import { isAuthenticated } from '../lib/auth.js';
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({authenticated:isAuthenticated(req)});
}
