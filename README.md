# The Living Room: Tuning into Sunday Afternoon

*An interactive exhibition companion by **The (She.LL)***

This is a mobile-first web app that goes with a large painting of a 1970s Black living room. Visitors "tune into" five hidden memory frequencies and find them in any order using **NFC tags**, the **AR Lens** (MindAR image tracking) or the **illustrated Explore Map**. Each frequency unlocks a story, a sound layer in the soul groove, and a stanza of the exhibition poem.

Built with Vite, React 18, Tailwind CSS v4, Lucide React, MindAR.js and Three.js. All audio is synthesized live with the Web Audio API, so the app needs no audio files.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN via --host)
npm run build      # production build in /dist
npm run preview    # serve the build locally
```

> To test the camera on a phone you need **HTTPS**. Use the GitHub Pages deploy below, or a tunnel such as `ngrok http 5173`.

## Deploying (GitHub Pages)

Every push to `main` builds and publishes the site with `.github/workflows/deploy.yml`, to
**https://the-she-ll.github.io/the-living-room/**. The first time, go to the repo's **Settings → Pages** and check that **Source** is set to **GitHub Actions**.

The build uses a relative base path, so the same `dist/` also works at a domain root, on a custom domain, or on any other static host (Netlify, Vercel, Cloudflare Pages). Put files in `/public` and reference them without a leading slash (e.g. `audio/pantheon/baldwin.mp3`). The `asset()` helper in `src/data/site.js` resolves them against the deployed path.

## NFC tags / deep links

Write one URL to each NFC sticker (any NFC writer app works, e.g. NFC Tools):

| Artifact | URL |
|---|---|
| Wall portraits | `https://the-she-ll.github.io/the-living-room/?frequency=portraits` |
| Velvet sofa / chair | `https://the-she-ll.github.io/the-living-room/?frequency=chair` |
| Coffee table | `https://the-she-ll.github.io/the-living-room/?frequency=table` |
| Turntable console | `https://the-she-ll.github.io/the-living-room/?frequency=turntable` |
| Rotary phone | `https://the-she-ll.github.io/the-living-room/?frequency=phone` |

`?unlock=xyz` also works, and so do friendly aliases like `?frequency=vinyl` or `?frequency=telephone`. When a tag is tapped, the app marks the frequency as found, plays the "Tuning In…" animation and sound, and opens the artifact drawer. Then it removes the parameter from the URL so a refresh doesn't replay it. The same URLs work as QR codes.

## What to customize

| What | Where |
|---|---|
| **Logo** | `public/logo.webp` (full logo, loading screen) and `public/logo-mark.webp` (emblem only: header, `favicon.png`, `apple-touch-icon.png`). Paths are set in `SITE` in `src/data/site.js`. |
| Titles, history text, riddles, reflection prompts | `src/data/frequencies.js` → `FREQUENCIES` |
| Notable figures (Living Pantheon) | `PANTHEON`. Add `image` and `audioSrc` (e.g. `audio/pantheon/baldwin.mp3`) |
| **Magazine covers** (Jet, Ebony, Essence, Black Enterprise, Black World) | `MAGAZINES` + scans in `public/images/covers/` (see the README there). Used by both the web flip viewer and the AR lens. |
| Rights notice | `RIGHTS` in `src/data/site.js`: short line (opening screen, footer, magazine viewers) and the full **Credits & rights** text. Set `contactEmail` to add a takedown/credit contact. |
| Meeting notes, liner notes, voicemails | `FRONT_ROOM_NOTES`, `MAGAZINES` (`image`), `LINER_NOTES`, `VOICEMAILS` (`audioSrc`) |
| **The poem** | `src/data/poem.js`. Replace each stanza's `lines` and set `ready: true` |
| AR targets | `public/ar/targets.mind` (see `public/ar/README.md`) |
| Colors and fonts | `src/index.css` → `@theme` |

Any clip without an `audioSrc` plays a synthesized "voice on the line" placeholder, so there are never missing-asset errors. Put real recordings in `public/audio/…`.

## Project structure

```
src/
  App.jsx                      State, deep links, tuning-in flow, layout
  audio/AudioController.js     Web Audio engine: crackle, tune-in sweep, soundbites,
                               5-stem groove sequencer, clip playback
  ar/arScene.js                MindAR session + Three.js overlays (lazy-loaded)
  components/
    SplashScreen.jsx           Logo loader + "Tap to Tune In" (unlocks audio on iOS)
    Header.jsx                 AR Lens toggle, vinyl crackle on/off
    FrequencyDial.jsx          Hi-fi receiver progress tracker (dial, VU, knob, presets)
    TuningOverlay.jsx          "Tuning In…" unlock animation
    ArtifactModal.jsx          Drawer: riddle, Explore / Archive / Reflect tabs
    ArtifactIllustration.jsx   Film-grain stand-ins for archival photos
    interactives/              PantheonGallery, FrontRoomNotes, MagazineFlip,
                               VinylPlayer, RotaryDial
    CanvasMap.jsx              Illustrated living-room map with riddle hotspots
    PoemViewer.jsx             "Assemble the Sanctuary": blurred → glowing stanzas
    SymphonyPlayer.jsx         Stem mixer + "All Frequencies Synchronized"
    Guestbook.jsx              Living Guestbook drawer + tape-reel marquee
    ARView.jsx                 Full-screen camera UI with graceful fallbacks
    Drawer.jsx                 Swipe-to-dismiss bottom sheet
  data/                        site.js, frequencies.js, poem.js
  hooks/                       useLocalStorage, useDiscoveries, useAudio
```

## The audio stems

Each frequency adds one layer to a two-bar soul vamp at 94 BPM (Dm9 to G13):

| Frequency | Stem |
|---|---|
| Turntable | Funk bassline |
| Chair | Pocket drums |
| Table | Page-turn shaker |
| Phone | Electric piano (with tremolo) |
| Portraits | Warm organ pad |

At 5/5 the **All Frequencies Synchronized** button (and the completed poem) brings in the full band.

## Notes for exhibition day

- **Persistence:** discoveries, the guestbook and the crackle setting are stored in `localStorage` on each visitor's phone. The guestbook is **per device**. To show every visitor's memories on a shared reel, connect a backend such as Supabase or Firebase in `Guestbook.jsx`.
- **iOS:** audio starts after the first tap (splash screen). If the phone's silent switch is on, Web Audio is muted on iPhone, so consider wall text that says "turn your ringer on 🔊".
- **AR size:** the MindAR engine (~360 KB gzipped) is code-split and only downloads when someone opens the AR Lens. The main app is ~80 KB gzipped.
- **Reset:** a "Reset progress" link in the footer is handy for docents and testing.
- `mind-ar` lists the native `canvas` package as a dependency, but it's only used by MindAR's Node tooling. `package.json` overrides it with an empty package so `npm install` never needs native build tools.

## Content status

Draft content to replace before opening:

- **Pantheon:** the four figures are placeholders until the final list is chosen. The quotes are well-documented public statements, and no speech audio is included yet.
- **Magazine covers:** these are stylized recreations, not reproductions of real Jet/Essence covers. Swap in licensed scans.
- **Meeting notes and voicemails:** these are illustrative composites, marked as such in the UI. Replace them with documented gatherings and oral histories recorded (with consent) for the exhibition.
- **Poem:** the stanzas are placeholders. The unlock and reveal already work.
