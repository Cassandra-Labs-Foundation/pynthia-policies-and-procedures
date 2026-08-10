-- Past-due monitors (plain SQL, NOT pgTAP). Each returns currently-violating rows.
-- Operationalizes the deadline half of each control's alerts_metrics.

-- account.closure_payout_due_at  (MP-05)
select 'account' as table, 'closure_payout_due_at' as deadline, id, "status" as status, "closure_payout_due_at" as due_at
from "core"."account" where "closure_payout_due_at" < now() and "status" = any(array['open', 'frozen']);

-- account.maturity_notice_due_at  (TIS-04)
select 'account' as table, 'maturity_notice_due_at' as deadline, id, "status" as status, "maturity_notice_due_at" as due_at
from "core"."account" where "maturity_notice_due_at" < now() and "status" = any(array['open', 'frozen']);

-- bsa_alert.triage_due_at  (unbound)
select 'bsa_alert' as table, 'triage_due_at' as deadline, id, null as status, "triage_due_at" as due_at
from "core"."bsa_alert" where "triage_due_at" < now();

-- change.cab_review_due_at  (EC-05, IC-05, IS-04)
select 'change' as table, 'cab_review_due_at' as deadline, id, "status" as status, "cab_review_due_at" as due_at
from "core"."change" where "cab_review_due_at" < now() and "status" = any(array['requested', 'in_review', 'deployed']);

-- change.post_review_due_at  (IC-05, IS-04)
select 'change' as table, 'post_review_due_at' as deadline, id, "status" as status, "post_review_due_at" as due_at
from "core"."change" where "post_review_due_at" < now() and "status" = any(array['requested', 'in_review', 'deployed']);

-- coi.questionnaire_due_at  (DF-03, IP-16)
select 'coi' as table, 'questionnaire_due_at' as deadline, id, "status" as status, "questionnaire_due_at" as due_at
from "core"."coi" where "questionnaire_due_at" < now() and "status" = any(array['under_review', 'determined']);

-- complaint.ack_due_at  (CO-06, FL-13, MP-04)
select 'complaint' as table, 'ack_due_at' as deadline, id, "status" as status, "ack_due_at" as due_at
from "core"."complaint" where "ack_due_at" < now() and "status" = any(array['received', 'investigating']);

-- complaint.final_response_due_at  (CO-06, MP-04)
select 'complaint' as table, 'final_response_due_at' as deadline, id, "status" as status, "final_response_due_at" as due_at
from "core"."complaint" where "final_response_due_at" < now() and "status" = any(array['received', 'investigating']);

-- complaint.initial_response_due_at  (CO-06, FL-13, MP-04, PR-10)
select 'complaint' as table, 'initial_response_due_at' as deadline, id, "status" as status, "initial_response_due_at" as due_at
from "core"."complaint" where "initial_response_due_at" < now() and "status" = any(array['received', 'investigating']);

-- complaint.resolution_due_at  (CM-08, CO-06)
select 'complaint' as table, 'resolution_due_at' as deadline, id, "status" as status, "resolution_due_at" as due_at
from "core"."complaint" where "resolution_due_at" < now() and "status" = any(array['received', 'investigating']);

-- dispute.investigation_due_at  (unbound)
select 'dispute' as table, 'investigation_due_at' as deadline, id, "status" as status, "investigation_due_at" as due_at
from "core"."dispute" where "investigation_due_at" < now() and "status" = any(array['investigating']);

-- dispute.provisional_credit_due_at  (MP-04)
select 'dispute' as table, 'provisional_credit_due_at' as deadline, id, "status" as status, "provisional_credit_due_at" as due_at
from "core"."dispute" where "provisional_credit_due_at" < now() and "status" = any(array['investigating']);

-- dispute.response_due_at  (MP-04)
select 'dispute' as table, 'response_due_at' as deadline, id, "status" as status, "response_due_at" as due_at
from "core"."dispute" where "response_due_at" < now() and "status" = any(array['investigating']);

-- finding.escalation_due_at  (AU-07)
select 'finding' as table, 'escalation_due_at' as deadline, id, "status" as status, "escalation_due_at" as due_at
from "core"."finding" where "escalation_due_at" < now() and "status" = any(array['open', 'in_remediation', 'risk_accepted']);

-- finding.response_due_at  (AU-08)
select 'finding' as table, 'response_due_at' as deadline, id, "status" as status, "response_due_at" as due_at
from "core"."finding" where "response_due_at" < now() and "status" = any(array['open', 'in_remediation', 'risk_accepted']);

