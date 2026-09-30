import { handleUpload } from '@vercel/blob/client';

function validCredentials(clientPayload) {
  try {
    const data = JSON.parse(clientPayload || '{}');
    return (
      data.username === process.env.ADMIN_USER &&
      data.password === process.env.ADMIN_PASSWORD
    );
  } catch {
    return false;
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = request.body;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!validCredentials(clientPayload)) {
          throw new Error('Invalid username or password');
        }

        if (!pathname || !pathname.toLowerCase().endsWith('.mp4')) {
          throw new Error('Only MP4 files are allowed');
        }

        return {
          allowedContentTypes: ['video/mp4'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploadedBy: 'admin' })
        };
      },
      onUploadCompleted: async () => {}
    });

    response.status(200).json(jsonResponse);
  } catch (error) {
    response.status(400).json({
      error: error && error.message ? error.message : 'Upload failed'
    });
  }
}
