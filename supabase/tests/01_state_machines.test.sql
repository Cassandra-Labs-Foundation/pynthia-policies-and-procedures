-- State-machine CHECK enforcement
-- generated from controls.json + model.json — DO NOT EDIT BY HAND
begin;
select plan(48);


-- account: status in ['open', 'frozen', 'closed']
select lives_ok($$insert into "core"."account" ("id", "status") values ('t_smoke_account', 'open')$$, 'account: valid status open accepted');
select throws_ok($$insert into "core"."account" ("id", "status") values ('t_smoke_bad_account', '__invalid__')$$, '23514', null, 'account: invalid status rejected by CHECK');

-- account_number: status in ['active', 'disabled', 'canceled']
select lives_ok($$insert into "core"."account_number" ("id", "status") values ('t_smoke_account_number', 'active')$$, 'account_number: valid status active accepted');
select throws_ok($$insert into "core"."account_number" ("id", "status") values ('t_smoke_bad_account_number', '__invalid__')$$, '23514', null, 'account_number: invalid status rejected by CHECK');

-- ach_transfer: status in ['pending_approval', 'submitted', 'settled', 'returned', 'rejected', 'canceled']
select lives_ok($$insert into "core"."ach_transfer" ("status") values ('pending_approval')$$, 'ach_transfer: valid status pending_approval accepted');
select throws_ok($$insert into "core"."ach_transfer" ("status") values ('__invalid__')$$, '23514', null, 'ach_transfer: invalid status rejected by CHECK');

-- case: status in ['opened', 'in_review', 'closed']
select lives_ok($$insert into "core"."case" ("id", "status") values ('t_smoke_case', 'opened')$$, 'case: valid status opened accepted');
select throws_ok($$insert into "core"."case" ("id", "status") values ('t_smoke_bad_case', '__invalid__')$$, '23514', null, 'case: invalid status rejected by CHECK');

-- change: status in ['requested', 'in_review', 'deployed', 'closed']
select lives_ok($$insert into "core"."change" ("status") values ('requested')$$, 'change: valid status requested accepted');
select throws_ok($$insert into "core"."change" ("status") values ('__invalid__')$$, '23514', null, 'change: invalid status rejected by CHECK');

-- coi: status in ['disclosed', 'under_review', 'determined']
select lives_ok($$insert into "core"."coi" ("status") values ('disclosed')$$, 'coi: valid status disclosed accepted');
select throws_ok($$insert into "core"."coi" ("status") values ('__invalid__')$$, '23514', null, 'coi: invalid status rejected by CHECK');

-- complaint: status in ['received', 'investigating', 'resolved', 'closed']
select lives_ok($$insert into "core"."complaint" ("status") values ('received')$$, 'complaint: valid status received accepted');
select throws_ok($$insert into "core"."complaint" ("status") values ('__invalid__')$$, '23514', null, 'complaint: invalid status rejected by CHECK');

-- dispute: status in ['filed', 'investigating', 'resolved', 'closed']
select lives_ok($$insert into "core"."dispute" ("status") values ('filed')$$, 'dispute: valid status filed accepted');
select throws_ok($$insert into "core"."dispute" ("status") values ('__invalid__')$$, '23514', null, 'dispute: invalid status rejected by CHECK');

-- entity: status in ['pending', 'active', 'disabled', 'archived']
select lives_ok($$insert into "core"."entity" ("id", "status") values ('t_smoke_entity', 'pending')$$, 'entity: valid status pending accepted');
select throws_ok($$insert into "core"."entity" ("id", "status") values ('t_smoke_bad_entity', '__invalid__')$$, '23514', null, 'entity: invalid status rejected by CHECK');

-- filing: status in ['prepared', 'submitted', 'acknowledged', 'continuing', 'amended', 'nil_determined']
select lives_ok($$insert into "core"."filing" ("id", "status") values ('t_smoke_filing', 'prepared')$$, 'filing: valid status prepared accepted');
select throws_ok($$insert into "core"."filing" ("id", "status") values ('t_smoke_bad_filing', '__invalid__')$$, '23514', null, 'filing: invalid status rejected by CHECK');

-- finding: status in ['open', 'in_remediation', 'risk_accepted', 'closed']
select lives_ok($$insert into "core"."finding" ("status") values ('open')$$, 'finding: valid status open accepted');
select throws_ok($$insert into "core"."finding" ("status") values ('__invalid__')$$, '23514', null, 'finding: invalid status rejected by CHECK');

-- handover: status in ['initiated', 'provisioned', 'completed']
select lives_ok($$insert into "core"."handover" ("status") values ('initiated')$$, 'handover: valid status initiated accepted');
select throws_ok($$insert into "core"."handover" ("status") values ('__invalid__')$$, '23514', null, 'handover: invalid status rejected by CHECK');

