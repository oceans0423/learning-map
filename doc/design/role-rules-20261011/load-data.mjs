import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {annotations,roleDefinitions} from './annotations.mjs';

const root = new URL('../../../', import.meta.url);
export async function loadRoleData() {
 const mappingPath = 'doc/CHARACTER_COURSE_ABILITY_MAPPING_2026-10-11.md';
 const abilityPath = 'doc/DEPARTMENT_ABILITY_MAPPING_2026-10-11.md';
 const sources = [mappingPath,abilityPath,'doc/course/courses_v1.json',
  'doc/design/role-rules-20261011/annotations.mjs',
  'doc/design/role-rules-20261011/interpret.mjs',
  'doc/CHARACTER_INTERPRETATION_RULES_2026-10-11.md'];
 const contents = await Promise.all(sources.map(path=>readFile(new URL(path,root),'utf8')));
 const [mapping,abilities,canonical] = contents;
 const {courses} = JSON.parse(canonical);
 const courseById = new Map(courses.map(c=>[c.id,c]));
 assert.equal(courseById.size,69);
 const allowed = new Map();
 for (const line of abilities.split(/\r?\n/).filter(line=>/^\| course-\d{3} \|/.test(line))) {
  const [id,name,core,support] = line.split('|').slice(1,-1).map(s=>s.trim());
  assert.equal(name,courseById.get(id)?.name);
  allowed.set(id,new Set((core+support).match(/H\d{2}/g)??[]));
 }
 const index = new Map();
 for (const role of roleDefinitions) for (const encoded of annotations[role.id]) {
  const [number,facets] = encoded.split(':');
  const courseId = `course-${number}`;
  const key = `${role.id}/${courseId}`;
  assert.ok(!index.has(key),key);
  const entries = facets.split(',').map(value=>{
   const [facetId,abilityId] = value.split('@');
   assert.ok(role.facets[facetId],key);
   assert.ok(allowed.get(courseId)?.has(abilityId),`${key}/${abilityId}`);
   return {facetId,abilityId};
  });
  assert.equal(new Set(entries.map(entry=>entry.facetId)).size,entries.length,key);
  index.set(key,entries);
 }
 const relations = [], pending = [];
 let roleId = null;
 for (const [lineNumber,line] of mapping.split(/\r?\n/).entries()) {
  if (line.startsWith('## ')) roleId=null;
  const heading = line.match(/^### (P[1-8])｜(.+)$/);
  if (heading) {
   roleId=heading[1];
   assert.equal(roleDefinitions.find(role=>role.id===roleId)?.name,heading[2]);
  }
  if (!/^\| course-\d{3} \|/.test(line)) continue;
  const cells = line.split('|').slice(1,-1).map(value=>value.trim());
  const [courseId,courseName] = cells;
  assert.equal(courseName,courseById.get(courseId)?.name);
  const sourceRefs = [{path:mappingPath,line:lineNumber+1},{path:abilityPath},
   {path:'doc/design/role-rules-20261011/annotations.mjs'}];
  if (!roleId) {
   assert.equal(cells.length,5);
   pending.push({courseId,courseName,pendingReason:cells[4],abilityIds:cells[2].match(/H\d{2}/g),sourceRefs});
   continue;
  }
  assert.equal(cells.length,6);
  const key = `${roleId}/${courseId}`;
  const abilityFacets=index.get(key);
  assert.ok(abilityFacets,`Missing annotation: ${key}`);
  index.delete(key);
  const [, , relationType,facetDescription,reason,limitations] = cells;
  assert.ok(['代表','支援'].includes(relationType));
  for (const {abilityId} of abilityFacets) assert.ok(facetDescription.includes(abilityId),`${key}: annotation absent from relationship`);
  relations.push({courseId,courseName,characterId:roleId,relationType,abilityFacets,facetDescription,reason,limitations,sourceRefs,reviewStatus:'proposed'});
 }
 assert.equal(index.size,0,'Unused annotations');
 assert.equal(relations.length,83);
 assert.equal(pending.length,4);
 assert.equal(new Set([...relations,...pending].map(row=>row.courseId)).size,69);
 return {schemaVersion:1,mappingVersion:'2026-10-11-v0.2',annotationVersion:'2026-10-11-v0.2',reviewStatus:'proposed',
  sourceHashes:Object.fromEntries(sources.map((path,i)=>[path,createHash('sha256').update(contents[i]).digest('hex')])),
  courseIds:courses.map(c=>c.id).sort(),roles:roleDefinitions,relations,pending};
}
