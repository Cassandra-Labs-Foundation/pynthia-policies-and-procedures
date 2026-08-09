# Product research — vendor benchmark and harvested feature ideas

> Moved out of `README.md` in August 2026: this is product context from 2025
> vendor evaluations, not a description of the codebase. Nothing here is a
> commitment; treat it as a backlog quarry.

## Core-provider benchmark

The UI must eventually sit on top of a production core. Below is a condensed
comparison of the three vendors evaluated. This context helps outside
contributors understand future integration constraints and naming conventions.

| Dimension | CU*Answers | Sharetec | Fiserv (Portico) |
|-----------|------------|----------|------------------|
| **Ownership / model** | CUSO owned by member CUs; free licence for start-up CUs (first 2 yrs). | Private-equity backed (Evergreen Services). Commercial licence. | Public mega-vendor; enterprise pricing, long-term contracts; heavy upsells to add-on modules. |
| **Tech stack** | Legacy engine + **OpenAPI**; modular "tools" UI. | Angular front-end, .NET REST API; MS SQL + Progress OpenEdge. | Proprietary stack; Portico thick-client UI in browser shell; core accessible only from whitelisted IPs. |
| **UI / UX** | Search-centric home, widgets visible only when relevant, multi-tab modal drill-downs. | Global fuzzy search, drag-drop KPI dashboards, granular change logs. | Search lacks autocomplete; teller balancing & cash-drawer flows central; reversal UI day-limited; in-app message feed. |
| **Customisation** | Unified object model for loans & deposits; highly configurable DB. | "Metrics" builder for products; relationship-based pricing; CRUD-level permissions. | Relies on add-ons (Loanscierge, GenX Accounting) for deeper functions; creating/managing tellers & ACH originations viewed as cumbersome. |
| **Cards & payments** | No native card module; integrate with any processor; digital-card push to wallets. | Leverage Payment Solutions + NeuralPayments; RTP/FedNow support. | ACH interface flags rejects; shared-branch network supported; card issuing via third-party processors. |
| **Lending flow** | Pre-set loan flows, recent-activity checks, built-in e-sign & imaging. | Visual decision engine, dynamic pricing via bureau polling, MeridianLink/SyncOne. | Loanscierge queue-based origination; loan reversals common; collection often outsourced via Portico sub-access. |
| **Reporting & analytics** | Table-based "Where Members Borrow/Shop" reports. | Split operational vs analytics; async dashboards (LogiAnalytics). | Auto-generated PDF reports (used for 5300); manual data-cache refresh; GenX Accounting for call-report. |
| **Reg-tech / audit** | Strong e-docs, CU-Folks form pre-fill, co-op managed knowledge base. | Adverse-action forms, full audit trail per item, automated call-report. | Docusign integration for user updates; charge-off loans reported to bureaus; audit searches require teller-by-teller lookup. |
| **Community & cadence** | 53-yr co-op, roadmap steered by owners. | Quarterly releases, vendor due-diligence handled in-house. | Slow release cadence; feature requests routed through account manager; heavy reliance on third-party ecosystem. |
| **BaaS fit (subjective)** | ✅ Co-op licensing & OpenAPI ease integration; must bolt on cards. | ✅ Modern REST + richer analytics; licensing cost & PE control are trade-offs. | ⚠️ Mature but closed stack; add-ons & manual workflows increase integration friction and cost. |

> **Take-away for contributors:** keep adapter layers thin and generic
> (`CoreAdapter`, `Account`, `Loan`, `GLTransaction`) so we can pivot between
> cores—or operate multi-core—without rewriting UI logic.

## Feature ideas harvested from vendor demos

A grab-bag of UI and workflow concepts spotted across CU*Answers, Sharetec,
and Fiserv sessions. Borrow freely when opening issues or PRs.

### Navigation & UX
- Search-first home with quick-launch "tool" cards and fuzzy autocomplete.
- Global shortcut bar (account lookup, phone operator, timeout/pause).
- Multi-tab workspace plus modal drill-downs that preserve form state.
- Context-aware widgets—only render components relevant to the current role.
- Embedded education/FAQ portal for just-in-time help.

### Teller Operations
- Cash-drawer buy/sell flows tied to vault inventory.
- Persistent transaction journal with same-day reversal action.
- Teller balancing dashboard & override workflow.
- Shared-branch network toggle to handle guest members.

### Lending & Underwriting
- Unified "account" model for deposits and loans.
- Configurable loan flows chosen by type; pre-loan activity checklist.
- Visual decision engine with red-yellow-green risk scoring.
- Queue-based origination ("pick up" the next application in line).
- Relationship-based pricing (balance targets, e-statement mandate, debit swipes).
- Adverse-Action form generator with regulator-ready language.

### Documents & Signatures
- Imaging module for drag-and-drop uploads tagged to accounts/loans.
- Remote e-sign via email, SMS, or online-banking signing room.
- Auto-tagging of documentation into call-report packets.

### Cards & Payments
- Preset BIN management table; plug-and-play processor integrations.
- Digital card provisioning to Apple/Google wallets.
- P2P routing via NeuralPayments with FedNow / RTP options.
- ACH exception queue flagging rejects with codes.

### Reporting & Analytics
- "Where Members Borrow/Shop" credit- & spend-insight reports.
- Click-through GL drill-downs; running vs available balances.
- Drag-and-drop KPI dashboards powered by data warehouse.
- One-click PDF exports for 5300, SAR, etc.; scheduled cache refresh.

### Compliance & Audit
- CRUD-level permission matrix with per-item change log.
- Charge-off pipeline that automatically reports to bureaus.
- Docusign-gated profile updates with audit trail.
- Task-management & notification hub for exception handling.

> **Backlog stance:** these are **nice-to-haves**, not requirements. Note
> that lending is deliberately unrouted in the core (see `api/index.ts`), so
> the lending/underwriting ideas are gated on a product decision first.
