import {domains} from './domains.mjs';
export {domains};
export const roles=[
 ['探索者','帶著問題，走進現場','從文本、田野與訪談蒐集線索，在人的經驗與文化脈絡裡，找到值得追問的問題。'],
 ['創作人','把想像變成作品','以文字、影像與跨媒介敘事，把觀察與想像轉成有觀點、能與人對話的作品。'],
 ['引路人','讓知識更容易抵達','理解不同對象的需求，把人文知識轉成清楚的內容與學習引導，讓更多人走進理解。'],
 ['分析師','在線索之間找出關聯','整理人文資料、比較不同證據，運用分析與詮釋提出有依據的解釋。'],
 ['策展人','把觀點變成一段體驗','連結內容、空間與觀眾，透過展覽與互動體驗，讓文化議題被看見、被感受。'],
 ['造物者','讓點子有可以試的形狀','從人的需求出發，運用 AI、數位工具與原型實作，把想法變成可測試、可修訂的方案。'],
 ['策略師','為文化找到行動方向','理解文化價值與溝通對象，整合品牌、活動與傳播策略，讓提案有清楚的方向。'],
 ['開拓者','和地方一起開出新路','走進地方與社群，在跨域合作、永續議題與實際行動中，共同探索新的可能。']
];
const $=s=>document.querySelector(s);
const track=$('.domain-track'),roleTrack=$('.role-track'),dialog=$('#preview');
const mobile=matchMedia('(max-width:700px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let selected=0,opener=null,scrollTimer;
const picture=name=>`assets/${name}.webp`;
track.innerHTML=domains.map((d,i)=>`<button class="domain-card" aria-pressed="${i===0}" data-index="${i}" style="--tint:${d.tint}" aria-label="${d.name}，${d.title}"><span class="portrait"><img src="${picture(d.name)}" alt="" width="400" height="760" fetchpriority="${i===0?'high':'auto'}"></span><span class="character-name">${d.name}</span><span class="domain-sub">${d.title}</span><span class="selected-label">● 目前選取</span></button>`).join('');
$('.domain-tabs').innerHTML=domains.map((d,i)=>`<button data-index="${i}" aria-pressed="${i===0}" aria-label="選取${d.title}">${d.name}</button>`).join('');
roleTrack.innerHTML=roles.map(([name,tag],i)=>`<button class="role-card" data-role="${i}" aria-haspopup="dialog" aria-label="認識${name}：${tag}"><img src="${picture(name)}" alt="" width="400" height="760" loading="lazy"><h3>${name}</h3><p>${tag}</p></button>`).join('');
function select(index,scroll=false){
 selected=Math.max(0,Math.min(3,index));const d=domains[selected];
 document.querySelectorAll('[data-index]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.index)===selected)));
 $('#domain-detail').innerHTML=`<div><p class="detail-label">${d.name}的提問</p><h3>${d.title}</h3></div><div><p>${d.question}</p><p>${d.description}</p></div><a class="primary" id="domain-entry" href="courses.html?domain=${selected}">探索這個領域 <span aria-hidden="true">↗</span></a>`;
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
mobile.addEventListener('change',()=>select(selected,true));
function openPreview(source,label,html){opener=source;$('#dialog-label').textContent=label;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();$('#close-dialog').focus();}
roleTrack.addEventListener('click',e=>{const button=e.target.closest('[data-role]');if(!button)return;const [name,tag,description]=roles[Number(button.dataset.role)];openPreview(button,'八種專業視角',`<div class="role-detail"><img src="${picture(name)}" alt="${name}人物造型"><div><h2 id="dialog-title">${name}</h2><p>${tag}</p><p>${description}</p></div></div><p class="dialog-note">這是一種可以探索的專業方向，不是固定的人格或職業判定。專業角色與課程的配對將在後續階段呈現。</p>`);});
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
select(history.state?.homepage?.selected??0);galleryControls();
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
