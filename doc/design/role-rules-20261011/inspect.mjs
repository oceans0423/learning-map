import {loadRoleData} from './load-data.mjs';
import {interpretCollection} from './interpret.mjs';

// Prints an inspection result; never writes storage or project data.
const data=await loadRoleData();
console.log(JSON.stringify(interpretCollection(process.argv.slice(2),data),null,2));
