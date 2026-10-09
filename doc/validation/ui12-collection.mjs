/* global process, console, document, URL, scrollY, localStorage */
import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.argv[2]);const dir=fileURLToPath(new URL('./ui12-20261009/',import.meta.url));await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const report={browser:browser.version(),checks:[]};const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const smoke = process.argv[3] === 'sticky-smoke';
try{for(const width of (smoke ? [1440] : [390,1440])){
 const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390});await page.goto('http://127.0.0.1:5181/?atlas=1&sem=1');await page.locator('.atlas-course').first().waitFor();
 const storageBefore=await page.evaluate(()=>JSON.stringify(localStorage));const top=()=>page.locator('#curriculum').evaluate(e=>e.getBoundingClientRect().top+scrollY);
 const before=await top();assert(!await page.locator('.collection-summary').count(),'Initial collection prompt');
 await page.locator('.atlas-course').first().click();await page.locator('.collection-toggle').waitFor();const firstWidth=(await page.locator('.collection-toggle').boundingBox()).width;
 await page.locator('.collection-toggle').click();assert(await page.locator('.collection-toggle').getAttribute('aria-pressed')==='true','Did not collect');
 assert((await page.locator('.collection-toggle').boundingBox()).width===firstWidth,'Collection button changed width');
 await page.getByRole('button',{name:'關閉課程詳情'}).click();await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
 assert(Math.abs(await top()-before)<1,'First collection moved map');assert(await page.locator('.collection-summary').count()===1,'Missing destination');
 await page.locator('.collection-summary').click();await page.getByRole('button',{name:'移除收藏：人文學概論'}).click();assert(!await page.locator('.collection-summary').count(),'Last summary retained');
 const undo=page.getByRole('button',{name:'復原「人文學概論」'});assert(await undo.isVisible(),'Last undo disappeared');await undo.click();assert(await page.locator('.collection-list li').count()===1,'Undo failed');
 await page.getByRole('button',{name:'返回找課'}).click();assert(Math.abs(await top()-before)<1,'Undo moved map');
 await page.getByRole('button',{name:'所有課程',exact:true}).click();
 for(const i of (smoke ? [34,68] : Array.from({length:68},(_,i)=>i+1))){
   await page.locator('.wb-course-list [data-list-id]').nth(i).click();await page.locator('.collection-toggle').waitFor();await page.locator('.collection-toggle').click();await page.getByRole('button',{name:'關閉課程詳情'}).click();await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
 }
 const total = smoke ? 3 : 69;
 assert(await page.locator('.collection-summary').getAttribute('aria-label')===`查看收藏，${total} 門課程`,'69 cap/dedup failure');
 await page.locator('.collection-summary').click();assert(await page.locator('.collection-list li').count()===total,'Collection list missing');
 const last=await page.locator('.collection-list strong').last().innerText();await page.locator('.collection-list li').last().getByRole('button',{name:/移除收藏/}).click();
 const second=await page.locator('.collection-list strong').last().innerText();await page.locator('.collection-list li').last().getByRole('button',{name:/移除收藏/}).click();
 await page.getByRole('button',{name:`復原「${second}」`}).click();assert(await page.locator('.collection-list li').count()===total-1,'Undo restored more than latest');assert(!await page.locator('.collection-list strong').filter({hasText:last}).count(),'Earlier remove restored');
 await page.screenshot({path:dir+width+'.png',fullPage:false,animations:'disabled'});
 assert(await page.evaluate(()=>JSON.stringify(localStorage))===storageBefore,'Implicit saving');await page.reload();await page.locator('.wb-toolbar').waitFor();assert(!await page.locator('.collection-summary').count(),'Unsaved reload retained');
 report.checks.push({width,all69:!smoke,stickySmoke:smoke,widthStable:true,mapNotShifted:true,lastUndo:true,recentUndoOnly:true,noStorageWrites:true,unsavedReload:true,passed:true});await page.close();
}}finally{await writeFile(dir+(smoke?'sticky-smoke.json':'results.json'),JSON.stringify(report,null,2));await browser.close()}console.log(JSON.stringify(report));
