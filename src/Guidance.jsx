import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GUIDANCE, SHARED, guidanceFor } from './guidance';
import { GuidanceCtx, useGuidanceState } from './guidanceContext';

/* The Tips panel, reachable from the nav on every study topic.
 *
 * It lives in the nav rather than floating over the page: the nav is already
 * sticky and no-print, and a floating button would sit on top of the keypad in
 * Math Facts and the map in Geography.
 *
 * Study apps report their active tab through useGuidanceTab(), so the panel can
 * say something about the tab she is actually on. A topic that never calls it
 * still gets its topic-level guidance — the tab note is additive. */

export function GuidanceProvider({ children }) {
  const [tab, setTab] = useState(null);
  const value = useMemo(() => ({ tab, setTab }), [tab]);
  return <GuidanceCtx.Provider value={value}>{children}</GuidanceCtx.Provider>;
}

function Bullet({ children }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
      <span>{children}</span>
    </li>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function StudentView({ topic, tabNote }) {
  return (
    <div className="space-y-6">
      {tabNote?.student && (
        <div className="rounded-xl bg-amber-50 p-4 text-slate-800 ring-1 ring-amber-200">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-800">On this tab</p>
          <p>{tabNote.student}</p>
        </div>
      )}

      {topic?.student?.length > 0 && (
        <Section title={topic.label}>
          <ul className="space-y-2.5 text-slate-800">
            {topic.student.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          </ul>
        </Section>
      )}

      <Section title="Works for anything">
        <ul className="space-y-2.5 text-slate-800">
          {SHARED.student.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
        </ul>
      </Section>
    </div>
  );
}

function ParentView({ topic, tabNote }) {
  const p = topic?.parent;
  return (
    <div className="space-y-6">
      {p?.lead && (
        <p className="rounded-xl bg-slate-100 p-4 leading-relaxed text-slate-800">{p.lead}</p>
      )}

      {tabNote?.parent && (
        <Section title="This tab">
          <p className="leading-relaxed text-slate-800">{tabNote.parent}</p>
        </Section>
      )}

      {p?.encourage?.length > 0 && (
        <Section title="What to encourage">
          <ul className="space-y-2.5 leading-relaxed text-slate-800">
            {p.encourage.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          </ul>
        </Section>
      )}

      {p?.watch?.length > 0 && (
        <Section title="What to watch for">
          <ul className="space-y-2.5 leading-relaxed text-slate-800">
            {p.watch.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          </ul>
        </Section>
      )}

      {p?.research?.length > 0 && (
        <Section title="Where this comes from">
          <ul className="space-y-3">
            {p.research.map(([claim, cite], i) => (
              <li key={i} className="border-l-2 border-slate-300 pl-3">
                <p className="font-semibold text-slate-800">{claim}</p>
                <p className="text-sm text-slate-600">{cite}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="The two that carry everything">
        <p className="leading-relaxed text-slate-800">{SHARED.parent.lead}</p>
        <ul className="mt-3 space-y-3">
          {SHARED.parent.points.map(([claim, why], i) => (
            <li key={i} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">{claim}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{why}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-500">{SHARED.parent.more}</p>
      </Section>
    </div>
  );
}

const AUDIENCES = [
  { id: 'student', label: 'How to study this' },
  { id: 'parent', label: 'For grown-ups' },
];

export function GuidanceButton({ topic }) {
  const { tab } = useGuidanceState();
  const [open, setOpen] = useState(false);
  /* Always opens on the student side. The grown-up notes are not hidden, but
   * they are not what she should land on either. */
  const [audience, setAudience] = useState('student');
  const panelRef = useRef(null);
  const openerRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    setAudience('student');
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => panelRef.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, close]);

  // Returning focus to the opener matters on iPad, where the panel is full height.
  useEffect(() => {
    if (!open) openerRef.current?.focus({ preventScroll: true });
  }, [open]);

  const resolved = guidanceFor(topic, tab);
  if (!GUIDANCE[topic]) return null;

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-[44px] items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 font-bold text-slate-100 transition hover:bg-white/20 active:bg-white/20"
      >
        <span aria-hidden="true">💡</span>
        <span>Tips</span>
      </button>

      {/* Portalled to <body> on purpose. The nav that hosts this button carries
        * `backdrop-blur`, and backdrop-filter makes an element a containing
        * block for fixed-position descendants — rendered in place, the panel
        * inherited the nav's 68px height and only its first rows painted. */}
      {open && createPortal(
        <div className="no-print fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close tips"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-[1px]"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Study tips"
            tabIndex={-1}
            className="relative flex h-full w-full max-w-xl flex-col bg-slate-50 shadow-2xl outline-none sm:rounded-l-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Study tips</p>
                <h2 className="text-xl font-bold text-slate-900">{resolved?.topic?.label ?? 'Studying'}</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] rounded-xl px-3 text-2xl leading-none text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-200 bg-white px-5 pb-3">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAudience(a.id)}
                  aria-pressed={audience === a.id}
                  className={`min-h-[44px] rounded-xl px-4 text-sm font-bold transition ${
                    audience === a.id
                      ? 'bg-slate-900 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {audience === 'student'
                ? <StudentView topic={resolved?.topic} tabNote={resolved?.tabNote} />
                : <ParentView topic={resolved?.topic} tabNote={resolved?.tabNote} />}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
