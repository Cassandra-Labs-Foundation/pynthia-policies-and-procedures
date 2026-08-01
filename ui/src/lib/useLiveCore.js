// The heartbeat every live view shares.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS SEQUENCE-DRIVEN AND NOT A TIMER
//
// The obvious way to make a dashboard "live" is to re-fetch everything on an
// interval. That fails here in both directions at once:
//
//   - The figures worth watching are EXPENSIVE. The ledger total and the share
//     lines come from walking all 1,829 accounts — ten sequential requests,
//     ~6 seconds. Re-running that every few seconds means the page spends its
//     whole life re-deriving numbers that did not change, and starts the next
//     walk before the last one lands.
//   - A timer also cannot tell you whether anything HAPPENED. A number that is
//     re-fetched every 5s and never moves looks identical to a number whose
//     feed died three days ago. That is the difference between a live
//     dashboard and a spreadsheet that lies about being one.
//
// So the poll is cheap and constant, and the RECOMPUTE is event-driven.
// `aggregator.fbo_position.last_seq` is a monotonic counter over settled money
// events, so it is the core's own answer to "did anything happen?". We poll
// that one small endpoint, and only when the sequence actually advances do we
// tell the page to re-derive the expensive half. Transactions coming in is
// what propagates the dashboard — not the clock.
//
// It also means idleness is observable. If the sequence has not moved, this
// hook says so with the timestamp of the last real event, rather than showing
// a confident figure with a spinning refresh icon over it.
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReport5300 } from "./api";

/** How often we ask the cheap endpoint whether anything happened. */
export const TICK_MS = 5000;

/**
 * How long without a sequence advance before we call the stream idle.
 *
 * Deliberately generous. A quiet minute on a credit union's book is normal;
 * the point of this threshold is to catch a feed that has actually stopped,
 * which in this instance it has — the seed data's last event is days old.
 */
export const IDLE_AFTER_MS = 90_000;

/**
 * Poll the core's event sequence; call `onAdvance` when it moves.
 *
 * `onAdvance` is held in a ref rather than listed as a dependency, so a caller
 * can pass an inline closure without re-arming the interval on every render —
 * which would reset the timer forever and mean the poll never actually fires.
 */
export function useLiveCore({ onAdvance, tickMs = TICK_MS } = {}) {
  const [live, setLive] = useState(null);
  const [polledAt, setPolledAt] = useState(null);
  const [lastAdvanceAt, setLastAdvanceAt] = useState(null);
  const [error, setError] = useState(null);
  // Bumped on every advance so a consumer can key a flash animation off it.
  const [advanceCount, setAdvanceCount] = useState(0);

  const seqRef = useRef(null);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  const tick = useCallback(async () => {
    try {
      const r = await fetchReport5300();
      const seq = r.current?.last_seq ?? null;

      setLive({
        seq,
        fboCents: r.current?.fbo_position_cents ?? null,
        // The moment the CORE last advanced the position — not the moment we
        // asked. These diverge by days on idle data and conflating them is
        // exactly the lie this hook exists to avoid.
        eventAt: r.current?.updated_at ?? null,
        history: r.history ?? [],
        stale: Boolean(r.stale),
        instanceId: r.instanceId ?? null,
      });
      setPolledAt(Date.now());
      setError(null);

      const prev = seqRef.current;
      seqRef.current = seq;

      // First tick establishes the baseline; it is not an "advance". Without
      // this guard every mount would fire a full recompute on top of the one
      // the page already does itself.
      if (prev !== null && seq !== null && String(seq) !== String(prev)) {
        setLastAdvanceAt(Date.now());
        setAdvanceCount((n) => n + 1);
        onAdvanceRef.current?.({ from: prev, to: seq });
      }
    } catch (e) {
      // A failed poll must never blank a good page — the last known figures
      // stay on screen and the badge reports that the heartbeat is missing.
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    tick();
    const t = setInterval(tick, tickMs);
    return () => clearInterval(t);
  }, [tick, tickMs]);

  return { live, polledAt, lastAdvanceAt, advanceCount, error, refetch: tick };
}

/**
 * A ticking "3s ago" clock.
 *
 * Its own state, on its own interval, because freshness has to decay on screen
 * without anything else happening. A timestamp rendered once and left alone is
 * how a dead dashboard passes for a live one.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** ms -> "just now" / "3s ago" / "4m ago" / "2h ago" / "6d ago". */
export function ago(ms) {
  if (ms === null || ms === undefined) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 2) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
