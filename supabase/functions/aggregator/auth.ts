// Card 51 — the aggregator's authentication boundary.
//
// D23's access matrix is unambiguous about what belongs here:
//
//   | Actor              | Fintech X | Fintech Y | Aggregator |
//   | Fintech X API key  |    yes    |    NO     |     NO     |
//   | Credit Union admin |   read    |   read    |    full    |
//   | Pynthia operations |   full    |   full    |    full    |
//
// A partner token is never valid at the aggregator — not "usually not", not
// "unless scoped". It is the wrong CLASS of credential entirely: per D19,
// instances authenticate to the aggregator with mTLS plus a short-lived JWT,
// which is a different mechanism, not a differently-scoped version of the same
// one. So this module does not consult the partner token table at all; there
// is no code path here that could resolve one.
//
// UNMET REQUIREMENT — mTLS. D19 specifies mTLS (transport) + JWT
// (application). Only the JWT half is implemented here, because mutual TLS is
// terminated by the platform edge and cannot be enforced from inside a Deno
// edge function. Client-certificate verification must be configured at the
// ingress in front of this function; until it is, D19 is HALF satisfied and
// this comment is the record of that gap.

const enc = new TextEncoder();

export interface InstanceClaims {
  /** the instance this token speaks for */
  instance_id: string;
  /** issued-at and expiry, seconds since epoch */
  iat: number;
  exp: number;
  /**
   * Card 52: credential class within the aggregator. 'instance' (the
   * default when absent) pushes events and originates for ITS instance;
   * 'cu_admin' reads across every instance and writes NOTHING. The claim is
   * minted by /auth/token from the credential row — never client-asserted.
   */
  role?: "instance" | "cu_admin";
}

export type VerifyOutcome =
  | { ok: true; claims: InstanceClaims }
  | { ok: false; reason: string };

// Allocates its own ArrayBuffer rather than using Uint8Array.from, whose
// ArrayBufferLike result is not assignable to the BufferSource that
// crypto.subtle.verify requires.
function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(b: Uint8Array): string {
  return btoa(String.fromCharCode(...b))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign an instance JWT (HS256). Used by instances and by the tests. */
export async function signInstanceJwt(
  claims: InstanceClaims,
  secret: string,
): Promise<string> {
  const header = bytesToB64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = bytesToB64url(enc.encode(JSON.stringify(claims)));
  const signingInput = `${header}.${payload}`;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(signingInput));
  return `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`;
}

/**
 * Verify an instance JWT.
 *
 * `alg` is checked against a literal allowlist BEFORE anything else. A verifier
 * that trusts the token's own header will accept alg:"none" — the token then
 * authenticates itself, which is the classic JWT break. The header here is
 * read only to be rejected if it is not exactly HS256.
 */
export async function verifyInstanceJwt(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<VerifyOutcome> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };

  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  // literal allowlist — never "whatever the token says"
  if (header.alg !== "HS256") return { ok: false, reason: "unsupported_alg" };

  const signingInput = `${parts[0]}.${parts[1]}`;
  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      b64urlToBytes(parts[2]),
      enc.encode(signingInput),
    );
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!valid) return { ok: false, reason: "bad_signature" };

  let claims: InstanceClaims;
  try {
    claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (typeof claims.instance_id !== "string" || claims.instance_id.length === 0) {
    return { ok: false, reason: "missing_instance_id" };
  }
  if (typeof claims.exp !== "number" || typeof claims.iat !== "number") {
    // An unexpiring instance token defeats the point of short-lived JWTs, so a
    // missing exp is a rejection rather than a default.
    return { ok: false, reason: "missing_expiry" };
  }

  const now = Math.floor(nowMs / 1000);
  if (claims.exp <= now) return { ok: false, reason: "expired" };

  // D19 caps instance tokens at 1 hour. A token minted with a longer life is
  // refused even while unexpired: accepting it would let a compromised signer
  // issue effectively permanent credentials.
  const MAX_LIFETIME_SECONDS = 3600;
  if (claims.exp - claims.iat > MAX_LIFETIME_SECONDS) {
    return { ok: false, reason: "lifetime_too_long" };
  }
  // Reject tokens issued in the future beyond small clock skew — an iat far
  // ahead is how a caller would smuggle a long-lived token past the check above.
  if (claims.iat > now + 60) return { ok: false, reason: "issued_in_future" };

  return { ok: true, claims };
}

/**
 * Is this credential a partner token?
 *
 * Recognised so the aggregator can say WHY it refused rather than returning a
 * generic 401. That is a deliberate exception to the usual
 * do-not-confirm-the-credential rule: the presenter already knows they hold a
 * partner token, so naming it leaks nothing, and "your partner key does not
 * work here, by design" is the difference between a five-minute fix and an
 * afternoon debugging a misconfigured integration.
 */
export function looksLikePartnerToken(token: string): boolean {
  return token.startsWith("cass_pt_");
}
