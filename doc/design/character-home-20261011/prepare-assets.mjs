import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../..');
await mkdir(path.join(dir, 'assets'), { recursive: true });
const names = ['觀察家','說書人','解碼師','設計師','探索者','創作人','引路人','分析師','策展人','造物者','策略師','開拓者'];
const report = [];
for (const name of [...names, 'logo']) {
  const src = name === 'logo' ? path.join(root, '人文跨域與應用學系透明標誌.png') : path.join(root, 'public/images/characters', `${name}_RB.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left=info.width, top=info.height, right=0, bottom=0, transparent=0;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    const a=data[(y*info.width+x)*4+3];
    if(a===0) transparent++;
    if(a>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  if(left>right) throw new Error(`Empty image: ${name}`);
  const crop={left,top,width:right-left+1,height:bottom-top+1};
  await sharp(src).extract(crop).resize({height:name==='logo'?180:760,withoutEnlargement:true}).webp({quality:88}).toFile(path.join(dir,'assets',`${name}.webp`));
  report.push({name,original:{width:info.width,height:info.height},crop,transparentFraction:transparent/(info.width*info.height)});
}
await writeFile(path.join(dir,'assets/report.json'),JSON.stringify(report,null,2));
const thumbs=await Promise.all(names.map(async(name,i)=>({input:await sharp(path.join(dir,'assets',`${name}.webp`)).resize(180,260,{fit:'contain',background:'#f4efe6'}).png().toBuffer(),left:(i%4)*180,top:Math.floor(i/4)*260})));
await sharp({create:{width:720,height:780,channels:3,background:'#f4efe6'}}).composite(thumbs).png().toFile(path.join(dir,'assets/contact-sheet.png'));
console.log(report);
