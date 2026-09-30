import { uploadPart } from '@vercel/blob';

function okAuth(body){
  return body && body.username===process.env.ADMIN_USER && body.password===process.env.ADMIN_PASSWORD;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const body=req.body||{};
    if(!okAuth(body)) return res.status(401).json({error:'Invalid username or password'});
    if(!body.pathname||!body.key||!body.uploadId||!body.partNumber||!body.data){
      return res.status(400).json({error:'Missing upload part data'});
    }
    const bytes=Buffer.from(body.data,'base64');
    const part=await uploadPart(body.pathname,bytes,{
      access:'public',
      partNumber:Number(body.partNumber),
      key:body.key,
      uploadId:body.uploadId
    });
    res.status(200).json(part);
  }catch(e){
    res.status(500).json({error:e?.message||'Unable to upload part'});
  }
}
