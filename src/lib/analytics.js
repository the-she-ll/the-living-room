import { GUESTBOOK } from '../data/site';

/**
 * Anonymous visitor analytics, stored in the same Supabase project as the
 * guestbook (table app_events). Each phone gets a random id so visits can be
 * counted; nothing personal (no name, location or IP) is saved.
 *
 * Open the site once with ?notrack on your own phone to leave yourself out
 * of the numbers (?track turns it back on).
 */
const NOTRACK_KEY = 'livingroom:notrack:v1';
const VISITOR_KEY = 'livingroom:visitor:v1';

const params = new URLSearchParams(window.location.search);
try {
  if (params.has('notrack')) localStorage.setItem(NOTRACK_KEY, '1');
  if (params.has('track')) localStorage.removeItem(NOTRACK_KEY);
} catch {
  /* storage blocked */
}

const randomId = () =>
  (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).slice(0, 36);

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) localStorage.setItem(VISITOR_KEY, (id = randomId()));
    return id;
  } catch {
    return randomId();
  }
}

const disabled = (() => {
  if (!GUESTBOOK.supabaseUrl || !GUESTBOOK.supabaseAnonKey) return true;
  if (params.has('admin')) return true;
  try {
    return localStorage.getItem(NOTRACK_KEY) === '1';
  } catch {
    return false;
  }
})();

export const analyticsOff = disabled;

const visitor = disabled ? '' : visitorId();
const session = randomId();
const url = `${GUESTBOOK.supabaseUrl.replace(/\/+$/, '')}/rest/v1/app_events`;
const key = GUESTBOOK.supabaseAnonKey;
let queue = [];
let timer = null;
const leaveHooks = [];

function send(keepalive) {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const rows = queue.splice(0, 50);
  fetch(url, {
    method: 'POST',
    keepalive,
    headers: {
      apikey: key,
      ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  }).catch(() => {}); // analytics must never get in the way
  if (queue.length) send(keepalive);
}

/**
 * Record one event. `target` is what it's about (a frequency id, voice note,
 * record…), `via` how it happened, `seconds` a duration where it applies.
 */
export function track(event, { target, via, seconds } = {}) {
  if (disabled) return;
  queue.push({
    visitor,
    session,
    event,
    target: target == null ? null : String(target).slice(0, 40),
    via: via == null ? null : String(via).slice(0, 20),
    seconds: seconds == null ? null : Math.max(0, Math.min(36000, Math.round(seconds * 10) / 10)),
  });
  if (!timer) timer = setTimeout(() => send(false), 4000);
}

/** Run `fn` just before the page goes away (e.g. to log a voice note cut short). */
export function onLeave(fn) {
  leaveHooks.push(fn);
}

if (!disabled) {
  const leave = () => {
    leaveHooks.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
    send(true);
  };
  window.addEventListener('pagehide', leave);
  document.addEventListener('visibilitychange', () => document.hidden && send(true));
}
