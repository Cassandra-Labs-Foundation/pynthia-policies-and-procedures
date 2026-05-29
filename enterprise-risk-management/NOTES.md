# Enterprise Risk Management — Drafting Notes

## Existing structure
Canonical has RA-01..RA-08:
- RA-01 Enterprise Risk Appetite Statement
- RA-02 Risk Taxonomy / Categories
- RA-03 Risk Scoring Matrix / Rating Scale
- RA-04 Risk Assessment Register Maintenance
- RA-05 Key Risk Indicators / Thresholds
- RA-06 Risk Appetite Breach Escalation / Incident Management
- RA-07 Risk Acceptance / Exceptions
- RA-08 Risk Reporting / Governance Oversight

## Drafting work needed: Model Risk Management integration
The `Model Risk Management Program.docx.md` reference is comprehensive (based on Federal Reserve **SR 11-7** Supervisory Guidance). Two integration options:

**Option A** — Add a new section `RA-09 Model Risk Management` inside the ERM canonical that summarizes the MRM framework and references the full program doc.

**Option B** — Treat MRM as a stand-alone supporting program referenced from the ERM taxonomy (RA-02). The full MRM program lives in its own location; ERM canonical just names it as a covered risk category.

Recommendation: **A** for now (single source of truth in ERM), revisit if MRM grows large enough to warrant its own top-level policy dir.

## Patterns worth hoisting from the MRM doc into ERM-wide governance
- **Three Lines of Defense** (Model Owners → Risk Mgmt & Compliance → Internal Audit) — generalize from MRM-specific to apply across all risk types in RA-08.
- Risk-tier-driven cadence (high 12–18mo, medium 18–24mo, low 36mo) — applicable to validation/review cadence for any risk control.

## DFPI flag
- SR 11-7 is a Federal Reserve supervisory letter. DFPI doesn't issue its own model-risk guidance, but state-chartered institutions are still expected to apply SR 11-7 principles. Cite SR 11-7.
- SR 12-7 stress testing (DFAST) only applies at >$10B total consolidated assets — may or may not apply depending on size.

## Reference docs
- `Model Risk Management Program.docx.md` — comprehensive MRM framework, SR 11-7 aligned.
