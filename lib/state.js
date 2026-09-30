import { put, list, del } from '@vercel/blob';

const storeOpts=()=>({
  oidcToken: process.env.VERCEL_OIDC_TOKEN,
  storeId: process.env.BLOB_STORE_ID
});

export function safeTvId(value){
  const s=String(value||'tv1').toLowerCase().replace(/[^a-z0-9_-]/g,'');
  return s || 'tv1';
}

export async function writeJson(path,obj){
  const blob=await put(path,JSON.stringify(obj,null,2),{
    access:'public',
    allowOverwrite:true,
    addRandomSuffix:false,
    contentType:'application/json',
    cacheControlMaxAge:0,
    ...storeOpts()
  });
  return blob;
}

export async function readJson(path,fallback=null){
  const result=await list({prefix:path,limit:20,...storeOpts()});
  const item=(result.blobs||[]).find(b=>b.pathname===path);
  if(!item) return fallback;
  try{
    const r=await fetch(item.url+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok) return fallback;
    return await r.json();
  }catch{return fallback;}
}

export async function appendHistory(tv,event){
  const path='state/'+tv+'/history.json';
  const history=await readJson(path,[]);
  const arr=Array.isArray(history)?history:[];
  arr.unshift({time:new Date().toISOString(),...event});
  await writeJson(path,arr.slice(0,100));
}

export async function cleanupVideos(tv,keepUrls=[]){
  let cursor;
  do{
    const r=await list({prefix:'videos/'+safeTvId(tv)+'/',limit:100,cursor,...storeOpts()});
    const old=(r.blobs||[]).filter(b=>!keepUrls.includes(b.url)).map(b=>b.url);
    if(old.length) await del(old,{...storeOpts()});
    cursor=r.cursor;
  }while(cursor);
}

export async function listVideos(tv='tv1'){
  const r=await list({prefix:'videos/'+safeTvId(tv)+'/',limit:100,...storeOpts()});
  return (r.blobs||[]).sort((a,b)=>new Date(b.uploadedAt||0)-new Date(a.uploadedAt||0));
}


export async function cleanupUnreferencedVideos(tv){
  const id=safeTvId(tv);
  const [current,draft,schedule,emergency]=await Promise.all([
    readJson('state/'+id+'/current.json',{current:null,previous:null}),
    readJson('state/'+id+'/draft.json',null),
    readJson('state/'+id+'/schedule.json',[]),
    readJson('state/'+id+'/emergency.json',{enabled:false})
  ]);
  const keep=new Set();
  [current?.current?.url,current?.previous?.url,draft?.url,emergency?.video?.url].filter(Boolean).forEach(x=>keep.add(x));
  (Array.isArray(schedule)?schedule:[]).forEach(x=>{if(x?.video?.url)keep.add(x.video.url)});
  await cleanupVideos(id,[...keep]);
  return [...keep];
}
