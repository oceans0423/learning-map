// Mechanical public-data derivation. Never reads or copies the private interview dataset.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadRoleData} from './load-data.mjs';
const data=await loadRoleData();
const source=await readFile(new URL('../../DEPARTMENT_ABILITY_MAPPING_2026-10-11.md',import.meta.url),'utf8');
data.abilityNames=Object.fromEntries([...source.matchAll(/^### (H\d{2})｜(.+)$/gm)].map(([,id,name])=>[id,name.trim()]));
assert.equal(Object.keys(data.abilityNames).length,14);
const target=new URL('../character-home-20261011/role-data.json',import.meta.url);
const output=JSON.stringify(data,null,2)+'\n';
if(process.argv.includes('--check')) assert.equal(await readFile(target,'utf8'),output,'Public role data is stale; regenerate before serving.');
else await writeFile(target,output);
console.log(`Public role data ${process.argv.includes('--check')?'verified':'generated'}: ${data.relations.length} relationships; no private interviews.`);
