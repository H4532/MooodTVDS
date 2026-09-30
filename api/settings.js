import { requireAuth } from '../lib/auth.js';
import { readJson, writeJson, safeTvId, appendHistory } from '../lib/state.js';

export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  const tv=safeTvId(req.query?.tv || req.body?.tv);
  if(req.method==='GET'){
    return res.status(200).json(await readJson('state/'+tv+'/settings.json',{
      orientation:0,fit:'contain',fallback:'https://h4532.github.io/MooodTVDS/video.mp4'
    }));
  }
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const orientation=[0,90,180,270].includes(Number(req.body?.orientation))?Number(req.body.orientation):0;
  const fit=req.body?.fit==='cover'?'cover':'contain';
  const data={orientation,fit,fallback:req.body?.fallback||'https://h4532.github.io/MooodTVDS/video.mp4',updatedAt:new Date().toISOString()};
  await writeJson('state/'+tv+'/settings.json',data);
  await appendHistory(tv,{action:'settings',orientation,fit});
  res.status(200).json(data);
}
