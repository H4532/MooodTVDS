import { list } from '@vercel/blob';
import { requireAuth } from '../lib/auth.js';
import { readJson, writeJson, safeTvId, appendHistory, cleanupUnreferencedVideos } from '../lib/state.js';

export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  try{
    const tv=safeTvId(req.body?.tv);
    let media=null;

    if(req.body?.pathname){
      const pathname=String(req.body.pathname);
      const result=await list({
        prefix:pathname,
        limit:10,
        oidcToken:process.env.VERCEL_OIDC_TOKEN,
        storeId:process.env.BLOB_STORE_ID
      });
      const blob=(result.blobs||[]).find(b=>b.pathname===pathname);
      if(!blob) return res.status(400).json({error:'Uploaded media not found in Blob storage'});
      media={
        url:blob.url,
        pathname:blob.pathname,
        contentType:req.body?.contentType||blob.contentType||'application/octet-stream',
        uploadedAt:blob.uploadedAt||new Date().toISOString(),
        size:blob.size||null
      };
    }else{
      media=await readJson('state/'+tv+'/draft.json',null);
      if(!media?.url) return res.status(400).json({error:'No draft video or photo to publish'});
    }

    const state=await readJson('state/'+tv+'/current.json',{current:null,previous:null});
    const next={
      current:media,
      previous:state.current||state.previous||null,
      version:String(Date.now()),
      updatedAt:new Date().toISOString()
    };

    await writeJson('state/'+tv+'/current.json',next);
    await writeJson('state/'+tv+'/draft.json',null);
    await appendHistory(tv,{action:'published',url:media.url,pathname:media.pathname});
    await cleanupUnreferencedVideos(tv);

    res.status(200).json(next);
  }catch(error){
    res.status(500).json({error:error?.message||'Publish failed'});
  }
}
