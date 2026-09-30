import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const result = await list({ prefix: 'videos/', limit: 100 });
    const videos = (result.blobs || [])
      .filter((b) => (b.pathname || '').toLowerCase().endsWith('.mp4'))
      .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

    if (!videos.length) {
      res.status(200).json({
        video: 'https://h4532.github.io/MooodTVDS/video.mp4',
        version: 'fallback',
        loop: true,
        muted: true,
        volume: 0,
        fit: 'contain'
      });
      return;
    }

    const current = videos[0];
    res.status(200).json({
      video: current.url,
      version: current.uploadedAt || current.etag || Date.now().toString(),
      loop: true,
      muted: true,
      volume: 0,
      fit: 'contain'
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to read current video' });
  }
}
