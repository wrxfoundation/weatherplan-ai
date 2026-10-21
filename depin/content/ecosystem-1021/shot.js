// Render an HTML file to PNG at 2x (full page). Usage: node shot.js in.html out.png width
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [,, input, output, w] = process.argv;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: 800 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(input));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.screenshot({ path: output, fullPage: true });
  await browser.close();
})();
