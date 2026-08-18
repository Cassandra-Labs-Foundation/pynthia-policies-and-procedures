-- Deadline data-invariants — 50 due-date checks
-- generated from controls.json + model.json — DO NOT EDIT BY HAND
begin;
select plan(50);


-- account.closure_payout_due_at  (evidences MP-05); open states: ['open', 'frozen']
insert into "core"."account" ("id", "closure_payout_due_at", "status") values ('t_dl_account_closure_payout_due_at_viol', now() - interval '1 day', 'open');
insert into "core"."account" ("id", "closure_payout_due_at", "status") values ('t_dl_account_closure_payout_due_at_ok_future', now() + interval '30 days', 'open');
insert into "core"."account" ("id", "closure_payout_due_at", "status") values ('t_dl_account_closure_payout_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."account" where "closure_payout_due_at" < now() and "status" = any(array['open', 'frozen']))::int, 1, 'account.closure_payout_due_at past-due detection flags exactly the violator (evidences MP-05)');

-- account.maturity_notice_due_at  (evidences TIS-04); open states: ['open', 'frozen']
insert into "core"."account" ("id", "maturity_notice_due_at", "status") values ('t_dl_account_maturity_notice_due_at_viol', now() - interval '1 day', 'open');
insert into "core"."account" ("id", "maturity_notice_due_at", "status") values ('t_dl_account_maturity_notice_due_at_ok_future', now() + interval '30 days', 'open');
insert into "core"."account" ("id", "maturity_notice_due_at", "status") values ('t_dl_account_maturity_notice_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."account" where "maturity_notice_due_at" < now() and "status" = any(array['open', 'frozen']))::int, 1, 'account.maturity_notice_due_at past-due detection flags exactly the violator (evidences TIS-04)');

-- bsa_alert.triage_due_at  (no direct control binding); open states: n/a (no status enum)
insert into "core"."bsa_alert" ("id", "triage_due_at") values ('t_dl_bsa_alert_triage_due_at_viol', now() - interval '1 day');
insert into "core"."bsa_alert" ("id", "triage_due_at") values ('t_dl_bsa_alert_triage_due_at_ok_future', now() + interval '30 days');
select is( (select count(*) from "core"."bsa_alert" where "triage_due_at" < now())::int, 1, 'bsa_alert.triage_due_at past-due detection flags exactly the violator (no direct control binding)');

-- change.cab_review_due_at  (evidences EC-05, IC-05, IS-04); open states: ['requested', 'in_review', 'deployed']
insert into "core"."change" ("cab_review_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."change" ("cab_review_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."change" ("cab_review_due_at", "status") values (now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."change" where "cab_review_due_at" < now() and "status" = any(array['requested', 'in_review', 'deployed']))::int, 1, 'change.cab_review_due_at past-due detection flags exactly the violator (evidences EC-05, IC-05, IS-04)');

-- change.post_review_due_at  (evidences IC-05, IS-04); open states: ['requested', 'in_review', 'deployed']
insert into "core"."change" ("post_review_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."change" ("post_review_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."change" ("post_review_due_at", "status") values (now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."change" where "post_review_due_at" < now() and "status" = any(array['requested', 'in_review', 'deployed']))::int, 1, 'change.post_review_due_at past-due detection flags exactly the violator (evidences IC-05, IS-04)');

-- coi.questionnaire_due_at  (evidences DF-03, IP-16); open states: ['under_review', 'determined']
insert into "core"."coi" ("questionnaire_due_at", "status") values (now() - interval '1 day', 'under_review');
insert into "core"."coi" ("questionnaire_due_at", "status") values (now() + interval '30 days', 'under_review');
insert into "core"."coi" ("questionnaire_due_at", "status") values (now() - interval '1 day', 'disclosed');
select is( (select count(*) from "core"."coi" where "questionnaire_due_at" < now() and "status" = any(array['under_review', 'determined']))::int, 1, 'coi.questionnaire_due_at past-due detection flags exactly the violator (evidences DF-03, IP-16)');

-- complaint.ack_due_at  (evidences CO-06, FL-13, MP-04); open states: ['received', 'investigating']
insert into "core"."complaint" ("ack_due_at", "status") values (now() - interval '1 day', 'received');
insert into "core"."complaint" ("ack_due_at", "status") values (now() + interval '30 days', 'received');
insert into "core"."complaint" ("ack_due_at", "status") values (now() - interval '1 day', 'resolved');
select is( (select count(*) from "core"."complaint" where "ack_due_at" < now() and "status" = any(array['received', 'investigating']))::int, 1, 'complaint.ack_due_at past-due detection flags exactly the violator (evidences CO-06, FL-13, MP-04)');

-- complaint.final_response_due_at  (evidences CO-06, MP-04); open states: ['received', 'investigating']
insert into "core"."complaint" ("final_response_due_at", "status") values (now() - interval '1 day', 'received');
insert into "core"."complaint" ("final_response_due_at", "status") values (now() + interval '30 days', 'received');
insert into "core"."complaint" ("final_response_due_at", "status") values (now() - interval '1 day', 'resolved');
select is( (select count(*) from "core"."complaint" where "final_response_due_at" < now() and "status" = any(array['received', 'investigating']))::int, 1, 'complaint.final_response_due_at past-due detection flags exactly the violator (evidences CO-06, MP-04)');

-- complaint.initial_response_due_at  (evidences CO-06, FL-13, MP-04, PR-10); open states: ['received', 'investigating']
insert into "core"."complaint" ("initial_response_due_at", "status") values (now() - interval '1 day', 'received');
insert into "core"."complaint" ("initial_response_due_at", "status") values (now() + interval '30 days', 'received');
insert into "core"."complaint" ("initial_response_due_at", "status") values (now() - interval '1 day', 'resolved');
select is( (select count(*) from "core"."complaint" where "initial_response_due_at" < now() and "status" = any(array['received', 'investigating']))::int, 1, 'complaint.initial_response_due_at past-due detection flags exactly the violator (evidences CO-06, FL-13, MP-04, PR-10)');

-- complaint.resolution_due_at  (evidences CM-08, CO-06); open states: ['received', 'investigating']
insert into "core"."complaint" ("resolution_due_at", "status") values (now() - interval '1 day', 'received');
insert into "core"."complaint" ("resolution_due_at", "status") values (now() + interval '30 days', 'received');
insert into "core"."complaint" ("resolution_due_at", "status") values (now() - interval '1 day', 'resolved');
select is( (select count(*) from "core"."complaint" where "resolution_due_at" < now() and "status" = any(array['received', 'investigating']))::int, 1, 'complaint.resolution_due_at past-due detection flags exactly the violator (evidences CM-08, CO-06)');

-- dispute.investigation_due_at  (no direct control binding); open states: ['investigating']
insert into "core"."dispute" ("investigation_due_at", "status") values (now() - interval '1 day', 'investigating');
insert into "core"."dispute" ("investigation_due_at", "status") values (now() + interval '30 days', 'investigating');
insert into "core"."dispute" ("investigation_due_at", "status") values (now() - interval '1 day', 'filed');
select is( (select count(*) from "core"."dispute" where "investigation_due_at" < now() and "status" = any(array['investigating']))::int, 1, 'dispute.investigation_due_at past-due detection flags exactly the violator (no direct control binding)');

-- dispute.provisional_credit_due_at  (evidences MP-04); open states: ['investigating']
insert into "core"."dispute" ("provisional_credit_due_at", "status") values (now() - interval '1 day', 'investigating');
insert into "core"."dispute" ("provisional_credit_due_at", "status") values (now() + interval '30 days', 'investigating');
insert into "core"."dispute" ("provisional_credit_due_at", "status") values (now() - interval '1 day', 'filed');
select is( (select count(*) from "core"."dispute" where "provisional_credit_due_at" < now() and "status" = any(array['investigating']))::int, 1, 'dispute.provisional_credit_due_at past-due detection flags exactly the violator (evidences MP-04)');

-- dispute.response_due_at  (evidences MP-04); open states: ['investigating']
insert into "core"."dispute" ("response_due_at", "status") values (now() - interval '1 day', 'investigating');
insert into "core"."dispute" ("response_due_at", "status") values (now() + interval '30 days', 'investigating');
insert into "core"."dispute" ("response_due_at", "status") values (now() - interval '1 day', 'filed');
select is( (select count(*) from "core"."dispute" where "response_due_at" < now() and "status" = any(array['investigating']))::int, 1, 'dispute.response_due_at past-due detection flags exactly the violator (evidences MP-04)');

-- finding.escalation_due_at  (evidences AU-07); open states: ['open', 'in_remediation', 'risk_accepted']
insert into "core"."finding" ("escalation_due_at", "status") values (now() - interval '1 day', 'open');
insert into "core"."finding" ("escalation_due_at", "status") values (now() + interval '30 days', 'open');
insert into "core"."finding" ("escalation_due_at", "status") values (now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."finding" where "escalation_due_at" < now() and "status" = any(array['open', 'in_remediation', 'risk_accepted']))::int, 1, 'finding.escalation_due_at past-due detection flags exactly the violator (evidences AU-07)');

-- finding.response_due_at  (evidences AU-08); open states: ['open', 'in_remediation', 'risk_accepted']
insert into "core"."finding" ("response_due_at", "status") values (now() - interval '1 day', 'open');
insert into "core"."finding" ("response_due_at", "status") values (now() + interval '30 days', 'open');
insert into "core"."finding" ("response_due_at", "status") values (now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."finding" where "response_due_at" < now() and "status" = any(array['open', 'in_remediation', 'risk_accepted']))::int, 1, 'finding.response_due_at past-due detection flags exactly the violator (evidences AU-08)');

