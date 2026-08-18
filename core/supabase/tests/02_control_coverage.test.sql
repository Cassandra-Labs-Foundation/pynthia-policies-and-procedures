-- Control coverage — 171 in-scope controls
-- generated from controls.json + model.json — DO NOT EDIT BY HAND
begin;
select plan(869);


-- AU-02 Audit Committee Governance and Independence  (in-scope fields: 1, gaps: 0, out-of-scope: 9)
select has_column('core', 'finding', 'open_report', 'AU-02: finding.open_report -> finding.open_report');

-- AU-03 Internal Auditor Independence and Reporting  (in-scope fields: 3, gaps: 0, out-of-scope: 7)
select has_column('core', 'finding', 'description', 'AU-03: finding.description -> finding.description');
select has_column('core', 'finding', 'risk_rating', 'AU-03: finding.risk_rating -> finding.risk_rating');
select has_column('core', 'finding', 'root_cause', 'AU-03: finding.root_cause -> finding.root_cause');

-- AU-04 Risk-Based Audit Scope and Frequency  (in-scope fields: 2, gaps: 0, out-of-scope: 9)
select has_column('core', 'finding', 'description', 'AU-04: finding.description -> finding.description');
select has_column('core', 'risk', 'assessment_results', 'AU-04: risk.assessment_results -> risk.assessment_results');

-- AU-05 Audit Types and Network Assessments  (in-scope fields: 2, gaps: 0, out-of-scope: 7)
select has_column('core', 'finding', 'description', 'AU-05: finding.description -> finding.description');
select has_column('core', 'finding', 'risk_rating', 'AU-05: finding.risk_rating -> finding.risk_rating');

-- AU-06 Audit Reporting and Work Papers  (in-scope fields: 5, gaps: 0, out-of-scope: 4)
select has_column('core', 'finding', 'description', 'AU-06: finding.description -> finding.description');
select has_column('core', 'finding', 'management_response', 'AU-06: finding.management_response -> finding.management_response');
select has_column('core', 'finding', 'responsible_party', 'AU-06: finding.responsible_party -> finding.responsible_party');
select has_column('core', 'finding', 'risk_rating', 'AU-06: finding.risk_rating -> finding.risk_rating');
select has_column('core', 'finding', 'root_cause', 'AU-06: finding.root_cause -> finding.root_cause');

-- AU-07 Finding Tracking and Escalation  (in-scope fields: 10, gaps: 0, out-of-scope: 2)
select has_column('core', 'finding', 'description', 'AU-07: finding.description -> finding.description');
select has_column('core', 'finding', 'escalation_due_at', 'AU-07: finding.escalation.due_at -> finding.escalation_due_at');
select has_column('core', 'finding', 'monthly_review_due', 'AU-07: finding.monthly.review.due -> finding.monthly_review_due');
select has_column('core', 'finding', 'open_report', 'AU-07: finding.open_report -> finding.open_report');
select has_column('core', 'finding', 'quarterly_report_due', 'AU-07: finding.quarterly.report.due -> finding.quarterly_report_due');
select has_column('core', 'finding', 'remediation_status', 'AU-07: finding.remediation_status -> finding.remediation_status');
select has_column('core', 'finding', 'responsible_party', 'AU-07: finding.responsible_party -> finding.responsible_party');
select has_column('core', 'finding', 'risk_rating', 'AU-07: finding.risk_rating -> finding.risk_rating');
select has_column('core', 'finding', 'root_cause', 'AU-07: finding.root_cause -> finding.root_cause');
select has_column('core', 'finding', 'severity', 'AU-07: finding.severity -> finding.severity');

-- AU-08 Management Response and Risk Acceptance  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'case', 'audit', 'AU-08: audit_detail.corrective_action -> embedded in case.audit');
select has_column('core', 'finding', 'description', 'AU-08: finding.description -> finding.description');
select has_column('core', 'finding', 'response_due_at', 'AU-08: finding.response.due_at -> finding.response_due_at');
select has_column('core', 'finding', 'responsible_party', 'AU-08: finding.responsible_party -> finding.responsible_party');
select has_column('core', 'finding', 'risk_acceptance_rationale', 'AU-08: finding.risk_acceptance_rationale -> finding.risk_acceptance_rationale');
select has_column('core', 'finding', 'risk_rating', 'AU-08: finding.risk_rating -> finding.risk_rating');

-- AU-09 Follow-Up Audits  (in-scope fields: 4, gaps: 0, out-of-scope: 1)
select has_column('core', 'finding', 'closure_evidence', 'AU-09: finding.closure_evidence -> finding.closure_evidence');
select has_column('core', 'finding', 'description', 'AU-09: finding.description -> finding.description');
select has_column('core', 'finding', 'remediation_evidence', 'AU-09: finding.remediation_evidence -> finding.remediation_evidence');
select has_column('core', 'finding', 'responsible_party', 'AU-09: finding.responsible_party -> finding.responsible_party');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- BA-04 Risk-Weight Schedule  (in-scope fields: 3, gaps: 0, out-of-scope: 6)
select has_column('core', 'loan', 'days_past_due', 'BA-04: loan.days_past_due -> loan.days_past_due');
select has_column('core', 'loan', 'delinquency_day_90', 'BA-04: loan.delinquency_day_90 -> loan.delinquency_day_90');
select has_column('core', 'loan', 'dpd', 'BA-04: loan.dpd -> loan.dpd');

