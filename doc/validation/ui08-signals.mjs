/* global process, console, URL */
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const dir = fileURLToPath(new URL('./ui08-20261009/', import.meta.url));
const { courses } = JSON.parse(await readFile(new URL('../../src/data/courses.json',import.meta.url),'utf8'));
const signals = JSON.parse(await readFile(new URL('../../src/data/explorationSignals.json',import.meta.url),'utf8'));
const mapping = new Map(signals.map(s=>[s.id,s]));
await mkdir(dir,{recursive:true}); const browser = await chromium.launch({channel:'chrome'});
const report = { browser:browser.version(),checks:[] };
const assert = (ok,message)=>{if(!ok)throw new Error(message)};
try {
  for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390});
    const samples=[];
    for(const year of [1,2,3,4]) for(const sem of [1,2]) {
      await page.goto(`http://127.0.0.1:5181/?atlas=${year}&sem=${sem}`); await page.locator('.atlas-course').first().waitFor();
      const semester=courses.filter(c=>c.year===year&&c.semester===sem);
      const countBefore=await page.locator('.atlas-course').count();
      for(const selected of [['text'],['story'],['digital'],['field'],['text','digital'],['text','story','digital','field']]) {
        await page.getByRole('button',{name:'清除訊號'}).click();
        for(const id of selected) await page.locator(`.wb-signal-button[data-signal='${id}']`).click();
        const related=semester.filter(c=>{const s=mapping.get(c.id);return s.signalPolicy!=='open'&&selected.some(id=>s.primary===id||s.secondary===id)}).length;
        const open=semester.filter(c=>c.role==='integration').length;
        const text=await page.locator('.atlas-count').innerText();
        assert(text.includes(`本學期 ${semester.length} 門`)&&text.includes(`相關 ${related} 門`)&&text.includes(`整合匯流 ${open} 門`),'Wrong count '+text);
        assert(await page.locator('.atlas-course').count()===countBefore,'Signals hide nodes');
        if(related===0)assert(text.includes('沒有符合訊號'),'Missing zero explanation');
        for(const course of semester.filter(c=>c.role==='integration')) {
          const node=page.locator(`[data-course-id='${course.id}']`);
          if(await node.count())assert(!await node.locator('.atlas-related-label').count(),'Integration miscount');
        }
        samples.push({year,sem,selected,related,open});
      }
      if(width===390&&await page.getByRole('button',{name:'下一組'}).count()) {
        const text=await page.locator('.atlas-count').innerText();await page.getByRole('button',{name:'下一組'}).click();
        assert(await page.locator('.atlas-count').innerText()===text,'Group changed semester count');
        const id=await page.locator('.atlas-course').first().getAttribute('data-course-id');
        await page.getByRole('button',{name:'清除訊號'}).click();
        assert(await page.locator(`.atlas-course[data-course-id='${id}']`).count()===1,'Clear reset page');
      }
    }
    if(width===1440){
      await page.locator('.atlas-course').first().click(); await page.locator('.detail-panel').waitFor();
      const name=await page.locator('#course-detail-title').innerText();
      await page.getByRole('button',{name:'文本思辨',exact:true}).click();
      assert(await page.locator('#course-detail-title').innerText()===name,'Signal cleared note');
    }
    await page.screenshot({path:dir+width+'.png',fullPage:false,animations:'disabled'});
    report.checks.push({width,samples,allNodesRetained:true,pageCountsStable:true,passed:true});await page.close();
  }
}finally{await writeFile(dir+'results.json',JSON.stringify(report,null,2));await browser.close()}
console.log('Passed '+report.checks.length+' devices with 48 signal combinations per device');
