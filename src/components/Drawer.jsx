import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Mobile bottom sheet: slides up, swipe the handle down to dismiss, ESC to
 * close, locks background scroll (iOS-safe).
 */
export default function Drawer({ open, onClose, title, eyebrow, accent = '#8A3319', children, tone = 'parchment', labelId, zClass = 'z-50' }) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(null);
  const panelRef = useRef(null);
  const id = labelId || `drawer-${String(title).replace(/\W+/g, '-').toLowerCase()}`;

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (dragY > 110) onClose?.();
    setDragY(0);
    startY.current = null;
  };

  const panelTone = tone === 'dark' ? 'bg-umber-deep text-parchment' : 'parchment';

  return (
    <div className={`fixed inset-0 ${zClass} flex items-end justify-center`} role="presentation">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`${panelTone} relative flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-[28px] shadow-[0_-20px_60px_rgba(0,0,0,0.55)] outline-none transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]`}
        style={{
          transform: visible ? `translateY(${dragY}px)` : 'translateY(100%)',
          transitionDuration: dragY ? '0ms' : undefined,
          borderTop: `6px solid ${accent}`,
        }}
      >
        <header
          className="shrink-0 touch-none px-5 pt-2 pb-3"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-current opacity-25" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {eyebrow && (
                <p className="mb-0.5 text-[11px] font-semibold tracking-[0.2em] uppercase opacity-70" style={{ color: tone === 'dark' ? undefined : accent }}>
                  {eyebrow}
                </p>
              )}
              <h2 id={id} className="font-display text-2xl leading-tight font-black sm:text-3xl">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/10 transition hover:bg-black/20"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="no-scrollbar safe-bottom flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
      </section>
    </div>
  );
}
