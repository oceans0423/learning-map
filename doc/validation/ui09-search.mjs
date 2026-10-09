/* global process, console, document, URL, CompositionEvent */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium }=createRequire(import.meta.url)(process.argv[2]); const dir=fileURLToPath(new URL('./ui09-20261009/',import.meta.url));
await mkdir(dir,{recursive:true}); const browser=await chromium.launch({channel:'chrome'}); const report={browser:browser.version(),checks:[]};
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
try{for(const width of [360,390,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<768});
  await page.goto('http://127.0.0.1:5181/?atlas=1&sem=1&signals=story'); await page.locator('.atlas-course').first().waitFor();
  const search=page.getByRole('searchbox',{name:'搜尋所有課程'});
  await search.fill('  數據化與文化  '); const result=page.locator('[data-search-id="course-068"]'); await result.waitFor();
  await (width<768?result.tap():result.click()); await page.locator('.detail-panel').waitFor();
  assert(await page.locator('#course-detail-title').innerText()==='古典文獻的數據化與文化IP轉譯','Cross-year search failed');
  assert(await page.locator('.atlas-heading h3').innerText()==='大四 · 下學期','Did not locate');
  assert(await page.locator('.atlas-course[data-course-id="course-068"]').count()===1,'Course not in group');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
  assert(await search.inputValue()==='  數據化與文化  ','Lost query');assert(await result.evaluate(e=>e===document.activeElement),'Lost result focus');
  await search.fill('畢業專題製作(一)');await page.locator('[data-search-id="course-059"]').click();await page.locator('.detail-panel').waitFor();
  assert(await page.locator('.atlas-course[data-course-id="course-059"]').count()===1,'Wrong mobile group for result');
  await page.getByRole('button',{name:'關閉課程詳情'}).click();await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
  await search.fill('[.*');assert(await page.getByText('找到 0 門課程',{exact:true}).count()===1,'Special query broke');
  await page.getByRole('button',{name:'查看全部課程',exact:true}).click();assert(await page.locator('.wb-course-list li').count()===69,'All exit failed');
  await search.fill('IP');await page.locator('[data-list-id="course-068"]').click();await page.locator('.detail-panel').waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
  assert(await search.inputValue()==='IP'&&await page.locator('.wb-course-list [data-list-id]').count()===1,'List query lost');
  await page.getByRole('button',{name:'課程星圖',exact:true}).click();assert(await search.inputValue()==='IP','Mode lost query');
  await search.evaluate(input=>input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'文'})));
  await search.fill('文化');assert(await page.getByText('找到 1 門課程',{exact:true}).count()===1,'Composition committed early');
  await search.evaluate(input=>input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'文化'})));
  assert(await page.locator('[data-search-id]').count()>1,'Composition did not commit');
  await page.screenshot({path:dir+width+'.png',fullPage:false,animations:'disabled'});
  report.checks.push({width,crossYear:true,signalIndependent:true,resultGroup:true,sourceFocus:true,noResultExit:true,compositionEvents:true,passed:true});await page.close();
}}finally{await writeFile(dir+'results.json',JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report));
