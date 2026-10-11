// Prototype-only namespace. Never read, clear or migrate production application storage.
export const COLLECTION_KEY='humanities-character-prototype:collection:v1';
const valid=id=>typeof id==='string'&&/^course-\d{3}$/.test(id)&&Number(id.slice(-3))>=1&&Number(id.slice(-3))<=69;
let ids=new Set(),issue='',volatile=false;
const listeners=new Set();
function read(){
 try{
  const raw=localStorage.getItem(COLLECTION_KEY);
  if(raw===null)return {ids:new Set(),issue:''};
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.ids)||data.ids.length>1000)throw Error('Invalid collection');
  return {ids:new Set(data.ids.filter(valid)),issue:data.ids.some(id=>!valid(id))?'部分舊收藏已不在目前課程資料中，僅顯示有效課程。':''};
 }catch{return null;}
}
const initial=read();
if(initial){ids=initial.ids;issue=initial.issue;}else{volatile=true;issue='無法讀取收藏紀錄。本次操作只暫存在此頁，未覆寫原紀錄。';}
function notify(){for(const listener of listeners)listener();}
export const getSavedIds=()=>new Set(ids);
export const getCollectionNotice=()=>issue||'收藏只保存在此瀏覽器，不會跨裝置同步；清除瀏覽器資料也會移除收藏。';
export const isVolatile=()=>volatile;
export const canClearCollection=()=>ids.size>0||volatile||Boolean(issue);
export function subscribeCollection(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function toggleSaved(id){
 if(!valid(id))return;
 // Read the latest shared state before changing one ID, to preserve sequential changes from other tabs.
 if(!volatile){const latest=read();if(latest){ids=latest.ids;issue=latest.issue;}else{volatile=true;issue='無法讀取收藏紀錄。本次操作只暫存在此頁，未覆寫原紀錄。';}}
 ids.has(id)?ids.delete(id):ids.add(id);
 if(!volatile){try{localStorage.setItem(COLLECTION_KEY,JSON.stringify({version:1,ids:[...ids].sort()}));}catch{volatile=true;issue='瀏覽器無法保存收藏；目前只暫存在此頁，重新整理或離開後可能遺失。';}}
 notify();return ids.has(id);
}
export function clearSaved(){
 try{localStorage.removeItem(COLLECTION_KEY);ids.clear();volatile=false;issue='';notify();return true;}
 catch{issue='無法清除此瀏覽器的收藏紀錄，未清空目前清單。請檢查瀏覽器的儲存設定。';notify();return false;}
}
window.addEventListener('storage',event=>{
 if(event.key!==COLLECTION_KEY&&event.key!==null)return;
 try{if(event.storageArea!==localStorage)return;}catch{return;}
 const latest=read();
 if(latest){ids=latest.ids;issue=latest.issue;volatile=false;}else{volatile=true;issue='其他分頁的收藏紀錄無法讀取；目前顯示此頁保留的清單。';}
 notify();
});
