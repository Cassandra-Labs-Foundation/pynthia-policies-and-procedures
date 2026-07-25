// Postgres ORDER BY semantics, for the test doubles.
//
// This exists because both doubles got null ordering WRONG in the same way and
// neither could have been caught by the other. drill/fake_db.ts coerced NULL to
// "" before comparing, and api/test_helpers.ts's listDb did not sort at all —
// so between them they modelled "NULLs last" and "whatever order the fixture
// was written in", and Postgres does neither.
//
// The rule being modelled, which is easy to get backwards:
//
//   ORDER BY col ASC   -> NULLS LAST   (nulls are "largest")
//   ORDER BY col DESC  -> NULLS FIRST
//
// So a DESC page over a column with nulls LEADS with the null rows. That is how
// GET /accounts came to advertise has_more:true with next_after:null against
// the live database while every hermetic test passed: the cursor is read from
// the last row of the page, and the fake never put a null row anywhere the real
// query would have.
//
// One definition, imported by both doubles, so they cannot drift apart again.

export interface PgOrder {
  ascending?: boolean;
  nullsFirst?: boolean;
}

/** Is this value NULL as far as ordering is concerned? */
function isNull(v: unknown): boolean {
  return v === null || v === undefined;
}

/**
 * Compare two rows on `col` the way Postgres would.
 *
 * Values are compared as strings, which is exact for the ISO-8601 timestamps
 * and prefixed ids these doubles hold (both sort lexicographically the same way
 * they sort natively) and is not claimed to be right for anything else.
 */
export function pgCompare(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  col: string,
  opts: PgOrder = {},
): number {
  const ascending = opts.ascending !== false;
  const nullsFirst = opts.nullsFirst ?? !ascending;

  const av = a[col], bv = b[col];
  const aNull = isNull(av), bNull = isNull(bv);
  if (aNull || bNull) {
    if (aNull && bNull) return 0;
    return (aNull ? 1 : -1) * (nullsFirst ? -1 : 1);
  }

  const x = String(av), y = String(bv);
  if (x === y) return 0;
  return ascending ? (x < y ? -1 : 1) : (x > y ? -1 : 1);
}

/** Sort a copy of `rows` the way Postgres' ORDER BY would. */
export function pgOrderBy<T extends Record<string, unknown>>(
  rows: T[],
  col: string,
  opts: PgOrder = {},
): T[] {
  return [...rows].sort((a, b) => pgCompare(a, b, col, opts));
}
