import { ExternalLink } from 'lucide-react';
import Drawer from './Drawer';
import { MAGAZINES, PANTHEON } from '../data/frequencies';
import { RIGHTS, SITE } from '../data/site';

/** Full rights notice + per-item credits, generated from the content data. */
export default function CreditsDrawer({ open, onClose, zClass }) {
  const covers = MAGAZINES.filter((m) => m.image);
  return (
    <Drawer open={open} onClose={onClose} title="Credits & Rights" eyebrow={SITE.artist} accent="#4F5D2F" zClass={zClass}>
      <div className="space-y-4 pb-6 text-[15px] leading-relaxed">
        {RIGHTS.full.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {RIGHTS.contactEmail && (
          <p>
            If you hold rights to anything shown here and would like it credited differently or removed, please contact{' '}
            <a className="font-bold underline" href={`mailto:${RIGHTS.contactEmail}`}>
              {RIGHTS.contactEmail}
            </a>
            .
          </p>
        )}

        {covers.length > 0 && (
          <section>
            <h3 className="font-display mb-1 text-lg font-black">Magazine covers</h3>
            <ul className="space-y-1 text-sm">
              {covers.map((m, i) => (
                <li key={i}>
                  {m.masthead}, {m.date} · © {m.credit}
                  {m.sourceUrl && (
                    <>
                      {' · '}
                      <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
                        source <ExternalLink size={11} />
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="font-display mb-1 text-lg font-black">Quotations</h3>
          <ul className="space-y-1 text-sm">
            {PANTHEON.map((p) => (
              <li key={p.name}>
                {p.name}: {p.source}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm opacity-70">Artwork, illustrations, sound design and app © {SITE.artist}.</p>
      </div>
    </Drawer>
  );
}
