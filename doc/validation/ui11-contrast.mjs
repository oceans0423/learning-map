/* global process, console, document, URL, getComputedStyle */
import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.argv[2]);const browser=await chromium.launch({channel:'chrome'});const report={browser:browser.version(),screens:[]};
const linear=c=>{const s=c/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4};const luminance=rgb=>rgb.map(linear).reduce((s,c,i)=>s+c*[0.2126,0.7152,0.0722][i],0);const contrast=(a,b)=>{const l=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(l[1]+0.05)/(l[0]+0.05)};
try{const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto('http://127.0.0.1:5181/?atlas=2&sem=2&signals=text');await page.locator('.atlas-course').first().waitFor();
for(const screen of ['map','note']){
  if(screen==='note'){await page.locator('.atlas-course').first().click();await page.locator('.detail-panel').waitFor()}
  await page.waitForTimeout(300);
  const data=await page.evaluate(()=>{
    const rgba=value=>{const numbers=value.match(/[\d.]+/g)?.map(Number)??[0,0,0,0];return[numbers[0],numbers[1],numbers[2],numbers[3]??1]};
    const background=element=>{if(!element)return[16,38,48];const previous=background(element.parentElement);const color=rgba(getComputedStyle(element).backgroundColor);return color.slice(0,3).map((c,i)=>c*color[3]+previous[i]*(1-color[3]))};
    return [...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility==='visible'&&[...e.childNodes].some(n=>n.nodeType===3&&/[a-z0-9\u3400-\u9fff]/i.test(n.textContent))).map(e=>{const css=getComputedStyle(e);return{text:e.textContent.trim().slice(0,50),color:rgba(css.color).slice(0,3),background:background(e),size:parseFloat(css.fontSize),weight:parseInt(css.fontWeight)||400,inGradient:!!e.closest('.atlas-scene')}});
  });
  const readings=data.map(item=>({...item,ratio:Math.min(contrast(item.color,item.background),item.inGradient?contrast(item.color,[34,68,78]):99),required:item.size>=24||(item.size>=18.66&&item.weight>=700)?3:4.5}));
  const violations=readings.filter(r=>r.ratio<r.required);report.screens.push({screen,count:readings.length,gradient:'Conservative opaque upper-color bound #22444e (actual gradient is translucent)',readings,violations});
  if(violations.length)throw new Error(JSON.stringify(violations));
}
}finally{await writeFile(fileURLToPath(new URL('./ui11-20261009/contrast.json',import.meta.url)),JSON.stringify(report,null,2));await browser.close()}
console.log('Actual rendered text contrast passed '+report.screens.map(s=>s.count).join('/')+' readings');
