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
  // Replace /public/logo.svg with your logo (or point this at e.g. asset('logo.png')).
  logoSrc: asset('logo.svg'),
  // Compiled MindAR image-target file (see /public/ar/README.md).
  arTargetsSrc: asset('ar/targets.mind'),
  /**
   * Order of images used when compiling targets.mind.
   * Index 0 = first image uploaded to the MindAR compiler, etc.
   */
  arTargetOrder: ['portraits', 'turntable', 'table', 'phone', 'chair'],
};

export const STORAGE_KEYS = {
  discovered: 'livingroom:discovered:v1',
  guestbook: 'livingroom:guestbook:v1',
  ambient: 'livingroom:ambient:v1',
};
