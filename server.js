const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const AUTH_TOKEN = '7facc2116210f6bfd3153ffe2fed2e3d0b73ae22039bf49600da41cc1a70b15da7d9f709';
const IMAGES_DIR = '/var/www/screenshots';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token provided

  if (token !== AUTH_TOKEN) {
    return res.sendStatus(403); // Invalid token
  }

  next(); // Token is valid, proceed
}

app.use(bodyParser.json());

app.post('/screenshot', verifyToken, async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.status(400).send({ error: 'URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({width: 1366, height: 768});
    const screenshot = await page.screenshot({ encoding: 'binary' });
    await browser.close();
    const imageName = `thumbnail-${Date.now()}.png`;
    const imagePath = path.join(IMAGES_DIR, imageName);
    fs.writeFileSync(imagePath, screenshot);

    res.status(200).send({
        image: imageName,
        url: `https://images.sitelaunch.io/images/${imageName}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to capture the screenshot' });
  }
});

app.listen(port, () => {
  console.log(`Screenshot server listening at http://localhost:${port}`);
});
