import { issueSignedToken, list, del } from '@vercel/blob';
import { handleUploadPresigned } from '@vercel/blob/client';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = request.body;

    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY,
      getSignedToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || '{}'); } catch {}

        if (payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error('Invalid password');
        }

        if (!pathname || !pathname.toLowerCase().endsWith('.mp4')) {
          throw new Error('Only MP4 files are allowed');
        }

        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          validUntil: Date.now() + 60 * 60 * 1000,
          allowedContentTypes: ['video/mp4'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          oidcToken: process.env.VERCEL_OIDC_TOKEN,
          storeId: process.env.BLOB_STORE_ID
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: ['video/mp4'],
            maximumSizeInBytes: 500 * 1024 * 1024,
            addRandomSuffix: true,
            allowOverwrite: false,
            cacheControlMaxAge: 60
          }
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try {
          let cursor;
          do {
            const result = await list({
              prefix: 'videos/',
              limit: 100,
              cursor,
              oidcToken: process.env.VERCEL_OIDC_TOKEN,
              storeId: process.env.BLOB_STORE_ID
            });

            const oldUrls = (result.blobs || [])
              .filter((item) => item.url !== blob.url)
              .map((item) => item.url);

            if (oldUrls.length) {
              await del(oldUrls, {
                oidcToken: process.env.VERCEL_OIDC_TOKEN,
                storeId: process.env.BLOB_STORE_ID
              });
            }

            cursor = result.cursor;
          } while (cursor);
        } catch (cleanupError) {
          console.error('Old video cleanup failed:', cleanupError);
        }
      }
    });

    response.status(200).json(jsonResponse);
  } catch (error) {
    response.status(400).json({
      error: error && error.message ? error.message : 'Upload failed'
    });
  }
}
