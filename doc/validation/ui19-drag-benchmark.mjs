/* global process, console, document, window, URL, PerformanceObserver, performance, requestAnimationFrame */
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.argv[2]), browser = await chromium.launch({ channel: 'chrome' }), report = { browser: browser.version(), mode: 'headless, no video, no CPU throttling; sequential isolated run', checks: [] }
try {
  for (const width of [390,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width === 390, reducedMotion: 'reduce' }); await page.goto('http://127.0.0.1:5182/')
    await page.getByRole('button', { name: '所有課程', exact: true }).click()
    for (let i=0; i<8; i++) { await page.locator('[data-list-id]').nth(i).click(); await page.locator('.collection-toggle').click(); await page.getByRole('button', { name: '關閉課程詳情' }).click(); await page.waitForFunction(() => !document.querySelector('.detail-panel')) }
    await page.getByRole('button', { name: '我的星座（選用）' }).click(); await page.emulateMedia({ reducedMotion: 'no-preference' }); const grip=page.locator('.star-grip').first(); await grip.scrollIntoViewIfNeeded(); const b=await grip.boundingBox()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => { window.dragPerf={frames:[],tasks:[],running:true}; const observer=new PerformanceObserver(list=>window.dragPerf.tasks.push(...list.getEntries().map(e=>e.duration))); observer.observe({type:'longtask'}); window.dragObserver=observer; let prior=performance.now(); function sample(now){if(!window.dragPerf.running)return;window.dragPerf.frames.push(now-prior);prior=now;requestAnimationFrame(sample)}requestAnimationFrame(sample);resolve() })))
    if(width===390){const session=await page.context().newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+22,y:b.y+22}]});for(let i=1;i<=40;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+22+i,y:b.y+22+i}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await page.mouse.move(b.x+22,b.y+22);await page.mouse.down();await page.mouse.move(b.x+62,b.y+62,{steps:40});await page.mouse.up()}
    const result=await page.evaluate(()=>{window.dragPerf.running=false;window.dragObserver.disconnect();return{longTasks:window.dragPerf.tasks,frames:window.dragPerf.frames.length,maxFrameMs:Math.max(...window.dragPerf.frames),frameDurationsMs:window.dragPerf.frames}})
    report.checks.push({width,...result});await page.close()
  }
} finally { await writeFile(fileURLToPath(new URL('./ui19-20261009/drag-benchmark.json',import.meta.url)),JSON.stringify(report,null,2));await browser.close() }
console.log(JSON.stringify(report))
