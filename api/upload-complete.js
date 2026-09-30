import { completeMultipartUpload } from '@vercel/blob';

function okAuth(body){
  return body && body.username===process.env.ADMIN_USER && body.password===process.env.ADMIN_PASSWORD;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const body=req.body||{};
    if(!okAuth(body)) return res.status(401).json({error:'Invalid username or password'});
    if(!body.pathname||!body.key||!body.uploadId||!Array.isArray(body.parts)||!body.parts.length){
      return res.status(400).json({error:'Missing completion data'});
    }
    const blob=await completeMultipartUpload(body.pathname,body.parts,{
      access:'public',
      key:body.key,
      uploadId:body.uploadId,
      contentType:'video/mp4',
      addRandomSuffix:false,
      cacheControlMaxAge:60
    });
    res.setHeader('Cache-Control','no-store');
    res.status(200).json(blob);
  }catch(e){
    res.status(500).json({error:e?.message||'Unable to complete upload'});
  }
}
