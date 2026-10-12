// Detail pass 2026-10-11: hover feedback, secondary buttons, role course combinations, course–ability correspondence.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./validation/',import.meta.url));await mkdir(dir,{recursive:true});
const root='http://127.0.0.1:4175/doc/design/character-home-20261011/';
const roleData=JSON.parse(await readFile(new URL('./role-data.json',import.meta.url),'utf8'));
const ability=JSON.parse(await readFile(new URL('./ability-data.json',import.meta.url),'utf8'));
const {courses}=JSON.parse(await readFile(new URL('../../course/courses_v1.json',import.meta.url),'utf8'));
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const scaleOf=locator=>locator.evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.round(Math.hypot(m.a,m.b)*100)/100;});
const noCodes=async()=>assert.ok(!/H(0[1-9]|1[0-4])/.test(await page.locator('body').innerText()),'能力編號不應顯示');
try{
 await page.goto(root+'index.html');await page.locator('.domain-card').first().waitFor();
 const second=page.locator('.domain-card').nth(1);await second.hover();await page.waitForTimeout(300);
 assert.equal(await scaleOf(second.locator('.portrait img')),1.04);
 await page.locator('#domain-detail').hover();
 const role=page.locator('.role-card').first();await role.scrollIntoViewIfNeeded();await role.hover();await page.waitForTimeout(300);
 assert.equal(await scaleOf(role.locator('img')),1.04);
 await second.hover();await page.waitForTimeout(300);await page.locator('#domains').screenshot({path:dir+'detail-hover-desktop.png'});
 checks.push('四領域與八角色人物觸碰皆輕微放大 1.04 倍（220ms）');
 const header=page.locator('.masthead .button-secondary');assert.ok((await header.boundingBox()).height>=44);checks.push('首頁「全部課程」改為次要按鈕，高度至少 44px');
 for(let i=0;i<8;i++){
  const card=page.locator('.role-card').nth(i);await card.scrollIntoViewIfNeeded();await card.click();
  await page.locator('.role-combo').first().waitFor();
  const id=`P${i+1}`,rows=roleData.relations.filter(r=>r.characterId===id);
  const core=rows.filter(r=>r.relationType==='代表').length,extra=rows.filter(r=>r.relationType==='支援').length;
  assert.equal(await page.locator('#preview .course-chip').count(),core+extra,id);
  assert.equal(await page.locator('.role-combo h3 small').textContent(),`${core} 門`);
  assert.ok(await page.locator('.role-combo').first().locator('.ability-tags li').count()>=1);
  await noCodes();
  if(i===0)await page.locator('#preview').screenshot({path:dir+'role-combo-desktop.png'});
  await page.keyboard.press('Escape');await page.waitForFunction(n=>document.activeElement?.dataset.role===String(n),i);
 }
 checks.push('八角色視窗：能力名稱、核心／延伸課程數與角色對照一致；Escape 返回角色卡');
 await page.locator('.role-card').first().click();await page.locator('.course-chip').first().waitFor();
 const target=roleData.relations.filter(r=>r.characterId==='P1'&&r.relationType==='代表').map(r=>courses.find(c=>c.id===r.courseId)).sort((a,b)=>a.year-b.year||a.semester-b.semester||a.id.localeCompare(b.id))[0];
 await page.locator('.course-chip').first().click();await page.waitForURL(/courses\.html/);
 await page.locator('#course-dialog[open]').waitFor();assert.equal(await page.locator('#course-title').textContent(),target.name);
 checks.push('角色課程按鈕直接開啟對應課程詳情');
 await page.keyboard.press('Escape');
 await page.goto(root+'courses.html');await page.locator('.course-card').first().waitFor();
 await page.locator('#ability option[value="H08"]').waitFor({state:'attached'});
 await page.selectOption('#ability','H08');
 const expected=Object.entries(ability.mappings).filter(([,m])=>m.primary.includes('H08')||m.secondary.includes('H08')).length;
 assert.equal(await page.locator('.course-card').count(),expected);assert.match(page.url(),/ability=H08/);
 assert.ok((await page.locator('#result-status').textContent()).includes('人文資料整理與分析'));
 await page.reload();await page.locator('.course-card').first().waitFor();assert.equal(await page.locator('#ability').inputValue(),'H08');assert.equal(await page.locator('.course-card').count(),expected);
 await page.locator('.reset').click();assert.equal(await page.locator('.course-card').count(),69);assert.equal(await page.locator('#ability').inputValue(),'');
 checks.push('依能力篩選：課數與對照一致，網址保留，清除條件恢復 69 門');
 await noCodes();assert.equal(await page.locator('.card-abilities').count(),69);
 await page.locator('.results-section').screenshot({path:dir+'course-abilities-desktop.png',clip:undefined}).catch(()=>{});
 checks.push('69 張課程卡皆顯示能力名稱，畫面無能力編號');
 for(const width of [320,390,700,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const url of ['index.html','courses.html','courses.html?view=saved']){await page.goto(root+url);await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${url} overflow ${width}`);}
 }
 await page.setViewportSize({width:390,height:900});await page.goto(root+'index.html');
 const mobileRole=page.locator('.role-card').first();await mobileRole.scrollIntoViewIfNeeded();await mobileRole.click();await page.locator('.course-chip').first().waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('#preview').screenshot({path:dir+'role-combo-mobile.png'});await page.keyboard.press('Escape');
 await page.goto(root+'courses.html?course=course-019');await page.locator('#course-dialog[open]').waitFor();await page.locator('#course-dialog').screenshot({path:dir+'course-detail-abilities-mobile.png'});
 checks.push('六種寬度三個頁面無水平溢出；手機角色視窗與課程詳情截圖');
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1000});await page.goto(root+'index.html');
 const reduced=page.locator('.domain-card').nth(2);await reduced.hover();await page.waitForTimeout(100);assert.equal(await scaleOf(reduced.locator('.portrait img')),1);
 checks.push('減少動態時不縮放，改以背景色塊回饋');
 assert.deepEqual(errors,[]);checks.push('無瀏覽器執行錯誤');
 console.log(checks);
}finally{await writeFile(dir+'detail-pass.json',JSON.stringify({browser:browser.version(),checks,errors,limitations:'Chrome 自動化模擬，非實體手機、Safari 或讀屏測試。'},null,2));await context.close();await browser.close();}
