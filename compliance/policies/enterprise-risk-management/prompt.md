# Enterprise Risk Management Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Enterprise Risk Management Policy that a regulator or
>    examiner can read end-to-end in a few minutes.
> 2. The canonical input that our regeneration task feeds into the shared
>    meta-prompt to produce the full Table-First, Design-Overlay v2 policy
>    document.
>
> Edit this file directly when the policy's substance, scope, or ownership
> changes. The regenerated long-form policy is rebuilt from this summary plus
> the reference documents in `references/`.

---

## Organization and Ownership

**Organization:** Pynthia Credit Union
**Policy Owner:** Patrick Wilson, Chief Compliance Officer
**Approvers:**
- Patrick Wilson, Chief Compliance Officer

## 1. Purpose and Scope

This Framework defines how Pynthia Credit Union manages risk deliberately and transparently across financial, operational, compliance, technology, model, strategic, and reputational risk types. It establishes how the Credit Union expresses risk appetite, rates risks using a consistent 5x5 likelihood/impact matrix, escalates and reports breaches, and maintains a living risk register. It does not list specific risks or limits; those live in separate risk appetite statements, registers, and committee charters that must conform to this Framework.

## 2. Key Regulatory Authorities

- **NCUA Requirements for Insurance — Risk Policies (12 CFR §741.3 and Appendix A to Part 741)** — require written policies and risk management programs, including interest-rate-risk policy and program expectations, for federally insured credit unions.
- **NCUA ERM & Risk Appetite Guidance (NCUA Examiner's Guide — Enterprise Risk Management & Basic Components of ERM; NCUA Enterprise Risk Appetite Statement)** — set expectations for enterprise risk management, risk appetite, and risk culture, used as a structuring benchmark.
- **Model Risk Management Guidance (Federal Reserve SR 11-7 and parallel OCC/FDIC adoptions)** — set development, validation, and governance expectations for model-based risk assessments and quantitative tools.
- **12 CFR Part 741 (safety-and-soundness expectations)** — underpins identification, measurement, monitoring, and control of risk.
- **Internal governance documents** — Pynthia Board Charter, Risk Committee Charter, ALCO Charter, Model Risk Management Program, and key risk-type policies (Credit, Liquidity, Operational/Technology, BSA/AML, etc.) that must align to this Framework.

## 3. What This Policy Must Cover

Risk in this domain is concentrated not in any single exposure but in the consistency and integrity of the enterprise risk process itself: whether appetite is defined, whether risks are scored comparably, whether breaches escalate on time, and whether the Board sees a complete and reconciled picture. The Framework operates across the three lines of defense and assumes a GRC/risk system capable of storing the defined fields and events.

The policy must establish the following controls:

**(a) Enterprise Risk Appetite Statement.** Maintain a single authoritative enterprise risk appetite statement (document plus structured data per risk category) with versioning, effective/expiry dates, and approval history; lock settings to authorized roles. Review at least annually and within 90 days of a material strategic change, with the system flagging an upcoming review 30 days before the next review date.

**(b) Risk Taxonomy & Categories.** Maintain a canonical list of risk categories and subcategories (financial, operational, compliance, technology, model, strategic, reputational) and enforce selection from it for every risk, KRI, and incident record; review at least annually and when adding new product types or business lines.

**(c) Risk Scoring Matrix & Rating Scale.** Implement a 5x5 likelihood-vs-impact matrix with numeric scores (1–25) and qualitative bands (e.g., Very Low through Very High), enforce its use for all enterprise assessments unless CRO-exempted, and review the scale at least every three years or on major change.

**(d) Risk Assessment & Register Maintenance.** Maintain a centralized enterprise risk register holding all material risks, ratings, controls, and owners, supporting lifecycle states. Reassess High/Very High residual risks at least quarterly, Moderate at least annually, and Low/Very Low every two years or on trigger events; flag risks with no owner or overdue review.

**(e) Key Risk Indicators & Thresholds.** Define KRIs linked to risks with green/amber/red thresholds aligned to appetite and a direction of risk; refresh at the configured frequency and flag stale data when no update is received within 1.5x the expected interval.

**(f) Risk Appetite Breach Escalation & Incident Management.** Detect positions outside appetite, generate a breach record with severity and escalation workflow, and track remediation. For Major/Critical breaches, complete initial triage and CRO notification within 1 business day and present to the appropriate committee within 30 calendar days; review breach status at least monthly until closure.

**(g) Risk Acceptance & Exceptions.** Provide a structured, time-bounded risk acceptance workflow recording approver, rationale, compensating controls, and a mandatory expiry date (no indefinite acceptances). Decide requests within 30 calendar days and issue expiry alerts 30 and 7 days out; lapsed acceptances revert to breach status.

**(h) Risk Reporting & Governance Oversight.** Generate standard management and Board reports and dashboards (heatmaps, top risks, breach and acceptance summaries, KRI trends) with drill-down, delivering management reports at least monthly and Board/Board Risk Committee reports at least quarterly; reconcile or explain conflicting figures and caveat incomplete data.

Governance of these controls is centralized with the Chief Compliance Officer, with the Management Risk Committee, Board Risk Committee, Board of Directors, and Internal Audit as required participants, aligned to the three-lines-of-defense model.

## 4. Out of Scope

- Detailed risk appetite statements and limits by risk type (Interest Rate Risk, Liquidity, Credit, Operational/Technology) — maintained separately and must conform to this Framework.
- Model-specific development, validation, and governance controls — see the Model Risk Management Program.
- Liquidity and ALM limits — see Liquidity Policy.
- Capital adequacy and regulatory capital calculation — see Capitalization and Basel II Standardized Approach Framework Policies.
- Vendor onboarding and oversight mechanics — see Third-Party Risk Policy.
- Internal control design and testing detail — see Internal Controls and Audit Policies.

## 5. System Design Notes

**This section is resolved dynamically at regeneration time.** The
regenerator must invoke the project-scoped `vocabulary` skill (see
`.skills/vocabulary/SKILL.md` at the project root) and inline its
entire stdout as the `DESIGN_NOTES` input to the shared meta-prompt.
Do not hand-curate event or field names here — the skill is the source
of truth and `core-vocabulary.json` evolves.

**Directive to the regenerator.** Before assembling the INPUTS block,
run the skill's extraction script from the project root:

    python3 .skills/vocabulary/scripts/extract_vocabulary.py

Capture the complete stdout verbatim and use it as `DESIGN_NOTES`. The
skill emits a self-contained Markdown block (per-entity field tables
plus events, endpoints, state machines, and plugins). Do not trim,
summarize, or reorder its output — the meta-prompt decides what is
relevant for the policy.

**Failure handling.** If the script exits non-zero, `core-vocabulary.json`
is missing, or the skill reports a parse error, record the failure in
the run summary and proceed with `DESIGN_NOTES` empty. Never invent
event codes or field names; the Design Overlay v2 blocks must only
cite codes that actually exist in the spec.

**Known state of the spec (as of regeneration time).** The parsed spec
is `Cassandra Banking Core API v1.0.0`, which is banking-core
(deposits, transfers, cards, BSA). ERM/GRC entities and events — risk appetite statements, the risk register and taxonomy, risk scoring records, KRI definitions and thresholds, breach and risk-acceptance records, and Board reporting objects — are almost certainly absent from a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
