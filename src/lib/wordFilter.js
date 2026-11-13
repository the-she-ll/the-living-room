/**
 * Instant word check for the guestbook form. It mirrors the blocklist in
 * supabase/setup.sql, which the database enforces on every post; keep the two
 * lists roughly in sync (the database is the one that counts).
 */
const EXACT = [
  'fuk', 'fck', 'fcuk', 'fack', 'shitty', 'ass', 'asses', 'jackass', 'dumbass', 'pussy', 'pussies',
  'niggas', 'fag', 'fags', 'spic', 'spics', 'coon', 'coons',
];
const PREFIX = [
  'fuck', 'motherfuck', 'fvck', 'shit', 'bullshit', 'bitch', 'cunt', 'twat', 'wank', 'asshole', 'arsehole',
  'bastard', 'cocksucker', 'whore', 'slut', 'jizz', 'porn', 'nigger', 'nigga', 'faggot', 'dyke', 'tranny',
  'kike', 'chink', 'gook', 'wetback', 'jigaboo', 'porchmonkey', 'retard',
];

const LOOKALIKES = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i', '|': 'i' };
const squash = (w) => w.replace(/(.)\1+/g, '$1');
const ALL = [...EXACT, ...PREFIX];

export function hasBlockedWords(text) {
  const tokens = String(text || '')
    .toLowerCase()
    .replace(/[013457@$!|]/g, (c) => LOOKALIKES[c])
    .split(/[^a-z]+/)
    .filter(Boolean);
  return tokens.some(
    (tok) =>
      ALL.includes(tok) ||
      PREFIX.some((p) => tok.startsWith(p)) ||
      ALL.some((w) => squash(w).length >= 4 && squash(tok) === squash(w)),
  );
}
