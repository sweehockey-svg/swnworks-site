import assert from 'node:assert/strict';
import {createHandler,validRosterChange} from './handler.mjs';
const base={home:{LW:'1',C:'2',RW:'',LD:'',RD:'',G:''},away:{LW:'3',C:'',RW:'',LD:'',RD:'',G:''}};
const expected={ticket:'valid.signature',leagueId:527,home:'11',away:'22',baseLineups:base};
const lineup={...base,home:{...base.home,C:'4'}};
const data={schema_version:1,league_id:527,expires_at:new Date(Date.now()+60000).toISOString(),players:[
 {sports_gamer_team_id:11,sports_gamer_player_id:4},
 {sports_gamer_team_id:22,sports_gamer_player_id:5},
 {sports_gamer_team_id:11,sports_gamer_player_id:6,is_current_roster:false}
]};
assert(validRosterChange(expected,lineup,data));
assert(validRosterChange(expected,{...base,home:{...base.home,RW:'4'}},data));
for(const id of ['1','3','5','6','999',''])assert(!validRosterChange(expected,{...base,home:{...base.home,C:id}},data),id);
assert(!validRosterChange(expected,lineup,{...data,expires_at:'2000-01-01'}));
assert(!validRosterChange(expected,lineup,{...data,league_id:520}));
const calls=[],operator='Bearer fixture.long.operator.token';
let allowed=true,stale=false,snapshot=data;
const handler=createHandler({url:'https://fixture.test',serviceKey:'server-key',anonKey:'public-key',fetcher:async (url,options)=>{
 const body=JSON.parse(options.body);calls.push({url,body});
 if(url.endsWith('swn_studio_scene_access')){
  assert.equal(options.headers.Authorization,operator);assert.equal(options.headers.apikey,'public-key');
  return Response.json(allowed);
 }
 assert.equal(options.headers.Authorization,'Bearer server-key');
 if(url.endsWith('/broadcast-data')){assert.deepEqual(body,{ticket:expected.ticket});return Response.json({data:snapshot});}
 assert(url.endsWith('/broadcast_studio_set_verified_lineups'));
 assert.deepEqual(body.p_lineups,lineup);
 return stale?Response.json({error:'stale'},{status:400}):Response.json({lineups:lineup});
}});
const request=(token=operator,changes=lineup)=>handler(new Request('https://fixture.test',{method:'POST',headers:{authorization:token,origin:'https://swnworks.se'},
 body:JSON.stringify({p_channel:'sec21-bronze-test',p_expected:{...expected,lineups:changes}})}));
assert.equal((await request('')).status,401);assert.equal(calls.length,0);
allowed=false;assert.equal((await request()).status,403);assert.equal(calls.length,1);
allowed=true;assert.equal((await request('Bearer fixture.long.operator.token',{...base,home:{...base.home,C:'5'}})).status,422);assert.equal(calls.length,3);
const saved=await request();assert.equal(saved.status,200);assert.deepEqual(await saved.json(),{lineups:lineup});
stale=true;assert.equal((await request()).status,409);
snapshot={...data,league_id:520};assert.equal((await request()).status,422);
console.log('PASS signed snapshot, authorized channel, valid reserve, opponent/duplicate/expired rejection, and stale save.');