-- handover.full_due_at  (evidences RS-07); open states: ['initiated', 'provisioned']
insert into "core"."handover" ("full_due_at", "status") values (now() - interval '1 day', 'initiated');
insert into "core"."handover" ("full_due_at", "status") values (now() + interval '30 days', 'initiated');
insert into "core"."handover" ("full_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."handover" where "full_due_at" < now() and "status" = any(array['initiated', 'provisioned']))::int, 1, 'handover.full_due_at past-due detection flags exactly the violator (evidences RS-07)');

-- handover.initial_due_at  (evidences RS-07); open states: ['initiated', 'provisioned']
insert into "core"."handover" ("initial_due_at", "status") values (now() - interval '1 day', 'initiated');
insert into "core"."handover" ("initial_due_at", "status") values (now() + interval '30 days', 'initiated');
insert into "core"."handover" ("initial_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."handover" where "initial_due_at" < now() and "status" = any(array['initiated', 'provisioned']))::int, 1, 'handover.initial_due_at past-due detection flags exactly the violator (evidences RS-07)');

-- incident.ncua_notice_due_at  (evidences SC-01); open states: ['detected', 'declared', 'contained', 'restored']
insert into "core"."incident" ("id", "ncua_notice_due_at", "status") values ('t_dl_incident_ncua_notice_due_at_viol', now() - interval '1 day', 'detected');
insert into "core"."incident" ("id", "ncua_notice_due_at", "status") values ('t_dl_incident_ncua_notice_due_at_ok_future', now() + interval '30 days', 'detected');
insert into "core"."incident" ("id", "ncua_notice_due_at", "status") values ('t_dl_incident_ncua_notice_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."incident" where "ncua_notice_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']))::int, 1, 'incident.ncua_notice_due_at past-due detection flags exactly the violator (evidences SC-01)');

