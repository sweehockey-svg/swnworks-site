const entities={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" "};
function text(value){
 return value.replace(/<[^>]*>/g," ").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(token,key)=>{
  if(key[0]!=="#")return entities[key.toLowerCase()]??token;
  const cp=key[1].toLowerCase()==="x"?parseInt(key.slice(2),16):Number(key.slice(1));
  return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):token;
 }).replace(/\s+/g," ").trim();
}
export function parseScorers(html,league){
 const header=html.match(/<td class="text-center match-score">[\s\S]*?<span>(\d+)<\/span>\s*-\s*<span>(\d+)<\/span>/i);
 const teams=[...html.matchAll(/<a class="profile-name" href="https:\/\/sportsgamer\.gg\/leagues\/(\d+)\/teams\/(\d+)"/gi)];
 const summary=html.match(/<h2>Game summary<\/h2>([\s\S]*?)<h2>Player stats<\/h2>/i)?.[1];
 if(!header||teams.length!==2||teams.some(m=>m[1]!==String(league))||teams[0][2]===teams[1][2]||!summary)return null;
 const goals=[0,0], counts=[new Map(),new Map()];
 for(const row of summary.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const events=[...row[1].matchAll(/<td class="text-(?:right|left) match-action">([\s\S]*?)<\/td>/gi)];
  if(events.length!==2)continue;
  for(const [side,event] of events.entries()){
   const goal=event[1].match(/<b>\s*<a href="https:\/\/sportsgamer\.gg\/players\/(\d+)">([\s\S]*?)<\/a>\s*(\d+)\s*-\s*(\d+)\s*<\/b>/i);
   if(!goal)continue;
   goals[side]++;
   if(Number(goal[3])!==goals[0]||Number(goal[4])!==goals[1])return null;
   const id=Number(goal[1]),name=text(goal[2]).replace(/^#\d+\s*(?:-\s*)?/,"").trim();
   if(!Number.isSafeInteger(id)||id<=0||!name||name.length>80)return null;
   const prior=counts[side].get(id);
   counts[side].set(id,{id,name,goals:(prior?.goals||0)+1});
  }
 }
 if(goals[0]!==Number(header[1])||goals[1]!==Number(header[2]))return null;
 return Object.fromEntries(teams.map((team,i)=>[team[2],[...counts[i].values()].sort((a,b)=>b.goals-a.goals)]));
}
