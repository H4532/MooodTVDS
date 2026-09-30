import { requireAuth } from '../lib/auth.js';
import { readJson, writeJson, safeTvId, appendHistory } from '../lib/state.js';
export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  const tv=safeTvId(req.query?.tv || req.body?.tv);
  if(req.method==='GET') return res.status(200).json(await readJson('state/'+tv+'/schedule.json',[]));
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const entries=Array.isArray(req.body?.entries)?req.body.entries.slice(0,50):[];
  await writeJson('state/'+tv+'/schedule.json',entries);
  await appendHistory(tv,{action:'schedule_updated',count:entries.length});
  res.status(200).json(entries);
}
