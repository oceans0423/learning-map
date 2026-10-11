import {interpretCollection} from '../role-rules-20261011/interpret.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions={P1:'從文本與現場材料，追問文化現象背後的原因。',P2:'把觀察與想像，轉成有自己觀點的作品。',P3:'換一種說法，讓人文知識更容易被理解。',P4:'從資料裡找出關係，再回到人的故事與文化脈絡。',P5:'安排內容與參與方式，讓觀眾走進一段文化體驗。',P6:'從人的需求出發，把點子做成可以試用與修正的方案。',P7:'為文化內容找到對象、資源與傳播方向。',P8:'理解地方與社群，探索一起回應問題的行動方向。'};
export function mountRoleResults({getSavedIds,subscribeCollection,isCourseReady}) {
 const section=document.querySelector('#role-exploration');
 section.hidden=false;
 const button=section.querySelector('#show-role-results');
 const status=section.querySelector('#role-status');
 const output=section.querySelector('#role-output');
 let data=null,result=null,busy=false,request=0;
 const snapshot=()=>[...getSavedIds()].sort().join(',');
 function validData(value) {
  if(value?.schemaVersion!==1||value.roles?.length!==8||value.relations?.length!==84||value.courseIds?.length!==69||value.pending?.length!==3||!value.abilityNames)throw Error('Invalid role data');
  const ids=new Set(value.courseIds),roles=new Map(value.roles.map(r=>[r.id,r]));
  if(ids.size!==69||roles.size!==8||value.roles.some((r,i)=>r.id!==`P${i+1}`||!r.name||!Array.isArray(r.requiredFacets)||!r.requiredFacets.length||r.requiredFacets.some(f=>!r.facets?.[f])))throw Error('Invalid roles');
  const pairs=new Set();
  for(const row of value.relations){
   const key=`${row.characterId}/${row.courseId}`;
   if(!ids.has(row.courseId)||!roles.has(row.characterId)||pairs.has(key)||!['代表','支援'].includes(row.relationType)||!row.reason||!row.limitations||!row.courseName||!Array.isArray(row.abilityFacets)||!row.abilityFacets.length||row.abilityFacets.some(f=>!roles.get(row.characterId).facets[f.facetId]||!value.abilityNames[f.abilityId]))throw Error('Invalid relationship');
   pairs.add(key);
  }
  if(value.pending.some(row=>!ids.has(row.courseId)||!row.pendingReason||!row.courseName||value.relations.some(r=>r.courseId===row.courseId)))throw Error('Invalid pending courses');
  return value;
 }
 function courseLink(row){return isCourseReady()?`<button data-course="${escape(row.courseId)}" aria-haspopup="dialog">${escape(row.courseName)} <span aria-hidden="true">↗</span></button>`:`<span>${escape(row.courseName)}</span>`;}
 function roleCard(role){
  const definition=data.roles.find(r=>r.id===role.characterId);
  const labels=definition.requiredFacets.map(id=>definition.facets[id]).join('、');
  return `<article class="exploration-role" data-character="${role.characterId}"><div class="exploration-role-top"><img src="assets/${encodeURIComponent(role.name)}.webp" alt="" width="140" height="230" loading="lazy"><div><p class="eyebrow">一種可以探索的方向</p><h4>${escape(role.name)}</h4><p>${escape(labels)}</p>${role.singleCourseEvidence?'<p class="role-caution">目前依據集中於一門課，先作為暫定方向。</p>':''}</div></div>${role.scopeNote?`<p class="role-caution">${escape(role.scopeNote)}</p>`:''}<details class="role-evidence"><summary>為什麼連向${escape(role.name)}？</summary><ul>${role.evidence.map(row=>`<li>${courseLink(row)}<small>${row.relationType==='代表'?'直接呈現工作方式':'提供支援線索'}</small><p>${escape(row.reason)}</p><p class="role-ability">${[...new Set(row.abilityFacets.map(f=>data.abilityNames[f.abilityId]))].map(escape).join('、')}</p><p class="role-limit">注意：${escape(row.limitations)}</p></li>`).join('')}</ul><p class="role-limit">各面向來源：${role.facetEvidence.map(f=>`${escape(f.label)}（${f.sources.map(s=>escape(role.evidence.find(r=>r.courseId===s.courseId).courseName)).filter((v,i,a)=>a.indexOf(v)===i).join('、')}）`).join('；')}</p></details></article>`;
 }
 function renderResult(){
  const titles={single:'目前呈現一個探索方向',dual:'這些選擇，連結了兩個方向',multiple:'你的好奇，涵蓋多種方向',insufficient:'先看見線索，不急著配成角色'};
  output.innerHTML=`<h3 id="role-result-title" tabindex="-1">${titles[result.status]}</h3><p class="role-description">${result.status==='insufficient'?'這不代表能力不足。目前的收藏還未連成清楚的工作方式，你可以繼續認識課程或八種角色。':'這是目前收藏呈現的學習方向，不是人格、職涯適配或已具備的能力。多個方向按固定次序呈現，沒有高低排名。'}</p><div class="exploration-role-grid">${result.directions.map(roleCard).join('')}</div>${result.partialDirections.length?`<details class="role-secondary"><summary>其他學習線索（${result.partialDirections.length} 個方向）</summary><ul>${result.partialDirections.map(r=>`<li><strong>${escape(r.name)}</strong><p>${r.hasRepresentative?'還有面向尚待連結':'目前是支援線索，不單獨配成角色'}${r.missingFacets.length?`：${r.missingFacets.map(f=>escape(data.roles.find(d=>d.id===r.characterId).facets[f])).join('、')}`:'；即使支援面向齊全，也不以課程數量取代直接線索'}。</p>${r.evidence.map(row=>`<div>${courseLink(row)}<p>${escape(row.reason)}</p><p class="role-limit">注意：${escape(row.limitations)}</p></div>`).join('')}</li>`).join('')}</ul></details>`:''}${result.pending.length?`<details class="role-secondary"><summary>需看實際題目的課程（${result.pending.length} 門）</summary><ul>${result.pending.map(row=>`<li>${courseLink(row)}<p>${escape(row.pendingReason)}。目前不預配角色，也不要求補答題目。</p></li>`).join('')}</ul></details>`:''}<p class="role-version">學系課程對應規劃 · 判讀 ${escape(result.ruleVersion)} · <a href="../role-rules-20261011/README.md">查看規則與限制</a></p>`;
  output.hidden=false;
  output.querySelector('#role-result-title').focus({preventScroll:true});
 }
 async function show(){
  if(busy)return;
  busy=true;const token=++request,selected=snapshot();
  button.disabled=true;button.textContent='正在整理方向…';section.setAttribute('aria-busy','true');
  status.textContent='正在讀取角色依據，收藏不會被修改。';output.hidden=true;
  try{
   if(!data){const response=await fetch('role-data.json');if(!response.ok)throw Error('Role request failed');data=validData(await response.json());}
   if(token!==request||selected!==snapshot()){status.textContent='收藏已更新，請重新查看探索方向。';return;}
   result=interpretCollection([...getSavedIds()],data);renderResult();
   status.textContent=`已依目前 ${result.snapshot.length} 門收藏整理方向。${result.status==='insufficient'?'目前先呈現學習線索。':`呈現 ${result.directions.length} 個方向，沒有排名。`}`;
  }catch{
   data=null;result=null;output.innerHTML='';status.textContent='角色依據暫時無法讀取。收藏與課程仍保留，請按「重新讀取角色方向」重試。';
   button.textContent='重新讀取角色方向';
  }finally{
   busy=false;button.disabled=false;section.setAttribute('aria-busy','false');
   if(!button.textContent.includes('重新讀取'))button.textContent=result?'重新查看探索方向':'看看我的探索方向';
  }
 }
 button.addEventListener('click',show);
 subscribeCollection(()=>{
  if(result&&result.snapshot.join(',')===snapshot())return;
  if(result||busy){
   const hadFocus=output.contains(document.activeElement);result=null;output.hidden=true;output.innerHTML='';
   status.textContent='收藏已更新，請重新查看探索方向。舊結果已收起，不會自動更換角色。';
   if(hadFocus&&!document.querySelector('#course-dialog').open)button.focus({preventScroll:true});
  }
 });
 return {refresh:()=>{if(result&&result.snapshot.join(',')!==snapshot()){result=null;output.hidden=true;output.innerHTML='';status.textContent='收藏已更新，請重新查看探索方向。';}}};
}
