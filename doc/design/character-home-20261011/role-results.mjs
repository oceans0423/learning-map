import {interpretCollection} from '../role-rules-20261011/interpret.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions={P1:'從文本與現場材料，追問文化現象背後的原因。',P2:'把觀察與想像，轉成有自己觀點的作品。',P3:'換一種說法，讓人文知識更容易被理解。',P4:'整理與分析人文資料，再回到人的故事與文化脈絡。',P5:'把文化內容化為展覽、影音與互動，用表達與呈現讓人走進文化。',P6:'從人的需求出發，把點子做成可以試用與修正的方案。',P7:'從文化創意發想，規劃目標、資源與推動方式。',P8:'走進地方與社群，以地方創生、社區參與與社會設計開創新的可能。'};
export function mountRoleResults({getSavedIds,subscribeCollection,isCourseReady}) {
 const section=document.querySelector('#role-exploration');
 section.hidden=false;
 const button=section.querySelector('#show-role-results');
 const start=section.querySelector('#start-role-exploration');
 const status=section.querySelector('#role-status');
 const output=section.querySelector('#role-output');
 let data=null,result=null,busy=false,request=0;
 const snapshot=()=>[...getSavedIds()].sort().join(',');
 function syncAvailability(){const empty=getSavedIds().size===0;button.hidden=empty;start.hidden=!empty;if(empty){result=null;output.hidden=true;output.innerHTML='';status.textContent='先收藏一門感興趣的課，再回來看看探索方向。';}}
 function validData(value) {
  if(value?.schemaVersion!==1||value.roles?.length!==8||value.relations?.length!==85||value.courseIds?.length!==69||value.pending?.length!==3||!value.abilityNames)throw Error('Invalid role data');
  const ids=new Set(value.courseIds),roles=new Map(value.roles.map(r=>[r.id,r]));
  if(ids.size!==69||roles.size!==8||value.roles.some((r,i)=>r.id!==`P${i+1}`||!r.name||!Array.isArray(r.requiredFacets)||!r.requiredFacets.length||r.requiredFacets.some(f=>!r.facets?.[f])))throw Error('Invalid roles');
  const pairs=new Set();
  for(const row of value.relations){
   const key=`${row.characterId}/${row.courseId}`;
   if(!ids.has(row.courseId)||!roles.has(row.characterId)||pairs.has(key)||!['代表','支援'].includes(row.relationType)||!row.reason||!row.courseName||!Array.isArray(row.abilityFacets)||!row.abilityFacets.length||row.abilityFacets.some(f=>!roles.get(row.characterId).facets[f.facetId]||!value.abilityNames[f.abilityId]))throw Error('Invalid relationship');
   pairs.add(key);
  }
  if(value.pending.some(row=>!ids.has(row.courseId)||!row.pendingReason||!row.courseName||value.relations.some(r=>r.courseId===row.courseId)))throw Error('Invalid pending courses');
  return value;
 }
 function courseLink(row){return isCourseReady()?`<button data-course="${escape(row.courseId)}" aria-haspopup="dialog">${escape(row.courseName)} <span aria-hidden="true">↗</span></button>`:`<span>${escape(row.courseName)}</span>`;}
 function roleCard(role){
  const definition=data.roles.find(r=>r.id===role.characterId);
  const labels=definition.requiredFacets.map(id=>definition.facets[id]).join('、');
  return `<article class="exploration-role" data-character="${role.characterId}"><div class="exploration-role-top"><img src="assets/${encodeURIComponent(role.name)}.webp" alt="" width="140" height="230" loading="lazy"><div><p class="eyebrow">一種可以探索的方向</p><h4>${escape(role.name)}</h4><p>${escape(descriptions[role.characterId])}</p><p class="role-facets">${escape(labels)}</p></div></div><details class="role-evidence"><summary>為什麼連向${escape(role.name)}？</summary><ul>${role.evidence.map(row=>`<li>${courseLink(row)}<small>${row.relationType==='代表'?'直接呈現工作方式':'提供支援線索'}</small><p>${escape(row.reason)}</p><p class="role-ability">${[...new Set(row.abilityFacets.map(f=>data.abilityNames[f.abilityId]))].map(escape).join('、')}</p></li>`).join('')}</ul><p class="role-sources">各面向來源：${role.facetEvidence.map(f=>`${escape(f.label)}（${f.sources.map(s=>escape(role.evidence.find(r=>r.courseId===s.courseId).courseName)).filter((v,i,a)=>a.indexOf(v)===i).join('、')}）`).join('；')}</p></details></article>`;
 }
 function renderResult(){
  const titles={single:'目前呈現一個探索方向',dual:'這些選擇，連結了兩個方向',multiple:'你的好奇，涵蓋多種方向',insufficient:'你的探索正在起步'};
  output.innerHTML=`<h3 id="role-result-title" tabindex="-1">${titles[result.status]}</h3><p class="role-description">${result.status==='insufficient'?'再多認識幾門課，或先看看八種角色，方向會慢慢浮現。':result.status==='single'?'這是你目前的收藏連成的學習方向。':'你的好奇往不同方向延伸，每一條都值得探索。'}</p><div class="exploration-role-grid">${result.directions.map(roleCard).join('')}</div>${result.partialDirections.length?`<details class="role-secondary"><summary>其他學習線索（${result.partialDirections.length} 個方向）</summary><ul>${result.partialDirections.map(r=>`<li><strong>${escape(r.name)}</strong><p>${r.missingFacets.length?`再連上「${r.missingFacets.map(f=>escape(data.roles.find(d=>d.id===r.characterId).facets[f])).join('」與「')}」，這個方向會更完整。`:'這些課程為這個方向打下基礎。'}</p>${r.evidence.map(row=>`<div>${courseLink(row)}<p>${escape(row.reason)}</p></div>`).join('')}</li>`).join('')}</ul></details>`:''}${result.pending.length?`<details class="role-secondary"><summary>整合所學的課程（${result.pending.length} 門）</summary><ul>${result.pending.map(row=>`<li>${courseLink(row)}<p>${escape(row.pendingReason)}。</p></li>`).join('')}</ul></details>`:''}`;
  output.hidden=false;
  output.querySelector('#role-result-title').focus({preventScroll:true});
 }
 async function show(){
  if(busy)return;
  busy=true;const token=++request,selected=snapshot();
  button.disabled=true;button.textContent='正在整理方向…';section.setAttribute('aria-busy','true');
  status.textContent='正在整理你的探索方向…';output.hidden=true;
  try{
   if(!data){const response=await fetch('role-data.json');if(!response.ok)throw Error('Role request failed');data=validData(await response.json());}
   if(token!==request||selected!==snapshot()){status.textContent='收藏已更新，按「重新查看探索方向」看看新的組合。';return;}
   result=interpretCollection([...getSavedIds()],data);renderResult();
   status.textContent=`已依目前 ${result.snapshot.length} 門收藏整理方向。${result.status==='insufficient'?'你的探索正在起步。':`呈現 ${result.directions.length} 個方向。`}`;
  }catch{
   data=null;result=null;output.innerHTML='';status.textContent='角色方向暫時無法讀取，請按「重新讀取角色方向」再試一次。';
   button.textContent='重新讀取角色方向';
  }finally{
   busy=false;button.disabled=false;section.setAttribute('aria-busy','false');
   if(!button.textContent.includes('重新讀取'))button.textContent=result?'重新查看探索方向':'看看我的探索方向';
  }
 }
 button.addEventListener('click',show);
 subscribeCollection(()=>{
  syncAvailability();
  if(result&&result.snapshot.join(',')===snapshot())return;
  if(result||busy){
   const hadFocus=output.contains(document.activeElement);result=null;output.hidden=true;output.innerHTML='';
   status.textContent='收藏已更新，按「重新查看探索方向」看看新的組合。';
   if(hadFocus&&!document.querySelector('#course-dialog').open)button.focus({preventScroll:true});
  }
 });
 syncAvailability();
 return {refresh:()=>{if(result&&result.snapshot.join(',')!==snapshot()){result=null;output.hidden=true;output.innerHTML='';status.textContent='收藏已更新，按「重新查看探索方向」看看新的組合。';}}};
}
