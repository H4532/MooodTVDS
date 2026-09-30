import { makeSessionCookie } from '../lib/auth.js';

const attempts=new Map();

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const ip=req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now=Date.now();
  const rec=attempts.get(ip)||{count:0,until:0};
  if(rec.until>now) return res.status(429).json({error:'Too many attempts. Try again shortly.'});

  const password=req.body?.password||'';
  if(password!==process.env.ADMIN_PASSWORD){
    rec.count++;
    if(rec.count>=5){rec.until=now+5*60*1000;rec.count=0;}
    attempts.set(ip,rec);
    return res.status(401).json({error:'Invalid password'});
  }
  attempts.delete(ip);
  res.setHeader('Set-Cookie',makeSessionCookie());
  res.status(200).json({ok:true,expiresInHours:8});
}
