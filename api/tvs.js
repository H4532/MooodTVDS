import { requireAuth } from '../lib/auth.js';
import { readJson, writeJson, safeTvId } from '../lib/state.js';

export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  if(req.method==='GET'){
    const list=await readJson('state/registry.json',['tv1']);
    const uniq=[...new Set((Array.isArray(list)?list:['tv1']).map(safeTvId))];
    return res.status(200).json({tvs:uniq.length?uniq:['tv1']});
  }
  if(req.method==='POST'){
    const id=safeTvId(req.body?.tv);
    const list=await readJson('state/registry.json',['tv1']);
    const uniq=[...new Set([...(Array.isArray(list)?list:[]),id])];
    await writeJson('state/registry.json',uniq);
    return res.status(200).json({tvs:uniq});
  }
  res.status(405).json({error:'Method not allowed'});
}
