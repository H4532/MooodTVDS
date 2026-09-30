export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    adminUserSet: !!process.env.ADMIN_USER,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    blobTokenSet: !!process.env.BLOB_READ_WRITE_TOKEN,
    nodeEnv: process.env.NODE_ENV || null
  });
}