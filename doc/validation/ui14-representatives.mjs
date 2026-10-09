/* global process, console, document, URL */
import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';const {chromium}=createRequire(import.meta.url)(process.argv[2]);const dir=fileURLToPath(new URL('./ui14-20261009/',import.meta.url));await mkdir(dir,{recursive:true});const browser=await chromium.launch({channel:'chrome'});const report={browser:browser.version(),checks:[]};const assert=(ok,message)=>{if(!ok)throw new Error(message)};
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390,reducedMotion:'reduce'});await page.goto('http://127.0.0.1:5181/');
 const enter=()=>page.getByRole('button',{name:'我的星座（選用）'}).click();const leave=()=>page.getByRole('button',{name:'繼續探索課程'}).click();
 const collect=async i=>{await page.locator('.wb-course-list [data-list-id]').nth(i).click();await page.locator('.collection-toggle').waitFor();await page.locator('.collection-toggle').click();await page.getByRole('button',{name:'關閉課程詳情'}).click();await page.waitForFunction(()=>!document.querySelector('.detail-panel'))};
 await enter();assert(await page.getByText(/先收藏感興趣的課程/).count()===1,'Zero unclear');assert(!await page.locator('[data-representative-id]').count(),'Zero slots');await leave();
 await page.getByRole('button',{name:'所有課程',exact:true}).click();await collect(0);await enter();assert(await page.locator('.representative-count').innerText()==='代表星 1／8 · 收藏 1 門','One star missing');
 await page.locator('[data-representative-id="course-001"]').click();await leave();await enter();assert(await page.locator('.representative-count').innerText()==='代表星 0／8 · 收藏 1 門','Reentry overwrote edit');await leave();
 await page.reload();await page.getByRole('button',{name:'所有課程',exact:true}).click();for(let i=0;i<9;i++)await collect(i);await enter();
 assert(await page.locator('.representative-count').innerText()==='代表星 8／8 · 收藏 9 門','First8 not seeded');const ninth=page.locator('[data-representative-id="course-009"]');await ninth.click();
 assert(await ninth.getAttribute('aria-pressed')==='false','Silent ninth');await page.getByRole('button',{name:'取消替換'}).click();assert(await page.locator('.representative-options [aria-pressed="true"]').count()===8,'Cancel changed stars');
 await ninth.click();await page.locator('.replacement-panel button').nth(1).click();assert(await ninth.getAttribute('aria-pressed')==='true','Replacement failed');
 await leave();await page.locator('.collection-summary').click();assert(await page.locator('.collection-list li').count()===9,'Replacement removed collection');
 const id9name=await page.locator('.collection-list strong').nth(8).innerText();await page.getByRole('button',{name:`移除收藏：${id9name}`}).click();
 await page.getByRole('button',{name:'用收藏課程建立我的星座'}).click();assert(await page.locator('.representative-count').innerText()==='代表星 7／8 · 收藏 8 門','Representative did not follow removal');
 await page.getByRole('button',{name:`復原「${id9name}」`}).click();assert(await page.locator('.representative-count').innerText()==='代表星 8／8 · 收藏 9 門','Star undo failed');assert(await page.locator('[data-representative-id="course-009"]').getAttribute('aria-pressed')==='true','Wrong star restored');
 await leave();await page.getByRole('button',{name:'所有課程',exact:true}).click();for(let i=9;i<69;i++)await collect(i);await enter();
 assert(await page.locator('.representative-count').innerText()==='代表星 8／8 · 收藏 69 門','69 flow capped or reseeded');assert(await page.locator('[data-representative-id]').count()===69,'Hidden collection options');
 await page.screenshot({path:dir+width+'.png',fullPage:false,animations:'disabled'});report.checks.push({width,zero:true,one:true,eight:true,nineReplacement:true,cancel:true,noCollectionLoss:true,starUndo:true,reentryPreserved:true,all69:true,passed:true});await page.close();
}}finally{await writeFile(dir+'results.json',JSON.stringify(report,null,2));await browser.close()}console.log(JSON.stringify(report));
