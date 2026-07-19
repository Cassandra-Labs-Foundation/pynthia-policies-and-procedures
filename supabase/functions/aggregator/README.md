# aggregator — the cross-fintech layer (card 51)

Instance-per-fintech means each fintech's data lives in its own instance
(D18/D23). The aggregator is the one place with visibility across all of them,
for Fed settlement and compliance.

## Scope of what is built

This is the **authentication boundary plus event ingest** — the part card 51
asserts. Not built here: the Payment Hub, BSA Approver, BSA Reporter and 5300
Reporter consumers (D27), and cross-fintech search (card 54).

## Auth

Instances authenticate with a short-lived **instance JWT** (D19, HS256, signed
with `AGGREGATOR_JWT_SECRET`).

Rejected, with reasons:

| Condition | Result |
|---|---|
| a partner token (`cass_pt_…`) in any header | `403 partner_token_not_valid_here` |
| `alg: "none"` or any non-HS256 | `401` |
| bad signature, or tampered payload | `401` |
| expired, or no `exp` at all | `401` |
| lifetime greater than 1 hour | `401` |
| `iat` more than 60s in the future | `401` |

A partner token is refused **first** — before the config check and before
signature verification — because it is the wrong *class* of credential, not a
differently-scoped one. It is therefore refused identically whether or not the
aggregator's own signing key is configured. This is the one place that names
the reason rather than returning an opaque `401`: the presenter already knows
they hold a partner token, so saying so leaks nothing and saves an afternoon
of debugging.

## Unmet requirement: mTLS

D19 specifies **mTLS (transport) + JWT (application)**. Only the JWT half
exists here. Mutual TLS is terminated by the platform edge and cannot be
enforced from inside a Deno edge function, so client-certificate verification
must be configured at the ingress in front of this function. **Until that is
done, D19 is half-satisfied.**

## POST /events/ingest

Instances push outbox events (D4/D21).

```bash
curl -sS -X POST "$AGG/events/ingest" \
  -H "Authorization: Bearer $INSTANCE_JWT" -H 'content-type: application/json' \
  -d '{"events":[{"id":"evt_1","code":"transfer.settled","resource_id":"transfer:t1"}]}'
```

`instance_id` is taken from the **verified JWT claims**, never from the request
body — a body field would let one fintech write events attributed to another.
Dedup is by `event_id UNIQUE`, so at-least-once redelivery is a no-op.

## Deployment

`supabase/migrations/20260719000700_aggregator_schema.sql` creates the
`aggregator` schema. In production the aggregator is its **own Supabase
project** (D25) — run that migration against the aggregator project, not
against fintech instances.

| Variable | Purpose |
|---|---|
| `AGGREGATOR_JWT_SECRET` | HS256 signing key for instance JWTs |
