import {domains} from './domains.mjs';
export {domains};
export const roles=[
 ['探索者','帶著問題，走進現場','從文本、田野與訪談蒐集線索，在人的經驗與文化脈絡裡，找到值得追問的問題。'],
 ['創作人','把想像變成作品','以文字、影像與跨媒介敘事，把觀察與想像轉成有觀點、能與人對話的作品。'],
 ['引路人','讓知識更容易抵達','理解不同對象的需求，把人文知識轉成清楚的內容與學習引導，讓更多人走進理解。'],
 ['分析師','在線索之間找出關聯','整理人文資料、比較不同證據，運用分析與詮釋提出有依據的解釋。'],
 ['策展人','把文化變成看得見的呈現','把文化內容轉成展覽、影音與互動體驗，用表達與呈現，讓議題被看見、被感受。'],
 ['造物者','讓點子有可以試的形狀','從人的需求出發，運用 AI、數位工具與原型實作，把想法變成可測試、可修訂的方案。'],
 ['策略師','從創意走向計畫','從文化創意發想出發，規劃目標、資源與推動方式，讓品牌、活動與提案走向實現。'],
 ['開拓者','和地方一起開出新路','走進地方與社群，透過地方創生、社區參與與社會設計，和大家一起開創新的可能。']
];
const $=s=>document.querySelector(s);
const track=$('.domain-track'),roleTrack=$('.role-track'),dialog=$('#preview');
const mobile=matchMedia('(max-width:700px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let selected=0,opener=null,scrollTimer;
const picture=name=>`assets/${name}.webp`;
const building=(name,size='')=>`../building/${name}${size?`-${size}`:''}.webp`;
track.innerHTML=domains.map((d,i)=>`<button class="domain-card" aria-pressed="${i===0}" data-index="${i}" style="--tint:${d.tint};--building-scale:${d.buildingScale}" aria-label="${d.guild}，${d.title}"><span class="portrait"><img class="guild-building" src="${building(d.building,512)}" srcset="${building(d.building,512)} 512w, ${building(d.building)} 1024w" sizes="(max-width:700px) 62vw, 280px" alt="" width="1024" height="${d.buildingHeight}" loading="${i===0?'eager':'lazy'}" decoding="async" fetchpriority="${i===0?'high':'low'}"><img class="representative" src="${picture(d.name)}" alt="" width="400" height="760" loading="${i===0?'eager':'lazy'}" decoding="async" fetchpriority="${i===0?'high':'low'}"></span><span class="guild-name">${d.guild}</span><span class="domain-sub">${d.title}</span><span class="selected-label">● 目前選取</span></button>`).join('');
$('.domain-tabs').innerHTML=domains.map((d,i)=>`<button data-index="${i}" aria-pressed="${i===0}" aria-label="選取${d.guild}">${d.guild}</button>`).join('');
roleTrack.innerHTML=roles.map(([name,tag],i)=>`<button class="role-card" data-role="${i}" aria-haspopup="dialog" aria-label="認識${name}：${tag}"><img src="${picture(name)}" alt="" width="400" height="760" loading="lazy" decoding="async"><h3>${name}</h3><p>${tag}</p></button>`).join('');
function syncDomainControls(){for(const card of track.children){card.tabIndex=mobile.matches?-1:0;card.toggleAttribute('aria-hidden',mobile.matches);}}
function select(index,scroll=false){
 selected=Math.max(0,Math.min(3,index));const d=domains[selected];
 document.querySelectorAll('[data-index]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.index)===selected)));
 $('#domain-detail').innerHTML=`<div><p class="detail-label">${d.guild}的提問</p><h3>${d.title}</h3></div><div><p>${d.question}</p><p>${d.description}</p></div><a class="primary" id="domain-entry" href="courses.html?domain=${selected}">探索這個公會 <span aria-hidden="true">↗</span></a>`;
 $('#domain-position').textContent=`0${selected+1} / 04`;
 $('#domain-prev').disabled=selected===0;$('#domain-next').disabled=selected===3;
 if(scroll&&mobile.matches){const item=track.children[selected];track.scrollTo({left:item.offsetLeft-track.offsetLeft-(track.clientWidth-item.clientWidth)/2,behavior:reduced.matches?'instant':'smooth'});}
}
document.querySelectorAll('[data-index]').forEach(el=>el.addEventListener('click',()=>select(Number(el.dataset.index),true)));
$('#domain-prev').addEventListener('click',()=>select(selected-1,true));$('#domain-next').addEventListener('click',()=>select(selected+1,true));
// Native scrolling remains interruptible. After the gesture settles, select the closest portrait.
track.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
 if(!mobile.matches)return;const center=track.getBoundingClientRect().left+track.clientWidth/2;
 const distances=[...track.children].map(el=>{const r=el.getBoundingClientRect();return Math.abs(r.left+r.width/2-center)});
 const closest=distances.indexOf(Math.min(...distances));if(closest!==selected)select(closest);
},140)});
track.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?0:e.key==='End'?3:selected+(e.key==='ArrowRight'?1:-1),true);track.children[selected].focus({preventScroll:true});});
mobile.addEventListener('change',()=>{syncDomainControls();select(selected,true)});
function openPreview(source,label,html){opener=source;$('#dialog-label').textContent=label;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();$('#close-dialog').focus();}
// Role course combinations come from the role mapping; abilities show names only.
let comboData=null;
async function loadComboData(){
 if(comboData)return comboData;
 const get=async url=>{const r=await fetch(url);if(!r.ok)throw Error(url);return r.json();};
 const [roleData,abilityData,courseData]=await Promise.all([get('role-data.json'),get('ability-data.json'),get('../../course/courses_v1.json')]);
 if(roleData.roles?.length!==8||!abilityData.abilities||courseData.courses?.length!==69)throw Error('Invalid combo data');
 comboData={roleData,abilityData,courseById:new Map(courseData.courses.map(c=>[c.id,c]))};return comboData;
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function comboHTML(index){
 const {roleData,abilityData,courseById}=comboData,roleId=`P${index+1}`;
 const rows=roleData.relations.filter(r=>r.characterId===roleId).map(r=>({...r,course:courseById.get(r.courseId)})).sort((a,b)=>a.course.year-b.course.year||a.course.semester-b.course.semester||a.courseId.localeCompare(b.courseId));
 const core=rows.filter(r=>r.relationType==='代表'),extra=rows.filter(r=>r.relationType==='支援');
 const abilityNames=[...new Set(core.flatMap(r=>r.abilityFacets.map(f=>f.abilityId)))].slice(0,4).map(id=>abilityData.abilities[id].name);
 const chip=r=>`<li><a class="course-chip" href="courses.html?course=${r.courseId}"><strong><span>${r.course.year}年級${r.course.semester===1?'上':'下'}</span>${esc(r.course.name)}</strong><ul class="ability-tags">${abilityData.mappings[r.courseId].primary.map(a=>`<li>${esc(abilityData.abilities[a].name)}</li>`).join('')}</ul></a></li>`;
 const list=items=>`<ul class="course-list">${items.map(chip).join('')}</ul>`;
 return `<section class="role-combo" aria-label="會用到的能力"><h3>這個角色會用到的能力</h3><ul class="ability-tags">${abilityNames.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></section>
<section class="role-combo" aria-label="核心課程"><h3>核心課程<small>${core.length} 門</small></h3>${list(core.slice(0,6))}${core.length>6?`<details><summary>再看 ${core.length-6} 門核心課程</summary>${list(core.slice(6))}</details>`:''}
${extra.length?`<details><summary>延伸課程（${extra.length} 門）</summary>${list(extra)}</details>`:''}</section>`;
}
roleTrack.addEventListener('click',async e=>{
 const button=e.target.closest('[data-role]');if(!button)return;const index=Number(button.dataset.role);const [name,tag,description]=roles[index];
 const shell=body=>`<div class="role-detail"><img src="${picture(name)}" alt="${name}人物造型"><div><h2 id="dialog-title">${name}</h2><p>${tag}</p><p>${description}</p></div></div><div id="role-combo-slot">${body}</div><div class="dialog-actions"><a class="primary" href="courses.html">探索全部課程 <span aria-hidden="true">↗</span></a><a class="button-secondary" href="courses.html?view=saved">我的探索 ↗</a></div>`;
 openPreview(button,'八種專業視角',shell(comboData?comboHTML(index):'<p class="role-combo-status" role="status">正在整理課程組合…</p>'));
 if(comboData)return;
 try{await loadComboData();if(dialog.open&&opener===button)$('#role-combo-slot').innerHTML=comboHTML(index);}
 catch{if(dialog.open&&opener===button)$('#role-combo-slot').innerHTML='<p class="role-combo-status" role="status">課程組合暫時無法讀取，請重新開啟再試一次。</p>';}
});
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
dialog.addEventListener('close',()=>{opener?.focus({preventScroll:true});});
function galleryControls(){const max=roleTrack.scrollWidth-roleTrack.clientWidth;$('#roles-prev').disabled=roleTrack.scrollLeft<5;$('#roles-next').disabled=roleTrack.scrollLeft>=max-5;}
for(const [id,direction] of [['roles-prev',-1],['roles-next',1]])$('#'+id).addEventListener('click',()=>roleTrack.scrollBy({left:direction*roleTrack.clientWidth*.8,behavior:reduced.matches?'instant':'smooth'}));
roleTrack.addEventListener('scroll',galleryControls);window.addEventListener('resize',galleryControls);
document.addEventListener('click',e=>{
 const link=e.target.closest('a[href^="courses.html"]');if(!link)return;
 history.replaceState({...history.state,homepage:{selected,scrollY:window.scrollY,entry:link.id==='domain-entry'?'domain':'all'}},'');
});
syncDomainControls();select(history.state?.homepage?.selected??0);galleryControls();
window.addEventListener('pageshow',e=>{
 const saved=history.state?.homepage;
 if(!saved||(!e.persisted&&performance.getEntriesByType('navigation')[0]?.type!=='back_forward'))return;
 requestAnimationFrame(()=>{
  select(saved.selected);
  if(mobile.matches){const item=track.children[selected];track.scrollTo({left:item.offsetLeft-track.offsetLeft-(track.clientWidth-item.clientWidth)/2,behavior:'instant'});}
  window.scrollTo({top:saved.scrollY,behavior:'instant'});
  (saved.entry==='domain'?$('#domain-entry'):$('.all-courses'))?.focus({preventScroll:true});
 });
});
