// Working values for a 5300 in progress — the numbers a person keys in for the
// lines the core cannot source on its own.
//
// A 5300 is mostly unsourceable here (no general ledger), but it still has to be
// FILEABLE: a preparer keys the missing figures, quarter after quarter. This
// hook is that working set — a flat { [accountCode]: rawString } map, persisted
// per institution + quarter in localStorage so a half-entered filing survives a
// reload. It is deliberately NOT sent anywhere: these are drafts a human is
// still editing, not core truth. Sourced lines never live here — they always win
// from the live read — so there is exactly one place each number comes from.
import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'callReport.values.v1';

/** Parse a keyed dollar string ("1,234.56", "$1,234", "1234") to integer cents. */
export function parseDollarsToCents(raw) {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/**
 * @param namespace  a stable key for this filing — instance id + quarter, so
 *                   two quarters (or two programs) do not share a draft.
 */
export function useFormValues(namespace) {
  const storageKey = `${PREFIX}.${namespace || 'default'}`;
  const [values, setValues] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Read after mount, never during render — localStorage does not exist on the
  // server and reading it inline would hydrate-mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      setValues(saved ? JSON.parse(saved) : {});
    } catch {
      setValues({});
    }
    setLoaded(true);
  }, [storageKey]);

  const persist = useCallback((next) => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* private mode */ }
  }, [storageKey]);

  const setValue = useCallback((code, raw) => {
    setValues((prev) => {
      const next = { ...prev };
      if (raw === '' || raw === null || raw === undefined) delete next[code];
      else next[code] = String(raw);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearAll = useCallback(() => {
    setValues({});
    persist({});
  }, [persist]);

  /** How many codes have a non-empty keyed value — for progress readouts. */
  const keyedCount = Object.keys(values).length;

  return { values, setValue, clearAll, keyedCount, loaded };
}
