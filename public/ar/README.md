# AR image targets

The AR Lens needs one compiled file here: **`targets.mind`**.
If it's missing, the app shows a friendly "lens is still being calibrated" screen and offers the illustrated map instead, so nothing breaks.

> **Current file = TEST TARGETS.** The `targets.mind` in this folder was compiled from five crops of a *test* painting (a digital mock-up of the room), so you can try the lens by pointing your phone at that image on another screen. **Replace it** with targets compiled from photos of the real, finished canvas before the exhibition opens. The real canvas's colors, texture and framing will differ, and the test targets won't recognize it.

## Make `targets.mind`

1. Photograph each artifact zone **on the finished painting**. Shoot straight on, in even light, with no glare, cropped tight to the zone. High-detail, high-contrast crops track best.
2. Open the official MindAR compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
3. Upload the images **in this exact order** (it must match `SITE.arTargetOrder` in `src/data/site.js`):

   | Index | Frequency   | AR overlay                                     |
   |------:|-------------|------------------------------------------------|
   | 0     | `portraits` | Floating history card + gold halo             |
   | 1     | `turntable` | Spinning psychedelic funk rings + rhythm bars |
   | 2     | `table`     | Floating 3D stack of magazines + archive card |
   | 3     | `phone`     | Pulsing ring + story card                     |
   | 4     | `chair`     | Pulsing ring + story card                     |

   Indexes 3 and 4 are optional. Leave them out and those two artifacts are still found by NFC or the map.
4. Click **Start**, download the result, rename it to `targets.mind` and put it in this folder.
5. Rebuild and redeploy. Camera access only works over **HTTPS**.