-- handover.full_due_at  (RS-07)
select 'handover' as table, 'full_due_at' as deadline, id, "status" as status, "full_due_at" as due_at
from "core"."handover" where "full_due_at" < now() and "status" = any(array['initiated', 'provisioned']);

-- handover.initial_due_at  (RS-07)
select 'handover' as table, 'initial_due_at' as deadline, id, "status" as status, "initial_due_at" as due_at
from "core"."handover" where "initial_due_at" < now() and "status" = any(array['initiated', 'provisioned']);

-- incident.ncua_notice_due_at  (SC-01)
select 'incident' as table, 'ncua_notice_due_at' as deadline, id, "status" as status, "ncua_notice_due_at" as due_at
from "core"."incident" where "ncua_notice_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']);

-- incident.notification_due_at  (SC-01)
select 'incident' as table, 'notification_due_at' as deadline, id, "status" as status, "notification_due_at" as due_at
from "core"."incident" where "notification_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']);

-- incident.triage_due_at  (CO-11, PR-18)
select 'incident' as table, 'triage_due_at' as deadline, id, "status" as status, "triage_due_at" as due_at
from "core"."incident" where "triage_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']);

-- incident.comms_initial_due_at  (unbound)
select 'incident' as table, 'comms_initial_due_at' as deadline, id, "status" as status, "comms_initial_due_at" as due_at
from "core"."incident" where "comms_initial_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']);

-- incident.determination_due_at  (unbound)
select 'incident' as table, 'determination_due_at' as deadline, id, "status" as status, "determination_due_at" as due_at
from "core"."incident" where "determination_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']);

-- incident.ic_assignment_due_at  (unbound)
select 'incident' as table, 'ic_assignment_due_at' as deadline, id, "status" as status, "ic_assignment_due_at" as due_at
from "core"."incident" where "ic_assignment_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']);

-- indemnification.advance_due_at  (RII-05)
select 'indemnification' as table, 'advance_due_at' as deadline, id, "status" as status, "advance_due_at" as due_at
from "core"."indemnification" where "advance_due_at" < now() and "status" = any(array['requested', 'under_review', 'determined']);

-- indemnification.determination_due_at  (RII-04, RII-07)
select 'indemnification' as table, 'determination_due_at' as deadline, id, "status" as status, "determination_due_at" as due_at
from "core"."indemnification" where "determination_due_at" < now() and "status" = any(array['requested', 'under_review', 'determined']);

-- indemnification.payment_due_at  (RII-03, RII-04)
select 'indemnification' as table, 'payment_due_at' as deadline, id, "status" as status, "payment_due_at" as due_at
from "core"."indemnification" where "payment_due_at" < now() and "status" = any(array['requested', 'under_review', 'determined']);

-- loan.bankruptcy_chargeoff_due_at  (CO-03)
select 'loan' as table, 'bankruptcy_chargeoff_due_at' as deadline, id, "status" as status, "bankruptcy_chargeoff_due_at" as due_at
from "core"."loan" where "bankruptcy_chargeoff_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.classification_due_at  (CO-03)
select 'loan' as table, 'classification_due_at' as deadline, id, "status" as status, "classification_due_at" as due_at
from "core"."loan" where "classification_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.courtesy_notice_due_at  (CO-02)
select 'loan' as table, 'courtesy_notice_due_at' as deadline, id, "status" as status, "courtesy_notice_due_at" as due_at
from "core"."loan" where "courtesy_notice_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.fraud_chargeoff_due_at  (CO-03)
select 'loan' as table, 'fraud_chargeoff_due_at' as deadline, id, "status" as status, "fraud_chargeoff_due_at" as due_at
from "core"."loan" where "fraud_chargeoff_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.nonaccrual_due_at  (CO-09)
select 'loan' as table, 'nonaccrual_due_at' as deadline, id, "status" as status, "nonaccrual_due_at" as due_at
from "core"."loan" where "nonaccrual_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.rating_review_due_at  (CO-09)
select 'loan' as table, 'rating_review_due_at' as deadline, id, "status" as status, "rating_review_due_at" as due_at
from "core"."loan" where "rating_review_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.right_to_cure_due_at  (CO-02)
select 'loan' as table, 'right_to_cure_due_at' as deadline, id, "status" as status, "right_to_cure_due_at" as due_at
from "core"."loan" where "right_to_cure_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.second_reminder_due_at  (CO-02)
select 'loan' as table, 'second_reminder_due_at' as deadline, id, "status" as status, "second_reminder_due_at" as due_at
from "core"."loan" where "second_reminder_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan.status_memo_due_at  (CO-02)
select 'loan' as table, 'status_memo_due_at' as deadline, id, "status" as status, "status_memo_due_at" as due_at
from "core"."loan" where "status_memo_due_at" < now() and "status" = any(array['booking_requested', 'funded']);