-- BA-08 Monitoring, Reporting, and Pillar 3 Disclosures  (in-scope fields: 2, gaps: 0, out-of-scope: 11)
select has_column('core', 'training', 'annual_due_at', 'BA-08: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'required_curriculum', 'BA-08: training.required_curriculum -> training.required_curriculum');

-- BSA-02 Enterprise BSA/AML Risk Assessment  (in-scope fields: 4, gaps: 0, out-of-scope: 5)
select has_column('core', 'risk', 'assessment_due_at', 'BSA-02: risk.assessment.due_at -> risk.assessment_due_at');
select has_column('core', 'risk', 'geography_factors', 'BSA-02: risk.geography_factors -> risk.geography_factors');
select has_column('core', 'risk', 'inherent_score', 'BSA-02: risk.inherent_score -> risk.inherent_score');
select has_column('core', 'risk', 'residual_rating', 'BSA-02: risk.residual_rating -> risk.residual_rating');

-- BSA-03 Customer Identification Program (CIP)  (in-scope fields: 9, gaps: 0, out-of-scope: 2)
select has_column('core', 'entity', 'address', 'BSA-03: entity.address -> entity.address');
select has_column('core', 'entity', 'date_of_birth', 'BSA-03: entity.date_of_birth -> entity.date_of_birth');
select has_column('core', 'entity', 'name', 'BSA-03: entity.name -> entity.name');
select has_column('core', 'entity', 'tin', 'BSA-03: entity.tin -> entity.tin');
select has_column('core', 'verification', 'match_status', 'BSA-03: verification.match_status -> verification.match_status');
select has_column('core', 'verification', 'provider_result', 'BSA-03: verification.provider_result -> verification.provider_result');
select has_column('core', 'verification', 'status', 'BSA-03: verification.status -> verification.status');
select has_column('core', 'verification', 'trust_level', 'BSA-03: verification.trust_level -> verification.trust_level');
select has_column('core', 'verification', 'type', 'BSA-03: verification.type -> verification.type');

-- BSA-05 OFAC Screening & Holds  (in-scope fields: 9, gaps: 0, out-of-scope: 5)
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-05: beneficiary.name -> embedded in wire_transfer.beneficiary');
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-05: beneficiary.routing_number -> embedded in wire_transfer.beneficiary');
select has_column('core', 'entity', 'address', 'BSA-05: entity.address -> entity.address');
select has_column('core', 'entity', 'date_of_birth', 'BSA-05: entity.date_of_birth -> entity.date_of_birth');
select has_column('core', 'entity', 'name', 'BSA-05: entity.name -> entity.name');
select has_column('core', 'entity', 'tin', 'BSA-05: entity.tin -> entity.tin');
select has_column('core', 'originator', 'name', 'BSA-05: originator.name -> originator.name');
select has_column('core', 'originator', 'routing_number', 'BSA-05: originator.routing_number -> originator.routing_number');
select has_column('core', 'wire_transfer', 'amount', 'BSA-05: wire_transfer.amount -> wire_transfer.amount');

-- BSA-06 Transaction Monitoring & Case Management  (in-scope fields: 12, gaps: 0, out-of-scope: 1)
select has_column('core', 'bsa_alert', 'alert_type', 'BSA-06: bsa_alert.alert_type -> bsa_alert.alert_type');
select has_column('core', 'bsa_alert', 'details', 'BSA-06: bsa_alert.details -> bsa_alert.details');
select has_column('core', 'bsa_alert', 'entity_hash', 'BSA-06: bsa_alert.entity_hash -> bsa_alert.entity_hash');
select has_column('core', 'bsa_alert', 'event_id', 'BSA-06: bsa_alert.event_id -> bsa_alert.event_id');
select has_column('core', 'bsa_alert', 'requires_lookback', 'BSA-06: bsa_alert.requires_lookback -> bsa_alert.requires_lookback');
select has_column('core', 'bsa_alert', 'status', 'BSA-06: bsa_alert.status -> bsa_alert.status');
select has_column('core', 'bsa_alert', 'triage_timer', 'BSA-06: bsa_alert.triage.timer -> bsa_alert.triage_timer');
select has_column('core', 'case', 'evidence', 'BSA-06: case.evidence -> case.evidence');
select has_column('core', 'case', 'sar_decision_timer', 'BSA-06: case.sar.decision.timer -> case.sar_decision_timer');
select has_column('core', 'case', 'status', 'BSA-06: case.status -> case.status');
select has_column('core', 'case', 'summary', 'BSA-06: case.summary -> case.summary');
select has_column('core', 'case', 'type', 'BSA-06: case.type -> case.type');

-- BSA-07 SAR Filing & Confidentiality  (in-scope fields: 1, gaps: 0, out-of-scope: 4)
select has_column('core', 'case', 'evidence', 'BSA-07: case.evidence -> case.evidence');

-- BSA-08 Currency Transaction Reporting (CTR)  (in-scope fields: 2, gaps: 0, out-of-scope: 6)
select has_column('core', 'entity', 'name', 'BSA-08: entity.name -> entity.name');
select has_column('core', 'entity', 'tin', 'BSA-08: entity.tin -> entity.tin');

-- BSA-09 Monetary Instruments Log  (in-scope fields: 1, gaps: 0, out-of-scope: 4)
select has_column('core', 'entity', 'name', 'BSA-09: entity.name -> entity.name');

-- BSA-10 Travel Rule (Wires ≥$3,000)  (in-scope fields: 11, gaps: 0, out-of-scope: 0)
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-10: beneficiary.account_number -> embedded in wire_transfer.beneficiary');
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-10: beneficiary.bank_name -> embedded in wire_transfer.beneficiary');
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-10: beneficiary.name -> embedded in wire_transfer.beneficiary');
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-10: beneficiary.routing_number -> embedded in wire_transfer.beneficiary');
select has_column('core', 'originator', 'name', 'BSA-10: originator.name -> originator.name');
select has_column('core', 'originator', 'reference', 'BSA-10: originator.reference -> originator.reference');
select has_column('core', 'originator', 'routing_number', 'BSA-10: originator.routing_number -> originator.routing_number');
select has_column('core', 'wire_transfer', 'amount', 'BSA-10: wire_transfer.amount -> wire_transfer.amount');
select has_column('core', 'wire_transfer', 'beneficiary', 'BSA-10: wire_transfer.beneficiary -> wire_transfer.beneficiary');
select has_column('core', 'wire_transfer', 'originator', 'BSA-10: wire_transfer.originator -> wire_transfer.originator');
select has_column('core', 'wire_transfer', 'status', 'BSA-10: wire_transfer.status -> wire_transfer.status');

-- BSA-11 Information Sharing (314(a)/314(b))  (in-scope fields: 4, gaps: 0, out-of-scope: 1)
select has_column('core', 'filing', 'fincen_314a', 'BSA-11: filing.fincen_314a -> filing.fincen_314a');
select has_column('core', 'filing', 'status', 'BSA-11: filing.status -> filing.status');
select has_column('core', 'filing', 'fincen_314a', 'BSA-11: fincen314a_data.counterpart_registration -> embedded in filing.fincen_314a');
select has_column('core', 'filing', 'fincen_314a', 'BSA-11: fincen314a_data.request_scope -> embedded in filing.fincen_314a');

-- BSA-12 CMIR (Cross-Border Currency)  (in-scope fields: 4, gaps: 0, out-of-scope: 1)
select has_column('core', 'filing', 'cmir', 'BSA-12: cmir_data.amount -> embedded in filing.cmir');
select has_column('core', 'filing', 'cmir', 'BSA-12: cmir_data.counterparty -> embedded in filing.cmir');
select has_column('core', 'filing', 'cmir', 'BSA-12: cmir_data.direction -> embedded in filing.cmir');
select has_column('core', 'filing', 'cmir', 'BSA-12: cmir_data.shipment_manifest -> embedded in filing.cmir');

-- BSA-13 FBAR  (in-scope fields: 2, gaps: 0, out-of-scope: 1)
select has_column('core', 'filing', 'fbar', 'BSA-13: fbar_data.account_record -> embedded in filing.fbar');
select has_column('core', 'filing', 'fbar', 'BSA-13: fbar_data.authority_type -> embedded in filing.fbar');

-- BSA-15 Training  (in-scope fields: 12, gaps: 0, out-of-scope: 0)
select has_column('core', 'training', 'annual_due_at', 'BSA-15: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'annual_timer', 'BSA-15: training.annual_timer -> training.annual_timer');
select has_column('core', 'training', 'assessment_score', 'BSA-15: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'assignee_id', 'BSA-15: training.assignee_id -> training.assignee_id');
select has_column('core', 'training', 'board_curriculum', 'BSA-15: training.board_curriculum -> training.board_curriculum');
select has_column('core', 'training', 'completion_due_at', 'BSA-15: training.completion.due_at -> training.completion_due_at');
select has_column('core', 'training', 'completion_status', 'BSA-15: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'curriculum_id', 'BSA-15: training.curriculum_id -> training.curriculum_id');
select has_column('core', 'training', 'hire_date', 'BSA-15: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'new_hire_timer', 'BSA-15: training.new_hire_timer -> training.new_hire_timer');
select has_column('core', 'training', 'newhire_due_at', 'BSA-15: training.newhire_due_at -> training.newhire_due_at');
select has_column('core', 'training', 'role_curriculum', 'BSA-15: training.role_curriculum -> training.role_curriculum');

-- BSA-18 PEP Screening & EDD  (in-scope fields: 4, gaps: 0, out-of-scope: 2)
select has_column('core', 'entity', 'address', 'BSA-18: entity.address -> entity.address');
select has_column('core', 'entity', 'date_of_birth', 'BSA-18: entity.date_of_birth -> entity.date_of_birth');
select has_column('core', 'entity', 'name', 'BSA-18: entity.name -> entity.name');
select has_column('core', 'verification', 'pep', 'BSA-18: verification.pep -> verification.pep');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- BC-05 Monitoring, Detection, and Severity  (in-scope fields: 3, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'comms_plan', 'BC-05: incident.comms_plan -> incident.comms_plan');
select has_column('core', 'incident', 'scope_initial', 'BC-05: incident.scope_initial -> incident.scope_initial');
select has_column('core', 'incident', 'severity', 'BC-05: incident.severity -> incident.severity');

-- BC-06 Incident Declaration and Initial Actions  (in-scope fields: 2, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'scope', 'BC-06: incident.scope -> incident.scope');
select has_column('core', 'incident', 'severity', 'BC-06: incident.severity -> incident.severity');

-- BC-09 Major IT Failure Response  (in-scope fields: 1, gaps: 0, out-of-scope: 3)
select has_column('core', 'incident', 'member_impact', 'BC-09: incident.member_impact -> incident.member_impact');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- BC-15 Security/Privacy Incident Containment, Legal Consult & Vendor Coordination  (in-scope fields: 5, gaps: 0, out-of-scope: 3)
select has_column('core', 'incident', 'data_scope', 'BC-15: incident.data_scope -> incident.data_scope');
select has_column('core', 'incident', 'description', 'BC-15: incident.description -> incident.description');
select has_column('core', 'incident', 'detection_source', 'BC-15: incident.detection_source -> incident.detection_source');
select has_column('core', 'incident', 'member_impact', 'BC-15: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'severity', 'BC-15: incident.severity -> incident.severity');

-- BC-13 Post-Incident Review (PIR)  (in-scope fields: 3, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'impact_summary', 'BC-13: incident.impact_summary -> incident.impact_summary');
select has_column('core', 'incident', 'root_cause', 'BC-13: incident.root_cause -> incident.root_cause');
select has_column('core', 'incident', 'timeline', 'BC-13: incident.timeline -> incident.timeline');

-- CA-11 Training and Competency  (in-scope fields: 11, gaps: 0, out-of-scope: 1)
select has_column('core', 'training', 'annual_due_at', 'CA-11: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assessment_score', 'CA-11: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'completion_status', 'CA-11: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'content_version', 'CA-11: training.content_version -> training.content_version');
select has_column('core', 'training', 'hire_date', 'CA-11: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'module_id', 'CA-11: training.module_id -> training.module_id');
select has_column('core', 'training', 'newhire_due_at', 'CA-11: training.newhire_due_at -> training.newhire_due_at');
select has_column('core', 'training', 'proficiency_failed', 'CA-11: training.proficiency.failed -> training.proficiency_failed');
select has_column('core', 'training', 'required_curriculum', 'CA-11: training.required_curriculum -> training.required_curriculum');
select has_column('core', 'training', 'role_curriculum', 'CA-11: training.role_curriculum -> training.role_curriculum');
select has_column('core', 'user', 'role', 'CA-11: user.role -> user.role');

-- CA-12 Monitoring, Reporting, and Recordkeeping  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'training', 'coverage_pct', 'CA-12: training.coverage_pct -> training.coverage_pct');

-- CO-01 Collections Governance & Scope  (in-scope fields: 4, gaps: 0, out-of-scope: 12)
select has_column('core', 'loan', 'dpd', 'CO-01: loan.dpd -> loan.dpd');
select has_column('core', 'loan', 'nonaccrual_placed', 'CO-01: loan.nonaccrual.placed -> loan.nonaccrual_placed');
select has_column('core', 'loan', 're_writedown', 'CO-01: loan.re_writedown -> loan.re_writedown');
select has_column('core', 'loan', 'risk_rating', 'CO-01: loan.risk_rating -> loan.risk_rating');

-- CO-02 Delinquency Monitoring & Early-Stage Collections  (in-scope fields: 20, gaps: 0, out-of-scope: 5)
select has_column('core', 'entity', 'contact', 'CO-02: entity.contact -> entity.contact');
select has_column('core', 'loan', 'balance', 'CO-02: loan.balance -> loan.balance');
select has_column('core', 'loan', 'collectibility_assessment', 'CO-02: loan.collectibility_assessment -> loan.collectibility_assessment');
select has_column('core', 'loan', 'courtesy_notice_due_at', 'CO-02: loan.courtesy.notice.due_at -> loan.courtesy_notice_due_at');
select has_column('core', 'loan', 'days_past_due', 'CO-02: loan.days_past_due -> loan.days_past_due');
select has_column('core', 'loan', 'delinquency_day_10', 'CO-02: loan.delinquency_day_10 -> loan.delinquency_day_10');
select has_column('core', 'loan', 'delinquency_day_20', 'CO-02: loan.delinquency_day_20 -> loan.delinquency_day_20');
select has_column('core', 'loan', 'delinquency_day_30', 'CO-02: loan.delinquency_day_30 -> loan.delinquency_day_30');
select has_column('core', 'loan', 'delinquency_day_60', 'CO-02: loan.delinquency_day_60 -> loan.delinquency_day_60');
select has_column('core', 'loan', 'delinquency_engine_run', 'CO-02: loan.delinquency_engine_run -> loan.delinquency_engine_run');
select has_column('core', 'loan', 'grace_period_days', 'CO-02: loan.grace_period_days -> loan.grace_period_days');
select has_column('core', 'loan', 'id', 'CO-02: loan.id -> loan.id');
select has_column('core', 'loan', 'last_payment_date', 'CO-02: loan.last_payment_date -> loan.last_payment_date');
select has_column('core', 'loan', 'past_due_amount', 'CO-02: loan.past_due_amount -> loan.past_due_amount');
select has_column('core', 'loan', 'product_type', 'CO-02: loan.product_type -> loan.product_type');
select has_column('core', 'loan', 'right_to_cure_due_at', 'CO-02: loan.right_to_cure_due_at -> loan.right_to_cure_due_at');
select has_column('core', 'loan', 'second_reminder_due_at', 'CO-02: loan.second_reminder_due_at -> loan.second_reminder_due_at');
select has_column('core', 'loan', 'status_memo_due_at', 'CO-02: loan.status_memo_due_at -> loan.status_memo_due_at');
select has_column('core', 'loan', 'well_secured_documented', 'CO-02: loan.well_secured.documented -> loan.well_secured_documented');
select has_column('core', 'loan', 'workout_alternatives', 'CO-02: loan.workout_alternatives -> loan.workout_alternatives');

-- CO-03 Retail Credit Classification & Charge-Offs  (in-scope fields: 24, gaps: 0, out-of-scope: 2)
select has_column('core', 'account', 'death_flag', 'CO-03: account.death_flag -> account.death_flag');
select has_column('core', 'loan', 'balance', 'CO-03: loan.balance -> loan.balance');
select has_column('core', 'loan', 'bankruptcy_chargeoff_due_at', 'CO-03: loan.bankruptcy.chargeoff.due_at -> loan.bankruptcy_chargeoff_due_at');
select has_column('core', 'loan', 'bankruptcy_case_id', 'CO-03: loan.bankruptcy_case_id -> loan.bankruptcy_case_id');
select has_column('core', 'loan', 'charged_off', 'CO-03: loan.charged_off -> loan.charged_off');
select has_column('core', 'loan', 'chargeoff_due_closed_end', 'CO-03: loan.chargeoff_due_closed_end -> loan.chargeoff_due_closed_end');
select has_column('core', 'loan', 'chargeoff_due_open_end', 'CO-03: loan.chargeoff_due_open_end -> loan.chargeoff_due_open_end');
select has_column('core', 'loan', 'chargeoff_month_end_at', 'CO-03: loan.chargeoff_month_end_at -> loan.chargeoff_month_end_at');
select has_column('core', 'loan', 'classification_due_at', 'CO-03: loan.classification.due_at -> loan.classification_due_at');
select has_column('core', 'loan', 'classified_substandard', 'CO-03: loan.classified_substandard -> loan.classified_substandard');
select has_column('core', 'loan', 'collateral_value', 'CO-03: loan.collateral_value -> loan.collateral_value');
select has_column('core', 'loan', 'death_loss_estimable', 'CO-03: loan.death_loss_estimable -> loan.death_loss_estimable');
select has_column('core', 'loan', 'delinquency_day_90', 'CO-03: loan.delinquency_day_90 -> loan.delinquency_day_90');
select has_column('core', 'loan', 'estate_claim_status', 'CO-03: loan.estate_claim_status -> loan.estate_claim_status');
select has_column('core', 'loan', 'estimated_recovery', 'CO-03: loan.estimated_recovery -> loan.estimated_recovery');
select has_column('core', 'loan', 'fraud_chargeoff_due_at', 'CO-03: loan.fraud.chargeoff.due_at -> loan.fraud_chargeoff_due_at');
select has_column('core', 'loan', 'id', 'CO-03: loan.id -> loan.id');
select has_column('core', 'loan', 'ltv', 'CO-03: loan.ltv -> loan.ltv');
select has_column('core', 'loan', 'product_type', 'CO-03: loan.product_type -> loan.product_type');
select has_column('core', 'loan', 're_valuation_due', 'CO-03: loan.re.valuation.due -> loan.re_valuation_due');
select has_column('core', 'loan', 're_writedown', 'CO-03: loan.re_writedown -> loan.re_writedown');
select has_column('core', 'loan', 'repayment_evidence', 'CO-03: loan.repayment_evidence -> loan.repayment_evidence');
select has_column('core', 'loan', 'risk_rating', 'CO-03: loan.risk_rating -> loan.risk_rating');
select has_column('core', 'loan', 'well_secured_documented', 'CO-03: loan.well_secured.documented -> loan.well_secured_documented');

-- CO-04 Forbearance, Extensions, Workouts & TDRs  (in-scope fields: 8, gaps: 0, out-of-scope: 4)
select has_column('core', 'loan', 'dpd', 'CO-04: loan.dpd -> loan.dpd');
select has_column('core', 'loan', 'dpd_reset', 'CO-04: loan.dpd_reset -> loan.dpd_reset');
select has_column('core', 'loan', 'dpd_reset_eligibility_check', 'CO-04: loan.dpd_reset_eligibility_check -> loan.dpd_reset_eligibility_check');
select has_column('core', 'loan', 'id', 'CO-04: loan.id -> loan.id');
select has_column('core', 'loan', 'io_capitalization', 'CO-04: loan.io_capitalization -> loan.io_capitalization');
select has_column('core', 'loan', 'io_term_months', 'CO-04: loan.io_term_months -> loan.io_term_months');
select has_column('core', 'loan', 'modified_schedule', 'CO-04: loan.modified_schedule -> loan.modified_schedule');
select has_column('core', 'loan', 'proposed_modification', 'CO-04: loan.proposed_modification -> loan.proposed_modification');

-- CO-06 Consumer Complaint Intake & Resolution  (in-scope fields: 15, gaps: 0, out-of-scope: 0)
select has_column('core', 'complaint', 'ack_due_at', 'CO-06: complaint.ack_due_at -> complaint.ack_due_at');
select has_column('core', 'complaint', 'channel', 'CO-06: complaint.channel -> complaint.channel');
select has_column('core', 'complaint', 'direct', 'CO-06: complaint.direct -> complaint.direct');
select has_column('core', 'complaint', 'final_response_due_at', 'CO-06: complaint.final.response.due_at -> complaint.final_response_due_at');
select has_column('core', 'complaint', 'initial_response_due_at', 'CO-06: complaint.initial.response.due_at -> complaint.initial_response_due_at');
select has_column('core', 'complaint', 'investigation_notes', 'CO-06: complaint.investigation_notes -> complaint.investigation_notes');
select has_column('core', 'complaint', 'member_id', 'CO-06: complaint.member_id -> complaint.member_id');
select has_column('core', 'complaint', 'narrative', 'CO-06: complaint.narrative -> complaint.narrative');
select has_column('core', 'complaint', 'portal_due_date', 'CO-06: complaint.portal_due_date -> complaint.portal_due_date');
select has_column('core', 'complaint', 'regulator', 'CO-06: complaint.regulator -> complaint.regulator');
select has_column('core', 'complaint', 'resolution_due_at', 'CO-06: complaint.resolution.due_at -> complaint.resolution_due_at');
select has_column('core', 'complaint', 'root_cause_tag', 'CO-06: complaint.root_cause_tag -> complaint.root_cause_tag');
select has_column('core', 'complaint', 'trend_review_due', 'CO-06: complaint.trend.review.due -> complaint.trend_review_due');
select has_column('core', 'complaint', 'trend_summary', 'CO-06: complaint.trend_summary -> complaint.trend_summary');
select has_column('core', 'complaint', 'udaap_flag', 'CO-06: complaint.udaap_flag -> complaint.udaap_flag');

-- CO-07 Credit Reporting & Dispute Handling  (in-scope fields: 4, gaps: 0, out-of-scope: 7)
select has_column('core', 'dispute', 'basis', 'CO-07: dispute.basis -> dispute.basis');
select has_column('core', 'dispute', 'category', 'CO-07: dispute.category -> dispute.category');
select has_column('core', 'dispute', 'findings', 'CO-07: dispute.findings -> dispute.findings');
select has_column('core', 'dispute', 'idtheft_report', 'CO-07: dispute.idtheft_report -> dispute.idtheft_report');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- CO-11 Collections-Data Incident Logging & Triage  (in-scope fields: 8, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'collections', 'CO-11: incident.collections -> incident.collections');
select has_column('core', 'incident', 'data_scope', 'CO-11: incident.data_scope -> incident.data_scope');
select has_column('core', 'incident', 'description', 'CO-11: incident.description -> incident.description');
select has_column('core', 'incident', 'detection_source', 'CO-11: incident.detection_source -> incident.detection_source');
select has_column('core', 'incident', 'member_impact', 'CO-11: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'scope_initial', 'CO-11: incident.scope_initial -> incident.scope_initial');
select has_column('core', 'incident', 'severity', 'CO-11: incident.severity -> incident.severity');
select has_column('core', 'incident', 'triage_due_at', 'CO-11: incident.triage.due_at -> incident.triage_due_at');

-- CO-09 Problem Loans, Nonaccrual & Foreclosure Governance  (in-scope fields: 11, gaps: 0, out-of-scope: 1)
select has_column('core', 'loan', 'accrued_interest', 'CO-09: loan.accrued_interest -> loan.accrued_interest');
select has_column('core', 'loan', 'collectibility_assessment', 'CO-09: loan.collectibility_assessment -> loan.collectibility_assessment');
select has_column('core', 'loan', 'dpd', 'CO-09: loan.dpd -> loan.dpd');
select has_column('core', 'loan', 'foreclosure_impact_eval', 'CO-09: loan.foreclosure_impact_eval -> loan.foreclosure_impact_eval');
select has_column('core', 'loan', 'id', 'CO-09: loan.id -> loan.id');
select has_column('core', 'loan', 'modified_schedule', 'CO-09: loan.modified_schedule -> loan.modified_schedule');
select has_column('core', 'loan', 'nonaccrual_placed', 'CO-09: loan.nonaccrual.placed -> loan.nonaccrual_placed');
select has_column('core', 'loan', 'nonaccrual_due_at', 'CO-09: loan.nonaccrual_due_at -> loan.nonaccrual_due_at');
select has_column('core', 'loan', 'rating_review_due_at', 'CO-09: loan.rating.review.due_at -> loan.rating_review_due_at');
select has_column('core', 'loan', 'repayment_evidence', 'CO-09: loan.repayment_evidence -> loan.repayment_evidence');
select has_column('core', 'loan', 'risk_rating', 'CO-09: loan.risk_rating -> loan.risk_rating');

-- CM-01 Governance and Board Reporting Line  (in-scope fields: 4, gaps: 0, out-of-scope: 6)
select has_column('core', 'finding', 'corrective_action', 'CM-01: finding.corrective_action -> finding.corrective_action');
select has_column('core', 'finding', 'remediation_status', 'CM-01: finding.remediation_status -> finding.remediation_status');
select has_column('core', 'training', 'completion_status', 'CM-01: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'coverage_pct', 'CM-01: training.coverage_pct -> training.coverage_pct');

-- CM-04 Compliance Risk Assessment  (in-scope fields: 2, gaps: 0, out-of-scope: 4)
select has_column('core', 'complaint', 'trend_summary', 'CM-04: complaint.trend_summary -> complaint.trend_summary');
select has_column('core', 'risk', 'assessment_results', 'CM-04: risk.assessment_results -> risk.assessment_results');

-- CM-05 Training Standards  (in-scope fields: 11, gaps: 0, out-of-scope: 1)
select has_column('core', 'finding', 'description', 'CM-05: finding.description -> finding.description');
select has_column('core', 'training', 'annual_due_at', 'CM-05: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assignee_id', 'CM-05: training.assignee_id -> training.assignee_id');
select has_column('core', 'training', 'completion_due_at', 'CM-05: training.completion.due_at -> training.completion_due_at');
select has_column('core', 'training', 'coverage_pct', 'CM-05: training.coverage_pct -> training.coverage_pct');
select has_column('core', 'training', 'hire_date', 'CM-05: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'module_id', 'CM-05: training.module_id -> training.module_id');
select has_column('core', 'training', 'onboarding_due_at', 'CM-05: training.onboarding.due_at -> training.onboarding_due_at');
select has_column('core', 'training', 'refresher_curriculum', 'CM-05: training.refresher_curriculum -> training.refresher_curriculum');
select has_column('core', 'training', 'role_curriculum', 'CM-05: training.role_curriculum -> training.role_curriculum');
select has_column('core', 'training', 'session', 'CM-05: training.session -> training.session');

-- CM-06 Monitoring and Assurance Reviews  (in-scope fields: 6, gaps: 0, out-of-scope: 7)
select has_column('core', 'finding', 'corrective_action', 'CM-06: finding.corrective_action -> finding.corrective_action');
select has_column('core', 'finding', 'department', 'CM-06: finding.department -> finding.department');
select has_column('core', 'finding', 'description', 'CM-06: finding.description -> finding.description');
select has_column('core', 'finding', 'root_cause', 'CM-06: finding.root_cause -> finding.root_cause');
select has_column('core', 'finding', 'severity', 'CM-06: finding.severity -> finding.severity');
select has_column('core', 'risk', 'residual_rating', 'CM-06: risk.residual_rating -> risk.residual_rating');

-- CM-07 Independent Audit  (in-scope fields: 4, gaps: 0, out-of-scope: 7)
select has_column('core', 'finding', 'corrective_action', 'CM-07: finding.corrective_action -> finding.corrective_action');
select has_column('core', 'finding', 'management_response', 'CM-07: finding.management_response -> finding.management_response');
select has_column('core', 'finding', 'remediation_evidence', 'CM-07: finding.remediation_evidence -> finding.remediation_evidence');
select has_column('core', 'risk', 'assessment_results', 'CM-07: risk.assessment_results -> risk.assessment_results');

-- CM-08 Regulatory Change and Complaint Management  (in-scope fields: 8, gaps: 0, out-of-scope: 4)
select has_column('core', 'complaint', 'category', 'CM-08: complaint.category -> complaint.category');
select has_column('core', 'complaint', 'channel', 'CM-08: complaint.channel -> complaint.channel');
select has_column('core', 'complaint', 'member_id', 'CM-08: complaint.member_id -> complaint.member_id');
select has_column('core', 'complaint', 'narrative', 'CM-08: complaint.narrative -> complaint.narrative');
select has_column('core', 'complaint', 'resolution_due_at', 'CM-08: complaint.resolution.due_at -> complaint.resolution_due_at');
select has_column('core', 'complaint', 'root_cause_tag', 'CM-08: complaint.root_cause_tag -> complaint.root_cause_tag');
select has_column('core', 'complaint', 'trend_review_due', 'CM-08: complaint.trend.review.due -> complaint.trend_review_due');
select has_column('core', 'complaint', 'udaap_flag', 'CM-08: complaint.udaap_flag -> complaint.udaap_flag');

-- CM-09 Policy and CMS Review Cadence  (in-scope fields: 2, gaps: 0, out-of-scope: 10)
select has_column('core', 'finding', 'remediation_status', 'CM-09: finding.remediation_status -> finding.remediation_status');
select has_column('core', 'risk', 'assessment_results', 'CM-09: risk.assessment_results -> risk.assessment_results');

-- DF-01 Fiduciary Duties Defined  (in-scope fields: 8, gaps: 0, out-of-scope: 4)
select has_column('core', 'training', 'annual_due_at', 'DF-01: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assessment_score', 'DF-01: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'completion_due_at', 'DF-01: training.completion.due_at -> training.completion_due_at');
select has_column('core', 'training', 'completion_status', 'DF-01: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'hire_date', 'DF-01: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'lapsed', 'DF-01: training.lapsed -> training.lapsed');
select has_column('core', 'training', 'module_id', 'DF-01: training.module_id -> training.module_id');
select has_column('core', 'training', 'newhire_due_at', 'DF-01: training.newhire_due_at -> training.newhire_due_at');

-- DF-02 Conflict Identification and General Duties  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'coi', 'conflict_identified', 'DF-02: coi.conflict.identified -> coi.conflict_identified');
select has_column('core', 'coi', 'conflicted_matter_voted', 'DF-02: coi.conflicted_matter_voted -> coi.conflicted_matter_voted');
select has_column('core', 'coi', 'interest_description', 'DF-02: coi.interest_description -> coi.interest_description');
select has_column('core', 'coi', 'matter_reference', 'DF-02: coi.matter_reference -> coi.matter_reference');
select has_column('core', 'coi', 'register_entry_id', 'DF-02: coi.register_entry_id -> coi.register_entry_id');
select has_column('core', 'coi', 'related_party', 'DF-02: coi.related_party -> coi.related_party');

-- DF-03 Annual and Continuing Disclosure  (in-scope fields: 12, gaps: 0, out-of-scope: 3)
select has_column('core', 'coi', 'attestation_date', 'DF-03: coi.attestation_date -> coi.attestation_date');
select has_column('core', 'coi', 'attestation_signature', 'DF-03: coi.attestation_signature -> coi.attestation_signature');
select has_column('core', 'coi', 'conflict_identified', 'DF-03: coi.conflict.identified -> coi.conflict_identified');
select has_column('core', 'coi', 'interest_description', 'DF-03: coi.interest_description -> coi.interest_description');
select has_column('core', 'coi', 'matter_reference', 'DF-03: coi.matter_reference -> coi.matter_reference');
select has_column('core', 'coi', 'questionnaire_due_at', 'DF-03: coi.questionnaire_due_at -> coi.questionnaire_due_at');
select has_column('core', 'coi', 'questionnaire_responses', 'DF-03: coi.questionnaire_responses -> coi.questionnaire_responses');
select has_column('core', 'coi', 'questionnaire_version', 'DF-03: coi.questionnaire_version -> coi.questionnaire_version');
select has_column('core', 'insider', 'record_circulated', 'DF-03: insider.record_circulated -> insider.record_circulated');
select has_column('core', 'insider', 'record_compiled', 'DF-03: insider.record_compiled -> insider.record_compiled');
select has_column('core', 'insider', 'record_entry', 'DF-03: insider.record_entry -> insider.record_entry');
select has_column('core', 'insider', 'record_prior', 'DF-03: insider.record_prior -> insider.record_prior');

-- DF-04 Conflict Management, Recusal, and Board Determination  (in-scope fields: 5, gaps: 0, out-of-scope: 4)
select has_column('core', 'coi', 'determination_made', 'DF-04: coi.determination_made -> coi.determination_made');
select has_column('core', 'coi', 'independent_review', 'DF-04: coi.independent_review -> coi.independent_review');
select has_column('core', 'coi', 'matter_reference', 'DF-04: coi.matter_reference -> coi.matter_reference');
select has_column('core', 'coi', 'recusal_record', 'DF-04: coi.recusal_record -> coi.recusal_record');
select has_column('core', 'coi', 'register_entry_id', 'DF-04: coi.register_entry_id -> coi.register_entry_id');

-- DF-05 Insider Transactions (Reg O / 12 CFR §701.21(d))  (in-scope fields: 13, gaps: 0, out-of-scope: 3)
select has_column('core', 'insider', 'aggregate_credit_amount', 'DF-05: insider.aggregate_credit_amount -> insider.aggregate_credit_amount');
select has_column('core', 'insider', 'board_approval', 'DF-05: insider.board_approval -> insider.board_approval');
select has_column('core', 'insider', 'comparable_terms', 'DF-05: insider.comparable_terms -> insider.comparable_terms');
select has_column('core', 'insider', 'credit_extended', 'DF-05: insider.credit.extended -> insider.credit_extended');
select has_column('core', 'insider', 'credit_threshold_exceeded', 'DF-05: insider.credit_threshold_exceeded -> insider.credit_threshold_exceeded');
select has_column('core', 'insider', 'funded_terms', 'DF-05: insider.funded_terms -> insider.funded_terms');
select has_column('core', 'insider', 'limits_recomputed', 'DF-05: insider.limits_recomputed -> insider.limits_recomputed');
select has_column('core', 'insider', 'loc_approval_expires_at', 'DF-05: insider.loc.approval.expires_at -> insider.loc_approval_expires_at');
select has_column('core', 'insider', 'proposed_terms', 'DF-05: insider.proposed_terms -> insider.proposed_terms');
select has_column('core', 'insider', 'record_entry', 'DF-05: insider.record_entry -> insider.record_entry');
select has_column('core', 'insider', 'terms_parity', 'DF-05: insider.terms_parity -> insider.terms_parity');
select has_column('core', 'loan_application', 'applicant', 'DF-05: loan_application.applicant -> loan_application.applicant');
select has_column('core', 'loan_application', 'insider', 'DF-05: loan_application.insider -> loan_application.insider');

-- DF-09 Recordkeeping and Reporting  (in-scope fields: 4, gaps: 0, out-of-scope: 2)
select has_column('core', 'coi', 'register_entry_id', 'DF-09: coi.register_entry_id -> coi.register_entry_id');
select has_column('core', 'insider', 'correspondent_credit_data', 'DF-09: insider.correspondent_credit_data -> insider.correspondent_credit_data');
select has_column('core', 'insider', 'public_request', 'DF-09: insider.public_request -> insider.public_request');
select has_column('core', 'insider', 'public_request_retention_expires_at', 'DF-09: insider.public_request.retention.expires_at -> insider.public_request_retention_expires_at');

-- DF-10 Training, Acknowledgment, and Enforcement  (in-scope fields: 3, gaps: 0, out-of-scope: 6)
select has_column('core', 'training', 'annual_due_at', 'DF-10: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assessment_score', 'DF-10: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'module_id', 'DF-10: training.module_id -> training.module_id');

-- EC-01 Safeguarding Member Information  (in-scope fields: 1, gaps: 0, out-of-scope: 4)
select has_column('core', 'finding', 'description', 'EC-01: finding.description -> finding.description');

-- EC-02 Network and Data Access Controls  (in-scope fields: 2, gaps: 0, out-of-scope: 11)
select has_column('core', 'user', 'id', 'EC-02: user.id -> user.id');
select has_column('core', 'user', 'role', 'EC-02: user.role -> user.role');

-- EC-03 User Authentication and Enrollment  (in-scope fields: 1, gaps: 0, out-of-scope: 9)
select has_column('core', 'entity', 'email', 'EC-03: entity.email -> entity.email');

-- EC-05 Firewalls  (in-scope fields: 5, gaps: 0, out-of-scope: 4)
select has_column('core', 'change', 'approver_id', 'EC-05: change.approver_id -> change.approver_id');
select has_column('core', 'change', 'cab_review_due_at', 'EC-05: change.cab.review.due_at -> change.cab_review_due_at');
select has_column('core', 'change', 'rfc', 'EC-05: change.rfc -> change.rfc');
select has_column('core', 'change', 'risk_rating', 'EC-05: change.risk_rating -> change.risk_rating');
select has_column('core', 'change', 'rollback_plan', 'EC-05: change.rollback_plan -> change.rollback_plan');

-- EC-06 Encryption  (in-scope fields: 3, gaps: 0, out-of-scope: 4)
select has_column('core', 'change', 'approver_id', 'EC-06: change.approver_id -> change.approver_id');
select has_column('core', 'change', 'emergency_justification', 'EC-06: change.emergency_justification -> change.emergency_justification');
select has_column('core', 'change', 'rfc', 'EC-06: change.rfc -> change.rfc');

-- EC-09 Security Monitoring, Penetration Testing, and Intrusion Detection  (in-scope fields: 2, gaps: 0, out-of-scope: 10)
select has_column('core', 'incident', 'detection_source', 'EC-09: incident.detection_source -> incident.detection_source');
select has_column('core', 'incident', 'timeline', 'EC-09: incident.timeline -> incident.timeline');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- EC-13 Breach Detection, Liability Assessment & External Comms Gating  (in-scope fields: 8, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'comms_plan', 'EC-13: incident.comms_plan -> incident.comms_plan');
select has_column('core', 'incident', 'data_scope', 'EC-13: incident.data_scope -> incident.data_scope');
select has_column('core', 'incident', 'detection_source', 'EC-13: incident.detection_source -> incident.detection_source');
select has_column('core', 'incident', 'facts', 'EC-13: incident.facts -> incident.facts');
select has_column('core', 'incident', 'legal_review', 'EC-13: incident.legal_review -> incident.legal_review');
select has_column('core', 'incident', 'member_impact', 'EC-13: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'scope_initial', 'EC-13: incident.scope_initial -> incident.scope_initial');
select has_column('core', 'incident', 'severity', 'EC-13: incident.severity -> incident.severity');

-- SC-03 Enterprise Incident Declaration & First-Hour Response  (in-scope fields: 2, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'scope', 'SC-03: incident.scope -> incident.scope');
select has_column('core', 'incident', 'severity', 'SC-03: incident.severity -> incident.severity');

-- EC-12 Expertise and Training  (in-scope fields: 11, gaps: 0, out-of-scope: 0)
select has_column('core', 'training', 'annual_due', 'EC-12: training.annual_due -> training.annual_due');
select has_column('core', 'training', 'annual_due_at', 'EC-12: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assessment_score', 'EC-12: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'assignee_id', 'EC-12: training.assignee_id -> training.assignee_id');
select has_column('core', 'training', 'completion_due_at', 'EC-12: training.completion.due_at -> training.completion_due_at');
select has_column('core', 'training', 'completion_status', 'EC-12: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'module_id', 'EC-12: training.module_id -> training.module_id');
select has_column('core', 'training', 'newhire_due_at', 'EC-12: training.newhire_due_at -> training.newhire_due_at');
select has_column('core', 'training', 'required_curriculum', 'EC-12: training.required_curriculum -> training.required_curriculum');
select has_column('core', 'task', 'training', 'EC-12: training_detail.hire_date -> embedded in task.training');
select has_column('core', 'user', 'role', 'EC-12: user.role -> user.role');

-- EPS-01 Planning and Feasibility Analysis  (in-scope fields: 1, gaps: 0, out-of-scope: 5)
select has_column('core', 'risk', 'inherent_score', 'EPS-01: risk.inherent_score -> risk.inherent_score');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- EPS-11 Payment-Incident Detection & BCP Testing  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'incident', 'description', 'EPS-11: incident.description -> incident.description');

-- EPS-05 Authentication Controls  (in-scope fields: 2, gaps: 0, out-of-scope: 7)
select has_column('core', 'card', 'id', 'EPS-05: card.id -> card.id');
select has_column('core', 'card', 'spend_controls', 'EPS-05: card.spend_controls -> card.spend_controls');

-- EPS-06 Dual Control for High-Risk Processes  (in-scope fields: 3, gaps: 0, out-of-scope: 11)
select has_column('core', 'ach_transfer', 'amount', 'EPS-06: ach_transfer.amount -> ach_transfer.amount');
select has_column('core', 'wire_transfer', 'amount', 'EPS-06: wire_transfer.amount -> wire_transfer.amount');
select has_column('core', 'wire_transfer', 'beneficiary', 'EPS-06: wire_transfer.beneficiary -> wire_transfer.beneficiary');

-- EPS-07 Electronic Fraud Protection Systems  (in-scope fields: 2, gaps: 0, out-of-scope: 7)
select has_column('core', 'card', 'id', 'EPS-07: card.id -> card.id');
select has_column('core', 'card', 'spend_controls', 'EPS-07: card.spend_controls -> card.spend_controls');

-- EPS-09 Expertise and Training  (in-scope fields: 5, gaps: 0, out-of-scope: 10)
select has_column('core', 'training', 'annual_due_at', 'EPS-09: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assessment_score', 'EPS-09: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'newhire_due_at', 'EPS-09: training.newhire_due_at -> training.newhire_due_at');
select has_column('core', 'task', 'training', 'EPS-09: training_detail.hire_date -> embedded in task.training');
select has_column('core', 'user', 'role', 'EPS-09: user.role -> user.role');

-- ERM-01 Enterprise Risk Appetite Statement  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'user', 'id', 'ERM-01: user.id -> user.id');

-- ERM-03 Risk Scoring Matrix & Rating Scale  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'user', 'id', 'ERM-03: user.id -> user.id');

-- ERM-04 Risk Assessment & Register Maintenance  (in-scope fields: 13, gaps: 0, out-of-scope: 1)
select has_column('core', 'risk', 'assessment_results', 'ERM-04: risk.assessment_results -> risk.assessment_results');
select has_column('core', 'risk', 'description', 'ERM-04: risk.description -> risk.description');
select has_column('core', 'risk', 'id', 'ERM-04: risk.id -> risk.id');
select has_column('core', 'risk', 'impact_score', 'ERM-04: risk.impact_score -> risk.impact_score');
select has_column('core', 'risk', 'inherent_score', 'ERM-04: risk.inherent_score -> risk.inherent_score');
select has_column('core', 'risk', 'last_assessed_at', 'ERM-04: risk.last_assessed_at -> risk.last_assessed_at');
select has_column('core', 'risk', 'likelihood_score', 'ERM-04: risk.likelihood_score -> risk.likelihood_score');
select has_column('core', 'risk', 'owner_id', 'ERM-04: risk.owner_id -> risk.owner_id');
select has_column('core', 'risk', 'reassessed', 'ERM-04: risk.reassessed -> risk.reassessed');
select has_column('core', 'risk', 'reassessment_due_at', 'ERM-04: risk.reassessment_due_at -> risk.reassessment_due_at');
select has_column('core', 'risk', 'remediation_evidence', 'ERM-04: risk.remediation_evidence -> risk.remediation_evidence');
select has_column('core', 'risk', 'residual_rating', 'ERM-04: risk.residual_rating -> risk.residual_rating');
select has_column('core', 'risk', 'review_overdue', 'ERM-04: risk.review.overdue -> risk.review_overdue');

-- ERM-05 Key Risk Indicators & Thresholds  (in-scope fields: 2, gaps: 0, out-of-scope: 10)
select has_column('core', 'risk', 'id', 'ERM-05: risk.id -> risk.id');
select has_column('core', 'risk', 'owner_id', 'ERM-05: risk.owner_id -> risk.owner_id');

-- ERM-06 Risk Appetite Breach Escalation & Incident Management  (in-scope fields: 3, gaps: 0, out-of-scope: 13)
select has_column('core', 'risk', 'owner_id', 'ERM-06: risk.owner_id -> risk.owner_id');
select has_column('core', 'risk', 'residual_rating', 'ERM-06: risk.residual_rating -> risk.residual_rating');
select has_column('core', 'user', 'id', 'ERM-06: user.id -> user.id');

-- ERM-07 Risk Acceptance & Exceptions  (in-scope fields: 3, gaps: 0, out-of-scope: 5)
select has_column('core', 'risk', 'id', 'ERM-07: risk.id -> risk.id');
select has_column('core', 'risk', 'remediation_evidence', 'ERM-07: risk.remediation_evidence -> risk.remediation_evidence');
select has_column('core', 'user', 'id', 'ERM-07: user.id -> user.id');

-- ERM-08 Risk Reporting & Governance Oversight  (in-scope fields: 1, gaps: 0, out-of-scope: 6)
select has_column('core', 'risk', 'register_snapshot', 'ERM-08: risk.register_snapshot -> risk.register_snapshot');

-- FL-02 Permissible Inquiries  (in-scope fields: 3, gaps: 0, out-of-scope: 1)
select has_column('core', 'loan_application', 'applicant', 'FL-02: applicant.state -> embedded in loan_application.applicant');
select has_column('core', 'loan_application', 'channel', 'FL-02: loan_application.channel -> loan_application.channel');
select has_column('core', 'loan_application', 'product_type', 'FL-02: loan_application.product_type -> loan_application.product_type');

-- FL-03 Evaluation & Pricing Rules  (in-scope fields: 4, gaps: 0, out-of-scope: 7)
select has_column('core', 'loan_application', 'decision', 'FL-03: decision.model_id -> embedded in loan_application.decision');
select has_column('core', 'loan_application', 'decision', 'FL-03: decision.score_block -> embedded in loan_application.decision');
select has_column('core', 'loan_application', 'action_basis', 'FL-03: loan_application.action_basis -> loan_application.action_basis');
select has_column('core', 'loan_application', 'income_assets', 'FL-03: loan_application.income_assets -> loan_application.income_assets');

-- FL-04 Appraisal Independence & ROV  (in-scope fields: 2, gaps: 0, out-of-scope: 5)
select has_column('core', 'loan_application', 'product_type', 'FL-04: loan_application.product_type -> loan_application.product_type');
select has_column('core', 'loan_application', 'parties', 'FL-04: loan_party.identity -> embedded in loan_application.parties');

-- FL-05 Action-Taken Notices  (in-scope fields: 11, gaps: 0, out-of-scope: 2)
select has_column('core', 'account', 'adverse_action', 'FL-05: account.adverse_action -> account.adverse_action');
select has_column('core', 'loan_application', 'applicant', 'FL-05: applicant.business_revenue_tier -> embedded in loan_application.applicant');
select has_column('core', 'loan_application', 'decision', 'FL-05: decision.score_block -> embedded in loan_application.decision');
select has_column('core', 'loan_application', 'aan_due_at', 'FL-05: loan_application.aan_due_at -> loan_application.aan_due_at');
select has_column('core', 'loan_application', 'action_basis', 'FL-05: loan_application.action_basis -> loan_application.action_basis');
select has_column('core', 'loan_application', 'adverse_action', 'FL-05: loan_application.adverse_action -> loan_application.adverse_action');
select has_column('core', 'loan_application', 'counteroffer_aan_due_at', 'FL-05: loan_application.counteroffer_aan_due_at -> loan_application.counteroffer_aan_due_at');
select has_column('core', 'loan_application', 'counteroffer_terms', 'FL-05: loan_application.counteroffer_terms -> loan_application.counteroffer_terms');
select has_column('core', 'loan_application', 'incompleteness_notice', 'FL-05: loan_application.incompleteness_notice -> loan_application.incompleteness_notice');
select has_column('core', 'loan_application', 'oral_statement', 'FL-05: loan_application.oral_statement -> loan_application.oral_statement');
select has_column('core', 'loan_application', 'parties', 'FL-05: loan_party.identity -> embedded in loan_application.parties');

-- FL-06 Government Monitoring (GMI/HMDA)  (in-scope fields: 3, gaps: 0, out-of-scope: 4)
select has_column('core', 'loan_application', 'applicant', 'FL-06: applicant.gmi_responses -> embedded in loan_application.applicant');
select has_column('core', 'loan_application', 'geography', 'FL-06: loan_application.geography -> loan_application.geography');
select has_column('core', 'loan_application', 'gmi', 'FL-06: loan_application.gmi -> loan_application.gmi');

-- FL-08 LO Compensation & Anti-Steering  (in-scope fields: 1, gaps: 0, out-of-scope: 6)
select has_column('core', 'loan_application', 'option_shortfall_reason', 'FL-08: loan_application.option_shortfall_reason -> loan_application.option_shortfall_reason');

-- FL-11 Training  (in-scope fields: 8, gaps: 0, out-of-scope: 0)
select has_column('core', 'training', 'annual_due_at', 'FL-11: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'completion_status', 'FL-11: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'content_version', 'FL-11: training.content_version -> training.content_version');
select has_column('core', 'training', 'coverage_pct', 'FL-11: training.coverage_pct -> training.coverage_pct');
select has_column('core', 'training', 'hire_date', 'FL-11: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'newhire_due_at', 'FL-11: training.newhire_due_at -> training.newhire_due_at');
select has_column('core', 'training', 'role_curriculum', 'FL-11: training.role_curriculum -> training.role_curriculum');
select has_column('core', 'training', 'role_matrix', 'FL-11: training.role_matrix -> training.role_matrix');

-- FL-12 Record Retention  (in-scope fields: 1, gaps: 0, out-of-scope: 2)
select has_column('core', 'loan_application', 'applicant', 'FL-12: applicant.business_revenue_tier -> embedded in loan_application.applicant');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- FL-13 Complaint Monitoring  (in-scope fields: 5, gaps: 0, out-of-scope: 1)
select has_column('core', 'complaint', 'ack_due_at', 'FL-13: complaint.ack_due_at -> complaint.ack_due_at');
select has_column('core', 'complaint', 'channel', 'FL-13: complaint.channel -> complaint.channel');
select has_column('core', 'complaint', 'initial_response_due_at', 'FL-13: complaint.initial.response.due_at -> complaint.initial_response_due_at');
select has_column('core', 'complaint', 'member_id', 'FL-13: complaint.member_id -> complaint.member_id');
select has_column('core', 'complaint', 'narrative', 'FL-13: complaint.narrative -> complaint.narrative');

-- IS-02 Enterprise Risk Assessment  (in-scope fields: 8, gaps: 0, out-of-scope: 2)
select has_column('core', 'risk', 'assessment_results', 'IS-02: risk.assessment_results -> risk.assessment_results');
select has_column('core', 'risk', 'owner_id', 'IS-02: risk.owner_id -> risk.owner_id');
select has_column('core', 'risk', 'poam_status', 'IS-02: risk.poam_status -> risk.poam_status');
select has_column('core', 'risk', 'product_assessment_due_at', 'IS-02: risk.product.assessment.due_at -> risk.product_assessment_due_at');
select has_column('core', 'risk', 'reassessment_due_at', 'IS-02: risk.reassessment_due_at -> risk.reassessment_due_at');
select has_column('core', 'risk', 'remediation_evidence', 'IS-02: risk.remediation_evidence -> risk.remediation_evidence');
select has_column('core', 'risk', 'residual_rating', 'IS-02: risk.residual_rating -> risk.residual_rating');
select has_column('core', 'risk', 'threat_catalog', 'IS-02: risk.threat_catalog -> risk.threat_catalog');

-- IS-04 Change Management and Configuration Control  (in-scope fields: 10, gaps: 0, out-of-scope: 2)
select has_column('core', 'change', 'approver_id', 'IS-04: change.approver_id -> change.approver_id');
select has_column('core', 'change', 'backout_plan', 'IS-04: change.backout_plan -> change.backout_plan');
select has_column('core', 'change', 'cab_review_due_at', 'IS-04: change.cab.review.due_at -> change.cab_review_due_at');
select has_column('core', 'change', 'deployment_record', 'IS-04: change.deployment_record -> change.deployment_record');
select has_column('core', 'change', 'emergency_justification', 'IS-04: change.emergency_justification -> change.emergency_justification');
select has_column('core', 'change', 'post_review_due_at', 'IS-04: change.post.review.due_at -> change.post_review_due_at');
select has_column('core', 'change', 'rfc', 'IS-04: change.rfc -> change.rfc');
select has_column('core', 'change', 'risk_rating', 'IS-04: change.risk_rating -> change.risk_rating');
select has_column('core', 'change', 'rollback_plan', 'IS-04: change.rollback_plan -> change.rollback_plan');
select has_column('core', 'change', 'test_evidence', 'IS-04: change.test_evidence -> change.test_evidence');

-- IS-06 Access Control and Authentication  (in-scope fields: 2, gaps: 0, out-of-scope: 12)
select has_column('core', 'user', 'employment_status', 'IS-06: user.employment_status -> user.employment_status');
select has_column('core', 'user', 'id', 'IS-06: user.id -> user.id');

-- IS-08 Backup and Disaster Recovery  (in-scope fields: 1, gaps: 0, out-of-scope: 10)
select has_column('core', 'incident', 'scope', 'IS-08: incident.scope -> incident.scope');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- IS-19 Incident Response Plan, Post-Mortem & Law Enforcement Coordination  (in-scope fields: 3, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'recovered', 'IS-19: incident.recovered -> incident.recovered');
select has_column('core', 'incident', 'root_cause', 'IS-19: incident.root_cause -> incident.root_cause');
select has_column('core', 'incident', 'timeline', 'IS-19: incident.timeline -> incident.timeline');

-- SC-03 Enterprise Incident Declaration & First-Hour Response  (in-scope fields: 2, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'scope', 'SC-03: incident.scope -> incident.scope');
select has_column('core', 'incident', 'severity', 'SC-03: incident.severity -> incident.severity');

-- IS-10 Identity Theft Red Flags Program  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'account', 'id', 'IS-10: account.id -> account.id');

-- IS-13 AI Governance and Usage Disclosure  (in-scope fields: 1, gaps: 0, out-of-scope: 8)
select has_column('core', 'incident', 'data_scope', 'IS-13: incident.data_scope -> incident.data_scope');

-- IS-15 Acceptable Use and Communications Systems  (in-scope fields: 2, gaps: 0, out-of-scope: 3)
select has_column('core', 'user', 'id', 'IS-15: user.id -> user.id');
select has_column('core', 'user', 'role', 'IS-15: user.role -> user.role');

-- IS-17 Training, Awareness, and Testing  (in-scope fields: 6, gaps: 0, out-of-scope: 3)
select has_column('core', 'training', 'annual_cycle', 'IS-17: training.annual_cycle -> training.annual_cycle');
select has_column('core', 'training', 'annual_due_at', 'IS-17: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'hire_date', 'IS-17: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'onboarding_due_at', 'IS-17: training.onboarding.due_at -> training.onboarding_due_at');
select has_column('core', 'training', 'required_curriculum', 'IS-17: training.required_curriculum -> training.required_curriculum');
select has_column('core', 'training', 'role_curriculum', 'IS-17: training.role_curriculum -> training.role_curriculum');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- IC-01 Control Environment and Governance  (in-scope fields: 2, gaps: 0, out-of-scope: 7)
select has_column('core', 'finding', 'description', 'IC-01: finding.description -> finding.description');
select has_column('core', 'finding', 'remediation_status', 'IC-01: finding.remediation_status -> finding.remediation_status');

-- IC-03 Authorization and Approval Limits  (in-scope fields: 2, gaps: 0, out-of-scope: 8)
select has_column('core', 'user', 'id', 'IC-03: user.id -> user.id');
select has_column('core', 'user', 'role', 'IC-03: user.role -> user.role');

-- IC-05 Access and Change Controls  (in-scope fields: 9, gaps: 0, out-of-scope: 8)
select has_column('core', 'change', 'backout_plan', 'IC-05: change.backout_plan -> change.backout_plan');
select has_column('core', 'change', 'cab_review_due_at', 'IC-05: change.cab.review.due_at -> change.cab_review_due_at');
select has_column('core', 'change', 'deployment_record', 'IC-05: change.deployment_record -> change.deployment_record');
select has_column('core', 'change', 'emergency_justification', 'IC-05: change.emergency_justification -> change.emergency_justification');
select has_column('core', 'change', 'post_review_due_at', 'IC-05: change.post.review.due_at -> change.post_review_due_at');
select has_column('core', 'change', 'rfc', 'IC-05: change.rfc -> change.rfc');
select has_column('core', 'change', 'risk_rating', 'IC-05: change.risk_rating -> change.risk_rating');
select has_column('core', 'change', 'test_evidence', 'IC-05: change.test_evidence -> change.test_evidence');
select has_column('core', 'user', 'role', 'IC-05: user.role -> user.role');

-- IC-06 Exception and Override Management  (in-scope fields: 1, gaps: 0, out-of-scope: 8)
select has_column('core', 'user', 'id', 'IC-06: user.id -> user.id');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- IP-02 Governance, Board Oversight, and Delegations  (in-scope fields: 4, gaps: 0, out-of-scope: 8)
select has_column('core', 'trade', 'approval', 'IP-02: trade.approval -> trade.approval');
select has_column('core', 'trade', 'exception_raised', 'IP-02: trade.exception_raised -> trade.exception_raised');
select has_column('core', 'trade', 'instrument_type', 'IP-02: trade.instrument_type -> trade.instrument_type');
select has_column('core', 'trade', 'settlement_amount', 'IP-02: trade.settlement_amount -> trade.settlement_amount');

-- IP-03 Permissible Investments and Prohibited Activities  (in-scope fields: 2, gaps: 0, out-of-scope: 4)
select has_column('core', 'trade', 'instrument_type', 'IP-03: trade.instrument_type -> trade.instrument_type');
select has_column('core', 'trade', 'permissibility', 'IP-03: trade.permissibility -> trade.permissibility');

-- IP-05 Credit Risk Standards and Downgrade Management  (in-scope fields: 1, gaps: 0, out-of-scope: 5)
select has_column('core', 'trade', 'instrument_type', 'IP-05: trade.instrument_type -> trade.instrument_type');

-- IP-08 Approved Brokers, Dealers, and Safekeepers  (in-scope fields: 1, gaps: 0, out-of-scope: 5)
select has_column('core', 'trade', 'intermediary_id', 'IP-08: trade.intermediary_id -> trade.intermediary_id');

-- IP-11 Pre-Purchase Due Diligence and Exceptions  (in-scope fields: 3, gaps: 0, out-of-scope: 1)
select has_column('core', 'trade', 'exception_raised', 'IP-11: trade.exception_raised -> trade.exception_raised');
select has_column('core', 'trade', 'pretrade_checklist', 'IP-11: trade.pretrade_checklist -> trade.pretrade_checklist');
select has_column('core', 'trade', 'valuation_support', 'IP-11: trade.valuation_support -> trade.valuation_support');

-- IP-14 Trade Execution, Controls, and Segregation of Duties  (in-scope fields: 5, gaps: 0, out-of-scope: 1)
select has_column('core', 'trade', 'reconciliation_due_at', 'IP-14: trade.reconciliation.due_at -> trade.reconciliation_due_at');
select has_column('core', 'trade', 'step_attempted', 'IP-14: trade.step_attempted -> trade.step_attempted');
select has_column('core', 'trade', 'ticket', 'IP-14: trade.ticket -> trade.ticket');
select has_column('core', 'user', 'id', 'IP-14: user.id -> user.id');
select has_column('core', 'user', 'role', 'IP-14: user.role -> user.role');

-- IP-15 Recordkeeping and Documentation Retention  (in-scope fields: 4, gaps: 0, out-of-scope: 0)
select has_column('core', 'case', 'evidence', 'IP-15: document.attachment_due_at -> embedded in case.evidence');
select has_column('core', 'case', 'evidence', 'IP-15: document.retention_schedule -> embedded in case.evidence');
select has_column('core', 'case', 'evidence', 'IP-15: document.subject_ref -> embedded in case.evidence');
select has_column('core', 'case', 'evidence', 'IP-15: document.type -> embedded in case.evidence');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- IP-16 Training, Competency, and Conflicts of Interest  (in-scope fields: 11, gaps: 0, out-of-scope: 3)
select has_column('core', 'coi', 'attestation_signature', 'IP-16: coi.attestation_signature -> coi.attestation_signature');
select has_column('core', 'coi', 'conflict_identified', 'IP-16: coi.conflict.identified -> coi.conflict_identified');
select has_column('core', 'coi', 'interest_description', 'IP-16: coi.interest_description -> coi.interest_description');
select has_column('core', 'coi', 'matter_reference', 'IP-16: coi.matter_reference -> coi.matter_reference');
select has_column('core', 'coi', 'questionnaire_due_at', 'IP-16: coi.questionnaire_due_at -> coi.questionnaire_due_at');
select has_column('core', 'coi', 'questionnaire_responses', 'IP-16: coi.questionnaire_responses -> coi.questionnaire_responses');
select has_column('core', 'coi', 'questionnaire_version', 'IP-16: coi.questionnaire_version -> coi.questionnaire_version');
select has_column('core', 'training', 'completion_status', 'IP-16: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'module_id', 'IP-16: training.module_id -> training.module_id');
select has_column('core', 'training', 'required_curriculum', 'IP-16: training.required_curriculum -> training.required_curriculum');
select has_column('core', 'training', 'role_curriculum', 'IP-16: training.role_curriculum -> training.role_curriculum');

-- LP-02 Product Eligibility & Prohibited Practices  (in-scope fields: 2, gaps: 0, out-of-scope: 8)
select has_column('core', 'loan_application', 'product_code', 'LP-02: loan_application.product_code -> loan_application.product_code');
select has_column('core', 'loan_application', 'product_type', 'LP-02: loan_application.product_type -> loan_application.product_type');

-- LP-03 Applications, Acceptance & Denial Standards  (in-scope fields: 13, gaps: 0, out-of-scope: 3)
select has_column('core', 'loan', 'ltv', 'LP-03: loan.ltv -> loan.ltv');
select has_column('core', 'loan_application', 'aan_due_at', 'LP-03: loan_application.aan_due_at -> loan_application.aan_due_at');
select has_column('core', 'loan_application', 'action_basis', 'LP-03: loan_application.action_basis -> loan_application.action_basis');
select has_column('core', 'loan_application', 'atr_qm_result', 'LP-03: loan_application.atr_qm_result -> loan_application.atr_qm_result');
select has_column('core', 'loan_application', 'channel', 'LP-03: loan_application.channel -> loan_application.channel');
select has_column('core', 'loan_application', 'data', 'LP-03: loan_application.data -> loan_application.data');
select has_column('core', 'loan_application', 'decision_due_at', 'LP-03: loan_application.decision.due_at -> loan_application.decision_due_at');
select has_column('core', 'loan_application', 'dti', 'LP-03: loan_application.dti -> loan_application.dti');
select has_column('core', 'loan_application', 'gmi', 'LP-03: loan_application.gmi -> loan_application.gmi');
select has_column('core', 'loan_application', 'id', 'LP-03: loan_application.id -> loan_application.id');
select has_column('core', 'loan_application', 'income_assets', 'LP-03: loan_application.income_assets -> loan_application.income_assets');
select has_column('core', 'loan_application', 'incomplete_aged', 'LP-03: loan_application.incomplete_aged -> loan_application.incomplete_aged');
select has_column('core', 'loan_application', 'parties', 'LP-03: loan_party.ofac_status -> embedded in loan_application.parties');

-- LP-04 Credit Scoring & Adverse Credit History  (in-scope fields: 2, gaps: 0, out-of-scope: 6)
select has_column('core', 'loan_application', 'action_basis', 'LP-04: loan_application.action_basis -> loan_application.action_basis');
select has_column('core', 'loan_application', 'thin_file', 'LP-04: loan_application.thin_file -> loan_application.thin_file');

-- LP-05 ATR/QM & Mortgage Underwriting  (in-scope fields: 4, gaps: 0, out-of-scope: 2)
select has_column('core', 'loan_application', 'atr_qm_result', 'LP-05: loan_application.atr_qm_result -> loan_application.atr_qm_result');
select has_column('core', 'loan_application', 'doc_block_state', 'LP-05: loan_application.doc_block_state -> loan_application.doc_block_state');
select has_column('core', 'loan_application', 'dti', 'LP-05: loan_application.dti -> loan_application.dti');
select has_column('core', 'loan_application', 'product_type', 'LP-05: loan_application.product_type -> loan_application.product_type');

-- LP-06 Appraisals, Valuations & Collateral  (in-scope fields: 4, gaps: 0, out-of-scope: 10)
select has_column('core', 'loan', 'ltv', 'LP-06: loan.ltv -> loan.ltv');
select has_column('core', 'loan_application', 'applicant', 'LP-06: loan_application.applicant -> loan_application.applicant');
select has_column('core', 'loan_application', 'id', 'LP-06: loan_application.id -> loan_application.id');
select has_column('core', 'loan_application', 'product_code', 'LP-06: loan_application.product_code -> loan_application.product_code');

-- LP-07 Adverse Action & Notifications  (in-scope fields: 8, gaps: 0, out-of-scope: 3)
select has_column('core', 'loan_application', 'aan_due_at', 'LP-07: loan_application.aan_due_at -> loan_application.aan_due_at');
select has_column('core', 'loan_application', 'action_basis', 'LP-07: loan_application.action_basis -> loan_application.action_basis');
select has_column('core', 'loan_application', 'applicant', 'LP-07: loan_application.applicant -> loan_application.applicant');
select has_column('core', 'loan_application', 'counteroffer_aan_due_at', 'LP-07: loan_application.counteroffer_aan_due_at -> loan_application.counteroffer_aan_due_at');
select has_column('core', 'loan_application', 'counteroffer_status', 'LP-07: loan_application.counteroffer_status -> loan_application.counteroffer_status');
select has_column('core', 'loan_application', 'counteroffer_terms', 'LP-07: loan_application.counteroffer_terms -> loan_application.counteroffer_terms');
select has_column('core', 'loan_application', 'gmi', 'LP-07: loan_application.gmi -> loan_application.gmi');
select has_column('core', 'loan_application', 'oral_statement', 'LP-07: loan_application.oral_statement -> loan_application.oral_statement');

-- LP-08 Exceptions, Mitigating Factors & Overrides  (in-scope fields: 1, gaps: 0, out-of-scope: 6)
select has_column('core', 'loan_application', 'id', 'LP-08: loan_application.id -> loan_application.id');

-- LP-09 Documentation, Recordkeeping & Retention  (in-scope fields: 3, gaps: 0, out-of-scope: 3)
select has_column('core', 'loan_application', 'doc_block_state', 'LP-09: loan_application.doc_block_state -> loan_application.doc_block_state');
select has_column('core', 'loan_application', 'gmi', 'LP-09: loan_application.gmi -> loan_application.gmi');
select has_column('core', 'loan_application', 'notified_at', 'LP-09: loan_application.notified_at -> loan_application.notified_at');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- LP-11 OFAC & Sanctions Gate  (in-scope fields: 7, gaps: 0, out-of-scope: 1)
select has_column('core', 'loan', 'funding_block_state', 'LP-11: loan.funding_block_state -> loan.funding_block_state');
select has_column('core', 'loan_application', 'parties', 'LP-11: loan_party.contact -> embedded in loan_application.parties');
select has_column('core', 'loan_application', 'parties', 'LP-11: loan_party.identity -> embedded in loan_application.parties');
select has_column('core', 'loan_application', 'parties', 'LP-11: loan_party.ofac_result -> embedded in loan_application.parties');
select has_column('core', 'loan_application', 'parties', 'LP-11: loan_party.ofac_status -> embedded in loan_application.parties');
select has_column('core', 'ofac_result', 'match_score', 'LP-11: ofac_result.match_score -> ofac_result.match_score');
select has_column('core', 'ofac_result', 'matched_lists', 'LP-11: ofac_result.matched_lists -> ofac_result.matched_lists');

-- LP-12 Prequalification, Marketing & Steering Controls  (in-scope fields: 3, gaps: 0, out-of-scope: 8)
select has_column('core', 'loan_application', 'prequal', 'LP-12: prequal.criteria_version -> embedded in loan_application.prequal');
select has_column('core', 'loan_application', 'prequal', 'LP-12: prequal.inputs -> embedded in loan_application.prequal');
select has_column('core', 'loan_application', 'prequal', 'LP-12: prequal.product_mapping -> embedded in loan_application.prequal');

-- LP-14 Insider Lending & Employee Conflicts  (in-scope fields: 8, gaps: 0, out-of-scope: 2)
select has_column('core', 'insider', 'aggregate_credit_amount', 'LP-14: insider.aggregate_credit_amount -> insider.aggregate_credit_amount');
select has_column('core', 'insider', 'board_approval', 'LP-14: insider.board_approval -> insider.board_approval');
select has_column('core', 'insider', 'comparable_terms', 'LP-14: insider.comparable_terms -> insider.comparable_terms');
select has_column('core', 'insider', 'credit_threshold_exceeded', 'LP-14: insider.credit_threshold_exceeded -> insider.credit_threshold_exceeded');
select has_column('core', 'insider', 'proposed_terms', 'LP-14: insider.proposed_terms -> insider.proposed_terms');
select has_column('core', 'insider', 'terms_parity', 'LP-14: insider.terms_parity -> insider.terms_parity');
select has_column('core', 'loan_application', 'applicant', 'LP-14: loan_application.applicant -> loan_application.applicant');
select has_column('core', 'loan_application', 'insider', 'LP-14: loan_application.insider -> loan_application.insider');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- MP-01 Membership Eligibility and Onboarding  (in-scope fields: 8, gaps: 0, out-of-scope: 2)
select has_column('core', 'entity', 'contact', 'MP-01: entity.contact -> entity.contact');
select has_column('core', 'entity', 'date_of_birth', 'MP-01: entity.date_of_birth -> entity.date_of_birth');
select has_column('core', 'entity', 'name', 'MP-01: entity.name -> entity.name');
select has_column('core', 'entity', 'tin', 'MP-01: entity.tin -> entity.tin');
select has_column('core', 'verification', 'provider', 'MP-01: verification.provider -> verification.provider');
select has_column('core', 'verification', 'provider_result', 'MP-01: verification.provider_result -> verification.provider_result');
select has_column('core', 'verification', 'status', 'MP-01: verification.status -> verification.status');
select has_column('core', 'verification', 'type', 'MP-01: verification.type -> verification.type');

-- MP-02 Account Maintenance and Change of Address  (in-scope fields: 5, gaps: 0, out-of-scope: 7)
select has_column('core', 'card', 'reissue_request', 'MP-02: card.reissue_request -> card.reissue_request');
select has_column('core', 'entity', 'address_new', 'MP-02: entity.address_new -> entity.address_new');
select has_column('core', 'entity', 'address_previous', 'MP-02: entity.address_previous -> entity.address_previous');
select has_column('core', 'entity', 'contact', 'MP-02: entity.contact -> entity.contact');
select has_column('core', 'verification', 'status', 'MP-02: verification.status -> verification.status');

-- MP-04 Member Disputes and Dispute Resolution  (in-scope fields: 19, gaps: 0, out-of-scope: 1)
select has_column('core', 'account', 'balance', 'MP-04: account.balance -> account.balance');
select has_column('core', 'complaint', 'ack_due_at', 'MP-04: complaint.ack_due_at -> complaint.ack_due_at');
select has_column('core', 'complaint', 'category', 'MP-04: complaint.category -> complaint.category');
select has_column('core', 'complaint', 'channel', 'MP-04: complaint.channel -> complaint.channel');
select has_column('core', 'complaint', 'final_response_due_at', 'MP-04: complaint.final.response.due_at -> complaint.final_response_due_at');
select has_column('core', 'complaint', 'initial_response_due_at', 'MP-04: complaint.initial.response.due_at -> complaint.initial_response_due_at');
select has_column('core', 'complaint', 'investigation_notes', 'MP-04: complaint.investigation_notes -> complaint.investigation_notes');
select has_column('core', 'complaint', 'member_id', 'MP-04: complaint.member_id -> complaint.member_id');
select has_column('core', 'complaint', 'narrative', 'MP-04: complaint.narrative -> complaint.narrative');
select has_column('core', 'complaint', 'regulator', 'MP-04: complaint.regulator -> complaint.regulator');
select has_column('core', 'complaint', 'root_cause_tag', 'MP-04: complaint.root_cause_tag -> complaint.root_cause_tag');
select has_column('core', 'complaint', 'udaap_flag', 'MP-04: complaint.udaap_flag -> complaint.udaap_flag');
select has_column('core', 'dispute', 'basis', 'MP-04: dispute.basis -> dispute.basis');
select has_column('core', 'dispute', 'correction_amount', 'MP-04: dispute.correction_amount -> dispute.correction_amount');
select has_column('core', 'dispute', 'findings', 'MP-04: dispute.findings -> dispute.findings');
select has_column('core', 'dispute', 'provisional_credit_due_at', 'MP-04: dispute.provisional_credit_due_at -> dispute.provisional_credit_due_at');
select has_column('core', 'dispute', 'rege_clock', 'MP-04: dispute.rege_clock -> dispute.rege_clock');
select has_column('core', 'dispute', 'response_due_at', 'MP-04: dispute.response.due_at -> dispute.response_due_at');
select has_column('core', 'entity', 'contact', 'MP-04: entity.contact -> entity.contact');

-- MP-05 Account Restrictions and Closures  (in-scope fields: 7, gaps: 0, out-of-scope: 5)
select has_column('core', 'account', 'balance', 'MP-05: account.balance -> account.balance');
select has_column('core', 'account', 'closure_payout_due_at', 'MP-05: account.closure_payout_due_at -> account.closure_payout_due_at');
select has_column('core', 'account', 'id', 'MP-05: account.id -> account.id');
select has_column('core', 'account', 'lock_type', 'MP-05: account.lock_type -> account.lock_type');
select has_column('core', 'account', 'restriction', 'MP-05: account.restriction -> account.restriction');
select has_column('core', 'account', 'status', 'MP-05: account.status -> account.status');
select has_column('core', 'entity', 'contact', 'MP-05: entity.contact -> entity.contact');

-- MP-06 Member Expulsion  (in-scope fields: 2, gaps: 0, out-of-scope: 7)
select has_column('core', 'account', 'balance', 'MP-06: account.balance -> account.balance');
select has_column('core', 'entity', 'contact', 'MP-06: entity.contact -> entity.contact');

-- MP-07 Member Death and Estate Handling  (in-scope fields: 3, gaps: 0, out-of-scope: 8)
select has_column('core', 'account', 'balance', 'MP-07: account.balance -> account.balance');
select has_column('core', 'account', 'death_flag', 'MP-07: account.death_flag -> account.death_flag');
select has_column('core', 'verification', 'status', 'MP-07: verification.status -> verification.status');

-- PR-01 Privacy Notice Lifecycle  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'entity', 'id', 'PR-01: entity.id -> entity.id');

-- PR-02 Opt-Out Capture and Honoring  (in-scope fields: 2, gaps: 0, out-of-scope: 7)
select has_column('core', 'entity', 'id', 'PR-02: entity.id -> entity.id');
select has_column('core', 'entity', 'jurisdiction', 'PR-02: entity.jurisdiction -> entity.jurisdiction');

-- PR-04 Member Access and Authentication  (in-scope fields: 1, gaps: 0, out-of-scope: 7)
select has_column('core', 'entity', 'id', 'PR-04: entity.id -> entity.id');

-- PR-05 Data Accuracy and Corrections  (in-scope fields: 4, gaps: 0, out-of-scope: 4)
select has_column('core', 'address', 'ncoa_candidate', 'PR-05: address.ncoa_candidate -> address.ncoa_candidate');
select has_column('core', 'address', 'ncoa_mismatch', 'PR-05: address.ncoa_mismatch -> address.ncoa_mismatch');
select has_column('core', 'dispute', 'basis', 'PR-05: dispute.basis -> dispute.basis');
select has_column('core', 'entity', 'id', 'PR-05: entity.id -> entity.id');

-- PR-06 Employee Access Minimization and Training  (in-scope fields: 5, gaps: 0, out-of-scope: 6)
select has_column('core', 'training', 'annual_due_at', 'PR-06: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'onboarding_due_at', 'PR-06: training.onboarding.due_at -> training.onboarding_due_at');
select has_column('core', 'training', 'role_curriculum', 'PR-06: training.role_curriculum -> training.role_curriculum');
select has_column('core', 'task', 'training', 'PR-06: training_detail.hire_date -> embedded in task.training');
select has_column('core', 'user', 'role', 'PR-06: user.role -> user.role');

-- PR-08 Secure Disposal of NPPI  (in-scope fields: 2, gaps: 0, out-of-scope: 9)
select has_column('core', 'legal_hold', 'matter_id', 'PR-08: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'release_approved_by', 'PR-08: legal_hold.release_approved_by -> legal_hold.release_approved_by');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notice_template_id', 'SC-01: incident.notice_template_id -> incident.notice_template_id');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- PR-18 Incident Detection, Classification & SAR Referral  (in-scope fields: 9, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'criminal_suspected', 'PR-18: incident.criminal_suspected -> incident.criminal_suspected');
select has_column('core', 'incident', 'data_scope', 'PR-18: incident.data_scope -> incident.data_scope');
select has_column('core', 'incident', 'description', 'PR-18: incident.description -> incident.description');
select has_column('core', 'incident', 'detection_source', 'PR-18: incident.detection_source -> incident.detection_source');
select has_column('core', 'incident', 'id', 'PR-18: incident.id -> incident.id');
select has_column('core', 'incident', 'material', 'PR-18: incident.material -> incident.material');
select has_column('core', 'incident', 'member_impact', 'PR-18: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'scope_initial', 'PR-18: incident.scope_initial -> incident.scope_initial');
select has_column('core', 'incident', 'triage_due_at', 'PR-18: incident.triage.due_at -> incident.triage_due_at');

-- PR-10 Recordkeeping, Complaints, and Board Reporting  (in-scope fields: 10, gaps: 0, out-of-scope: 2)
select has_column('core', 'complaint', 'category', 'PR-10: complaint.category -> complaint.category');
select has_column('core', 'complaint', 'channel', 'PR-10: complaint.channel -> complaint.channel');
select has_column('core', 'complaint', 'initial_response_due_at', 'PR-10: complaint.initial.response.due_at -> complaint.initial_response_due_at');
select has_column('core', 'complaint', 'member_id', 'PR-10: complaint.member_id -> complaint.member_id');
select has_column('core', 'complaint', 'narrative', 'PR-10: complaint.narrative -> complaint.narrative');
select has_column('core', 'complaint', 'privacy', 'PR-10: complaint.privacy -> complaint.privacy');
select has_column('core', 'complaint', 'root_cause_tag', 'PR-10: complaint.root_cause_tag -> complaint.root_cause_tag');
select has_column('core', 'complaint', 'trend_review_due', 'PR-10: complaint.trend.review.due -> complaint.trend_review_due');
select has_column('core', 'complaint', 'trend_summary', 'PR-10: complaint.trend_summary -> complaint.trend_summary');
select has_column('core', 'incident', 'material', 'PR-10: incident.material -> incident.material');

-- PR-11 Website Posting and E-SIGN Delivery  (in-scope fields: 1, gaps: 0, out-of-scope: 6)
select has_column('core', 'entity', 'id', 'PR-11: entity.id -> entity.id');

-- PR-12 State Privacy Rights: Universal Floor  (in-scope fields: 2, gaps: 0, out-of-scope: 5)
select has_column('core', 'entity', 'id', 'PR-12: entity.id -> entity.id');
select has_column('core', 'entity', 'jurisdiction', 'PR-12: entity.jurisdiction -> entity.jurisdiction');

-- PR-15 Third-Party App and Account Connections  (in-scope fields: 1, gaps: 0, out-of-scope: 4)
select has_column('core', 'entity', 'id', 'PR-15: entity.id -> entity.id');

-- PR-16 Biometric Data for KYC  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'entity', 'id', 'PR-16: entity.id -> entity.id');
select has_column('core', 'verification', 'alt_path_available', 'PR-16: verification.alt_path_available -> verification.alt_path_available');
select has_column('core', 'verification', 'biometric_purge_due_at', 'PR-16: verification.biometric.purge.due_at -> verification.biometric_purge_due_at');
select has_column('core', 'verification', 'id', 'PR-16: verification.id -> verification.id');
select has_column('core', 'verification', 'match_status', 'PR-16: verification.match_status -> verification.match_status');

-- RR-05 Legal Holds  (in-scope fields: 6, gaps: 0, out-of-scope: 1)
select has_column('core', 'legal_hold', 'hold_scope', 'RR-05: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'RR-05: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'RR-05: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'RR-05: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'RR-05: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'RR-05: legal_hold.released_at -> legal_hold.released_at');

-- RR-10 Training  (in-scope fields: 8, gaps: 0, out-of-scope: 0)
select has_column('core', 'training', 'annual_due_at', 'RR-10: training.annual_due_at -> training.annual_due_at');
select has_column('core', 'training', 'assessment_score', 'RR-10: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'assignee_id', 'RR-10: training.assignee_id -> training.assignee_id');
select has_column('core', 'training', 'completion_status', 'RR-10: training.completion_status -> training.completion_status');
select has_column('core', 'training', 'curriculum_id', 'RR-10: training.curriculum_id -> training.curriculum_id');
select has_column('core', 'training', 'hire_date', 'RR-10: training.hire_date -> training.hire_date');
select has_column('core', 'training', 'module_id', 'RR-10: training.module_id -> training.module_id');
select has_column('core', 'training', 'newhire_due_at', 'RR-10: training.newhire_due_at -> training.newhire_due_at');

-- RII-03 Mandatory Indemnification  (in-scope fields: 10, gaps: 0, out-of-scope: 2)
select has_column('core', 'indemnification', 'disposition_record', 'RII-03: indemnification.disposition_record -> indemnification.disposition_record');
select has_column('core', 'indemnification', 'enforcement_status', 'RII-03: indemnification.enforcement_status -> indemnification.enforcement_status');
select has_column('core', 'indemnification', 'expense_statement', 'RII-03: indemnification.expense_statement -> indemnification.expense_statement');
select has_column('core', 'indemnification', 'federal_screen_result', 'RII-03: indemnification.federal_screen_result -> indemnification.federal_screen_result');
select has_column('core', 'indemnification', 'legal_review', 'RII-03: indemnification.legal_review -> indemnification.legal_review');
select has_column('core', 'indemnification', 'liability_terms', 'RII-03: indemnification.liability_terms -> indemnification.liability_terms');
select has_column('core', 'indemnification', 'payment_disbursed', 'RII-03: indemnification.payment.disbursed -> indemnification.payment_disbursed');
select has_column('core', 'indemnification', 'payment_due_at', 'RII-03: indemnification.payment.due_at -> indemnification.payment_due_at');
select has_column('core', 'indemnification', 'request', 'RII-03: indemnification.request -> indemnification.request');
select has_column('core', 'indemnification', 'request_routed', 'RII-03: indemnification.request.routed -> indemnification.request_routed');

-- RII-04 Permissive Indemnification  (in-scope fields: 15, gaps: 0, out-of-scope: 2)
select has_column('core', 'indemnification', 'conduct_record', 'RII-04: indemnification.conduct_record -> indemnification.conduct_record');
select has_column('core', 'indemnification', 'counsel_opinion', 'RII-04: indemnification.counsel_opinion -> indemnification.counsel_opinion');
select has_column('core', 'indemnification', 'decision_body', 'RII-04: indemnification.decision_body -> indemnification.decision_body');
select has_column('core', 'indemnification', 'defense_budget', 'RII-04: indemnification.defense_budget -> indemnification.defense_budget');
select has_column('core', 'indemnification', 'determination_due_at', 'RII-04: indemnification.determination_due_at -> indemnification.determination_due_at');
select has_column('core', 'indemnification', 'enforcement_status', 'RII-04: indemnification.enforcement_status -> indemnification.enforcement_status');
select has_column('core', 'indemnification', 'expense_statement', 'RII-04: indemnification.expense_statement -> indemnification.expense_statement');
select has_column('core', 'indemnification', 'federal_screen_result', 'RII-04: indemnification.federal_screen_result -> indemnification.federal_screen_result');
select has_column('core', 'indemnification', 'payment_blocked', 'RII-04: indemnification.payment.blocked -> indemnification.payment_blocked');
select has_column('core', 'indemnification', 'payment_disbursed', 'RII-04: indemnification.payment.disbursed -> indemnification.payment_disbursed');
select has_column('core', 'indemnification', 'payment_due_at', 'RII-04: indemnification.payment.due_at -> indemnification.payment_due_at');
select has_column('core', 'indemnification', 'recusal_record', 'RII-04: indemnification.recusal_record -> indemnification.recusal_record');
select has_column('core', 'indemnification', 'request', 'RII-04: indemnification.request -> indemnification.request');
select has_column('core', 'indemnification', 'request_routed', 'RII-04: indemnification.request.routed -> indemnification.request_routed');
select has_column('core', 'indemnification', 'standard_determination_made', 'RII-04: indemnification.standard_determination.made -> indemnification.standard_determination_made');

-- RII-05 Advancement of Expenses  (in-scope fields: 9, gaps: 0, out-of-scope: 2)
select has_column('core', 'indemnification', 'advance_disbursed', 'RII-05: indemnification.advance.disbursed -> indemnification.advance_disbursed');
select has_column('core', 'indemnification', 'advance_balance', 'RII-05: indemnification.advance_balance -> indemnification.advance_balance');
select has_column('core', 'indemnification', 'advance_due_at', 'RII-05: indemnification.advance_due_at -> indemnification.advance_due_at');
select has_column('core', 'indemnification', 'defense_invoice', 'RII-05: indemnification.defense_invoice -> indemnification.defense_invoice');
select has_column('core', 'indemnification', 'enforcement_status', 'RII-05: indemnification.enforcement_status -> indemnification.enforcement_status');
select has_column('core', 'indemnification', 'federal_screen_result', 'RII-05: indemnification.federal_screen_result -> indemnification.federal_screen_result');
select has_column('core', 'indemnification', 'repayment_demanded', 'RII-05: indemnification.repayment.demanded -> indemnification.repayment_demanded');
select has_column('core', 'indemnification', 'request', 'RII-05: indemnification.request -> indemnification.request');
select has_column('core', 'indemnification', 'undertaking', 'RII-05: indemnification.undertaking -> indemnification.undertaking');

-- RII-06 Indemnification Exclusions  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'indemnification', 'conduct_record', 'RII-06: indemnification.conduct_record -> indemnification.conduct_record');
select has_column('core', 'indemnification', 'enforcement_status', 'RII-06: indemnification.enforcement_status -> indemnification.enforcement_status');
select has_column('core', 'indemnification', 'federal_screen_result', 'RII-06: indemnification.federal_screen_result -> indemnification.federal_screen_result');
select has_column('core', 'indemnification', 'legal_review', 'RII-06: indemnification.legal_review -> indemnification.legal_review');
select has_column('core', 'indemnification', 'payment_blocked', 'RII-06: indemnification.payment.blocked -> indemnification.payment_blocked');

-- RII-07 Decision Process and Conflicts  (in-scope fields: 9, gaps: 0, out-of-scope: 2)
select has_column('core', 'coi', 'matter_reference', 'RII-07: coi.matter_reference -> coi.matter_reference');
select has_column('core', 'coi', 'questionnaire_responses', 'RII-07: coi.questionnaire_responses -> coi.questionnaire_responses');
select has_column('core', 'indemnification', 'conduct_record', 'RII-07: indemnification.conduct_record -> indemnification.conduct_record');
select has_column('core', 'indemnification', 'counsel_opinion', 'RII-07: indemnification.counsel_opinion -> indemnification.counsel_opinion');
select has_column('core', 'indemnification', 'decision_body_selected', 'RII-07: indemnification.decision_body.selected -> indemnification.decision_body_selected');
select has_column('core', 'indemnification', 'determination_due_at', 'RII-07: indemnification.determination_due_at -> indemnification.determination_due_at');
select has_column('core', 'indemnification', 'recusal_record', 'RII-07: indemnification.recusal_record -> indemnification.recusal_record');
select has_column('core', 'indemnification', 'request', 'RII-07: indemnification.request -> indemnification.request');
select has_column('core', 'indemnification', 'request_routed', 'RII-07: indemnification.request.routed -> indemnification.request_routed');

-- RII-08 Claims Procedures  (in-scope fields: 1, gaps: 0, out-of-scope: 6)
select has_column('core', 'indemnification', 'claim_notified', 'RII-08: indemnification.claim.notified -> indemnification.claim_notified');

-- RII-09 Recordkeeping  (in-scope fields: 3, gaps: 0, out-of-scope: 7)
select has_column('core', 'indemnification', 'conduct_record', 'RII-09: indemnification.conduct_record -> indemnification.conduct_record');
select has_column('core', 'indemnification', 'counsel_opinion', 'RII-09: indemnification.counsel_opinion -> indemnification.counsel_opinion');
select has_column('core', 'indemnification', 'undertaking', 'RII-09: indemnification.undertaking -> indemnification.undertaking');

-- RS-07 Trustee/Conservator Handover  (in-scope fields: 13, gaps: 0, out-of-scope: 2)
select has_column('core', 'handover', 'access_expiry_due', 'RS-07: handover.access.expiry.due -> handover.access_expiry_due');
select has_column('core', 'handover', 'access_scope', 'RS-07: handover.access_scope -> handover.access_scope');
select has_column('core', 'handover', 'appointment_reference', 'RS-07: handover.appointment_reference -> handover.appointment_reference');
select has_column('core', 'handover', 'appointment_status', 'RS-07: handover.appointment_status -> handover.appointment_status');
select has_column('core', 'handover', 'full_due_at', 'RS-07: handover.full_due_at -> handover.full_due_at');
select has_column('core', 'handover', 'initial_due_at', 'RS-07: handover.initial_due_at -> handover.initial_due_at');
select has_column('core', 'handover', 'personnel_roster', 'RS-07: handover.personnel_roster -> handover.personnel_roster');
select has_column('core', 'handover', 'trustee_access_grant_id', 'RS-07: handover.trustee_access_grant_id -> handover.trustee_access_grant_id');
select has_column('core', 'handover', 'trustee_contact', 'RS-07: handover.trustee_contact -> handover.trustee_contact');
select has_column('core', 'handover', 'trustee_credential_id', 'RS-07: handover.trustee_credential_id -> handover.trustee_credential_id');
select has_column('core', 'handover', 'trustee_identity', 'RS-07: handover.trustee_identity -> handover.trustee_identity');
select has_column('core', 'records_package', 'artifact_id', 'RS-07: records_package.artifact_id -> records_package.artifact_id');
select has_column('core', 'records_package', 'checksum_chain', 'RS-07: records_package.checksum_chain -> records_package.checksum_chain');

-- RS-08 Records Preservation for Resolution  (in-scope fields: 10, gaps: 0, out-of-scope: 0)
select has_column('core', 'records_package', 'artifact_id', 'RS-08: records_package.artifact_id -> records_package.artifact_id');
select has_column('core', 'records_package', 'checksum_chain', 'RS-08: records_package.checksum_chain -> records_package.checksum_chain');
select has_column('core', 'records_package', 'complete_due_at', 'RS-08: records_package.complete_due_at -> records_package.complete_due_at');
select has_column('core', 'records_package', 'failure_reason', 'RS-08: records_package.failure_reason -> records_package.failure_reason');
select has_column('core', 'records_package', 'manifest_id', 'RS-08: records_package.manifest_id -> records_package.manifest_id');
select has_column('core', 'records_package', 'snapshot_as_of', 'RS-08: records_package.snapshot_as_of -> records_package.snapshot_as_of');
select has_column('core', 'records_package', 'snapshot_due', 'RS-08: records_package.snapshot_due -> records_package.snapshot_due');
select has_column('core', 'records_package', 'snapshot_id', 'RS-08: records_package.snapshot_id -> records_package.snapshot_id');
select has_column('core', 'records_package', 'snapshot_schedule', 'RS-08: records_package.snapshot_schedule -> records_package.snapshot_schedule');
select has_column('core', 'records_package', 'start_due_at', 'RS-08: records_package.start_due_at -> records_package.start_due_at');

-- SC-03 Enterprise Incident Declaration & First-Hour Response  (in-scope fields: 2, gaps: 0, out-of-scope: 1)
select has_column('core', 'incident', 'scope', 'SC-03: incident.scope -> incident.scope');
select has_column('core', 'incident', 'severity', 'SC-03: incident.severity -> incident.severity');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- SC-02 Record-Retention Lifecycle Mechanics  (in-scope fields: 6, gaps: 0, out-of-scope: 4)
select has_column('core', 'legal_hold', 'hold_scope', 'SC-02: legal_hold.hold_scope -> legal_hold.hold_scope');
select has_column('core', 'legal_hold', 'matter_id', 'SC-02: legal_hold.matter_id -> legal_hold.matter_id');
select has_column('core', 'legal_hold', 'matter_ref', 'SC-02: legal_hold.matter_ref -> legal_hold.matter_ref');
select has_column('core', 'legal_hold', 'placed_at', 'SC-02: legal_hold.placed_at -> legal_hold.placed_at');
select has_column('core', 'legal_hold', 'release_approved_by', 'SC-02: legal_hold.release_approved_by -> legal_hold.release_approved_by');
select has_column('core', 'legal_hold', 'released_at', 'SC-02: legal_hold.released_at -> legal_hold.released_at');

-- SC-01 NCUA Reportable Cyber-Incident & Member Notification  (in-scope fields: 5, gaps: 0, out-of-scope: 0)
select has_column('core', 'incident', 'member_impact', 'SC-01: incident.member_impact -> incident.member_impact');
select has_column('core', 'incident', 'member_notice_template', 'SC-01: incident.member_notice_template -> incident.member_notice_template');
select has_column('core', 'incident', 'ncua_notice_due_at', 'SC-01: incident.ncua.notice.due_at -> incident.ncua_notice_due_at');
select has_column('core', 'incident', 'notification_due_at', 'SC-01: incident.notification_due_at -> incident.notification_due_at');
select has_column('core', 'incident', 'reportability_rationale', 'SC-01: incident.reportability_rationale -> incident.reportability_rationale');

-- TIS-01 Disclosure Standards  (in-scope fields: 1, gaps: 0, out-of-scope: 9)
select has_column('core', 'entity', 'esign_consent', 'TIS-01: entity.esign_consent -> entity.esign_consent');

-- TIS-02 Pre-Opening Account Disclosures  (in-scope fields: 9, gaps: 0, out-of-scope: 8)
select has_column('core', 'account', 'account_type', 'TIS-02: account.account_type -> account.account_type');
select has_column('core', 'account', 'id', 'TIS-02: account.id -> account.id');
select has_column('core', 'account', 'opening_channel', 'TIS-02: account.opening_channel -> account.opening_channel');
select has_column('core', 'account', 'restriction', 'TIS-02: account.restriction -> account.restriction');
select has_column('core', 'address', 'city', 'TIS-02: address.city -> address.city');
select has_column('core', 'address', 'line1', 'TIS-02: address.line1 -> address.line1');
select has_column('core', 'address', 'postal_code', 'TIS-02: address.postal_code -> address.postal_code');
select has_column('core', 'address', 'region', 'TIS-02: address.region -> address.region');
select has_column('core', 'entity', 'esign_consent', 'TIS-02: entity.esign_consent -> entity.esign_consent');

-- TIS-04 Maturity Notices  (in-scope fields: 6, gaps: 0, out-of-scope: 3)
select has_column('core', 'account', 'account_type', 'TIS-04: account.account_type -> account.account_type');
select has_column('core', 'account', 'id', 'TIS-04: account.id -> account.id');
select has_column('core', 'account', 'maturity_notice_due_at', 'TIS-04: account.maturity.notice.due_at -> account.maturity_notice_due_at');
select has_column('core', 'account', 'maturity_date', 'TIS-04: account.maturity_date -> account.maturity_date');
select has_column('core', 'account', 'maturity_disposition', 'TIS-04: account.maturity_disposition -> account.maturity_disposition');
select has_column('core', 'account', 'maturity_window', 'TIS-04: account.maturity_window -> account.maturity_window');

-- TIS-05 Periodic Statement Disclosures  (in-scope fields: 2, gaps: 0, out-of-scope: 4)
select has_column('core', 'account', 'balance', 'TIS-05: account.balance -> account.balance');
select has_column('core', 'account', 'id', 'TIS-05: account.id -> account.id');

-- TIS-06 Interest Calculation  (in-scope fields: 2, gaps: 0, out-of-scope: 5)
select has_column('core', 'account', 'balance', 'TIS-06: account.balance -> account.balance');
select has_column('core', 'account', 'id', 'TIS-06: account.id -> account.id');

-- TIS-08 Overdraft Service Disclosures  (in-scope fields: 3, gaps: 0, out-of-scope: 2)
select has_column('core', 'account', 'balance', 'TIS-08: account.balance -> account.balance');
select has_column('core', 'account', 'id', 'TIS-08: account.id -> account.id');
select has_column('core', 'entity', 'reg_e_opt_in', 'TIS-08: entity.reg_e_opt_in -> entity.reg_e_opt_in');

-- TIS-09 Recordkeeping  (in-scope fields: 1, gaps: 0, out-of-scope: 5)
select has_column('core', 'account', 'id', 'TIS-09: account.id -> account.id');

-- TIS-10 Training and Monitoring  (in-scope fields: 5, gaps: 0, out-of-scope: 5)
select has_column('core', 'training', 'assessment_score', 'TIS-10: training.assessment_score -> training.assessment_score');
select has_column('core', 'training', 'assignee_id', 'TIS-10: training.assignee_id -> training.assignee_id');
select has_column('core', 'training', 'completion_due_at', 'TIS-10: training.completion.due_at -> training.completion_due_at');
select has_column('core', 'training', 'curriculum_id', 'TIS-10: training.curriculum_id -> training.curriculum_id');
select has_column('core', 'training', 'module_id', 'TIS-10: training.module_id -> training.module_id');
select * from finish();
rollback;
