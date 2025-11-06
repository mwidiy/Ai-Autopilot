const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.wikipedia.org');
  await page.pause();
  console.log(await page.title());
  await browser.close();
})();
