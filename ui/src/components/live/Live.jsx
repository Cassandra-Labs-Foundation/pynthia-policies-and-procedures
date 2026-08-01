// The visual vocabulary of "this number is live".
//
// Three pieces, and the third is the one that matters most:
//
//   LiveBadge  — the heartbeat. Says whether events are flowing, and when the
//                last real one landed.
//   LiveValue  — a figure that visibly changes when it changes.
//   DeltaChip  — movement since the page was opened.
//
// The design constraint throughout: a live dashboard must be able to say "this
// feed is not moving". A pulsing green dot over a figure whose source died
// last Tuesday is worse than no dot at all, because it converts an absence of
// information into a false positive.
import React, { useEffect, useRef, useState } from 'react';
import { IDLE_AFTER_MS, ago, useNow } from '../../lib/useLiveCore';

/**
 * The heartbeat.
 *
 * Three states, deliberately distinct rather than a boolean:
 *   live    — the sequence advanced recently. Green, pulsing.
 *   idle    — polling fine, nothing happening. Slate, still. This is the
 *             honest state for a quiet book, and for seed data that stopped.
 *   no beat — the poll itself is failing. Amber. Different problem entirely.
 */
export function LiveBadge({ live, polledAt, lastAdvanceAt, error, className = '' }) {
  const now = useNow();

  if (error) {
    return (
      <span className={`inline-flex items-center text-xs text-amber-700 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 shrink-0" />
        heartbeat failing — showing last known figures
      </span>
    );
  }

  // The event clock, not the poll clock: how long since the CORE last moved.
  const eventMs = live?.eventAt ? now - new Date(live.eventAt).getTime() : null;
  const isLive = lastAdvanceAt !== null && now - lastAdvanceAt < IDLE_AFTER_MS;

  return (
    <span className={`inline-flex items-center text-xs ${className}`}>
      <span className="relative flex w-2 h-2 mr-1.5 shrink-0">
        {isLive && (
          <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex w-2 h-2 rounded-full ${
            isLive ? 'bg-green-500' : 'bg-slate-300'
          }`}
        />
      </span>
      {isLive ? (
        <span className="text-green-700">
          live · event {ago(now - lastAdvanceAt)}
        </span>
      ) : (
        <span className="text-slate-500">
          {/* Names the last real event, so "quiet" and "dead" are separable. */}
          idle · last event {ago(eventMs)}
        </span>
      )}
      {polledAt && (
        <span className="text-slate-400 ml-1.5">· checked {ago(now - polledAt)}</span>
      )}
      {live?.seq !== null && live?.seq !== undefined && (
        <span className="text-slate-400 ml-1.5 font-mono">seq {String(live.seq)}</span>
      )}
    </span>
  );
}

/**
 * A figure that flashes when it moves.
 *
 * The flash is the whole point: on a dashboard someone leaves open on a wall,
 * a number that changes silently between glances is a number nobody saw
 * change. Keyed on the formatted text rather than the raw cents so a
 * re-render with an identical value does not fire it.
 */
export function LiveValue({ children, value, className = '' }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== undefined && prev.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  return (
    <span
      className={`inline-block transition-colors duration-700 rounded px-1 -mx-1 ${
        flash ? 'bg-green-100 text-green-900' : ''
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** Movement since the page was opened. Null baseline renders nothing. */
export function DeltaChip({ cents, format }) {
  if (typeof cents !== 'number' || cents === 0) return null;
  const up = cents > 0;
  return (
    <span
      className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
        up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {up ? '▲' : '▼'} {format(Math.abs(cents))} since open
    </span>
  );
}
