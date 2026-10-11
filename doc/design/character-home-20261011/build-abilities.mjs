// Generate only the public department translation layer, never the private research JSON.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const document=await readFile(new URL('../../DEPARTMENT_ABILITY_MAPPING_2026-10-11.md',import.meta.url),'utf8');
const {courses}=JSON.parse(await readFile(new URL('../../course/courses_v1.json',import.meta.url),'utf8'));
const abilities={};
for(const match of document.matchAll(/### (H\d{2})｜([^\r\n]+)\r?\n([\s\S]*?)(?=\r?\n### |\r?\n## |$)/g)){
 const [,id,name,body]=match;
 const definition=body.match(/- 定義：([^\r\n]+)/)?.[1];assert.ok(definition,id);
 abilities[id]={name,definition};
}
assert.equal(Object.keys(abilities).length,14);
const mappings={};
for(const line of document.split(/\r?\n/).filter(line=>/^\| course-\d{3} \|/.test(line))){
 const [id,name,core,support,rationale]=line.split('|').slice(1,-1).map(x=>x.trim());
 const course=courses.find(c=>c.id===id);assert.ok(course,id);assert.equal(name,course.name);assert.ok(!mappings[id]);
 const primary=core.match(/H\d{2}/g)||[],secondary=support.match(/H\d{2}/g)||[];
 for(const ability of [...primary,...secondary])assert.ok(abilities[ability],ability);
 mappings[id]={primary,secondary,rationale:rationale.replace(/，不預設[^。；]*/g,'')};
}
assert.equal(Object.keys(mappings).length,69);
await writeFile(new URL('./ability-data.json',import.meta.url),JSON.stringify({source:'doc/DEPARTMENT_ABILITY_MAPPING_2026-10-11.md',status:'department_course_mapping_proposal',abilities,mappings},null,2)+'\n');
console.log('Validated 14 department abilities and 69 course mappings; source files unchanged.');
