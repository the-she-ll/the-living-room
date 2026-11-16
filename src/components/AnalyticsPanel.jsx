import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { FREQUENCIES, FREQUENCY_ORDER, SESSIONS, VOICEMAILS } from '../data/frequencies';
import { PROMPTS } from './Guestbook';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 365, label: 'Year' },
];

const fmtTime = (s) => {
  if (s == null) return '–';
  const n = Math.round(Number(s));
  return n >= 60 ? `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s` : `${n}s`;
};

/** Visitor numbers for the admin page (reads app_stats(), admins only). */
export default function AnalyticsPanel({ client }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const { data, error: err } = await client.rpc('app_stats', { days, tz });
    setLoading(false);
    if (err) {
      setError(
        /app_stats|app_events|schema cache/i.test(err.message)
          ? 'Analytics isn’t set up yet. Run supabase/analytics.sql in the Supabase SQL Editor.'
          : err.message,
      );
      return;
    }
    setStats(data);
  }, [client, days]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = stats?.events || [];
  const pick = (event, target, via) =>
    rows.filter((r) => r.event === event && (target === undefined || r.target === target) && (via === undefined || r.via === via));
  const times = (...a) => pick(...a).reduce((n, r) => n + r.times, 0);
  const people = (...a) => pick(...a).reduce((n, r) => n + r.people, 0);
  const avgSeconds = (event, target) => {
    const rs = pick(event, target);
    const total = rs.reduce((n, r) => n + r.times, 0);
    return total ? rs.reduce((n, r) => n + Number(r.avg_seconds || 0) * r.times, 0) / total : null;
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-full bg-ink/10 p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold ${days === r.days ? 'bg-teal text-parchment' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} aria-label="Refresh" className="grid h-9 w-9 place-items-center rounded-full bg-ink/10">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <p className="rounded-lg bg-sienna/10 p-3 text-sm font-bold text-sienna">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat n={stats.visitors} label="people opened the app" />
            <Stat n={stats.entered} label="tapped Enter" />
            <Stat n={stats.visits} label="visits in total" />
          </div>

          <Section title="Porch Lifeline voice notes" note="“Listened” counts each time someone heard a voice note, and for how long.">
            <p className="mb-2 text-sm">
              <b>{people('story_open', 'phone', 'unlocked')}</b> people opened the porch phone.
            </p>
            <Cards
              items={VOICEMAILS.map((v) => {
                const id = `vm-${v.digit}`;
                return [
                  `${v.digit}. ${v.title}`,
                  [
                    ['people', people('voice_play', id)],
                    ['plays', times('voice_play', id)],
                    ['heard to the end', times('voice_end', id, 'finished')],
                    ['avg. listened', fmtTime(avgSeconds('voice_end', id))],
                  ],
                ];
              })}
            />
            <p className="mt-1 text-xs opacity-60">
              Plays that didn’t finish: someone hung up, dialed another number, closed the story or left the app.
            </p>
          </Section>

          <Section title="Frequencies" note="How people unlocked each one, and how many opened its story.">
            <Cards
              items={FREQUENCY_ORDER.map((id) => [
                FREQUENCIES[id].title,
                [
                  ['by NFC tag', people('found', id, 'nfc')],
                  ['by AR Lens', people('found', id, 'ar')],
                  ['by map', people('found', id, 'map')],
                  ['opened story', people('story_open', id, 'unlocked')],
                ],
              ])}
            />
          </Section>

          <Section title="Other interactions">
            <Table
              head={['', 'Times', 'People']}
              rows={[
                ['Opened the AR Lens', times('ar_open'), people('ar_open')],
                ['Stopped the radio music', times('radio_stop'), people('radio_stop')],
                ['Checked a locked frequency’s hint', times('story_open', undefined, 'locked'), people('story_open', undefined, 'locked')],
                ...SESSIONS.map((s) => [`Played the record “${s.title}”`, times('record_play', s.id), people('record_play', s.id)]),
              ]}
            />
          </Section>

          <Section title="Guestbook">
            <Table
              head={['', 'Times', 'People']}
              rows={[
                ['Opened from the tape reel', times('guestbook_open', undefined, 'reel'), people('guestbook_open', undefined, 'reel')],
                ['Opened from a Reflect button', times('guestbook_open', undefined, 'reflect'), people('guestbook_open', undefined, 'reflect')],
                ['Opened from the family-photo tag', times('guestbook_open', undefined, 'tag'), people('guestbook_open', undefined, 'tag')],
                ...PROMPTS.map((p) => [`Posted: “${p.text}”`, times('guestbook_post', p.id), people('guestbook_post', p.id)]),
              ]}
            />
          </Section>

          <Section title="By day">
            <Table head={['Day', 'Opened the app', 'Tapped Enter']} rows={(stats.daily || []).map((d) => [d.day, d.visitors, d.entered])} />
          </Section>

          <p className="text-xs opacity-60">
            Counts are anonymous: each phone gets a random id, and nothing personal is stored. “People” means different phones. Leave
            your own phone out of the numbers by opening the site once with <code>?notrack</code> at the end of the link.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div className="rounded-xl bg-white/55 p-3">
      <p className="font-display text-3xl font-black">{n ?? 0}</p>
      <p className="text-[11px] leading-tight opacity-70">{label}</p>
    </div>
  );
}

function Section({ title, note, children }) {
  return (
    <section>
      <h2 className="font-display text-xl font-black">{title}</h2>
      {note && <p className="mb-2 text-xs opacity-60">{note}</p>}
      {children}
    </section>
  );
}

function Cards({ items }) {
  return (
    <ul className="space-y-2">
      {items.map(([title, nums]) => (
        <li key={title} className="rounded-xl border border-ink/10 bg-white/55 p-3">
          <p className="text-sm font-bold">{title}</p>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center">
            {nums.map(([label, n]) => (
              <div key={label}>
                <p className="font-display text-xl font-black tabular-nums">{n}</p>
                <p className="text-[10px] leading-tight opacity-60">{label}</p>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Table({ head, rows }) {
  if (!rows.length) return <p className="text-sm opacity-60">Nothing yet.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/55">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-ink/10">
            {head.map((h, i) => (
              <th key={i} className={`px-3 py-2 font-bold ${i ? 'text-right whitespace-nowrap' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-ink/5 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j ? 'text-right tabular-nums' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
