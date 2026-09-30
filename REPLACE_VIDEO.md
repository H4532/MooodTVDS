# Replace the Moood Cafe TV video

This signage setup is designed so the TV URL never changes.

TV URL:

https://h4532.github.io/MooodTVDS/

For every future campaign, only replace one file: **video.mp4**.

## Fast replacement workflow

1. Prepare the new video as:
   - MP4
   - H.264 video
   - no audio preferred
   - 1920x1080 for the rotated TV
   - 29.97 or 30 fps
   - filename exactly: `video.mp4`

2. Open the repository:
   https://github.com/H4532/MooodTVDS

3. Delete or replace the existing `video.mp4`.

4. Upload the new file with the exact same name:
   `video.mp4`

5. Commit directly to `main`.

6. Edit `config.json` and increase only the `version` value:
   - current: `"version": "2"`
   - next upload: `"version": "3"`
   - then `4`, `5`, etc.

The TV checks the configuration every 30 seconds. The version number forces older Samsung browsers to ignore any cached copy and download the new video.

## Recovery behavior

The player automatically:
- loops the video
- forces muted playback
- retries failed playback
- restarts stalled playback
- reloads the webpage if playback has been dead for 90 seconds
- performs a full page refresh every 6 hours as a final fallback

The TV should normally not need to be touched when replacing content remotely.
