# Third-Party Risk — Drafting Notes

## Rename context
This dir was renamed from `outsourcing-and-vendor-management/`. Per user: "merging Vendor Management and Outsourcing Policy" → single combined Third-Party Risk policy. The new name aligns with the standard examiner terminology ("third-party risk management" / TPRM) used by the **Interagency Guidance on Third-Party Relationships: Risk Management** (OCC/FRB/FDIC, June 6, 2023) and CFPB Bulletin 2016-02.

## Canonical drafting work needed
Existing sections VM-01..VM-10 already cover:
- Governance/accountability, vendor inventory & criticality, risk assessment, due diligence (incl. AML/KYC), contract standards, outsourcing of core/capital-impacting functions, ongoing monitoring, incident/breach reporting, termination/exit strategy, key third-party owners (RACI).

Strong backbone. Drafting work:
- **Retitle sections** from VM- (Vendor Management) → TPR- (Third-Party Risk) if you want the prefix to match the new name. Optional — the anchor codes still work as-is.
- **Lifecycle framing** per 2023 Interagency Guidance: Planning → Due Diligence → Contracting → Ongoing Monitoring → Termination. Existing sections roughly map; explicitly label the lifecycle.
- **Critical / High / Moderate / Low** tiering — make the criticality classification explicit (it's implied in VM-02 but should be a defined matrix).
- **Subcontractor (fourth-party) risk** — examiners increasingly expect this; ensure VM-04 / VM-07 cover visibility into the vendor's own vendors.

## Reference docs (already in place)
- `Vendor Management Policy 2022.docx.md`
- `Vendor Management Policy Example - 05-11-2022.docx.md`
- `Vendor Management Policy Starter Template 01252024.doc.md`
- `Third-Party Service Provider Management Policy and Procedures.doc - Google Docs.pdf`

## References still to gather (user note)
*"No references here. We need to find them and generate this later"* — user flagged that additional references should be sourced. Specifically worth pursuing:
- **2023 Interagency Guidance on Third-Party Relationships: Risk Management** (the canonical federal framework).
- **CFPB Bulletin 2016-02** (Service Providers).
- **DFPI vendor-management exam expectations** (no equivalent of OCC Bulletin 2013-29 from DFPI, but examiner practice tracks the interagency guidance).
- Real-world TPRM tooling references (e.g., RSA Archer / OneTrust / Whistic SOC-2 review templates).

## DFPI scope
- The 2023 Interagency Guidance applies to all federally-supervised institutions; DFPI tracks examiner practice closely. Cite the Interagency Guidance even under DFPI.
- **California Consumer Privacy Act / CPRA** "service provider" / "contractor" definitions impose contractual requirements on third parties handling PII — must be reflected in VM-05 (contract standards). Cross-reference `privacy/`.
- **California Financial Code** Section 1750 (state-chartered banks) has notice requirements for outsourcing of certain functions.

## Cross-references
- Vendor InfoSec / data protection → `information-security/` IS-11.
- BSA/AML due diligence on payment processors → `bsa/`.
- Vendor records retention → `record-retention/`.
- Vendor contingency planning → `business-continuity-plan/` BC-14.
- Material outsourcing of capital-impacting functions → `enterprise-risk-management/`.
