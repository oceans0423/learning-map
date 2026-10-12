import {spawn} from 'node:child_process';

const baseUrl='http://127.0.0.1:4175/';
const scripts=[
 'verify.mjs',
 'verify-navigation.mjs',
 'verify-courses.mjs',
 'verify-collection.mjs',
 'verify-detail-pass.mjs',
 'verify-role-results.mjs',
];

const run=script=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[new URL(script,import.meta.url).pathname.slice(1)],{stdio:'inherit'});
 child.once('error',reject);
 child.once('exit',code=>code===0?resolve():reject(new Error(`${script} failed with exit code ${code}`)));
});

async function serverIsReady(){
 try{return (await fetch(baseUrl,{redirect:'manual'})).status<500;}catch{return false;}
}

let server;
try{
 if(!await serverIsReady()){
  server=spawn(process.execPath,[new URL('serve.mjs',import.meta.url).pathname.slice(1)],{stdio:'inherit'});
  for(let attempt=0;attempt<50&&!await serverIsReady();attempt++)await new Promise(resolve=>setTimeout(resolve,100));
  if(!await serverIsReady())throw new Error(`Local verification server did not start at ${baseUrl}`);
 }
 for(const script of scripts){
  console.log(`\n[verify:browser] ${script}`);
  await run(script);
 }
 console.log('\n[verify:browser] All browser checks passed.');
}finally{
 if(server)server.kill();
}