-- incident.notification_due_at  (evidences SC-01); open states: ['detected', 'declared', 'contained', 'restored']
insert into "core"."incident" ("id", "notification_due_at", "status") values ('t_dl_incident_notification_due_at_viol', now() - interval '1 day', 'detected');
insert into "core"."incident" ("id", "notification_due_at", "status") values ('t_dl_incident_notification_due_at_ok_future', now() + interval '30 days', 'detected');
insert into "core"."incident" ("id", "notification_due_at", "status") values ('t_dl_incident_notification_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."incident" where "notification_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']))::int, 1, 'incident.notification_due_at past-due detection flags exactly the violator (evidences SC-01)');

-- incident.triage_due_at  (evidences CO-11, PR-18); open states: ['detected', 'declared', 'contained', 'restored']
insert into "core"."incident" ("id", "triage_due_at", "status") values ('t_dl_incident_triage_due_at_viol', now() - interval '1 day', 'detected');
insert into "core"."incident" ("id", "triage_due_at", "status") values ('t_dl_incident_triage_due_at_ok_future', now() + interval '30 days', 'detected');
insert into "core"."incident" ("id", "triage_due_at", "status") values ('t_dl_incident_triage_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."incident" where "triage_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']))::int, 1, 'incident.triage_due_at past-due detection flags exactly the violator (evidences CO-11, PR-18)');

