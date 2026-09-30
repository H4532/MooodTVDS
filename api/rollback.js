import { requireAuth } from '../lib/auth.js';
import { readJson, writeJson, safeTvId, appendHistory, cleanupVideos } from '../lib/state.js';
export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const tv=safeTvId(req.body?.tv);
  const state=await readJson('state/'+tv+'/current.json',{current:null,previous:null});
  if(!state.previous?.url) return res.status(400).json({error:'No previous video available'});
  const next={current:state.previous,previous:state.current,version:String(Date.now()),updatedAt:new Date().toISOString()};
  await writeJson('state/'+tv+'/current.json',next);
  await appendHistory(tv,{action:'rollback',url:next.current.url});
  await cleanupVideos([next.current?.url,next.previous?.url].filter(Boolean));
  res.status(200).json(next);
}
