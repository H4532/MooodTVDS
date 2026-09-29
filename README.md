# MooodTVDS

Simple browser-based digital signage player for the Samsung TV at Moood Cafe.

## TV URL
After GitHub Pages is enabled from the repository's **Settings > Pages**, use:

https://h4532.github.io/MooodTVDS/

Recommended Pages settings:
- Source: Deploy from a branch
- Branch: main
- Folder: /(root)

## Content control
The TV player reads `config.json` every 30 seconds.

Example:

```json
{
  "video": "video.mp4",
  "loop": true,
  "muted": true,
  "volume": 1,
  "fit": "contain"
}
```

### video
Can be:
- `video.mp4` if the file is hosted in this repository/site
- an absolute HTTPS URL to an H.264 MP4 hosted elsewhere

### fit
- `contain`: show the whole video with black bars if needed
- `cover`: fill the screen and crop excess edges

## Samsung compatibility
The page intentionally uses ES5-style JavaScript and XMLHttpRequest for compatibility with older Samsung Smart TV browsers. It automatically retries playback, restarts stalled playback, loops continuously, and checks for configuration changes every 30 seconds.

For the first test, use a reasonably sized H.264/AAC MP4. Older Samsung TV browsers may not reliably decode newer codecs or very high-bitrate 4K browser video.
