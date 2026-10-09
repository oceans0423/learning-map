/* global process, console, document, URL, window, getComputedStyle, MutationObserver, HTMLElement */
import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.argv[2]);const dir=fileURLToPath(new URL('./ui13-20261009/',import.meta.url));await mkdir(dir,{recursive:true});const browser=await chromium.launch({channel:'chrome'});const report={browser:browser.version(),checks:[]};const assert=(ok,message)=>{if(!ok)throw new Error(message)};
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390,recordVideo:{dir,size:{width:Math.min(width,960),height:700}}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.flightSeen=[];new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement&&node.classList.contains('collection-flight'))window.flightSeen.push({hidden:node.getAttribute('aria-hidden'),pointer:getComputedStyle(node).pointerEvents})}).observe(document,{subtree:true,childList:true})});
 await page.goto('http://127.0.0.1:5181/?atlas=1&sem=1');await page.locator('.atlas-course').first().click();await page.locator('.collection-toggle').waitFor();
 const toggle=page.locator('.collection-toggle');await toggle.click();await toggle.click();await toggle.click();
 assert(await toggle.getAttribute('aria-pressed')==='true','Quick reverse lost state');assert(await page.locator('.collection-summary').getAttribute('aria-label')==='查看收藏，1 門課程','Duplicate collection');
 await page.waitForTimeout(350);assert(!await page.locator('.collection-flight').count(),'Ghost token');
 const seen=await page.evaluate(()=>window.flightSeen);assert(seen.every(t=>t.hidden==='true'&&t.pointer==='none'),'Interactive clone');
 if(width===1440)assert(seen.length>0,'No flight with visible destination');else assert(seen.length===0,'Flight through inert background');
 await page.evaluate(()=>document.documentElement.style.setProperty('--ui-duration-collect','2000ms'));
 await toggle.click();await toggle.click();await page.setViewportSize({width:width===1440?1024:400,height:900});await page.waitForFunction(()=>!document.querySelector('.collection-flight'),null,{timeout:250});
 await page.emulateMedia({reducedMotion:'reduce'});await toggle.click();await toggle.click();await page.waitForTimeout(50);assert(!await page.locator('.collection-flight').count(),'Reduced flight');
 await page.emulateMedia({reducedMotion:'no-preference'});await toggle.click();await toggle.click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.detail-panel'));assert(!await page.locator('.collection-flight').count(),'Close leak');
 await page.screenshot({path:dir+width+'.png',fullPage:false,animations:'disabled'});report.checks.push({width,visibleFlights:seen.length,inertFallback:width===390,reverse:true,resize:true,reduced:true,closeCleanup:true,errors,passed:!errors.length});assert(!errors.length,'Runtime error');await context.close();
}}finally{await writeFile(dir+'results.json',JSON.stringify(report,null,2));await browser.close()}console.log(JSON.stringify(report));
