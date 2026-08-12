# Institution Parameters — Proposal for Sign-off

**Drafted:** 2026-08-11, by the engineering side, for Patrick's review.
**Provenance:** every value below is a *proposed default* drawn from NCUA-normal
practice for a small federally-insured credit union. None is currently set in
the system — each row's storage is deliberately NULL until a person signs.
**How to review:** strike or amend values inline; anything unmarked is adopted
as written. Once signed, every value lands as an `UPDATE` (or a dated config
row) — no code changes, no redeploy.

The blocked surface, for scale: 83 time-based obligations sit UNSCHEDULED
(OQ-15), every ACH batch grades UNASSESSED (OQ-14), the liquidity module
computes no survival verdict, and the capital module reports no early-warning
trigger.

## 1. Governance calendar anchors (OQ-15)

Anchoring rule proposed, rather than 83 individual dates:

| Cadence | Anchor | Example obligations |
|---|---|---|
| Annual | January 15 (fiscal year + 2 weeks) | board policy reviews, BSA training, audit engagement |
| Quarterly | 15th of Jan / Apr / Jul / Oct | ALCO review, BSA risk assessment refresh, vendor reviews |
| Monthly | first business day | board packet, reconciliation attestations |
| Weekly | Monday | (none currently — reserved) |

An obligation whose regulation names its own deadline (5300 call report,
HMDA/LAR submission) keeps the regulatory date; the anchor rule covers only
obligations where the institution chooses its own calendar.

## 2. ACH dual-control thresholds (OQ-14)

| Parameter | Proposed | Storage |
|---|---|---|
| Per-batch dual-control threshold | **$10,000** — at or above requires maker–checker (CG-DUAL-01) | per-client config, `eps` module |
| Per-client daily exposure cap | **2× trailing-90-day average daily origination**, floor $50,000 | same |
| Same-day ACH per-batch cap | **$100,000** (NACHA limit is $1M/payment; we start conservative) | same |

## 3. Liquidity — LAR bands and survival horizon

| Parameter | Proposed | Storage |
|---|---|---|
| LAR maturity bands | 0–30d / 31–90d / 91–365d / >365d | `core.lar_band_config` |
| Band mismatch limit | net outflow in 0–30d band ≤ **15% of assets** | same |
| Survival horizon (stress) | **30 days** minimum under the combined scenario; early-warning at 45 | `liquidity` stress runs (`survival_days` threshold) |
| Headroom floor | **10%** of assets in unencumbered liquid instruments | `core.lar_band_config` |

## 4. Capital triggers

| Parameter | Proposed | Storage |
|---|---|---|
| Internal early-warning trigger | **800 bp** net-worth ratio (regulatory well-capitalized is 700 bp — 100 bp buffer) | `internal_trigger_bp`, `capital` module |
| Board escalation | any quarter-over-quarter decline ≥ 50 bp, even above trigger | governance obligation (new row, annual-review cadence) |

## 5. Cash limits schedule (cash policy CA-03/CA-04)

| Limit | Proposed |
|---|---|
| Teller drawer | $10,000 |
| Branch vault | $150,000 |
| ATM/ITM per machine | $80,000 |
| Enterprise aggregate | $500,000 |
| Dual-control movement threshold | $25,000 (CA-05) |

## 6. Lending (recorded now, dormant while lending stays parked)

| Parameter | Proposed | Storage |
|---|---|---|
| LTV max — first-lien real estate | 80% (85% with escrow) | `max_ltv_bp`, underwriting config |
| LTV max — HELOC | 85% combined | same |
| LTV max — new vehicle | 100% | same |
| LTV max — used vehicle | 90% | same |

Lending is parked (decision A, 2026-08-11), so these gate nothing today; they
are included so the eventual unparking starts from signed numbers, not a
scramble.

## Sign-off

| Field | |
|---|---|
| Reviewed by | ____________________ |
| Date | ____________________ |
| Amendments | see inline strikes |
