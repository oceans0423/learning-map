// Read-only structural validation; this does not validate educational claims or infer roles.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const canonical = await read('doc/course/courses_v1.json');
const production = await read('src/data/courses.json');
const hash = value => createHash('sha256').update(value).digest('hex').toUpperCase();
assert.equal(hash(canonical), '9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691');
assert.equal(hash(canonical), hash(production));
const {courses} = JSON.parse(canonical);
assert.equal(courses.length, 69);
const courseById = new Map(courses.map(course => [course.id, course]));
const abilityDocument = await read('doc/DEPARTMENT_ABILITY_MAPPING_2026-10-11.md');
const allowedAbilities = new Map();
for (const line of abilityDocument.split(/\r?\n/).filter(line => /^\| course-\d{3} \|/.test(line))) {
  const [id, name, core, support] = line.split('|').slice(1, -1).map(cell => cell.trim());
  assert.equal(name, courseById.get(id)?.name);
  allowedAbilities.set(id, new Set((core + support).match(/H\d{2}/g) ?? []));
}
assert.equal(allowedAbilities.size, 69);
const document = await read('doc/CHARACTER_COURSE_ABILITY_MAPPING_2026-10-11.md');
const roleNames = ['探索者', '創作人', '引路人', '分析師', '策展人', '造物者', '策略師', '開拓者'];
const relations = [];
const pending = new Set();
const covered = new Set();
const pairs = new Set();
const foundRoles = new Set();
let role = null;
for (const line of document.split(/\r?\n/)) {
  if (line.startsWith('## ')) role = null;
  const heading = line.match(/^### (P[1-8])｜(.+)$/);
  if (heading) {
    role = heading[1];
    assert.equal(heading[2], roleNames[Number(role.slice(1)) - 1]);
    assert.ok(!foundRoles.has(role), `Duplicate role section: ${role}`);
    foundRoles.add(role);
  }
  if (!/^\| course-\d{3} \|/.test(line)) continue;
  const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
  const [id, name] = cells;
  assert.ok(courseById.has(id), `Unknown course: ${id}`);
  assert.equal(name, courseById.get(id).name, id);
  covered.add(id);
  if (role) {
    assert.equal(cells.length, 6, id);
    const [, , type, facets, reason, limitations] = cells;
    assert.ok(['代表', '支援'].includes(type));
    assert.ok(reason && limitations, `Missing explanation: ${role}/${id}`);
    const ids = facets.match(/H\d{2}/g) ?? [];
    assert.ok(ids.length, `Missing ability: ${role}/${id}`);
    assert.equal(new Set(ids).size, ids.length, `Duplicate ability: ${role}/${id}`);
    for (const ability of ids) assert.ok(allowedAbilities.get(id).has(ability), `${role}/${id}: ${ability} not in course mapping`);
    const key = `${role}/${id}`;
    assert.ok(!pairs.has(key), `Duplicate relationship: ${key}`);
    pairs.add(key);
    relations.push({role, id, type, facets, limitations});
  } else {
    assert.equal(cells.length, 5, id);
    assert.ok(['course-050', 'course-059', 'course-066'].includes(id));
    assert.ok(!pending.has(id));
    pending.add(id);
    for (const ability of cells[2].match(/H\d{2}/g) ?? []) assert.ok(allowedAbilities.get(id).has(ability));
    assert.equal(cells[3], '不另配角色');
    assert.ok(cells[4]);
  }
}
assert.equal(foundRoles.size, 8);
assert.equal(covered.size, 69);
assert.equal(pending.size, 3);
for (let number = 1; number <= 8; number++) {
  for (const type of ['代表', '支援']) assert.ok(relations.some(row => row.role === `P${number}` && row.type === type));
}
assert.ok(!relations.some(row => pending.has(row.id)));
assert.ok(!relations.some(row => row.role === 'P4' && row.id === 'course-063'));
assert.equal(relations.find(row => row.role === 'P4' && row.id === 'course-049')?.type, '支援');
assert.equal(relations.find(row => row.role === 'P4' && row.id === 'course-068')?.type, '代表');
for (const id of ['course-010', 'course-024', 'course-036', 'course-064']) assert.equal(relations.find(row => row.role === 'P8' && row.id === id)?.type, '代表');
for (const id of ['course-004', 'course-055']) assert.match(relations.find(row => row.role === 'P3' && row.id === id)?.limitations ?? '', /教學|學習引導/);
for (const id of ['course-005', 'course-008', 'course-036']) assert.equal(relations.find(row => row.role === 'P6' && row.id === id)?.type, '支援');
console.log(JSON.stringify({status: 'passed', courses: covered.size, roles: foundRoles.size, relationships: relations.length, pending: [...pending], byRole: roleNames.map((name, i) => ({id: `P${i + 1}`, name, representative: relations.filter(row => row.role === `P${i + 1}` && row.type === '代表').length, supporting: relations.filter(row => row.role === `P${i + 1}` && row.type === '支援').length})), canonicalSha256: hash(canonical), note: 'Structural checks only; no role inference, scoring, syllabus verification or UI changes.'}, null, 2));