-- incident.comms_initial_due_at  (no direct control binding); open states: ['detected', 'declared', 'contained', 'restored']
insert into "core"."incident" ("id", "comms_initial_due_at", "status") values ('t_dl_incident_comms_initial_due_at_viol', now() - interval '1 day', 'detected');
insert into "core"."incident" ("id", "comms_initial_due_at", "status") values ('t_dl_incident_comms_initial_due_at_ok_future', now() + interval '30 days', 'detected');
insert into "core"."incident" ("id", "comms_initial_due_at", "status") values ('t_dl_incident_comms_initial_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."incident" where "comms_initial_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']))::int, 1, 'incident.comms_initial_due_at past-due detection flags exactly the violator (no direct control binding)');

-- incident.determination_due_at  (no direct control binding); open states: ['detected', 'declared', 'contained', 'restored']
insert into "core"."incident" ("id", "determination_due_at", "status") values ('t_dl_incident_determination_due_at_viol', now() - interval '1 day', 'detected');
insert into "core"."incident" ("id", "determination_due_at", "status") values ('t_dl_incident_determination_due_at_ok_future', now() + interval '30 days', 'detected');
insert into "core"."incident" ("id", "determination_due_at", "status") values ('t_dl_incident_determination_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."incident" where "determination_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']))::int, 1, 'incident.determination_due_at past-due detection flags exactly the violator (no direct control binding)');

