import {domains} from './domains.mjs';
import {mountRoleResults} from './role-results.mjs';
import {getSavedIds,getCollectionNotice,isVolatile,canClearCollection,toggleSaved,clearSaved,subscribeCollection} from './collection-store.mjs';
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const params=new URLSearchParams(location.search);
const savedView=params.get('view')==='saved';
const initialDomains=(params.get('domains')??params.get('domain')??'').split(',').filter(v=>/^[0-3]$/.test(v)).map(Number);
const state={domains:new Set(initialDomains),year:/^[1-4]$/.test(params.get('year'))?params.get('year'):'',type:['required','elective'].includes(params.get('type'))?params.get('type'):'',q:params.get('q')??'',ability:/^H(0[1-9]|1[0-4])$/.test(params.get('ability'))?params.get('ability'):''};
const requestedCourse=/^course-\d{3}$/.test(params.get('course')??'')?params.get('course'):null;
let courses=null,abilityData=null,opener=null,timer,loadingVersion=0,activeCourse=requestedCourse,courseHistory=false,removalFocusTarget=null;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase().trim();
const labels=['一','二','三','四'];
const domainFor=course=>domains.find(d=>d.module===course.module);
const building=(domain,size=512)=>`../building/${domain.building}-${size}.webp`;
$('#domain-options').innerHTML=domains.map((d,i)=>`<label class="domain-option"><input type="checkbox" name="domain" value="${i}" ${state.domains.has(i)?'checked':''}><span><strong>${d.guild}</strong><small>${d.title}</small></span></label>`).join('');
$('#search').value=state.q;$('#year').value=state.year;$('#type').value=state.type;
function syncURL(mode='replace'){const p=new URLSearchParams();if(savedView)p.set('view','saved');else{if(state.domains.size)p.set('domains',[...state.domains].sort().join(','));if(state.year)p.set('year',state.year);if(state.type)p.set('type',state.type);if(state.ability)p.set('ability',state.ability);if(state.q.trim())p.set('q',state.q.trim());}if(activeCourse)p.set('course',activeCourse);history[mode+'State'](null,'',location.pathname+(p.size?'?'+p:''));}
function renderIntro(){
 const one=!savedView&&state.domains.size===1?domains[[...state.domains][0]]:null;
 $('#intro-side').innerHTML=one?`<div class="intro-domain"><img src="${building(one)}" alt="${one.guild}建築" width="512" height="${Math.round(one.buildingHeight/2)}"><div><p class="eyebrow">EXPLORE A GUILD</p><h2>${one.guild}</h2><p>${one.title}<br>${one.question}</p></div></div>`:domains.map(d=>`<img class="mini-crew" src="${building(d)}" alt="${d.guild}建築" width="512" height="${Math.round(d.buildingHeight/2)}">`).join('');
}
function conditionText(){const parts=[];if(state.domains.size)parts.push([...state.domains].sort().map(i=>domains[i].guild).join('、'));if(state.year)parts.push(`${labels[Number(state.year)-1]}年級`);if(state.type)parts.push(state.type==='required'?'必修':'選修');if(state.ability&&abilityData)parts.push(`培養「${abilityData.abilities[state.ability].name}」`);if(state.q.trim())parts.push(`課名包含「${state.q.trim()}」`);return parts.join(' · ')||'全部公會與年級';}
function filterCourses(){const terms=normalize(state.q).split(/\s+/).filter(Boolean),saved=getSavedIds();return courses.filter(c=>savedView?saved.has(c.id):(!state.domains.size||[...state.domains].some(i=>domains[i].module===c.module))&&(!state.year||String(c.year)===state.year)&&(!state.type||c.type===state.type)&&(!state.ability||!abilityData||abilityData.mappings[c.id]?.primary.includes(state.ability)||abilityData.mappings[c.id]?.secondary.includes(state.ability))&&terms.every(term=>normalize(c.name).includes(term))).sort((a,b)=>a.year-b.year||a.semester-b.semester||a.id.localeCompare(b.id));}
const bookmark='<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
function saveButton(c){const saved=getSavedIds().has(c.id);return `<button class="save-button" data-save="${c.id}" aria-pressed="${saved}" aria-label="${saved?'取消收藏':'收藏'}${escapeHTML(c.name)}">${bookmark}<span>${saved?'已收藏':'收藏'}</span></button>`;}
function syncSaveUI(){
 const saved=getSavedIds();document.querySelectorAll('[data-save-count]').forEach(el=>el.textContent=saved.size);
 $('#storage-notice').textContent=getCollectionNotice();$('#storage-notice').classList.toggle('storage-warning',isVolatile());
 $('#clear-collection').hidden=!savedView;$('#clear-collection').disabled=!canClearCollection();
 document.querySelectorAll('[data-save]').forEach(button=>{const course=courses?.find(c=>c.id===button.dataset.save);if(!course)return;const active=saved.has(course.id);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',`${active?'取消收藏':'收藏'}${course.name}`);button.querySelector('span').textContent=active?'已收藏':'收藏';});
}
function renderCollectionSummary(){
 const box=$('#collection-summary');if(!savedView||!courses)return;
 const saved=courses.filter(c=>getSavedIds().has(c.id));box.hidden=!saved.length;if(!saved.length)return;
 const domainHTML=domains.map((d,i)=>{const related=saved.filter(c=>c.module===d.module);return `<article class="direction-tile"><img src="${building(d)}" alt="${d.guild}建築" width="512" height="${Math.round(d.buildingHeight/2)}"><div><p class="eyebrow">${d.guild}</p><h3>${d.title}</h3><p class="direction-count">${related.length?`${related.length} 門收藏課程`:'尚未收藏此公會課程'}</p><a href="courses.html?domain=${i}" class="button-secondary">探索公會 ↗</a></div></article>`;}).join('');
 const rows=abilityData?Object.entries(abilityData.abilities).map(([id,a])=>{
  const related=saved.filter(c=>{const m=abilityData.mappings[c.id];return m&&(m.primary.includes(id)||m.secondary.includes(id))});if(!related.length)return '';
  return `<details class="interest-direction"><summary><span>${escapeHTML(a.name)}</span><small>${related.length} 門課程連結</small></summary><p>${escapeHTML(a.definition)}</p><ul>${related.map(c=>`<li><button data-course="${c.id}" aria-haspopup="dialog">${escapeHTML(c.name)} ↗</button><span>${abilityData.mappings[c.id].primary.includes(id)?'主要方向':'支援方向'}</span></li>`).join('')}</ul></details>`;
 }).join(''):'<p class="ability-unavailable">能力連結資料暫時無法讀取；收藏課程與公會仍可正常查看。</p>';
 box.innerHTML=`<div class="summary-heading"><p class="eyebrow">A FEW THINGS YOU ARE CURIOUS ABOUT</p><h2>這些選擇，連向哪些方向？</h2><p>你留下了 ${saved.length} 門想進一步認識的課。</p><a class="button-secondary" href="#results-title">直接查看收藏的課程 ↓</a></div><div class="direction-grid">${domainHTML}</div><div class="interest-heading"><h2>你想探索的能力方向</h2><p>展開看看，是哪些課程帶來這個連結。</p></div><div class="interest-list">${rows}</div>`;
}
function render(){
 syncURL();renderIntro();syncSaveUI();if(!courses)return;
 const filtered=filterCourses();$('#result-number').textContent=filtered.length;
 $('#result-status').textContent=savedView?`已留下 ${filtered.length} 門課程，依規劃年級與學期排列。`:`${conditionText()} · 找到 ${filtered.length} 門課程`;
 $('#results').innerHTML=filtered.length?`<div class="course-grid">${filtered.map(c=>{
 const d=domainFor(c);return `<article class="course-card" style="--card-color:${d.tint}"><p class="card-kicker"><span>${labels[c.year-1]}年級 · 第 ${c.semester} 學期</span><span>${c.type==='required'?'必修':'選修'}</span></p><h3>${escapeHTML(c.name)}</h3><p class="course-domain">${d.guild} · ${d.title}</p>${abilityTags(c.id)}<div class="card-bottom"><p>${c.credits} 學分</p><div class="card-actions">${saveButton(c)}<button data-course="${c.id}" aria-haspopup="dialog" aria-label="查看${escapeHTML(c.name)}的課程詳情">認識這門課 ↗</button></div></div></article>`;
 }).join('')}</div>`:savedView?`<div class="empty-state"><p class="eyebrow">START WITH A LITTLE CURIOSITY</p><h3>還沒有留下想探索的課</h3><p>看到感興趣的課時，可以按下「收藏」。<br>也可以不收藏，直接繼續認識課程。</p><a href="courses.html" class="primary">去看看課程 ↗</a></div>`:`<div class="empty-state"><p class="eyebrow">TRY ANOTHER DIRECTION</p><h3>換個關鍵字，或放寬條件？</h3><p>目前條件沒有找到課程。<br>可以試試「文化」、「文學」或「數位」，也可以先看全部課程。</p><button class="primary" id="empty-reset">清除條件，查看全部課程 ↗</button></div>`;
 $('#empty-reset')?.addEventListener('click',reset);
 renderCollectionSummary();
}
function commitSearch(){clearTimeout(timer);state.q=$('#search').value;render();}
$('#search').addEventListener('input',e=>{if(e.isComposing)return;clearTimeout(timer);timer=setTimeout(commitSearch,180)});
$('#search').addEventListener('compositionend',()=>{clearTimeout(timer);timer=setTimeout(commitSearch,180)});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();commitSearch()});
$('#domain-options').addEventListener('change',e=>{const index=Number(e.target.value);e.target.checked?state.domains.add(index):state.domains.delete(index);commitSearch()});
for(const id of ['year','type','ability'])$('#'+id).addEventListener('change',()=>{state[id]=$('#'+id).value;commitSearch()});
function reset(){clearTimeout(timer);state.domains.clear();state.year='';state.type='';state.ability='';state.q='';$('#search').value='';$('#year').value='';$('#type').value='';$('#ability').value='';document.querySelectorAll('[name=domain]').forEach(el=>el.checked=false);render();$('#search').focus({preventScroll:true});}
$('.reset').addEventListener('click',reset);
function abilityTags(id){const m=abilityData?.mappings[id];return m?`<ul class="ability-tags card-abilities" aria-label="主要培養能力">${m.primary.map(a=>`<li>${escapeHTML(abilityData.abilities[a].name)}</li>`).join('')}</ul>`:'';}
function abilityBlock(id){const a=abilityData.abilities[id];return `<div class="ability-block"><h4>${escapeHTML(a.name)}</h4><p>${escapeHTML(a.definition)}</p><dl><div><dt>怎麼做</dt><dd>${escapeHTML(a.behavior)}</dd></div><div><dt>可以做出</dt><dd>${escapeHTML(a.outputs)}</dd></div></dl></div>`;}
function openCourse(e){const button=e.target.closest('[data-course]');if(button)showCourse(button.dataset.course,button);}
function showCourse(id,source,push=true){
 const c=courses.find(c=>c.id===id);if(!c)return;const d=domainFor(c),mapping=abilityData?.mappings[c.id];opener=source;activeCourse=id;if(push){syncURL('push');courseHistory=true;}
 $('#course-content').innerHTML=`<div class="course-heading"><img src="${building(d)}" alt="${d.guild}建築" width="512" height="${Math.round(d.buildingHeight/2)}"><div><p>${d.guild} · ${d.title}</p><h2 id="course-title">${escapeHTML(c.name)}</h2></div></div><dl class="facts"><div><dt>規劃年級</dt><dd>${labels[c.year-1]}年級</dd></div><div><dt>規劃學期</dt><dd>第 ${c.semester} 學期</dd></div><div><dt>課程學分</dt><dd>${c.credits} 學分</dd></div><div><dt>課程性質</dt><dd>${c.type==='required'?'必修':'選修'}</dd></div></dl><p class="detail-offering">${escapeHTML(c.offeringNote)} · ${escapeHTML(c.sourceVersion)}</p><section class="ability-section" aria-labelledby="ability-title"><h3 id="ability-title">這門課的能力連結</h3>${mapping?`<p class="mapping-rationale">${escapeHTML(mapping.rationale)}</p><div class="ability-primary"><h4 class="ability-group">主要培養</h4>${mapping.primary.map(abilityBlock).join('')}</div><div class="ability-secondary"><h4 class="ability-group">延伸練習</h4>${mapping.secondary.map(abilityBlock).join('')}</div>`:'<p>這門課的能力對照尚待更新；課程基本資訊仍可正常查看。</p>'}</section>`;
 $('.detail-offering').insertAdjacentHTML('afterend',`<div class="detail-save-row">${saveButton(c)}<p>想再看一眼？把這門課留在「我的探索」。</p></div><p id="detail-save-feedback" class="detail-save-feedback" role="status" aria-live="polite"></p>`);
 $('#course-dialog').showModal();$('#close-course').focus();
}
$('#results').addEventListener('click',openCourse);
$('#collection-summary').addEventListener('click',openCourse);
$('#role-exploration').addEventListener('click',openCourse);
function closeCourse(){if(courseHistory)history.back();else{activeCourse=null;syncURL();$('#course-dialog').close();}}
$('#close-course').addEventListener('click',closeCourse);
$('#course-dialog').addEventListener('cancel',e=>{e.preventDefault();closeCourse();});
$('#course-dialog').addEventListener('close',()=>{const replacement=opener?.dataset.course?document.querySelector(`#results [data-course="${opener.dataset.course}"]`):null;if(opener?.isConnected&&!opener.closest('dialog'))opener.focus({preventScroll:true});else if(removalFocusTarget?.isConnected)removalFocusTarget.focus({preventScroll:true});else if(replacement)replacement.focus({preventScroll:true});else $('#results-title').focus({preventScroll:true});removalFocusTarget=null;});
$('#course-dialog').addEventListener('click',e=>{const d=$('#course-dialog'),r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeCourse();});
async function loadCourses(){
 const version=++loadingVersion;$('#results-section').setAttribute('aria-busy','true');$('#result-status').textContent='正在讀取課程資料…';$('#results').innerHTML='';$('#result-number').textContent='—';
 try{const response=await fetch('../../course/courses_v1.json');if(!response.ok)throw Error('Course request failed');const data=await response.json();if(!Array.isArray(data.courses)||data.courses.length!==69||data.courses.some(c=>!domainFor(c)))throw Error('Invalid course data');if(version!==loadingVersion)return;courses=data.courses;render();}
 catch{if(version!==loadingVersion)return;$('#result-status').textContent='課程資料讀取失敗，已保留你的篩選條件。';$('#results').innerHTML='<div class="empty-state"><h3>暫時無法讀取課程</h3><p>請確認本機伺服器仍在運作，再試一次。</p><button id="retry-courses" class="primary">重新讀取課程</button></div>';$('#retry-courses').addEventListener('click',loadCourses);}
 finally{if(version===loadingVersion)$('#results-section').setAttribute('aria-busy','false');}
}
async function loadAbilities(){try{const response=await fetch('ability-data.json');if(!response.ok)throw Error('Ability request failed');const data=await response.json();if(!data.abilities||!data.mappings||Object.keys(data.abilities).length!==14||Object.keys(data.mappings).length!==69)throw Error('Invalid ability data');abilityData=data;$('#ability').insertAdjacentHTML('beforeend',Object.entries(data.abilities).map(([id,a])=>`<option value="${id}">${escapeHTML(a.name)}</option>`).join(''));$('#ability').value=state.ability;}catch{abilityData=null;$('#ability').disabled=true;}if(courses)render();else renderCollectionSummary();}
let feedbackTimer,feedbackClearTimer;
function feedback(message){const toast=$('#collection-feedback');clearTimeout(feedbackTimer);clearTimeout(feedbackClearTimer);toast.textContent=message;toast.classList.add('is-visible');if($('#detail-save-feedback'))$('#detail-save-feedback').textContent=message;feedbackTimer=setTimeout(()=>{toast.classList.remove('is-visible');feedbackClearTimer=setTimeout(()=>toast.textContent='',reduced.matches?160:200)},5000);}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-save]');if(!button||!courses)return;
 const course=courses.find(c=>c.id===button.dataset.save);if(!course)return;
 const saved=toggleSaved(course.id);
 feedback(`「${course.name}」${saved?'已加入':'已移出'}我的探索。${isVolatile()?'目前只在本頁暫存。':''}`);
});
subscribeCollection(()=>{
 const active=document.activeElement,saveId=active?.dataset.save;
 const oldButtons=[...document.querySelectorAll('#results [data-save]')],oldIndex=oldButtons.indexOf(active);
 if(savedView){const detailIndex=opener?.dataset.course?[...document.querySelectorAll('#results [data-course]')].indexOf(opener):-1;render();if($('#course-dialog').open&&detailIndex>=0&&!getSavedIds().has(opener.dataset.course)){const remaining=document.querySelectorAll('#results [data-course]');removalFocusTarget=remaining[Math.min(detailIndex,remaining.length-1)]||$('#results-title');}if(saveId&&!$('#course-dialog').open&&!$('#clear-dialog').open){const replacement=document.querySelector(`#results [data-save="${saveId}"]`)||document.querySelectorAll('#results [data-save]')[Math.min(Math.max(oldIndex,0),getSavedIds().size-1)];(replacement||$('#results-title')).focus({preventScroll:true});}}
 else syncSaveUI();
});
$('#clear-collection').addEventListener('click',()=>{const n=getSavedIds().size;$('#clear-description').textContent=n?`即將移除目前 ${n} 門課程的收藏紀錄。`:'即將清除此樣張目前無法讀取的收藏紀錄。';$('#clear-dialog').showModal();$('#cancel-clear').focus();});
$('#cancel-clear').addEventListener('click',()=>$('#clear-dialog').close());
$('#confirm-clear').addEventListener('click',()=>{const cleared=clearSaved();$('#clear-dialog').close();feedback(cleared?'已清空此瀏覽器的樣張收藏。課程資料沒有變更。':'無法清除收藏；目前清單仍保留。');});
$('#clear-dialog').addEventListener('close',()=>{$('#clear-collection').disabled?$('#results-title').focus({preventScroll:true}):$('#clear-collection').focus({preventScroll:true});});
if(savedView){
 document.title='我的探索｜人文跨域與應用學系';document.body.classList.add('saved-view');
 $('#collection-link').setAttribute('aria-current','page');$('.filter-panel').hidden=true;
 $('#catalog-title').innerHTML='留下一點好奇，<br>慢慢長出方向<span class="title-dot">．</span>';
 $('.catalog-intro .eyebrow').textContent='MY EXPLORATION';$('.catalog-lead').innerHTML='從想了解的課程開始，<br>看見自己的探索路徑。';
 $('#results-title').innerHTML='收藏的課程 <span id="result-number">—</span>';
}else $('#browse-link').setAttribute('aria-current','page');
if(savedView)mountRoleResults({getSavedIds,subscribeCollection,isCourseReady:()=>Boolean(courses)});
window.addEventListener('pageshow',event=>{if(event.persisted){if(savedView)render();else syncSaveUI();}});
window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('course');activeCourse=id;if(id&&courses){courseHistory=true;showCourse(id,null,false);}else if($('#course-dialog').open){courseHistory=false;$('#course-dialog').close();}});
render();await Promise.all([loadCourses(),loadAbilities()]);
if(requestedCourse&&courses)showCourse(requestedCourse,null,false);
