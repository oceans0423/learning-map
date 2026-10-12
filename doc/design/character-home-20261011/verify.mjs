import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const dir=fileURLToPath(new URL('./validation/',import.meta.url));await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const checks=[],errors=[];const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
const courses=JSON.parse(await readFile(new URL('../../course/courses_v1.json',import.meta.url),'utf8')).courses;
const record=message=>checks.push(message);
try{
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:4175/');await page.locator('.domain-card img').last().waitFor();
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 assert.equal(await page.locator('.domain-card').count(),4);assert.equal(await page.locator('.role-card').count(),8);record('4 領域與 8 專業角色呈現');
 assert.equal(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)),true);record('全部 13 張網頁圖片成功載入');
 await page.screenshot({path:dir+'desktop.png',fullPage:true});
 for(let i=0;i<4;i++){
  await page.locator('.domain-card').nth(i).click();assert.equal(await page.locator('.domain-card[aria-pressed=true]').count(),1);
  await page.locator('#domain-entry').click();await page.locator('.course-grid').waitFor();
  const modules=['人文思維與方法','文學創作','數位人文','文化創意與社會設計'];
  assert.equal(await page.locator('.course-card').count(),courses.filter(c=>c.module===modules[i]).length);
  await page.goBack();await page.locator('#domain-entry').waitFor();await page.waitForTimeout(150);assert.equal(await page.locator('.domain-card').nth(i).getAttribute('aria-pressed'),'true');
 }record('四領域入口連到正確課程；瀏覽器返回保留人物選取');
 await page.locator('.all-courses').first().click();await page.locator('.course-grid').waitFor();assert.equal(await page.locator('.course-card').count(),69);assert.deepEqual(await page.locator('.course-card h3').allTextContents(),courses.map(c=>c.name));await page.goBack();await page.locator('.role-card').first().waitFor();record('直接進入全部 69 門課程，課名逐一吻合');
 for(let i=0;i<8;i++){const role=page.locator('.role-card').nth(i);await role.click();assert.equal(await page.locator('#preview').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await role.evaluate(e=>e===document.activeElement),true);}record('八角色介紹可開關，關閉還原來源焦點');
 await page.waitForTimeout(100);await page.locator('.domain-card').first().focus();await page.keyboard.press('End');assert.equal(await page.locator('.domain-card').last().getAttribute('aria-pressed'),'true');await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.domain-card').nth(1).getAttribute('aria-pressed'),'true');record('領域方向鍵、Home、End 可操作');
 for(const width of [320,390,700,768,1024,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);}record('320 / 390 / 700 / 768 / 1024 / 1440px 無整頁水平溢出');
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4175/');await page.locator('.domain-card img').first().evaluate(i=>i.decode());
 await page.locator('.domain-tabs button').nth(3).click();await page.waitForTimeout(800);assert.equal(await page.locator('.domain-card[aria-pressed=true] .character-name').textContent(),'設計師');
 const centered=await page.locator('.domain-card').last().evaluate(e=>{const r=e.getBoundingClientRect(),t=e.parentElement.getBoundingClientRect();return Math.abs(r.left+r.width/2-(t.left+t.width/2))<5});assert.ok(centered);record('手機直接選取可捲至正確人物並保持選取');
 await page.locator('#domain-prev').click();await page.waitForTimeout(800);assert.equal(await page.locator('.domain-card[aria-pressed=true] .character-name').textContent(),'解碼師');
 await page.locator('.domain-track').evaluate(t=>t.scrollTo({left:0,behavior:'instant'}));await page.waitForTimeout(350);assert.equal(await page.locator('.domain-card[aria-pressed=true] .character-name').textContent(),'觀察家');record('手機上一位按鈕與原生捲動會同步介紹');
 await page.screenshot({path:dir+'mobile.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.domain-tabs button').nth(1).click();await page.waitForTimeout(200);assert.equal(await page.locator('.portrait img').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');record('減少動態偏好移除縮放及過場');
 await page.locator('.role-card').first().click();assert.equal(await page.locator('#close-dialog').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await page.locator('#preview').evaluate(e=>e.open),false);record('角色對話框聚焦關閉按鈕，可用 Enter 關閉');
 assert.deepEqual(errors,[]);record('無 JavaScript 執行錯誤');
 console.log(checks);
}finally{await writeFile(dir+'results.json',JSON.stringify({checks,errors,testedBrowser:browser.version(),limitations:'Chrome 自動化與模擬視窗；未進行實體手機、Safari、讀屏軟體或高中生使用者測試。'},null,2));await browser.close();}