-- incident: status in ['declared', 'responding', 'contained', 'postmortem', 'closed']
select lives_ok($$insert into "core"."incident" ("id", "status") values ('t_smoke_incident', 'declared')$$, 'incident: valid status declared accepted');
select throws_ok($$insert into "core"."incident" ("id", "status") values ('t_smoke_bad_incident', '__invalid__')$$, '23514', null, 'incident: invalid status rejected by CHECK');

-- indemnification: status in ['requested', 'under_review', 'determined', 'paid']
select lives_ok($$insert into "core"."indemnification" ("status") values ('requested')$$, 'indemnification: valid status requested accepted');
select throws_ok($$insert into "core"."indemnification" ("status") values ('__invalid__')$$, '23514', null, 'indemnification: invalid status rejected by CHECK');

-- insider: status in ['requested', 'board_review', 'approved', 'denied']
select lives_ok($$insert into "core"."insider" ("status") values ('requested')$$, 'insider: valid status requested accepted');
select throws_ok($$insert into "core"."insider" ("status") values ('__invalid__')$$, '23514', null, 'insider: invalid status rejected by CHECK');

-- loan: status in ['booking_requested', 'booked', 'funded']
select lives_ok($$insert into "core"."loan" ("id", "status") values ('t_smoke_loan', 'booking_requested')$$, 'loan: valid status booking_requested accepted');
select throws_ok($$insert into "core"."loan" ("id", "status") values ('t_smoke_bad_loan', '__invalid__')$$, '23514', null, 'loan: invalid status rejected by CHECK');

-- loan_application: status in ['created', 'decisioned', 'counteroffer', 'final_action']
select lives_ok($$insert into "core"."loan_application" ("id", "status") values ('t_smoke_loan_application', 'created')$$, 'loan_application: valid status created accepted');
select throws_ok($$insert into "core"."loan_application" ("id", "status") values ('t_smoke_bad_loan_application', '__invalid__')$$, '23514', null, 'loan_application: invalid status rejected by CHECK');

-- records_package: status in ['requested', 'building', 'complete', 'failed']
select lives_ok($$insert into "core"."records_package" ("status") values ('requested')$$, 'records_package: valid status requested accepted');
select throws_ok($$insert into "core"."records_package" ("status") values ('__invalid__')$$, '23514', null, 'records_package: invalid status rejected by CHECK');

-- risk: status in ['registered', 'assessed', 'monitored', 'closed']
select lives_ok($$insert into "core"."risk" ("id", "status") values ('t_smoke_risk', 'registered')$$, 'risk: valid status registered accepted');
select throws_ok($$insert into "core"."risk" ("id", "status") values ('t_smoke_bad_risk', '__invalid__')$$, '23514', null, 'risk: invalid status rejected by CHECK');

-- task: status in ['pending', 'due', 'completed', 'overdue']
select lives_ok($$insert into "core"."task" ("id", "status") values ('t_smoke_task', 'pending')$$, 'task: valid status pending accepted');
select throws_ok($$insert into "core"."task" ("id", "status") values ('t_smoke_bad_task', '__invalid__')$$, '23514', null, 'task: invalid status rejected by CHECK');

-- trade: status in ['entered', 'confirmed', 'settled', 'blocked']
select lives_ok($$insert into "core"."trade" ("status") values ('entered')$$, 'trade: valid status entered accepted');
select throws_ok($$insert into "core"."trade" ("status") values ('__invalid__')$$, '23514', null, 'trade: invalid status rejected by CHECK');

-- training: status in ['assigned', 'in_progress', 'completed', 'lapsed']
select lives_ok($$insert into "core"."training" ("status") values ('assigned')$$, 'training: valid status assigned accepted');
select throws_ok($$insert into "core"."training" ("status") values ('__invalid__')$$, '23514', null, 'training: invalid status rejected by CHECK');

-- verification: status in ['pending', 'approved', 'denied']
select lives_ok($$insert into "core"."verification" ("id", "status") values ('t_smoke_verification', 'pending')$$, 'verification: valid status pending accepted');
select throws_ok($$insert into "core"."verification" ("id", "status") values ('t_smoke_bad_verification', '__invalid__')$$, '23514', null, 'verification: invalid status rejected by CHECK');

-- wire_transfer: status in ['pending_approval', 'submitted', 'completed', 'return_requested', 'returned', 'rejected', 'canceled']
select lives_ok($$insert into "core"."wire_transfer" ("status") values ('pending_approval')$$, 'wire_transfer: valid status pending_approval accepted');
select throws_ok($$insert into "core"."wire_transfer" ("status") values ('__invalid__')$$, '23514', null, 'wire_transfer: invalid status rejected by CHECK');
select * from finish();
rollback;
