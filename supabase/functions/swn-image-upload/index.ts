import { createClient } from 'npm:@supabase/supabase-js@2.115.0';
const url=Deno.env.get('SUPABASE_URL')!;
const service=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const consentVersion='swn-portrait-2026-10-10-en-v2';
const consentText='I confirm that I am the person in this photo and that I have the right to share it. I agree that SWNWORKS may edit the photo and use the original and edited versions in SWNWORKS productions, graphics, broadcasts and promotion of those productions.';
const allowedOrigins=new Set(['https://swnworks.se','https://www.swnworks.se']);
const json=(data:unknown,status=200,origin='')=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://swnworks.se','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}});
function fail(message:string){throw new Error(message);}
function check<T>(result:{data:T,error:any}){if(result.error)fail(result.error.message);return result.data;}
function validateGT(value:unknown){const gt=String(value??'').trim();if(gt.length<2||gt.length>80||/[\x00-\x1f]/.test(gt))fail('Enter a GT with 2-80 characters.');return gt;}
async function validateFile(file:unknown){
 if(!(file instanceof File)||!file.size||file.size>8388608)fail('Choose a JPG, PNG or WEBP image up to 8 MB.');
 const f=file as File,b=new Uint8Array(await f.slice(0,16).arrayBuffer());
 const mime=b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10?'image/png':b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP'?'image/webp':'';
 if(!mime||mime!==f.type)fail('The file must contain a JPG, PNG or WEBP image.');
 return {file:f,mime,ext:mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'};
}
async function linkInfo(token:string){if(!/^[a-f0-9]{48}$/.test(token))fail('This upload link is invalid.');const result=await service.rpc('swn_image_link_info',{p_token:token});if(result.error)fail('This upload link is invalid or closed.');return result.data;}
async function searchPlayers(query:string){return check(await service.rpc('swn_image_player_search',{p_query:query}));}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS')return json({},200,origin);
 if(req.method!=='POST')return json({error:'Använd POST.'},405,origin);
 if(origin&&!allowedOrigins.has(origin))return json({error:'Otillåtet ursprung.'},403,origin);
 try{
  if(Number(req.headers.get('content-length')||0)>8500000)fail('The image must not exceed 8 MB.');
  const multipart=(req.headers.get('content-type')||'').startsWith('multipart/form-data');
  const reader=req.body?.getReader();let length=0;const chunks:Uint8Array[]=[];
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8500000){await reader.cancel();fail('The image must not exceed 8 MB.');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const parsedRequest=new Request(req.url,{method:'POST',headers:req.headers,body:bytes});
  const body:any=multipart?await parsedRequest.formData():await parsedRequest.json();
  const get=(name:string)=>multipart?body.get(name):body[name];
  const action=String(get('action')||'');
  if(['info','search','upload'].includes(action)){
   const token=String(get('token')||'');const info:any=await linkInfo(token);
   if(action==='info')return json({...info,consentVersion,consentText},200,origin);
   if(action==='search')return json({players:await searchPlayers(String(get('query')||'').trim().slice(0,80))},200,origin);
   if(get('consent')!=='yes'||get('consentVersion')!==consentVersion)fail('Please agree to the photo use before uploading.');
   const gt=validateGT(get('gt'));const {file,mime,ext}=await validateFile(get('file'));
   const reservation:any=check(await service.rpc('swn_image_reserve',{p_token:token,p_gt:gt,p_filename:file.name.slice(0,255),p_mime:mime,p_size:file.size,p_extension:ext,p_consent_version:consentVersion,p_consent_text:consentText}));
   try{
    check(await service.storage.from('player-image-submissions').upload(reservation.original_path,file,{upsert:false,contentType:mime}));
    check(await service.from('swn_image_submissions').update({status:'pending',uploaded_at:new Date().toISOString()}).eq('id',reservation.id).eq('status','reserved').select('id').single());
   }catch(error){await service.from('swn_image_submissions').update({status:'failed'}).eq('id',reservation.id).eq('status','reserved');await service.storage.from('player-image-submissions').remove([reservation.original_path]);throw error;}
   return json({ok:true,message:'Thank you! Your photo has been submitted for review.',remaining:Math.max(0,info.remaining-1)},200,origin);
  }
  // Every administrative operation verifies the actual user and owner role.
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return json({error:'Adminbehörighet krävs.'},401,origin);
  const userClient=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const userResult=await userClient.auth.getUser();
  if(userResult.error)return json({error:'Logga in med ditt admin-konto.'},401,origin);
  const user=userResult.data;
  if(!user.user||check(await userClient.rpc('swn_studio_admin_access'))!==true)return json({error:'Adminbehörighet krävs.'},403,origin);
  if(action==='admin-list'){
   const links=check(await service.from('swn_image_links').select('*').order('created_at',{ascending:false}));
   const submissions=check(await service.from('swn_image_submissions').select('*').not('status','in','(reserved,failed)').order('created_at',{ascending:false}).limit(500));
   const counts=check(await service.rpc('swn_image_link_counts'));
   return json({links,submissions,counts},200,origin);
  }
  if(action==='admin-create'){
   const name=String(get('name')||'').trim(),limit=Number(get('limit'));if(!name||name.length>100||!Number.isInteger(limit)||limit<1||limit>500)fail('Ange länknamn och 1–500 uppladdningar.');
   const presets=[...new Set(String(get('presets')||'').split('\n').map(x=>x.trim()).filter(Boolean))];if(presets.length>500)fail('Högst 500 förifyllda GT.');presets.forEach(validateGT);
   const token=[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const link=check(await service.from('swn_image_links').insert({name,upload_limit:limit,preset_gts:presets,token,created_by:user.user.id}).select('*').single());return json({link},200,origin);
  }
  if(action==='admin-link-update'){
   const limit=Number(get('limit'));if(!Number.isInteger(limit)||limit<1||limit>500)fail('Ange 1–500 uppladdningar.');
   check(await service.from('swn_image_links').update({upload_limit:limit,active:get('active')===true}).eq('id',get('id')).select('id').single());return json({ok:true},200,origin);
  }
  if(action==='admin-search')return json({players:await searchPlayers(String(get('query')||'').slice(0,80))},200,origin);
  const submission:any=check(await service.from('swn_image_submissions').select('*').eq('id',get('id')).single());
  if(action==='admin-original'){
   const signed=check(await service.storage.from('player-image-submissions').createSignedUrl(submission.original_path,600));return json({url:signed.signedUrl},200,origin);
  }
  if(action==='admin-reject'){
   if(submission.status==='published')fail('Bilden är redan publicerad.');check(await service.from('swn_image_submissions').update({status:'rejected',reviewed_by:user.user.id,reviewed_at:new Date().toISOString()}).eq('id',submission.id));return json({ok:true},200,origin);
  }
  if(action==='admin-publish'){
   if(!['pending','editing'].includes(submission.status))fail('Bilden är redan behandlad.');
   const playerKey=String(get('playerKey')||'');if(!playerKey||playerKey.length>100)fail('Välj en registrerad spelare.');
   const {file,mime,ext}=await validateFile(get('file'));
   const path='published/'+playerKey.replace(/[^a-z0-9_-]/gi,'_')+'/'+crypto.randomUUID()+'.'+ext;
   check(await service.storage.from('player-profile-images').upload(path,file,{upsert:false,contentType:mime,cacheControl:'31536000'}));
   const publicUrl=service.storage.from('player-profile-images').getPublicUrl(path).data.publicUrl;
   try{check(await userClient.rpc('seh_admin_publish_player_image_direct',{p_player_key:playerKey,p_final_path:path,p_public_url:publicUrl}));}
   catch(error){await service.storage.from('player-profile-images').remove([path]);throw error;}
   check(await service.from('swn_image_submissions').update({status:'published',player_key:playerKey,published_url:publicUrl,final_path:path,reviewed_by:user.user.id,reviewed_at:new Date().toISOString()}).eq('id',submission.id));
   return json({ok:true,url:publicUrl},200,origin);
  }
  return json({error:'Okänd åtgärd.'},400,origin);
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to complete the request.'},400,origin);}
});