-- loan_application.aan_due_at  (FL-05, LP-03, LP-07)
select 'loan_application' as table, 'aan_due_at' as deadline, id, "status" as status, "aan_due_at" as due_at
from "core"."loan_application" where "aan_due_at" < now() and "status" = any(array['created', 'decisioned', 'counteroffer', 'final_action']);

-- loan_application.counteroffer_aan_due_at  (FL-05, LP-07)
select 'loan_application' as table, 'counteroffer_aan_due_at' as deadline, id, "status" as status, "counteroffer_aan_due_at" as due_at
from "core"."loan_application" where "counteroffer_aan_due_at" < now() and "status" = any(array['created', 'decisioned', 'counteroffer', 'final_action']);

-- loan_application.decision_due_at  (LP-03)
select 'loan_application' as table, 'decision_due_at' as deadline, id, "status" as status, "decision_due_at" as due_at
from "core"."loan_application" where "decision_due_at" < now() and "status" = any(array['created', 'decisioned', 'counteroffer', 'final_action']);

-- records_package.complete_due_at  (RS-08)
select 'records_package' as table, 'complete_due_at' as deadline, id, "status" as status, "complete_due_at" as due_at
from "core"."records_package" where "complete_due_at" < now() and "status" = any(array['requested', 'building', 'failed']);

-- records_package.start_due_at  (RS-08)
select 'records_package' as table, 'start_due_at' as deadline, id, "status" as status, "start_due_at" as due_at
from "core"."records_package" where "start_due_at" < now() and "status" = any(array['requested', 'building', 'failed']);

-- risk.assessment_due_at  (BSA-02)
select 'risk' as table, 'assessment_due_at' as deadline, id, "status" as status, "assessment_due_at" as due_at
from "core"."risk" where "assessment_due_at" < now() and "status" = any(array['registered', 'assessed', 'monitored']);

-- risk.product_assessment_due_at  (IS-02)
select 'risk' as table, 'product_assessment_due_at' as deadline, id, "status" as status, "product_assessment_due_at" as due_at
from "core"."risk" where "product_assessment_due_at" < now() and "status" = any(array['registered', 'assessed', 'monitored']);

-- risk.reassessment_due_at  (ERM-04, IS-02)
select 'risk' as table, 'reassessment_due_at' as deadline, id, "status" as status, "reassessment_due_at" as due_at
from "core"."risk" where "reassessment_due_at" < now() and "status" = any(array['registered', 'assessed', 'monitored']);

-- trade.reconciliation_due_at  (IP-14)
select 'trade' as table, 'reconciliation_due_at' as deadline, id, "status" as status, "reconciliation_due_at" as due_at
from "core"."trade" where "reconciliation_due_at" < now() and "status" = any(array['entered', 'confirmed', 'blocked']);

-- training.annual_due_at  (BA-08, BSA-15, CM-05, CP-11, DF-01, DF-10, EC-12, EPS-09, FL-11, IS-17, PR-06, RR-10)
select 'training' as table, 'annual_due_at' as deadline, id, "status" as status, "annual_due_at" as due_at
from "core"."training" where "annual_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']);

-- training.completion_due_at  (BSA-15, CM-05, DF-01, EC-12, TIS-10)
select 'training' as table, 'completion_due_at' as deadline, id, "status" as status, "completion_due_at" as due_at
from "core"."training" where "completion_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']);

-- training.newhire_due_at  (BSA-15, CP-11, DF-01, EC-12, EPS-09, FL-11, RR-10)
select 'training' as table, 'newhire_due_at' as deadline, id, "status" as status, "newhire_due_at" as due_at
from "core"."training" where "newhire_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']);

-- training.onboarding_due_at  (CM-05, IS-17, PR-06)
select 'training' as table, 'onboarding_due_at' as deadline, id, "status" as status, "onboarding_due_at" as due_at
from "core"."training" where "onboarding_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']);

-- training.retention_due_at  (unbound)
select 'training' as table, 'retention_due_at' as deadline, id, "status" as status, "retention_due_at" as due_at
from "core"."training" where "retention_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']);

-- verification.biometric_purge_due_at  (PR-16)
select 'verification' as table, 'biometric_purge_due_at' as deadline, id, "status" as status, "biometric_purge_due_at" as due_at
from "core"."verification" where "biometric_purge_due_at" < now() and "status" = any(array['pending', 'approved']);

