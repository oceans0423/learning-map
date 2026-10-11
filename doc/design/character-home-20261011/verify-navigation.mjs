import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.argv[2]);
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
const base='http://127.0.0.1:4175/doc/design/character-home-20261011/courses.html';
const dir=fileURLToPath(new URL('./validation/',import.meta.url));await mkdir(dir,{recursive:true});
const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const saved of [false,true]){
  await page.goto(base+(saved?'?view=saved':''));await page.locator('.catalog-nav [aria-current=page]').waitFor();
  assert.equal(await page.locator('.catalog-nav [aria-current=page]').count(),1);
  assert.equal(await page.locator('.catalog-nav [aria-current=page]').getAttribute('id'),saved?'collection-link':'browse-link');
  for(const width of [320,390,700,768,900,1024,1440]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`page overflow ${width}`);
   assert.ok(await page.locator('.catalog-nav').evaluate(e=>e.scrollWidth<=e.clientWidth),`nav overflow ${width}`);
   assert.ok(await page.locator('.catalog-nav a').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=48)));
   assert.ok(await page.locator('.catalog-nav a').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth)));
  }
 }checks.push('兩頁皆只有一個目前頁面，七種寬度無溢出、控制項至少 48px 高');
 await page.setViewportSize({width:1440,height:900});await page.goto(base);await page.locator('.course-card').first().waitFor();
 assert.equal(await page.locator('#browse-link').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(60, 87, 69)');
 assert.equal(await page.locator('#browse-link').evaluate(e=>getComputedStyle(e).color),'rgb(255, 253, 248)');
 assert.ok((await page.locator('#collection-link').textContent()).includes('0 門'));checks.push('目前頁面深綠反白，收藏數標示單位');
 await page.locator('.catalog-nav').screenshot({path:dir+'navigation-desktop.png'});
 await page.locator('#collection-link').focus();assert.equal(await page.locator('#collection-link').evaluate(e=>getComputedStyle(e).outlineWidth),'3px');await page.keyboard.press('Enter');await page.locator('.saved-view').waitFor();assert.equal(await page.locator('#collection-link').getAttribute('aria-current'),'page');checks.push('鍵盤焦點可見，Enter 導覽正確');
 await page.setViewportSize({width:390,height:844});await page.locator('#catalog-title').click();await page.locator('.masthead').screenshot({path:dir+'navigation-mobile.png'});
 await page.goto(base);await page.locator('.course-card').first().waitFor();await page.locator('#results [data-save="course-001"]').click();assert.equal(await page.locator('.nav-count [data-save-count]').textContent(),'1');checks.push('新樣式保留收藏門數同步');
 assert.deepEqual(errors,[]);console.log(checks);
}finally{await writeFile(dir+'navigation-results.json',JSON.stringify({checks,errors,browser:browser.version(),limitations:'Chrome 自動化模擬視窗，未做實機與使用者辨識測試。'},null,2));await browser.close();}
