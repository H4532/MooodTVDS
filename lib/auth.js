import crypto from 'node:crypto';

const COOKIE_NAME='moood_session';
const SESSION_MS=8*60*60*1000;

function b64url(input){
  return Buffer.from(input).toString('base64url');
}

function sign(payload){
  return crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || 'change-me').update(payload).digest('base64url');
}

export function makeSessionCookie(){
  const payload=b64url(JSON.stringify({exp:Date.now()+SESSION_MS,role:'admin'}));
  const token=payload+'.'+sign(payload);
  return COOKIE_NAME+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+(SESSION_MS/1000);
}

export function clearSessionCookie(){
  return COOKIE_NAME+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

function parseCookies(header=''){
  const out={};
  header.split(';').forEach(p=>{
    const i=p.indexOf('=');
    if(i>0) out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim());
  });
  return out;
}

export function isAuthenticated(req){
  const cookies=parseCookies(req.headers?.cookie || '');
  const token=cookies[COOKIE_NAME];
  if(!token) return false;
  const parts=token.split('.');
  if(parts.length!==2) return false;
  const [payload,sig]=parts;
  const expected=sign(payload);
  if(sig.length!==expected.length) return false;
  try{
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return false;
    const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return data.role==='admin' && Number(data.exp)>Date.now();
  }catch{return false;}
}

export function requireAuth(req,res){
  if(!isAuthenticated(req)){
    res.status(401).json({error:'Unauthorized'});
    return false;
  }
  return true;
}