-- incident.ic_assignment_due_at  (no direct control binding); open states: ['detected', 'declared', 'contained', 'restored']
insert into "core"."incident" ("id", "ic_assignment_due_at", "status") values ('t_dl_incident_ic_assignment_due_at_viol', now() - interval '1 day', 'detected');
insert into "core"."incident" ("id", "ic_assignment_due_at", "status") values ('t_dl_incident_ic_assignment_due_at_ok_future', now() + interval '30 days', 'detected');
insert into "core"."incident" ("id", "ic_assignment_due_at", "status") values ('t_dl_incident_ic_assignment_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."incident" where "ic_assignment_due_at" < now() and "status" = any(array['detected', 'declared', 'contained', 'restored']))::int, 1, 'incident.ic_assignment_due_at past-due detection flags exactly the violator (no direct control binding)');

-- indemnification.advance_due_at  (evidences RII-05); open states: ['requested', 'under_review', 'determined']
insert into "core"."indemnification" ("advance_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."indemnification" ("advance_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."indemnification" ("advance_due_at", "status") values (now() - interval '1 day', 'paid');
select is( (select count(*) from "core"."indemnification" where "advance_due_at" < now() and "status" = any(array['requested', 'under_review', 'determined']))::int, 1, 'indemnification.advance_due_at past-due detection flags exactly the violator (evidences RII-05)');

-- indemnification.determination_due_at  (evidences RII-04, RII-07); open states: ['requested', 'under_review', 'determined']
insert into "core"."indemnification" ("determination_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."indemnification" ("determination_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."indemnification" ("determination_due_at", "status") values (now() - interval '1 day', 'paid');
select is( (select count(*) from "core"."indemnification" where "determination_due_at" < now() and "status" = any(array['requested', 'under_review', 'determined']))::int, 1, 'indemnification.determination_due_at past-due detection flags exactly the violator (evidences RII-04, RII-07)');

-- indemnification.payment_due_at  (evidences RII-03, RII-04); open states: ['requested', 'under_review', 'determined']
insert into "core"."indemnification" ("payment_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."indemnification" ("payment_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."indemnification" ("payment_due_at", "status") values (now() - interval '1 day', 'paid');
select is( (select count(*) from "core"."indemnification" where "payment_due_at" < now() and "status" = any(array['requested', 'under_review', 'determined']))::int, 1, 'indemnification.payment_due_at past-due detection flags exactly the violator (evidences RII-03, RII-04)');

-- loan.bankruptcy_chargeoff_due_at  (evidences CO-03); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "bankruptcy_chargeoff_due_at", "status") values ('t_dl_loan_bankruptcy_chargeoff_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "bankruptcy_chargeoff_due_at", "status") values ('t_dl_loan_bankruptcy_chargeoff_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "bankruptcy_chargeoff_due_at", "status") values ('t_dl_loan_bankruptcy_chargeoff_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "bankruptcy_chargeoff_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.bankruptcy_chargeoff_due_at past-due detection flags exactly the violator (evidences CO-03)');

-- loan.classification_due_at  (evidences CO-03); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "classification_due_at", "status") values ('t_dl_loan_classification_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "classification_due_at", "status") values ('t_dl_loan_classification_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "classification_due_at", "status") values ('t_dl_loan_classification_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "classification_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.classification_due_at past-due detection flags exactly the violator (evidences CO-03)');

-- loan.courtesy_notice_due_at  (evidences CO-02); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "courtesy_notice_due_at", "status") values ('t_dl_loan_courtesy_notice_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "courtesy_notice_due_at", "status") values ('t_dl_loan_courtesy_notice_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "courtesy_notice_due_at", "status") values ('t_dl_loan_courtesy_notice_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "courtesy_notice_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.courtesy_notice_due_at past-due detection flags exactly the violator (evidences CO-02)');

-- loan.fraud_chargeoff_due_at  (evidences CO-03); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "fraud_chargeoff_due_at", "status") values ('t_dl_loan_fraud_chargeoff_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "fraud_chargeoff_due_at", "status") values ('t_dl_loan_fraud_chargeoff_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "fraud_chargeoff_due_at", "status") values ('t_dl_loan_fraud_chargeoff_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "fraud_chargeoff_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.fraud_chargeoff_due_at past-due detection flags exactly the violator (evidences CO-03)');

-- loan.nonaccrual_due_at  (evidences CO-09); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "nonaccrual_due_at", "status") values ('t_dl_loan_nonaccrual_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "nonaccrual_due_at", "status") values ('t_dl_loan_nonaccrual_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "nonaccrual_due_at", "status") values ('t_dl_loan_nonaccrual_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "nonaccrual_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.nonaccrual_due_at past-due detection flags exactly the violator (evidences CO-09)');

-- loan.rating_review_due_at  (evidences CO-09); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "rating_review_due_at", "status") values ('t_dl_loan_rating_review_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "rating_review_due_at", "status") values ('t_dl_loan_rating_review_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "rating_review_due_at", "status") values ('t_dl_loan_rating_review_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "rating_review_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.rating_review_due_at past-due detection flags exactly the violator (evidences CO-09)');

-- loan.right_to_cure_due_at  (evidences CO-02); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "right_to_cure_due_at", "status") values ('t_dl_loan_right_to_cure_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "right_to_cure_due_at", "status") values ('t_dl_loan_right_to_cure_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "right_to_cure_due_at", "status") values ('t_dl_loan_right_to_cure_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "right_to_cure_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.right_to_cure_due_at past-due detection flags exactly the violator (evidences CO-02)');

