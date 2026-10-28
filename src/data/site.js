/**
 * Resolve a file in /public against the deployed base path, so the app works
 * at a domain root or under a subpath (e.g. GitHub Pages /the-living-room/).
 * Accepts 'audio/x.mp3' or '/audio/x.mp3'; full URLs pass through.
 */
export const asset = (path) =>
  !path || /^(https?:|data:|blob:)/.test(path) ? path : import.meta.env.BASE_URL + path.replace(/^\//, '');

/** Global exhibition settings. Edit these to rebrand or relocate assets. */
export const SITE = {
  title: 'The Living Room',
  tagline: 'Tuning into Sunday Afternoon',
  artist: 'The (She.LL)',
  // Full logo (splash screen) and emblem-only mark (header). Files live in /public.
  logoSrc: asset('logo.webp'),
  logoMarkSrc: asset('logo-mark.webp'),
  // Compiled MindAR image-target file (see /public/ar/README.md).
  arTargetsSrc: asset('ar/targets.mind'),
  /**
   * Order of images used when compiling targets.mind.
   * Index 0 = first image uploaded to the MindAR compiler, etc.
   */
  arTargetOrder: ['portraits', 'turntable', 'table', 'phone', 'chair'],
};

/**
 * Rights & credits notice (shown subtly in the footer, magazine viewers, AR
 * lens, and in full in the "Credits & rights" drawer). Set `contactEmail` to
 * add a "request credit or removal" line.
 */
export const RIGHTS = {
  short: 'For educational, non-commercial use. Archival materials © their respective owners.',
  contactEmail: '',
  full: [
    'The Living Room is a non-commercial, educational art project. It is shared to support learning about Black domestic life, print culture, music and community history in the 1960s and 1970s.',
    'Magazine covers, photographs, quotations, recordings and other historical materials shown here belong to their original creators and copyright holders. They are presented for education, commentary and historical reflection. The (She.LL) does not claim ownership of them, and no endorsement by any rights holder is implied.',
    'Jet, Ebony, Essence, Black Enterprise, Black World and Negro Digest are trademarks of their respective owners.',
  ],
};

export const STORAGE_KEYS = {
  discovered: 'livingroom:discovered:v1',
  guestbook: 'livingroom:guestbook:v1',
  ambient: 'livingroom:ambient:v1',
};
