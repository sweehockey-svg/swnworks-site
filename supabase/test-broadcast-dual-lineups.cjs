// SWN_PGLITE_TEST_MODULE can point to an isolated local @electric-sql/pglite install.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.SWN_PGLITE_TEST_MODULE||'@electric-sql/pglite');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');
(async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema broadcast_control;
   grant usage on schema broadcast_control to authenticated;
   create function auth.uid() returns uuid language sql as $$ select '00000000-0000-0000-0000-000000000001'::uuid $$;
   create function public.swn_studio_scene_access(text) returns boolean language sql as $$ select $1='broadcast-en' $$;
   create table public.broadcast_studio_state(channel text primary key,state jsonb,updated_at timestamptz);`);
  const scene=read('broadcast_scene_control.sql').split('create or replace function broadcast_control.set_scene')[1].split('create or replace function public.broadcast_studio_set_scene')[0];
  const music=read('broadcast_music_control.sql').split('create or replace function public.broadcast_studio_set_music')[0];
  await db.exec('create or replace function broadcast_control.set_scene'+scene+music);
  const state={scene:'opening',lineupSide:'away',home:'1',away:'2',hs:'4',as:'2',twitchChannel:'fixture',transientSource:{expires_at:new Date(Date.now()+3600000).toISOString()}};
  await db.query("insert into public.broadcast_studio_state values ('broadcast-en',$1,now()),('broadcast-fi',$1,now())",[state]);
  await db.exec('set role authenticated');
  await assert.rejects(db.query("select broadcast_control.set_scene('broadcast-fi','duallineup',null)"),{code:'42501'});
  const selected=(await db.query("select broadcast_control.set_scene('broadcast-en','duallineup',null) as result")).rows[0].result;
  assert.deepEqual(selected,{...state,scene:'duallineup'});
  const mixed=(await db.query("select broadcast_control.set_music('broadcast-en','duallineup','low') as result")).rows[0].result;
  assert.deepEqual(mixed,{...selected,sceneMusic:{muted:false,duallineup:'low'}});
  await db.exec('reset role');
  assert.equal((await db.query("select has_function_privilege('anon','broadcast_control.set_scene(text,text,text)','EXECUTE') as allowed")).rows[0].allowed,false);
  console.log('PASS both-lineups scene and volume are accepted for authorized operators only. Local Postgres only.');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
