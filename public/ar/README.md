# AR image targets

The AR Lens needs one compiled file here: **`targets.mind`**.
If it's missing, the app shows a friendly "lens is still being calibrated" screen and offers the illustrated map instead, so nothing breaks.

> **Current file:** compiled from the artist's **close-up photos** of each zone on the finished canvas. Tested against a separate photo of the whole painting, plus dim, warm, glare, far-away and 20° side views: all recognized. Very steep side views (about 30° or more) can miss; once locked, tracking follows the visitor as they move.
>
> The file URL gets a `?v=<build>` tag on every deploy, so phones never keep a stale cached copy.

## The three AR zones

Only three artifacts have AR. The armchair and the rotary phone are still part of the hunt through NFC tags and the Explore Map.

| Index | Artifact    | Zone on the canvas                                   | AR overlay                                      |
|------:|-------------|------------------------------------------------------|-------------------------------------------------|
| 0     | `portraits` | The painted portrait of the woman on the blue wall   | Floating history card + gold halo               |
| 1     | `turntable` | The turntable and records on the wooden dresser      | Spinning funk rings + rhythm bars               |
| 2     | `table`     | The magazines on the coffee table                    | Magazine flip-through (covers + stories)        |
| 3, 4  | `turntable` | Same zone, as seen from the left / from the right    | (same as 1)                                     |
| 5, 6  | `table`     | Same zone, as seen from the left / from the right    | (same as 2)                                     |

The angled copies (3–6) are generated from the straight-on photo so visitors standing off to the side are still recognized. This order must match `SITE.arTargetOrder` in `src/data/site.js`.

## Photographing the zones (best results)

- **One photo per zone**, phone held **parallel to the canvas** (straight on, not tilted), the zone filling most of the frame with a little margin around it.
- **Even light, no glare.** Turn off the flash. If there's a shine on the paint or the gold frame, step a little to the side or move the light. Varnish glare is the main thing that hurts recognition.
- **Sharp and full resolution.** Hold still or brace your elbows, and send the original file (not a screenshot or a messaging-app copy, which get compressed).
- **Light color doesn't matter.** Warm or cool bulbs are fine: the lens works in grayscale. Dim is fine too, as long as the photo is sharp.
- If you can, shoot in the **actual gallery lighting**. Otherwise anywhere with soft daylight works.

## Rebuilding `targets.mind`

Send the photos to Claude in this project, or do it by hand:

1. Open the official MindAR compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload the images in the index order above (for a by-hand build you can skip the angled copies and set `arTargetOrder` to `['portraits', 'turntable', 'table']`).
3. Click **Start**, download the result, rename it to `targets.mind` and put it in this folder.
4. Commit and push. The site redeploys automatically. Camera access only works over **HTTPS**.
