// LIVE drill database — the real thing, recorded.
//
// The hermetic drill (fake_db.ts) mimics supabase-js; the writers were
// written FOR supabase-js. So the live tier is not a port — it is the same
// firers and the same grading handed a real client, with one addition: a
// recording wrapper that mirrors every SUCCESSFUL write into the same
// `rows["schema.table"]` structure the graders already read.
//
// Why record instead of querying back: the graders ask "what did THIS run
// write" — the live database accumulates every prior run, so reading it back
// would grade history, not the run. The recorder scopes observation to the
// process without touching the writers.
//
// What this tier catches that the fake cannot (the five fake-vs-real defect
// classes): writer/schema gaps (a column the migration never got), create-body
// no-ops (the real table refusing what the fake accepted), select-list
// narrowing (PostgREST returns only listed columns), and real constraint /
// trigger behavior. Env guards and route-gate conflicts still need the HTTP
// tier — the harness owns those.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface LiveDb {
  client: SupabaseClient;
  rows: Record<string, Any[]>;
  /** unrecorded client — used to materialize seeds without counting them as run-writes twice */
  raw: SupabaseClient;
}

/**
 * seedInstitution writes straight into `rows` (the fake reads its own store);
 * a real database never sees those rows unless we put them there. Upserts in
 * dependency order, ignoring per-row failures — a seed the live schema
 * refuses is itself a finding, so failures are returned, not swallowed.
 */
export async function materializeSeeds(
  raw: SupabaseClient,
  rows: Record<string, Any[]>,
): Promise<string[]> {
  const failures: string[] = [];
  const priority = ["partner", "entity", "account", "api_token"];
  const keys = Object.keys(rows).sort((a, b) => {
    const ta = a.split(".")[1], tb = b.split(".")[1];
    const pa = priority.indexOf(ta), pb = priority.indexOf(tb);
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.localeCompare(b);
  });
  const missingTables = new Set<string>();
  for (const key of keys) {
    const [schema, table] = key.split(".");
    if (missingTables.has(key)) continue;
    for (const row of rows[key]) {
      let attempt: Record<string, Any> = { ...row };
      // Self-heal two mechanical drift classes so REAL findings stand out:
      // fake seeds carry columns some card-era tables never had (strip and
      // retry), and sim mirrors exist only for artifact-era tables (skip the
      // key). Everything else — constraint violations, bad enum values — is a
      // finding and stays in the failure list.
      for (let tries = 0; tries < 6; tries++) {
        const { error } = await raw.schema(schema).from(table)
          .upsert(attempt, { onConflict: "id", ignoreDuplicates: false });
        if (!error) break;
        const missingCol = error.message.match(/Could not find the '([^']+)' column/);
        if (missingCol) {
          delete attempt[missingCol[1]];
          continue;
        }
        if (/Could not find the table/.test(error.message)) {
          missingTables.add(key);
          break;
        }
        if (/no unique or exclusion constraint/.test(error.message)) {
          const { error: insErr } = await raw.schema(schema).from(table).insert(attempt);
          if (insErr && !/duplicate key/.test(insErr.message)) {
            failures.push(`${key}: ${insErr.message.slice(0, 100)}`);
          }
          break;
        }
        failures.push(`${key}: ${error.message.slice(0, 100)}`);
        break;
      }
      if (missingTables.has(key)) break;
    }
  }
  return failures;
}

/**
 * Wrap a PostgREST filter/query builder so that when the chain finally
 * resolves WITHOUT error, `record()` fires. Every method call is passed
 * through; intermediate results (still-chainable builders) are wrapped again
 * so the interception survives `.update(x).eq(...)`-style chains.
 */
function recordingChain(target: Any, record: () => void, onError?: (e: Any) => void): Any {
  return new Proxy(target, {
    get(t, prop, receiver) {
      if (prop === "then") {
        // thenable terminal: delegate, record on clean resolution
        const realThen = t.then?.bind(t);
        if (!realThen) return undefined;
        return (onFulfilled: Any, onRejected: Any) =>
          realThen((res: Any) => {
            if (res && res.error == null) record();
            else if (res && res.error != null && onError) onError(res.error);
            return onFulfilled ? onFulfilled(res) : res;
          }, onRejected);
      }
      const v = Reflect.get(t, prop, receiver);
      if (typeof v !== "function") return v;
      return (...args: Any[]) => {
        const out = v.apply(t, args);
        // still a builder (has .then or more methods) -> keep recording
        if (out && typeof out === "object") return recordingChain(out, record, onError);
        return out;
      };
    },
  });
}

function normalizeRows(payload: Any): Any[] {
  if (payload == null) return [];
  return Array.isArray(payload) ? payload : [payload];
}

/**
 * A SupabaseClient whose writes are mirrored into `rows` on success. Reads
 * pass straight through to the live database.
 */
export function makeLiveDb(url: string, serviceKey: string): LiveDb {
  const rows: Record<string, Any[]> = {};
  const real = createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: {
      // A dead socket must FAIL, not hang. Two full runs stalled forever
      // (0% CPU, zero open sockets) on a fetch that never resolved; with a
      // deadline the call errors, the runner's try/catch records the control
      // as blocked, and the run keeps moving.
      fetch: (input: Any, init?: Any) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(30_000)])
            : AbortSignal.timeout(30_000),
        }),
    },
  });

  const client: Any = {
    schema(schemaName: string) {
      const s = real.schema(schemaName);
      return {
        from(table: string) {
          const b: Any = s.from(table);
          const key = `${schemaName}.${table}`;
          // DRILL_DEBUG=1 surfaces writes the live schema refused — the
          // writers ignore PostgREST errors, so without this a refusal is
          // only visible as a missing produced event, never as a cause.
          const debug = (globalThis as Any).Deno?.env.get("DRILL_DEBUG");
          const wrap = (payload: Any, out: Any) =>
            recordingChain(out, () => {
              (rows[key] ??= []).push(...normalizeRows(payload));
            }, debug
              ? (e: Any) => console.error(`  [refused] ${key}: ${String(e.message).slice(0, 140)}`)
              : undefined);
          return new Proxy(b, {
            get(t, prop, receiver) {
              const v = Reflect.get(t, prop, receiver);
              if (typeof v !== "function") return v;
              if (prop === "insert" || prop === "upsert" || prop === "update") {
                return (payload: Any, ...rest: Any[]) => wrap(payload, v.call(t, payload, ...rest));
              }
              return v.bind(t);
            },
          });
        },
        rpc(fn: string, args?: Any) {
          return (s as Any).rpc(fn, args);
        },
      };
    },
    rpc(fn: string, args?: Any) {
      return (real as Any).rpc(fn, args);
    },
  };

  return { client: client as SupabaseClient, rows, raw: real };
}
