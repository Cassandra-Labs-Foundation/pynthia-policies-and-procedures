# Electronic Payment Systems — Drafting Notes

## Reference docs
- `Electronic Banking Services Policy - 10-2021.docx.md` — markdown export.
- `Electronic Banking Services Policy - 10-2021.docx - Google Docs.pdf` — PDF rendering of the same source. Keep both; PDF preserves tables/formatting that the markdown export may mangle.

## Scope clarification — EPS vs. E-Commerce
The reference doc covers **Electronic Banking Services** broadly (online banking, mobile banking, bill pay, person-to-person payments, mobile remote deposit capture). Need to decide what lives where:

- **`electronic-payment-systems/` (this dir)** — backend payment infrastructure (ACH, wires, card networks, RTP/FedNow, settlement, payment risk controls).
- **`e-commerce/`** — consumer-facing online/mobile channel governance.
- **Overlap zone:** bill pay, mobile RDC, P2P payments — these are both payment rails AND consumer channels. Recommendation: place rail-side rules (limits, fraud monitoring, NACHA compliance) here; channel-side rules (UX, disclosures, channel auth) in `e-commerce/`.

## Canonical drafting work needed
The existing canonical `electronic-payment-systems.md` is fairly thin. Drafting should cover:
- **ACH origination & receipt** — NACHA Operating Rules compliance, ACH risk management (return rates, prenote, originator agreements).
- **Wire transfers** — Fedwire/CHIPS, BSA Travel Rule (cross-reference `bsa/` BA-10), OFAC screening (cross-reference `bsa/`), wire dollar limits, dual control.
- **Card networks** — debit/credit card issuance, Reg E error resolution (60-day rule), card network compliance (Visa/MC).
- **RTP / FedNow** — instant payments rails, irrevocability considerations, fraud controls.
- **Settlement & nostro accounts** — daylight overdraft management (cross-reference `liquidity/`).
- **Payment fraud monitoring** — anomaly detection, transaction limits, hold/release procedures.

## DFPI scope
- **California Money Transmission Act** — applies if processing payments on behalf of third parties.
- **California Financial Code §§ 1351-1389** — wire transfers under state law.
- Federal: **Reg E** (consumer EFTs), **Reg J** (Fedwire), **Reg CC** (funds availability), **NACHA Operating Rules**, **BSA Travel Rule** (31 CFR 1010.410(f)), **UCC Article 4A** (commercial wires).

## Cross-references
- BSA Travel Rule + OFAC wire screening → `bsa/`.
- Consumer-facing online channel → `e-commerce/`.
- Card fraud / Red Flags → `information-security/` IS-10.
- ACH/wire vendor management (e.g., correspondent banks) → `third-party-risk/`.
- Funds availability holds → `cash/` (deposit ops side).
- BCP for payment rails (alternate clearing, manual processing) → `business-continuity-plan/`.
