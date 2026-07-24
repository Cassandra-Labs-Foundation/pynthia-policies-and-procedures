# E-Commerce — Drafting Notes

## Reference doc status (Patrick)
*"One more that is a bit out of my depth right now, but it looks solid."*

→ The reference doc (`0691R00000RNybgQAD_0051R00000JE8AtQAL_(1).pdf`) is a solid seed, but Patrick is not the SME. Drafting this policy will need input from someone with e-commerce / digital banking / online channel expertise.

## Likely scope
E-commerce policy for a financial institution typically covers:
- Online account opening (interaction with BSA CIP — see `bsa/`).
- Online disclosures (e-SIGN Act consent, online Reg E disclosures, online Reg Z/DD).
- Website / app design standards (UDAAP compliance, accessibility).
- Online authentication & FFIEC guidance on authentication for internet banking.
- Mobile banking specifics.
- Third-party online services (cross-reference `third-party-risk/`).
- Online fraud monitoring (cross-reference `information-security/`).
- Customer onboarding flow controls.
- Online channel BCP/DR (cross-reference `business-continuity-plan/`).

## Relationship to adjacent policies
Overlapping scope to consider when drafting:
- **`electronic-payment-systems/`** — payment rails (ACH, wires, cards). E-commerce is the consumer-facing channel; EPS is the backend payment infrastructure. Keep separate but cross-reference.
- **`information-security/`** — cybersecurity controls for online channels live there; e-commerce policy should reference, not duplicate.
- **`bsa/`** — CIP for online account opening lives in BSA.
- **`privacy/`** — online privacy notices, cookies, third-party app connections live in privacy.

→ E-commerce policy should be the **channel governance** layer (what we offer online, how customers interact, business rules) — not the backend controls.

## Duplicate files in Downloads
Three identical copies exist in Downloads (same byte size, 48,218 bytes):
- `0691R00000RNybgQAD_0051R00000JE8AtQAL.pdf`
- `0691R00000RNybgQAD_0051R00000JE8AtQAL (1).pdf`
- `0691R00000RNybgQAD_0051R00000JE8AtQAL_(1).pdf` (this one placed in references/)

## DFPI scope
- **DFPI Money Transmission Act** — if e-commerce involves money transmission (payment processing on behalf of merchants), may require MTA license.
- **California Consumer Financial Protection Law (CCFPL)** — covers UDAAP in digital channels.
- **California ADA compliance** — Unruh Civil Rights Act + Cal Code of Regs Title 24 web accessibility expectations.
- Federal: FFIEC IT Examination Handbook (E-Banking booklet), FFIEC Authentication Guidance (2021 update), Reg E (electronic fund transfers), e-SIGN Act, ESIGN consent requirements.
