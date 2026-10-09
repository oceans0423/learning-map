/* global process, console, document, URL */
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const dir = fileURLToPath(new URL('./ui07-20261009/', import.meta.url));
const { courses } = JSON.parse(await readFile(new URL('../../src/data/courses.json',import.meta.url),'utf8'));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { browser: browser.version(), checks: [] };
const assert = (ok, message) => { if (!ok) throw new Error(message); };
try {
  for (const width of [390,1440]) {
    const page = await browser.newPage({viewport:{width,height:900},hasTouch:width===390});
    await page.goto('http://127.0.0.1:5181/');
    await page.getByRole('button',{name:'所有課程',exact:true}).click();
    for (const [i, course] of courses.entries()) {
      const source = page.locator('.wb-course-list button').nth(i); await source.click();
      await page.locator('.detail-panel').waitFor();
      assert(await page.locator('#course-detail-title').innerText() === course.name,'Wrong content');
      assert(await page.locator('.details-pending').count() === 1,'Draft guard missing');
      assert(await page.locator('.detail-panel').innerText().then(t=>t.includes('導覽草案')&&t.includes(course.module)),'Missing facts');
      if(i===0) {
        if(width===390) {
          assert(await page.evaluate(()=>document.querySelector('.detail-panel').contains(document.activeElement)),'Missing initial focus');
          assert(await page.locator('.wb-map').getAttribute('inert') !== null,'Background active');
          for(let j=0;j<4;j++) { await page.keyboard.press(j%2?'Shift+Tab':'Tab'); assert(await page.evaluate(()=>document.querySelector('.detail-panel').contains(document.activeElement)),'Trap escaped'); }
          await page.getByRole('button',{name:'所有課程',exact:true,includeHidden:true}).evaluate(b=>b.focus());
          assert(await page.evaluate(()=>document.querySelector('.detail-panel').contains(document.activeElement)),'Inert failed');
        } else assert(await source.evaluate(b=>b===document.activeElement),'Desktop stole focus');
        await page.screenshot({path:dir+width+'-note.png',fullPage:false,animations:'disabled'});
      }
      await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
      assert(await source.evaluate(b=>b===document.activeElement),'Source focus lost '+course.id);
      assert(!await page.locator('[inert]').count(),'Inert leaked');
    }
    await page.goto('http://127.0.0.1:5181/?course=course-068'); await page.locator('.detail-panel').waitFor();
    await page.getByRole('button',{name:'關閉課程詳情'}).click(); await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
    assert(!page.url().includes('course='),'Direct close left course');
    assert(await page.locator('.atlas-heading h3').innerText()==='大四 · 下學期','Direct location wrong');
    // Source removed while desktop note remains open; closing must use a live fallback.
    if(width===1440) {
      await page.locator('.atlas-course').first().click(); await page.locator('.detail-panel').waitFor();
      await page.getByRole('group',{name:'選擇學期'}).getByRole('button').first().click();
      await page.getByRole('button',{name:'關閉課程詳情'}).click(); await page.waitForFunction(()=>!document.querySelector('.detail-panel'));
      assert(await page.evaluate(()=>document.querySelector('#curriculum').contains(document.activeElement)),'No fallback focus');
    }
    report.checks.push({width,all69Notes:true,draftGuard:true,trap:width===390,focusReturn:true,directClose:true,passed:true}); await page.close();
  }
} finally { await writeFile(dir+'results.json',JSON.stringify(report,null,2)); await browser.close(); }
console.log(JSON.stringify(report));