-- loan.second_reminder_due_at  (evidences CO-02); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "second_reminder_due_at", "status") values ('t_dl_loan_second_reminder_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "second_reminder_due_at", "status") values ('t_dl_loan_second_reminder_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "second_reminder_due_at", "status") values ('t_dl_loan_second_reminder_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "second_reminder_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.second_reminder_due_at past-due detection flags exactly the violator (evidences CO-02)');

-- loan.status_memo_due_at  (evidences CO-02); open states: ['booking_requested', 'funded']
insert into "core"."loan" ("id", "status_memo_due_at", "status") values ('t_dl_loan_status_memo_due_at_viol', now() - interval '1 day', 'booking_requested');
insert into "core"."loan" ("id", "status_memo_due_at", "status") values ('t_dl_loan_status_memo_due_at_ok_future', now() + interval '30 days', 'booking_requested');
insert into "core"."loan" ("id", "status_memo_due_at", "status") values ('t_dl_loan_status_memo_due_at_ok_term', now() - interval '1 day', 'booked');
select is( (select count(*) from "core"."loan" where "status_memo_due_at" < now() and "status" = any(array['booking_requested', 'funded']))::int, 1, 'loan.status_memo_due_at past-due detection flags exactly the violator (evidences CO-02)');

-- loan_application.aan_due_at  (evidences FL-05, LP-03, LP-07); open states: ['created', 'decisioned', 'counteroffer', 'final_action']
insert into "core"."loan_application" ("id", "aan_due_at", "status") values ('t_dl_loan_application_aan_due_at_viol', now() - interval '1 day', 'created');
insert into "core"."loan_application" ("id", "aan_due_at", "status") values ('t_dl_loan_application_aan_due_at_ok_future', now() + interval '30 days', 'created');
select is( (select count(*) from "core"."loan_application" where "aan_due_at" < now() and "status" = any(array['created', 'decisioned', 'counteroffer', 'final_action']))::int, 1, 'loan_application.aan_due_at past-due detection flags exactly the violator (evidences FL-05, LP-03, LP-07)');

-- loan_application.counteroffer_aan_due_at  (evidences FL-05, LP-07); open states: ['created', 'decisioned', 'counteroffer', 'final_action']
insert into "core"."loan_application" ("id", "counteroffer_aan_due_at", "status") values ('t_dl_loan_application_counteroffer_aan_due_at_viol', now() - interval '1 day', 'created');
insert into "core"."loan_application" ("id", "counteroffer_aan_due_at", "status") values ('t_dl_loan_application_counteroffer_aan_due_at_ok_future', now() + interval '30 days', 'created');
select is( (select count(*) from "core"."loan_application" where "counteroffer_aan_due_at" < now() and "status" = any(array['created', 'decisioned', 'counteroffer', 'final_action']))::int, 1, 'loan_application.counteroffer_aan_due_at past-due detection flags exactly the violator (evidences FL-05, LP-07)');

-- loan_application.decision_due_at  (evidences LP-03); open states: ['created', 'decisioned', 'counteroffer', 'final_action']
insert into "core"."loan_application" ("id", "decision_due_at", "status") values ('t_dl_loan_application_decision_due_at_viol', now() - interval '1 day', 'created');
insert into "core"."loan_application" ("id", "decision_due_at", "status") values ('t_dl_loan_application_decision_due_at_ok_future', now() + interval '30 days', 'created');
select is( (select count(*) from "core"."loan_application" where "decision_due_at" < now() and "status" = any(array['created', 'decisioned', 'counteroffer', 'final_action']))::int, 1, 'loan_application.decision_due_at past-due detection flags exactly the violator (evidences LP-03)');

