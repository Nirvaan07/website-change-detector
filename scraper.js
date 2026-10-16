const { chromium } = require('playwright');
const crypto = require('crypto');

async function checkWebsite(url, ignoreSelectors = []) {
    // Using channel: 'msedge' or 'chrome' uses the browser already installed on your Windows PC, 
    // bypassing any internet download errors!
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'msedge' 
    });
    const page = await browser.newPage();

    try {
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        
        if (!response || !response.ok()) {
            await browser.close();
            return { status: 'error or blocked', code: response ? response.status() : 500 };
        }

        for (const selector of ignoreSelectors) {
            await page.evaluate((sel) => {
                document.querySelectorAll(sel).forEach(el => el.remove());
            }, selector);
        }

        const pageText = await page.innerText('body');
        const screenshotBuffer = await page.screenshot({ fullPage: true });

        const contentHash = crypto.createHash('sha256').update(pageText).digest('hex');

        await browser.close();
        return {
            status: 'OK',
            contentHash,
            pageText,
            screenshot: screenshotBuffer
        };

    } catch (error) {
        await browser.close();
        return { status: 'error', message: error.message };
    }
}

module.exports = { checkWebsite };