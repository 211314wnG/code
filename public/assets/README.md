# Local assets

This project keeps **all** of its assets local — nothing is fetched from a CDN
or any external host at runtime.

By default the textures and sounds are generated **procedurally in code**:

- Textures (terrain, rails, supports, sky) — `app/coaster/lib/textures.js`
  (HTML canvas → `THREE.CanvasTexture`).
- Audio (wind, rumble, tie/chain clacks) — `app/coaster/lib/audio.js`
  (Web Audio API synthesis, mixed and modulated by speed).

This means the ride works fully offline with zero binary asset downloads.

## Using pre-baked files instead

If you would rather ship real image / audio files, drop them in here:

```
public/assets/textures/   # *.png / *.jpg
public/assets/audio/      # *.mp3 / *.ogg / *.wav
public/assets/models/     # *.glb / *.gltf
```

Because the site is served under the `/code` base path, load them with the base
path prefix, e.g.:

```js
const base = process.env.NODE_ENV === 'production' ? '/code' : ''
const tex = new THREE.TextureLoader().load(`${base}/assets/textures/rail.png`)
new Audio(`${base}/assets/audio/wind.mp3`)
```
