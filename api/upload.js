import { handleUpload } from '@vercel/blob/client';

function isAuthorized(payload) {
  try {
    const data = JSON.parse(payload || '{}');
    return data.username === process.env.ADMIN_USER &&
           data.password === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: new Request('https://mooodtvds.vercel.app/api/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req.body)
      }),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isAuthorized(clientPayload)) {
          throw new Error('Unauthorized');
        }
        if (!pathname || !pathname.toLowerCase().endsWith('.mp4')) {
          throw new Error('Only MP4 files are allowed');
        }
        return {
          allowedContentTypes: ['video/mp4'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ok: true })
        };
      },
      onUploadCompleted: async () => {}
    });

    res.status(200).json(jsonResponse);
  } catch (error) {
    const message = error && error.message ? error.message : 'Upload failed';
    res.status(message === 'Unauthorized' ? 401 : 400).json({ error: message });
  }
}
