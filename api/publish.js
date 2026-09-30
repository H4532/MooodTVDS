import { requireAuth } from '../lib/auth.js';
import { readJson, writeJson, safeTvId, appendHistory, cleanupVideos } from '../lib/state.js';

export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const tv=safeTvId(req.body?.tv);
  const draft=await readJson('state/'+tv+'/draft.json',null);
  if(!draft?.url) return res.status(400).json({error:'No draft video to publish'});
  const state=await readJson('state/'+tv+'/current.json',{current:null,previous:null});
  const next={
    current:draft,
    previous:state.current||null,
    version:String(Date.now()),
    updatedAt:new Date().toISOString()
  };
  await writeJson('state/'+tv+'/current.json',next);
  await writeJson('state/'+tv+'/draft.json',null);
  await appendHistory(tv,{action:'published',url:draft.url,pathname:draft.pathname});
  const keep=[next.current?.url,next.previous?.url].filter(Boolean);
  await cleanupVideos(tv,keep);
  res.status(200).json(next);
}
