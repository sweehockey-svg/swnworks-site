export const REPORT_TAGS=[
  "Momentum","Målfarliga chanser","Nyckelspelare","Special teams","Story","Anfallare","Målvakt",
  "Vändpunkt","Försvarsspel","Disciplin","Matchbild","Milstolpe","Trend","Citat"
];

const text=(value:any,max=500)=>String(value??"").replace(/\s+/g," ").trim().slice(0,max);
const TITLES:any={
  game:"Matchöversikt",standings:"Tabell",form_last_5:"Senaste fem matcherna",h2h:"Inbördes möten",
  special_teams:"Special teams",top_skaters:"Spelarstatistik",goalies:"Målvaktsstatistik",
  current_match_stats:"Aktuell matchstatistik",current_events:"Matchhändelse",editorial_notes:"Egen anteckning"
};

export function buildEvidenceCatalog(context:any,teamNames:any={}){
  const sources:any[]=[];
  for(const [category,label] of Object.entries(TITLES)){
    const value=context[category];
    const add=(record:any,group="")=>{
      if(!record||typeof record!=="object"||!Object.keys(record).length) return;
      const team=teamNames[record.team_id];
      const ref=category+":"+sources.length;
      sources.push({ref,category,label:label+(group||team?" · "+(group||team):""),record:team?{...record,team}:record});
    };
    if(Array.isArray(value)) value.forEach((row)=>add(row));
    else if(["form_last_5","top_skaters","goalies"].includes(category)){
      for(const [group,rows] of Object.entries(value||{})){
        if(Array.isArray(rows)) rows.forEach((row)=>add(row,group));
      }
    }else add(value);
  }
  return sources;
}

export function attachEvidence(brief:any,catalog:any[]){
  if(!brief||!Array.isArray(brief.talking_points)) return null;
  const byRef=new Map(catalog.map((source)=>[source.ref,source]));
  const points=brief.talking_points.slice(0,3).flatMap((point:any)=>{
    const sources=[...new Set<string>(Array.isArray(point.source_refs)?point.source_refs:[])]
      .map((ref)=>byRef.get(ref)).filter(Boolean).slice(0,5);
    if(!sources.length||!text(point.text,1400)) return [];
    return [{
      label:text(point.label,120),text:text(point.text,1400),why_now:text(point.why_now,500),
      source_refs:[...new Set(sources.map((source)=>source.category))],
      sources:sources.map((source)=>({label:source.label,category:source.category,record:source.record}))
    }];
  });
  return points.length?{headline:text(brief.headline,160),talking_points:points,caution:text(brief.caution,500)}:null;
}

export function validatedReportPoints(payload:any,report:string){
  const original=text(report,12000);
  return (Array.isArray(payload?.points)?payload.points:[]).slice(0,5).flatMap((point:any)=>{
    const excerpt=text(point.source_excerpt,400);
    const body=text(point.body,500);
    if(excerpt.length<12||!original.includes(excerpt)||!body) return [];
    const tags=[...new Set<string>(Array.isArray(point.tags)?point.tags:[])].filter((tag)=>REPORT_TAGS.includes(tag)).slice(0,8);
    return [{title:text(point.title,120),body,tags,source_excerpt:excerpt}];
  });
}
