export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    adminUserSet: !!process.env.ADMIN_USER,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    oidcConfigured: !!process.env.BLOB_STORE_ID,
    blobStoreIdSet: !!process.env.BLOB_STORE_ID,
    blobWebhookKeySet: !!process.env.BLOB_WEBHOOK_PUBLIC_KEY,
    legacyBlobTokenSet: !!process.env.BLOB_READ_WRITE_TOKEN,
    nodeEnv: process.env.NODE_ENV || null
  });
}