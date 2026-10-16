# Website Change Detector 🔍

A full-stack web application designed to monitor web pages for updates using automated headless scraping and SHA-256 cryptographic hashing. Built as a club project.

## Features
- **Headless Scraping:** Uses Playwright to render and scrape web content[cite: 1].
- **SHA-256 Hashing:** Generates a secure cryptographic signature of page content to track state[cite: 1].
- **Change Detection:** Automatically compares current snapshots against historical records to detect modifications[cite: 1].
- **Local JSON Storage:** Lightweight persistence layer for tracking timestamped snapshots.
- **Minimalist Dashboard:** Clean UI to run checks and view live status telemetry.

## Tech Stack
- **Backend:** Node.js, Express
- **Automation / Scraping:** Playwright (Chromium Headless Shell)
- **Frontend:** HTML5, CSS3, JavaScript (Fetch API)


Getting Started 
1. Clone the repository: git clone <your-github-repo-url> cd website-change-detector 
2. Install dependencies: npm install npx playwright install 
3. Start the server: npm start 
4. Open your browser and navigate to: http://localhost:3000
