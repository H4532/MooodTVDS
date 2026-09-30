import { readJson, safeTvId } from '../lib/state.js';

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
  const tv=safeTvId(req.query?.tv);
  const [state,schedule,settings,emergency]=await Promise.all([
    readJson('state/'+tv+'/current.json',{current:null,previous:null,version:'0'}),
    readJson('state/'+tv+'/schedule.json',[]),
    readJson('state/'+tv+'/settings.json',{orientation:0,fit:'contain',fallback:'https://h4532.github.io/MooodTVDS/video.mp4'}),
    readJson('state/'+tv+'/emergency.json',{enabled:false})
  ]);
  let selected=state.current;
  const now=Date.now();
  const active=(Array.isArray(schedule)?schedule:[]).filter(x=>{
    const s=x.start?new Date(x.start).getTime():0;
    const e=x.end?new Date(x.end).getTime():Infinity;
    return x.enabled!==false && s<=now && now<e && x.video?.url;
  }).sort((a,b)=>new Date(b.start||0)-new Date(a.start||0))[0];
  if(active?.video) selected=active.video;
  if(emergency?.enabled && emergency.video?.url) selected=emergency.video;
  const fallback=settings.fallback||'https://h4532.github.io/MooodTVDS/video.mp4';
  const chosenUrl=selected?.url||fallback;
  const chosenPath=String(selected?.pathname||chosenUrl||'').toLowerCase().split('?')[0];
  const isImage=(selected?.contentType||'').startsWith('image/') || /\.(jpg|jpeg|png|webp)$/.test(chosenPath);
  res.status(200).json({
    tv,
    video:chosenUrl,
    version:selected?.uploadedAt||state.version||String(now),
    loop:true,
    muted:true,
    volume:0,
    fit:settings.fit||'contain',
    orientation:Number(settings.orientation||0),
    source:emergency?.enabled?'emergency':active?'schedule':selected?'current':'fallback',
    mediaType:isImage?'image':'video'
  });
}
