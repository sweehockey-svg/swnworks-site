/* Compare actual lineup contents; timestamps and revision IDs alone are not changes. */
(function(root){
  const fields=['team_id','player_id','source_name','jersey_number','position','line_number','goalie_role','is_extra'];
  const key=row=>JSON.stringify(fields.map(field=>row[field]??null));
  function compare(previous,next){
    if(!previous || !next || previous.game.id!==next.game.id)return [];
    const before=new Map((previous.players||[]).map(row=>[key(row),row]));
    const after=new Map((next.players||[]).map(row=>[key(row),row]));
    return [...[...before].filter(([id])=>!after.has(id)).map(([,row])=>({kind:'before',row})),
      ...[...after].filter(([id])=>!before.has(id)).map(([,row])=>({kind:'after',row}))];
  }
  root.CockpitLineupChanges={key,compare};
  if(typeof module!=='undefined')module.exports=root.CockpitLineupChanges;
})(typeof window!=='undefined'?window:globalThis);
