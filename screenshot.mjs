import { chromium } from 'playwright';

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      timeout: 30000
    });
    
    console.log('Creating page...');
    const page = await browser.newPage();
    
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    console.log('Waiting for content to load...');
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'screenshot.png', 
      fullPage: true 
    });
    
    console.log('Screenshot saved as screenshot.png');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
