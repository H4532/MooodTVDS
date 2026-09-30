import { issueSignedToken, presignUrl } from '@vercel/blob';
import { isAuthenticated } from '../lib/auth.js';
import { safeTvId, readJson, writeJson } from '../lib/state.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  const body=req.body||{};
  const sessionOk=isAuthenticated(req);
  const passwordOk=body.password && body.password===process.env.ADMIN_PASSWORD;
  if(!sessionOk && !passwordOk) return res.status(401).json({error:'Unauthorized'});

  try{
    const tv=safeTvId(body.tv);
    const filename=String(body.filename||'media.bin').replace(/[^a-zA-Z0-9._-]/g,'_');
    const contentType=String(body.contentType||'application/octet-stream');
    const size=Number(body.size||0);
    const lower=filename.toLowerCase();
    const allowedExt=['.mp4','.jpg','.jpeg','.png','.webp'];
    const allowedTypes=['video/mp4','image/jpeg','image/png','image/webp'];

    if(!allowedExt.some(ext=>lower.endsWith(ext))) {
      return res.status(400).json({error:'Only MP4, JPG, PNG or WebP files are allowed'});
    }
    if(!allowedTypes.includes(contentType)){
      return res.status(400).json({error:'Unsupported media type'});
    }
    if(size<=0 || size>500*1024*1024){
      return res.status(400).json({error:'File must be between 1 byte and 500 MB'});
    }

    const pathname='videos/'+tv+'/'+Date.now()+'-'+filename;
    const signedToken=await issueSignedToken({
      pathname,
      operations:['put'],
      validUntil:Date.now()+60*60*1000,
      allowedContentTypes:[contentType],
      maximumSizeInBytes:500*1024*1024,
      oidcToken:process.env.VERCEL_OIDC_TOKEN,
      storeId:process.env.BLOB_STORE_ID
    });

    const signed=await presignUrl(signedToken,{
      operation:'put',
      pathname,
      access:'public',
      allowedContentTypes:[contentType],
      maximumSizeInBytes:500*1024*1024,
      addRandomSuffix:false,
      allowOverwrite:false,
      cacheControlMaxAge:60
    });

    // Keep TV registry persistent.
    const registry=await readJson('state/registry.json',['tv1','tv2']);
    const tvs=[...new Set(['tv1','tv2',...(Array.isArray(registry)?registry:[]),tv])];
    await writeJson('state/registry.json',tvs);

    res.setHeader('Cache-Control','no-store');
    res.status(200).json({presignedUrl:signed.presignedUrl,pathname,tv,contentType});
  }catch(error){
    res.status(400).json({error:error?.message||'Unable to create upload URL'});
  }
}
