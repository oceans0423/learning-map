/* global process, console, document, URL, innerWidth */
import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.argv[2]);const dir=fileURLToPath(new URL('./ui11-20261009/',import.meta.url));await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const report={browser:browser.version(),matrix:[],viewportChecks:[],userValidation:'Pending: no student participants, physical devices, Safari or Firefox supplied'};
const base = process.argv[3] || 'http://127.0.0.1:5181/';
const prefix = base.includes('5182') ? 'build-' : '';
report.base = base;
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
try{
for(const mode of ['mouse','tap','keyboard','reduce']){
  const width=mode==='tap'?390:1440;const context=await browser.newContext({viewport:{width,height:900},hasTouch:mode==='tap',reducedMotion:mode==='reduce'?'reduce':'no-preference'});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('.atlas-overview').waitFor();
  const tabTo=async locator=>{for(let i=0;i<180;i++){if(await locator.evaluate(e=>e===document.activeElement))return;await page.keyboard.press('Tab')}throw new Error('Keyboard target unreachable')};
  const activate=async locator=>{if(mode==='keyboard'){await tabTo(locator);await page.keyboard.press('Enter')}else if(mode==='tap')await locator.tap();else await locator.click()};
  await activate(page.getByRole('button',{name:'查看大二課程'}));await activate(page.getByRole('group',{name:'選擇學期'}).getByRole('button').nth(1));
  assert(await page.locator('.atlas-heading h3').innerText()==='大二 · 下學期','Wrong semester');
  const search=page.getByRole('searchbox',{name:'搜尋所有課程'});
  if(mode==='keyboard'){await tabTo(search);await page.keyboard.insertText('數據化與文化')}else await search.fill('數據化與文化');
  const result=page.locator('[data-search-id="course-068"]');await activate(result);await page.locator('.detail-panel').waitFor();
  assert(await page.locator('#course-detail-title').innerText()==='古典文獻的數據化與文化IP轉譯','Wrong search course');
  if(mode==='keyboard')await page.keyboard.press('Escape');else await activate(page.getByRole('button',{name:'關閉課程詳情'}));
  await page.waitForFunction(()=>!document.querySelector('.detail-panel'));assert(await result.evaluate(e=>e===document.activeElement),'Lost source focus');
  await activate(page.getByRole('button',{name:'清除搜尋'}));await activate(page.getByRole('button',{name:'所有課程',exact:true}));assert(await page.locator('.wb-course-list [data-list-id]').count()===69,'Not all courses');
  await activate(page.getByRole('button',{name:'課程星圖',exact:true}));assert(await page.locator('.atlas-course').count()>0,'No return map');
  assert(await page.locator('.wb-personal-slot').innerText()==='','Collection intrusion');assert(!errors.length,'Runtime error');
  if(mode==='reduce')assert(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)===0,'Reduced motion incomplete');
  await page.screenshot({path:dir+prefix+mode+'.png',fullPage:true,animations:'disabled'});report.matrix.push({mode,width,journeyComplete:true,sourceFocus:true,noCollection:true,errors,passed:true});await context.close();
}
for(const width of [360,390,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:400}});await page.goto(base+'?atlas=2&sem=2');await page.locator('.atlas-course').first().waitFor();
  await page.addStyleTag({content:'html{font-size:200%}'});assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'200% overflow');
  await page.getByRole('button',{name:'所有課程',exact:true}).click();await page.locator('[data-list-id="course-068"]').click();await page.locator('.detail-panel').waitFor();
  assert(await page.getByRole('button',{name:'關閉課程詳情'}).isVisible(),'Close clipped');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Long note overflow');
  await page.getByRole('button',{name:'關閉課程詳情'}).click();await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
  report.viewportChecks.push({width,height:400,textScale:'200%',longestCourse:true,passed:true});await page.close();
}
}finally{await writeFile(dir+prefix+'results.json',JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report));
