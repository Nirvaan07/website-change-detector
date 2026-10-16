const express = require('express');
const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

let updateCounter = 1;
let dynamicPageContent = `<html><body><h1>Dynamic Page</h1><p>Version ${updateCounter}: Initial baseline content.</p></body></html>`;

function readDatabase() {
    if (!fs.existsSync(DB_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writeDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Mock Routes
app.get('/mock-stable', (req, res) => {
    res.send('<html><body><h1>Stable Page</h1><p>This content remains completely static and unchanged.</p></body></html>');
});

app.get('/mock-dynamic', (req, res) => {
    res.send(dynamicPageContent);
});

// Trigger Simulated Update
app.post('/api/trigger-update', (req, res) => {
    updateCounter++;
    const timestamp = new Date().toLocaleTimeString();
    dynamicPageContent = `<html><body><h1>Dynamic Page</h1><p>Version ${updateCounter}: Brand new update published at ${timestamp}!</p></body></html>`;
    res.json({ success: true, message: `Updated to Version ${updateCounter}` });
});

// Reset Database API
app.post('/api/reset-db', (req, res) => {
    try {
        if (fs.existsSync(DB_FILE)) {
            fs.unlinkSync(DB_FILE);
        }
        updateCounter = 1;
        dynamicPageContent = `<html><body><h1>Dynamic Page</h1><p>Version ${updateCounter}: Initial baseline content.</p></body></html>`;
        res.json({ success: true, message: "Database reset successfully!" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Main Check API with enhanced status handling (OK, ERROR, BLOCKED)
app.post('/api/check', async (req, res) => {
    const { url, intervalMinutes } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        // Timeout handling (Requirement #2)
        await page.setDefaultNavigationTimeout(15000);
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        if (response && response.status() === 403 || response.status() === 401) {
            await browser.close();
            return res.json({
                url: url,
                status: "BLOCKED",
                hasChanged: false,
                message: "⚠️ Access Blocked / CAPTCHA encountered (Status 403/401)."
            });
        }

        const pageContent = await page.innerText('body');
        await browser.close();

        const currentHash = crypto.createHash('sha256').update(pageContent).digest('hex');
        const db = readDatabase();
        const lastRecord = db[url];

        let hasChanged = false;
        let previousHash = null;

        if (!lastRecord) {
            previousHash = currentHash;
        } else {
            previousHash = lastRecord.hash;
            if (previousHash !== currentHash) {
                hasChanged = true;
            }
        }

        db[url] = {
            hash: currentHash,
            lastChecked: new Date().toISOString(),
            status: "OK",
            interval: intervalMinutes || 15
        };
        writeDatabase(db);

        res.json({
            url: url,
            status: "OK",
            hasChanged: hasChanged,
            lastChecked: db[url].lastChecked,
            message: hasChanged ? "⚠️ Change Detected on Page!" : "✅ No Changes Detected (Page is Stable)."
        });

    } catch (error) {
        if (browser) await browser.close();
        res.json({
            url: url,
            status: "ERROR",
            hasChanged: false,
            error: true,
            message: `❌ Site Outage / Error: ${error.message}`
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running smoothly on http://localhost:3000`);
});