/* global process, console, document, URL, window, PerformanceObserver, performance, requestAnimationFrame, getComputedStyle */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cpus, platform } from 'node:os';
const {chromium}=createRequire(import.meta.url)(process.argv[2]);const dir=fileURLToPath(new URL('./ui10-20261009/',import.meta.url));
await mkdir(dir,{recursive:true});const browser=await chromium.launch({channel:'chrome'});
const report={browser:browser.version(),environment:{platform:platform(),cpu:cpus()[0]?.model,logicalCpus:cpus().length,mode:'headless, no CPU throttling; emulator, not phone'},checks:[]};
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const video = process.argv[3] !== 'no-video';
report.environment.recording = video;
try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,...(video ? {recordVideo:{dir,size:{width:Math.min(width,960),height:700}}} : {})});const page=await context.newPage();
  await page.addInitScript(()=>{window.uiPerformance={longTasks:[],frames:[]};new PerformanceObserver(list=>{for(const e of list.getEntries())window.uiPerformance.longTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true});let previous=performance.now();function sample(now){window.uiPerformance.frames.push(now-previous);previous=now;requestAnimationFrame(sample)}requestAnimationFrame(sample)});
  await page.goto('http://127.0.0.1:5181/?atlas=2&sem=1');await page.locator('.atlas-course').first().waitFor();
  const group=page.getByRole('group',{name:'選擇學期'});
  await page.evaluate(()=>{window.uiPerformance={longTasks:[],frames:[]}});
  for(let i=0;i<10;i++)await group.getByRole('button').nth(i%2).click();
  assert(await page.locator('.atlas-heading h3').innerText()==='大二 · 下學期','Stale semester');
  assert(await page.locator('.atlas-scene').count()===1,'Duplicate scene');
  assert(new URL(page.url()).searchParams.get('sem')==='2','Stale URL');
  const before=await page.evaluate(()=>window.history.length);
  await page.locator('.atlas-course').first().click();await page.locator('.detail-panel').waitFor();
  if(width===1440){
    for(let i=0;i<10;i++)await page.locator('.atlas-course').nth(i%2).click();
    assert(await page.locator('.detail-panel').count()===1,'Duplicate notes');
    assert(await page.evaluate(()=>window.history.length)===before+1,'Queued note history');
    await page.getByRole('button',{name:'文本思辨',exact:true}).click();
  }
  await page.getByRole('button',{name:'關閉課程詳情'}).click();await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
  if(width===1440)assert(await page.getByRole('button',{name:'文本思辨',exact:true}).getAttribute('aria-pressed')==='true','Close lost latest filters');
  await page.locator('.atlas-course').first().click();await page.locator('.detail-panel').waitFor();
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await page.locator('.detail-panel').evaluate(e=>getComputedStyle(e).animationName)==='none','Live reduce left animation');
  assert(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)===0,'Running reduced motion');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
  for(let i=0;i<10;i++)await group.getByRole('button').nth(i%2).click();
  assert(await page.locator('.atlas-scene').evaluate(e=>getComputedStyle(e).animationName)==='none','Reduced scene animated');
  await page.emulateMedia({reducedMotion:'no-preference'});await group.getByRole('button').first().click();
  assert(await page.locator('.atlas-scene').evaluate(e=>getComputedStyle(e).animationDuration)==='0.22s','Motion token missing');
  await page.waitForTimeout(500);
  const perf=await page.evaluate(()=>({longTasks:window.uiPerformance.longTasks,frameCount:window.uiPerformance.frames.length,maxFrameMs:Math.max(...window.uiPerformance.frames),framesOver50ms:window.uiPerformance.frames.filter(d=>d>50).length}));
  await page.screenshot({path:dir+width+'.png',fullPage:false,animations:'disabled'});
  const videoPath = video ? await page.video().path() : null;
  report.checks.push({width,normal10Switches:true,reduced10Switches:true,latestState:true,livePreference:true,performance:perf,videoPath,passed:true});await context.close();
}}finally{await writeFile(dir+(video ? 'results.json' : 'results-no-recording.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report));
