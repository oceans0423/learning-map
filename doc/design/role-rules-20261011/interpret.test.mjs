import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadRoleData} from './load-data.mjs';
import {interpretCollection} from './interpret.mjs';

const data=await loadRoleData();
const ids=(...numbers)=>numbers.map(n=>`course-${String(n).padStart(3,'0')}`);
const expected=[
 [[7,48,65],['P1']], [[14,45,54],['P2']], [[20,22,27],['P3']],
 [[43,52,58],['P3']], [[19,40,68],['P4']], [[42,49],['P5']],
 [[5,30,51],['P6']], [[38,60],['P7']], [[10,36,39,64],['P8']],
 [[13,31,32],['P1','P2']], [[17,38,42,49],['P5','P7']],
 [[41,42,49],['P2','P5']], [[1,11,21,35],[]], [[4,55],[]],
 [[49,68],['P4','P5']], [[63],[]], [[50,59,66],[]], [[51],['P6']],
 [[14,19,40,45,51],['P2','P4','P6']], [[],[]],
];
const document=await readFile(new URL('../../CHARACTER_INTERPRETATION_RULES_2026-10-11.md',import.meta.url),'utf8');
const rows=document.split(/\r?\n/).filter(line=>/^\| S\d{2} \|/.test(line));
assert.equal(rows.length,expected.length);
const directionIds=result=>result.directions.map(role=>role.characterId);
const run=input=>interpretCollection(input,data);
for (const [index,[numbers,roles]] of expected.entries()) {
 test(`S${String(index+1).padStart(2,'0')}: expected ${roles.join('/')||'insufficient'}`,()=>{
  // Keep executable fixtures consistent with the pre-existing manual scenarios.
  const cells=rows[index].split('|').slice(1,-1).map(cell=>cell.trim());
  assert.deepEqual(cells[1].match(/course-\d{3}/g)??[],ids(...numbers));
  assert.deepEqual(cells[2].split('，')[0].match(/P[1-8]/g)??[],roles);
  const result=run(ids(...numbers));
  assert.deepEqual(directionIds(result),roles);
  assert.equal(result.status,roles.length===0?'insufficient':roles.length===1?'single':roles.length===2?'dual':'multiple');
 });
}
test('removal removes creative direction and all removed evidence',()=>{
 const result=run(ids(13,32));
 assert.deepEqual(directionIds(result),['P1']);
 assert.ok(!JSON.stringify(result).includes('course-031'));
});
test('background course volume cannot displace an established direction',()=>{
 assert.deepEqual(directionIds(run(ids(42,49,1,11,21,35))),['P5']);
});
test('all courses retain all eight roles and three integrative courses, without rankings',()=>{
 const result=run(data.courseIds);
 assert.deepEqual(directionIds(result),data.roles.map(role=>role.id));
 assert.equal(result.pending.length,3);
 assert.equal(result.ordering,'fixed_role_id_not_rank');
});
test('single-course result explicitly records concentrated evidence',()=>{
 assert.equal(run(ids(51)).directions[0].singleCourseEvidence,true);
 assert.equal(run(ids(30)).status,'insufficient'); // tool work alone lacks human need
 assert.equal(run(ids(5,8)).status,'insufficient'); // support cannot replace representative
});
test('unknown and malformed IDs are excluded without modifying the input',()=>{
 const input=['course-999',null,51,{},'course-051','course-051'];
 const before=structuredClone(input);
 const result=run(input);
 assert.deepEqual(result.snapshot,ids(51));
 assert.deepEqual(result.ignoredIds,['course-999']);
 assert.equal(result.invalidEntryCount,3);
 assert.deepEqual(input,before);
 assert.throws(()=>run('course-051'),TypeError);
});
test('result evidence is isolated from source data',()=>{
 const result=run(ids(51));
 result.directions[0].evidence[0].abilityFacets[0].abilityId='changed';
 assert.ok(!JSON.stringify(data).includes('changed'));
});
test('all single/pair inputs are deterministic, traceable and not inflated by duplicates',()=>{
 const check=input=>{
  const result=run(input);
  assert.deepEqual(result,run([...input].reverse()));
  assert.deepEqual(result,run([...input,...input]));
  const selected=new Set(input);
  for (const role of [...result.directions,...result.partialDirections]) {
   for (const row of role.evidence) {
    assert.ok(selected.has(row.courseId));
    assert.equal(row.characterId,role.characterId);
    assert.ok(row.reason&&row.limitations&&row.sourceRefs.length);
    assert.ok(!data.pending.some(pending=>pending.courseId===row.courseId));
   }
   for (const facet of role.facetEvidence) for (const source of facet.sources) {
    assert.ok(role.evidence.some(row=>row.courseId===source.courseId&&row.abilityFacets.some(f=>f.facetId===facet.facetId&&f.abilityId===source.abilityId)));
   }
  }
  for (const role of result.directions) {
   assert.equal(role.missingFacets.length,0);
   assert.equal(role.hasRepresentative,true);
  }
 };
 for (let i=0;i<data.courseIds.length;i++) {
  check([data.courseIds[i]]);
  for (let j=i+1;j<data.courseIds.length;j++) check([data.courseIds[i],data.courseIds[j]]);
 }
});
test('support-only evidence cannot produce a role even when all facets are covered',()=>{
 const supportOnly=structuredClone(data);
 supportOnly.relations.forEach(row=>row.relationType='支援');
 assert.equal(interpretCollection(data.courseIds,supportOnly).status,'insufficient');
});
