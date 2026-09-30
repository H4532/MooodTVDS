import { createMultipartUpload } from '@vercel/blob';

function okAuth(body){
  return body && body.username===process.env.ADMIN_USER && body.password===process.env.ADMIN_PASSWORD;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const body=req.body||{};
    if(!okAuth(body)) return res.status(401).json({error:'Invalid username or password'});
    const name=(body.filename||'video.mp4').replace(/[^a-zA-Z0-9._-]/g,'_');
    if(!name.toLowerCase().endsWith('.mp4')) return res.status(400).json({error:'Only MP4 files are allowed'});
    const pathname='videos/'+Date.now()+'-'+name;
    const upload=await createMultipartUpload(pathname,{
      access:'public',
      contentType:'video/mp4',
      addRandomSuffix:false,
      cacheControlMaxAge:60
    });
    res.status(200).json({pathname,key:upload.key,uploadId:upload.uploadId});
  }catch(e){
    res.status(500).json({error:e?.message||'Unable to start upload'});
  }
}
