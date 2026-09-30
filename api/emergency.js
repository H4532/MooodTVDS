import { requireAuth } from '../lib/auth.js';
import { writeJson, safeTvId, appendHistory } from '../lib/state.js';
export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const tv=safeTvId(req.body?.tv);
  const enabled=!!req.body?.enabled;
  const data={enabled,video:req.body?.video||null,updatedAt:new Date().toISOString()};
  await writeJson('state/'+tv+'/emergency.json',data);
  await appendHistory(tv,{action:enabled?'emergency_on':'emergency_off',video:data.video?.url||null});
  res.status(200).json(data);
}
