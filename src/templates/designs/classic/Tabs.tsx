"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabDay { key: string; small: string; label: string; content: ReactNode }

/**
 * Days as tabs (Riviera's weekend): arrow keys, Home and End move between them (WAI-ARIA tabs pattern).
 * `all` shows every day one after another instead (the editor, where every event must be reachable).
 */
export function DayTabs({ days, all, label }: { days: TabDay[]; all: boolean; label: string }) {
  const [current, setCurrent] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (all || days.length < 2) {
    return <>{days.map((d) => <div key={d.key} className="panel">{days.length > 1 ? <p className="lab t panel-day">{d.small} · {d.label}</p> : null}{d.content}</div>)}</>;
  }
  const go = (i: number) => { const n = (i + days.length) % days.length; setCurrent(n); tabs.current[n]?.focus(); };
  const onKey = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: days.length - 1 };
    if (e.key in keys) { e.preventDefault(); go(keys[e.key]); }
  };
  return (
    <>
      <div className="tablist" role="tablist" aria-label={label} onKeyDown={onKey}>
        {days.map((d, i) => (
          <button key={d.key} ref={(b) => { tabs.current[i] = b; }} type="button" role="tab" id={`${id}-t${i}`} aria-controls={`${id}-p${i}`}
            aria-selected={i === current} tabIndex={i === current ? 0 : -1} onClick={() => setCurrent(i)}>
            <small>{d.small}</small>{d.label}
          </button>
        ))}
      </div>
      {days.map((d, i) => (
        <div key={d.key} className="panel" role="tabpanel" id={`${id}-p${i}`} aria-labelledby={`${id}-t${i}`} hidden={i !== current} tabIndex={0}>
          {d.content}
        </div>
      ))}
    </>
  );
}
