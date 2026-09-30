import { requireAuth } from '../lib/auth.js';
import { readJson, safeTvId, listVideos } from '../lib/state.js';

export default async function handler(req,res){
  if(!requireAuth(req,res)) return;
  const tv=safeTvId(req.query?.tv);
  const [current,draft,heartbeat,schedule,settings,emergency,history,videos]=await Promise.all([
    readJson('state/'+tv+'/current.json',{current:null,previous:null}),
    readJson('state/'+tv+'/draft.json',null),
    readJson('state/'+tv+'/heartbeat.json',null),
    readJson('state/'+tv+'/schedule.json',[]),
    readJson('state/'+tv+'/settings.json',{orientation:0,fit:'contain'}),
    readJson('state/'+tv+'/emergency.json',{enabled:false}),
    readJson('state/'+tv+'/history.json',[]),
    listVideos()
  ]);
  const lastSeen=heartbeat?.time?new Date(heartbeat.time).getTime():0;
  const online=!!lastSeen && Date.now()-lastSeen<120000;
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({tv,current,draft,heartbeat,online,schedule,settings,emergency,history,videos});
}
