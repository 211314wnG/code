# 🎮 Game Hub — Three.js Games

A small **Next.js** + **Three.js** game hub deployed to **GitHub Pages** via
GitHub Actions. The landing page (`/`) shows two cards:

- **我的世界 / Voxel Sandbox** (`/minecraft`) — a Minecraft-style voxel world:
  procedural terrain, trees, mining and building. Desktop uses pointer-lock
  mouse-look + WASD + space + left/right click; touch devices get an on-screen
  D-pad, jump, and break/place buttons with drag-to-look. The touch UI hides the
  moment a key/mouse is used and returns on the next screen touch.
- **过山车 / Coaster POV** (`/coaster`) — the first-person roller-coaster
  simulator below.

## 🎢 Coaster POV

A first-person roller-coaster point-of-view simulator built with **Three.js**.

Live circuit features:

- **Curved track** with a chain lift hill, a big first **drop**, **banked turns**
  and a full **vertical loop**.
- **First-person camera** that follows the track with full tilt (pitch) and roll
  (banking + loop inversion). The camera uses the *same* orientation frames as
  the rail geometry, so the view always matches the visible track.
- **Gravity-based physics**: the train accelerates downhill, decelerates uphill
  and is pulled up the lift hill by a chain. A speed floor guarantees the loop
  always completes.
- **Rich scene**: visible rail / spine / cross-tie meshes, vertical support
  beams, a gradient sky dome, rolling textured terrain, scattered trees and
  distance fog.
- **Realistic layered lighting**: ambient + hemisphere fill + a shadow-casting
  directional sun with soft PCF shadows.
- **Dynamic sound** synthesised live with the Web Audio API and synced to speed
  (wind, wheel rumble and tie/chain clacks).

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to ./out
```

## Project structure

Everything is modular — there is **no single monolithic HTML file**.

```
app/
  layout.js                  # document shell + metadata
  page.js                    # loads the simulator client-side (ssr: false)
  coaster/
    CoasterSimulator.jsx     # renderer, animation loop, wiring
    HUD.jsx                  # start gate, live speed readout, mute toggle
    lib/
      track.js               # the curve (control points: drops/loop/turns)
      frames.js              # parallel-transport frames + banking
      trackMesh.js           # rails, spine, ties, support beams
      scene.js               # sky, terrain, lights, scenery
      physics.js             # gravity-based speed model
      rideCamera.js          # first-person follow camera
      audio.js               # Web Audio engine (speed-synced sound)
      textures.js            # procedural canvas textures
```

## Assets are 100% local

All visual and audio assets are **generated procedurally in code** (canvas
textures + Web Audio synthesis) and live inside the project's `app/coaster/lib`
folder. There are **no external CDN requests and no network fetches at runtime**
— the ride works fully offline. See `public/assets/README.md` for where to drop
in pre-baked image/audio files instead, if you ever want to.

## Deployment

`.github/workflows/deploy.yml` builds on every push / PR (CI) and deploys the
static export to GitHub Pages from `main`. The site is served under the `/code`
base path (see `next.config.js`).
