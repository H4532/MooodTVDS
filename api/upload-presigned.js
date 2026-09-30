import { issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned } from '@vercel/blob/client';
import { isAuthenticated } from '../lib/auth.js';
import { writeJson, safeTvId, appendHistory, cleanupUnreferencedVideos } from '../lib/state.js';

export default async function handler(request,response){
  if(request.method!=='POST') return response.status(405).json({error:'Method not allowed'});

  try{
    const body=request.body;
    const jsonResponse=await handleUploadPresigned({
      body,
      request,
      webhookPublicKey:process.env.BLOB_WEBHOOK_PUBLIC_KEY,
      getSignedToken:async(pathname,clientPayload)=>{
        if(!isAuthenticated(request)) throw new Error('Unauthorized');
        let payload={}; try{payload=JSON.parse(clientPayload||'{}')}catch{}
        const tv=safeTvId(payload.tv);
        const lower=String(pathname||'').toLowerCase();
        const allowedExt=['.mp4','.jpg','.jpeg','.png','.webp'];
        if(!allowedExt.some(ext=>lower.endsWith(ext))) throw new Error('Only MP4, JPG, PNG or WebP files are allowed');
        const token=await issueSignedToken({
          pathname,
          operations:['put'],
          validUntil:Date.now()+60*60*1000,
          allowedContentTypes:['video/mp4','image/jpeg','image/png','image/webp'],
          maximumSizeInBytes:500*1024*1024,
          oidcToken:process.env.VERCEL_OIDC_TOKEN,
          storeId:process.env.BLOB_STORE_ID
        });
        return {
          token,
          urlOptions:{
            allowedContentTypes:['video/mp4','image/jpeg','image/png','image/webp'],
            maximumSizeInBytes:500*1024*1024,
            addRandomSuffix:true,
            allowOverwrite:false,
            cacheControlMaxAge:60
          }
        };
      },
      onUploadCompleted:async({blob})=>{
        const parts=String(blob.pathname||'').split('/');
        const tv=safeTvId(parts.length>1?parts[1]:'tv1');
        const draft={
          url:blob.url,
          pathname:blob.pathname,
          contentType:blob.contentType||'application/octet-stream',
          uploadedAt:new Date().toISOString(),
          size:blob.size||null
        };
        await writeJson('state/'+tv+'/draft.json',draft);
        await appendHistory(tv,{action:'draft_uploaded',url:blob.url,pathname:blob.pathname});
        await cleanupUnreferencedVideos(tv);
      }
    });
    response.status(200).json(jsonResponse);
  }catch(error){
    response.status(400).json({error:error?.message||'Upload failed'});
  }
}
