import { writeJson, safeTvId } from '../lib/state.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const tv=safeTvId(req.body?.tv);
  const registry=await (await import('../lib/state.js')).readJson('state/registry.json',['tv1','tv2']);
  const tvs=[...new Set([...(Array.isArray(registry)?registry:[]),tv])];
  await (await import('../lib/state.js')).writeJson('state/registry.json',tvs);
  const data={
    time:new Date().toISOString(),
    state:req.body?.state||'unknown',
    currentUrl:req.body?.currentUrl||'',
    currentTime:Number(req.body?.currentTime||0),
    duration:Number(req.body?.duration||0),
    reloads:Number(req.body?.reloads||0),
    userAgent:String(req.headers['user-agent']||'').slice(0,300)
  };
  await writeJson('state/'+tv+'/heartbeat.json',data);
  res.status(200).json({ok:true});
}
