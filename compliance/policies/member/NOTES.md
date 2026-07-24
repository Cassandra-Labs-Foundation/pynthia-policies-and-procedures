# Member — Drafting Notes

## Scope (merger)
Per user: *"merging Change of Address Policy and Member Expulsion Policy and Dispute Resolution Policy anything else as needed."*

This is the **member lifecycle umbrella** — events and rights affecting members of a credit-union-style institution from onboarding through expulsion. "Member" terminology aligns with credit union charter; for a bank charter the equivalent term is "customer."

## Likely sub-sections
1. **Membership Eligibility & Onboarding** — field of membership rules, who can become a member (cross-reference `bsa/` CIP for identity verification).
2. **Account Maintenance / Change of Address** — change-of-address controls including:
   - Identity verification before processing change.
   - Notice to old address (Reg E / Reg DD red-flag triggers).
   - Time-window before new card/statement sent (cross-reference `information-security/` IS-10 Red Flags Rule).
3. **Member Communications** — preferences, opt-outs, electronic vs. paper.
4. **Member Disputes & Dispute Resolution** — internal complaint intake, escalation, response timelines, regulator forwarding (DFPI, CFPB).
5. **Account Restrictions / Closures** — when an account can be restricted or closed by the institution.
6. **Member Expulsion** — credit-union-specific procedure for expelling a member for cause:
   - Statutory grounds (FCU Act § 118 / state credit union law equivalents — for DFPI, **California Credit Union Law, Cal Fin Code §§ 14000+**).
   - Notice requirements.
   - Member's right to be heard at a special meeting.
   - Effect of expulsion on existing loans/shares.
7. **Member Death / Estate** — account handling on death, payable-on-death designations, beneficiary claims.
8. **Member Records & Privacy** — cross-reference `privacy/` and `record-retention/`.
9. **Member Service Standards** — response timelines, channels.

## Reference docs
- `Account Servicing-Address Changes.doc - Google Docs.pdf` — Change of Address procedure. Seed for the change-of-address sub-section.
- `0691R00000RO7DnQAL_0051R00000JDyQtQAL (1).doc` — (Salesforce ID file, content unknown — read before drafting).
- `0691R00000RNyUiQAL_0051R00000JE995QAD (1).docx` — (Salesforce ID file, content unknown — read before drafting).

## References still to gather
- **Member Expulsion** policy template.
- **Dispute Resolution** policy template (or borrow structure from `compliance/` complaint handling).
- **Member Death / Estate Handling** template.

## DFPI scope
- **California Credit Union Law (Cal Fin Code Division 5)** — governs state-chartered credit union membership, expulsion procedures, member meetings, etc.
- **California Consumer Financial Protection Law (CCFPL)** — covers complaint handling and UDAAP in member interactions.
- **DFPI complaint forwarding** — institution must forward DFPI-routed complaints to designated officer.
- Federal: **Reg E** (error resolution for EFTs), **Reg DD** (Truth in Savings disclosures on member accounts), **Reg P** (privacy notices), **FACT Act Red Flags** (identity theft triggers on address changes), **NCUA Part 707** (if becomes a federal CU).

## Cross-references
- CIP / identity verification on onboarding → `bsa/`.
- Address-change red flags → `information-security/` IS-10.
- Member privacy / disclosures → `privacy/`.
- Member record retention → `record-retention/`.
- Complaint logging structure → `compliance/`.
- Member-facing online channels → `e-commerce/`.

## Duplicate files in Downloads
The two Salesforce-named files still have non-`(1)` duplicates in Downloads (same byte sizes). Worth deleting from Downloads if no longer needed.
