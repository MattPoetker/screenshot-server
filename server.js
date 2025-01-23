const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;  // Use promises for async file operations
const path = require('path');
const app = express();
const port = 3000;

const AUTH_TOKEN = '7facc2116210f6bfd3153ffe2fed2e3d0b73ae22039bf49600da41cc1a70b15da7d9f709';
const IMAGES_DIR = '/var/www/screenshots';
const MAX_CONCURRENT_BROWSERS = 5;  // Limit concurrent browsers

// Browser pool
let browserPool = [];
let initializingBrowser = null;

// Initialize browser pool
async function initializeBrowserPool() {
    for (let i = 0; i < MAX_CONCURRENT_BROWSERS; i++) {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: 'new'  // Use new headless mode for better performance
        });
        browserPool.push(browser);
    }
}

// Get available browser from pool
async function getBrowser() {
    if (browserPool.length > 0) {
        return browserPool.pop();
    }
    
    if (!initializingBrowser) {
        initializingBrowser = puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: 'new'
        });
    }
    
    const browser = await initializingBrowser;
    initializingBrowser = null;
    return browser;
}

// Return browser to pool
function returnBrowser(browser) {
    if (browserPool.length < MAX_CONCURRENT_BROWSERS) {
        browserPool.push(browser);
    } else {
        browser.close();
    }
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    if (token !== AUTH_TOKEN) return res.sendStatus(403);
    next();
}

app.use(bodyParser.json());

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
});
app.use(limiter);

app.post('/screenshot', verifyToken, async (req, res) => {
    const url = req.body.url;
    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        
        // Set timeout for navigation
        await page.setDefaultNavigationTimeout(30000);
        
        // Optional: Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.setViewport({ width: 1366, height: 768 });
        
        const screenshot = await page.screenshot({ 
            encoding: 'binary',
            quality: 80,  // Reduce file size
            type: 'jpeg'  // Use JPEG instead of PNG for smaller file size
        });
        
        await page.close();
        
        const imageName = `thumbnail-${Date.now()}.jpg`;
        const imagePath = path.join(IMAGES_DIR, imageName);
        
        await fs.writeFile(imagePath, screenshot);
        
        res.status(200).send({
            image: imageName,
            url: `https://images.sitelaunch.io/images/${imageName}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to capture the screenshot' });
    } finally {
        if (browser) returnBrowser(browser);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    for (const browser of browserPool) {
        await browser.close();
    }
    process.exit(0);
});

// Initialize browser pool and start server
(async () => {
    await initializeBrowserPool();
    app.listen(port, () => {
        console.log(`Screenshot server listening at http://localhost:${port}`);
    });
})();
