import { issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned } from '@vercel/blob/client';
import { isAuthenticated } from '../lib/auth.js';
import { writeJson, safeTvId, appendHistory, cleanupUnreferencedVideos } from '../lib/state.js';

export default async function handler(request,response){
  if(request.method!=='POST') return response.status(405).json({error:'Method not allowed'});
  if(!isAuthenticated(request)) return response.status(401).json({error:'Unauthorized'});

  try{
    const body=request.body;
    const jsonResponse=await handleUploadPresigned({
      body,
      request,
      webhookPublicKey:process.env.BLOB_WEBHOOK_PUBLIC_KEY,
      getSignedToken:async(pathname,clientPayload)=>{
        let payload={}; try{payload=JSON.parse(clientPayload||'{}')}catch{}
        const tv=safeTvId(payload.tv);
        if(!pathname||!pathname.toLowerCase().endsWith('.mp4')) throw new Error('Only MP4 files are allowed');
        const token=await issueSignedToken({
          pathname,
          operations:['put'],
          validUntil:Date.now()+60*60*1000,
          allowedContentTypes:['video/mp4'],
          maximumSizeInBytes:500*1024*1024,
          oidcToken:process.env.VERCEL_OIDC_TOKEN,
          storeId:process.env.BLOB_STORE_ID
        });
        return {
          token,
          urlOptions:{
            allowedContentTypes:['video/mp4'],
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
          contentType:blob.contentType||'video/mp4',
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
