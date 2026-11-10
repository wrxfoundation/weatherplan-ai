const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  for (const [input, output] of jobs) {
    await page.goto('file://' + path.resolve(input));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: output, omitBackground: true });
  }
  await browser.close();
})();
