// Pure, deterministic local interpreter. No storage, network, DOM, randomness or scoring.
export const RULE_VERSION = '2026-10-11-v0.1';
export function interpretCollection(input,data) {
 if (!Array.isArray(input)) throw new TypeError('收藏必須是課程 ID 陣列');
 const validIds=new Set(data.courseIds);
 const snapshot=[...new Set(input.filter(id=>typeof id==='string'&&validIds.has(id)))].sort();
 const ignoredIds=[...new Set(input.filter(id=>typeof id==='string'&&!validIds.has(id)))].sort();
 const selected=new Set(snapshot);
 const directions=[],partialDirections=[];
 for (const role of data.roles) {
  const evidence=structuredClone(data.relations.filter(row=>row.characterId===role.id&&selected.has(row.courseId))).sort((a,b)=>a.courseId.localeCompare(b.courseId));
  if (!evidence.length) continue;
  const covered=new Set(evidence.flatMap(row=>row.abilityFacets.map(facet=>facet.facetId)));
  const missingFacets=role.requiredFacets.filter(id=>!covered.has(id));
  const hasRepresentative=evidence.some(row=>row.relationType==='代表');
  const candidate=hasRepresentative&&missingFacets.length===0;
  const result={characterId:role.id,name:role.name,evidence,
   facetEvidence:role.requiredFacets.map(facetId=>({facetId,label:role.facets[facetId],sources:evidence.flatMap(row=>row.abilityFacets.filter(f=>f.facetId===facetId).map(f=>({courseId:row.courseId,abilityId:f.abilityId})))})),
   missingFacets,hasRepresentative,singleCourseEvidence:evidence.length===1,
   limitations:[...new Set(evidence.map(row=>row.limitations))],
   ...(role.id==='P8'?{scopeNote:'僅呈現地方與社會實踐的探索方向，未證實地方共同決策與執行訓練。'}:{})};
  (candidate?directions:partialDirections).push(result);
 }
 return {ruleVersion:RULE_VERSION,mappingVersion:data.mappingVersion,annotationVersion:data.annotationVersion,
  sourceHashes:{...data.sourceHashes},reviewStatus:'prototype_rules',snapshot,ignoredIds,
  invalidEntryCount:input.filter(id=>typeof id!=='string').length,
  status:directions.length===0?'insufficient':directions.length===1?'single':directions.length===2?'dual':'multiple',
  ordering:'fixed_role_id_not_rank',directions,partialDirections,pending:structuredClone(data.pending.filter(row=>selected.has(row.courseId)))};
}