-- records_package.complete_due_at  (evidences RS-08); open states: ['requested', 'building', 'failed']
insert into "core"."records_package" ("complete_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."records_package" ("complete_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."records_package" ("complete_due_at", "status") values (now() - interval '1 day', 'complete');
select is( (select count(*) from "core"."records_package" where "complete_due_at" < now() and "status" = any(array['requested', 'building', 'failed']))::int, 1, 'records_package.complete_due_at past-due detection flags exactly the violator (evidences RS-08)');

-- records_package.start_due_at  (evidences RS-08); open states: ['requested', 'building', 'failed']
insert into "core"."records_package" ("start_due_at", "status") values (now() - interval '1 day', 'requested');
insert into "core"."records_package" ("start_due_at", "status") values (now() + interval '30 days', 'requested');
insert into "core"."records_package" ("start_due_at", "status") values (now() - interval '1 day', 'complete');
select is( (select count(*) from "core"."records_package" where "start_due_at" < now() and "status" = any(array['requested', 'building', 'failed']))::int, 1, 'records_package.start_due_at past-due detection flags exactly the violator (evidences RS-08)');

-- risk.assessment_due_at  (evidences BSA-02); open states: ['registered', 'assessed', 'monitored']
insert into "core"."risk" ("id", "assessment_due_at", "status") values ('t_dl_risk_assessment_due_at_viol', now() - interval '1 day', 'registered');
insert into "core"."risk" ("id", "assessment_due_at", "status") values ('t_dl_risk_assessment_due_at_ok_future', now() + interval '30 days', 'registered');
insert into "core"."risk" ("id", "assessment_due_at", "status") values ('t_dl_risk_assessment_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."risk" where "assessment_due_at" < now() and "status" = any(array['registered', 'assessed', 'monitored']))::int, 1, 'risk.assessment_due_at past-due detection flags exactly the violator (evidences BSA-02)');

-- risk.product_assessment_due_at  (evidences IS-02); open states: ['registered', 'assessed', 'monitored']
insert into "core"."risk" ("id", "product_assessment_due_at", "status") values ('t_dl_risk_product_assessment_due_at_viol', now() - interval '1 day', 'registered');
insert into "core"."risk" ("id", "product_assessment_due_at", "status") values ('t_dl_risk_product_assessment_due_at_ok_future', now() + interval '30 days', 'registered');
insert into "core"."risk" ("id", "product_assessment_due_at", "status") values ('t_dl_risk_product_assessment_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."risk" where "product_assessment_due_at" < now() and "status" = any(array['registered', 'assessed', 'monitored']))::int, 1, 'risk.product_assessment_due_at past-due detection flags exactly the violator (evidences IS-02)');

-- risk.reassessment_due_at  (evidences ERM-04, IS-02); open states: ['registered', 'assessed', 'monitored']
insert into "core"."risk" ("id", "reassessment_due_at", "status") values ('t_dl_risk_reassessment_due_at_viol', now() - interval '1 day', 'registered');
insert into "core"."risk" ("id", "reassessment_due_at", "status") values ('t_dl_risk_reassessment_due_at_ok_future', now() + interval '30 days', 'registered');
insert into "core"."risk" ("id", "reassessment_due_at", "status") values ('t_dl_risk_reassessment_due_at_ok_term', now() - interval '1 day', 'closed');
select is( (select count(*) from "core"."risk" where "reassessment_due_at" < now() and "status" = any(array['registered', 'assessed', 'monitored']))::int, 1, 'risk.reassessment_due_at past-due detection flags exactly the violator (evidences ERM-04, IS-02)');

-- trade.reconciliation_due_at  (evidences IP-14); open states: ['entered', 'confirmed', 'blocked']
insert into "core"."trade" ("reconciliation_due_at", "status") values (now() - interval '1 day', 'entered');
insert into "core"."trade" ("reconciliation_due_at", "status") values (now() + interval '30 days', 'entered');
insert into "core"."trade" ("reconciliation_due_at", "status") values (now() - interval '1 day', 'settled');
select is( (select count(*) from "core"."trade" where "reconciliation_due_at" < now() and "status" = any(array['entered', 'confirmed', 'blocked']))::int, 1, 'trade.reconciliation_due_at past-due detection flags exactly the violator (evidences IP-14)');

-- training.annual_due_at  (evidences BA-08, BSA-15, CA-11, CM-05, DF-01, DF-10, EC-12, EPS-09, FL-11, IS-17, PR-06, RR-10); open states: ['assigned', 'in_progress', 'lapsed']
insert into "core"."training" ("annual_due_at", "status") values (now() - interval '1 day', 'assigned');
insert into "core"."training" ("annual_due_at", "status") values (now() + interval '30 days', 'assigned');
insert into "core"."training" ("annual_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."training" where "annual_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']))::int, 1, 'training.annual_due_at past-due detection flags exactly the violator (evidences BA-08, BSA-15, CA-11, CM-05, DF-01, DF-10, EC-12, EPS-09, FL-11, IS-17, PR-06, RR-10)');

-- training.completion_due_at  (evidences BSA-15, CM-05, DF-01, EC-12, TIS-10); open states: ['assigned', 'in_progress', 'lapsed']
insert into "core"."training" ("completion_due_at", "status") values (now() - interval '1 day', 'assigned');
insert into "core"."training" ("completion_due_at", "status") values (now() + interval '30 days', 'assigned');
insert into "core"."training" ("completion_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."training" where "completion_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']))::int, 1, 'training.completion_due_at past-due detection flags exactly the violator (evidences BSA-15, CM-05, DF-01, EC-12, TIS-10)');

-- training.newhire_due_at  (evidences BSA-15, CA-11, DF-01, EC-12, EPS-09, FL-11, RR-10); open states: ['assigned', 'in_progress', 'lapsed']
insert into "core"."training" ("newhire_due_at", "status") values (now() - interval '1 day', 'assigned');
insert into "core"."training" ("newhire_due_at", "status") values (now() + interval '30 days', 'assigned');
insert into "core"."training" ("newhire_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."training" where "newhire_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']))::int, 1, 'training.newhire_due_at past-due detection flags exactly the violator (evidences BSA-15, CA-11, DF-01, EC-12, EPS-09, FL-11, RR-10)');

-- training.onboarding_due_at  (evidences CM-05, IS-17, PR-06); open states: ['assigned', 'in_progress', 'lapsed']
insert into "core"."training" ("onboarding_due_at", "status") values (now() - interval '1 day', 'assigned');
insert into "core"."training" ("onboarding_due_at", "status") values (now() + interval '30 days', 'assigned');
insert into "core"."training" ("onboarding_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."training" where "onboarding_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']))::int, 1, 'training.onboarding_due_at past-due detection flags exactly the violator (evidences CM-05, IS-17, PR-06)');

-- training.retention_due_at  (no direct control binding); open states: ['assigned', 'in_progress', 'lapsed']
insert into "core"."training" ("retention_due_at", "status") values (now() - interval '1 day', 'assigned');
insert into "core"."training" ("retention_due_at", "status") values (now() + interval '30 days', 'assigned');
insert into "core"."training" ("retention_due_at", "status") values (now() - interval '1 day', 'completed');
select is( (select count(*) from "core"."training" where "retention_due_at" < now() and "status" = any(array['assigned', 'in_progress', 'lapsed']))::int, 1, 'training.retention_due_at past-due detection flags exactly the violator (no direct control binding)');

-- verification.biometric_purge_due_at  (evidences PR-16); open states: ['pending', 'approved']
insert into "core"."verification" ("id", "biometric_purge_due_at", "status") values ('t_dl_verification_biometric_purge_due_at_viol', now() - interval '1 day', 'pending');
insert into "core"."verification" ("id", "biometric_purge_due_at", "status") values ('t_dl_verification_biometric_purge_due_at_ok_future', now() + interval '30 days', 'pending');
insert into "core"."verification" ("id", "biometric_purge_due_at", "status") values ('t_dl_verification_biometric_purge_due_at_ok_term', now() - interval '1 day', 'denied');
select is( (select count(*) from "core"."verification" where "biometric_purge_due_at" < now() and "status" = any(array['pending', 'approved']))::int, 1, 'verification.biometric_purge_due_at past-due detection flags exactly the violator (evidences PR-16)');
select * from finish();
rollback;
