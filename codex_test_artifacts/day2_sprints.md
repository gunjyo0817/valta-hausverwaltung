# Day 2 Sprint Plan

## Sprint 1: Admin Demo Data Control

Purpose: add a visible admin/demo control surface where the database can be cleared and reloaded during demos.

Steps:
- Add an admin route or modal, for example `/admin/demo-data`, accessible from the role switcher or settings area.
- Show current demo DB status: counts for tickets, properties, units, contractors, notifications, approvals, invoices, documents, AI activity, and AI suggestions.
- Add two primary actions: "Clear demo data" and "Reload mock data".
- Add a confirmation step for destructive actions.
- Keep accounts, users, roles, and organizations intact.
- Show clear success/error feedback after each action.
- Invalidate React Query caches after clear/reseed so the UI updates immediately.

How to test:
- Open the admin page and verify table counts are displayed.
- Click "Clear demo data", confirm, then verify tickets/properties/etc. disappear while role switching and demo accounts still work.
- Click "Reload mock data", then verify dashboard, inbox, properties, contractors, owner, tenant, and contractor views repopulate.
- Repeat clear/reload twice to confirm operations are idempotent.

## Sprint 2: Backend Reset and Seed Services

Purpose: implement the backend functions that power the admin UI safely.

Steps:
- Create server functions for `getDemoDataStatus`, `clearDemoData`, and `reloadDemoData`.
- Move seed logic into reusable functions instead of only script execution.
- Add safe deletion ordering for relational tables.
- Preserve immutable demo identity tables.
- Add an environment guard such as `DEMO_ADMIN_ENABLED=true`.
- Refuse to run destructive actions unless the guard is enabled.
- Return structured counts before/after each operation.
- Add package scripts for local CLI reset as a fallback.

How to test:
- Run the status function and compare counts with direct DB records.
- Run clear and verify only mutable tables are emptied.
- Run reload and verify expected row counts return.
- Temporarily disable the demo guard and verify clear/reload are rejected.

## Sprint 3: Empty-State Reliability

Purpose: make the UI behave cleanly when the admin page clears demo data.

Steps:
- Remove silent frontend mock fallbacks from core DB-backed screens where possible.
- Add empty states for dashboard, inbox, properties, contractors, tenant tickets, contractor jobs, owner approvals, and notifications.
- Ensure empty states offer a path back to the admin demo-data page.
- Keep the app shell, role switcher, language switcher, and navigation usable with an empty DB.
- Make read errors visually distinct from an intentionally empty database.

How to test:
- Clear demo data from the admin page.
- Visit every primary role route and confirm no crashes, blank panels, or mock data leakage.
- Verify empty states are understandable and link back to reload demo data.
- Reload mock data and verify all empty states disappear.

## Sprint 4: Core Data Consistency

Purpose: make seeded and demo-mutated data stay internally consistent.

Steps:
- Compute dashboard KPIs from DB data instead of hardcoded values.
- Compute or sync property open/critical ticket counts.
- Compute or sync contractor active/past job counts.
- Make assignment, completion, and status changes update related data consistently.
- Wrap multi-table writes in transactions where supported.
- Add idempotency protection for repeated clicks on clear/reload and major ticket actions.

How to test:
- Reload seed data and record dashboard/property/contractor counts.
- Create a ticket and verify dashboard and property counts change.
- Assign a contractor and verify contractor active jobs changes.
- Complete a job and verify active/past counts and ticket status update.
- Double-click important mutation buttons and verify duplicate rows/events are not created.

## Sprint 5: Ticket Workflow Completion

Purpose: make all visible ticket actions alter backend state in a way the demo can show.

Steps:
- Add PM manual status controls using the existing `updateTicketStatus` backend function.
- Define allowed demo status transitions.
- Add tenant reply/add-info flow for missing-information requests.
- Add tenant "confirm resolved" flow if repair confirmation remains in the UI copy.
- Add contractor completion form with note, optional photo metadata, and optional invoice placeholder.
- Improve mutation loading/error feedback on ticket detail and contractor views.

How to test:
- Open a ticket as PM and move it through each allowed status.
- Request missing info, switch to tenant, add the missing information, and verify PM sees it.
- Assign/start/complete a contractor job and verify tenant tracking updates.
- Try invalid/repeated actions and verify the UI prevents or reports them.

## Sprint 6: Demo Uploads and Documents

Purpose: make photo and document interactions real enough for a prototype.

Steps:
- Add a demo upload abstraction for local/dev or object storage.
- Store uploaded file metadata and usable URLs in the `documents` table.
- Wire uploads from PM ticket detail, tenant ticket detail, intake/new request, and property detail.
- Add type, size, and count validation.
- Add previews or download links for uploaded files.
- Wire or remove `/portal` add-photo behavior.

How to test:
- Upload a photo during intake and verify it appears on the created ticket.
- Upload a tenant photo after ticket creation and verify PM gets a notification.
- Upload a property document and verify it appears on the property detail page with a working link.
- Try invalid file types or oversized files and verify errors are shown.

## Sprint 7: Messaging and Delivery Simulation

Purpose: align UI claims like "sent by email/SMS" with backend state, without real email/SMS integration.

Steps:
- Add a lightweight delivery/message table or a clear event extension.
- Track outbound PM replies, missing-info requests, contractor assignment summaries, and contractor replies.
- Add simulated statuses such as queued, sent, failed, and read if useful.
- Show delivery status in ticket timeline or side panels.
- Replace contractor message static threads with DB-backed ticket events/messages.
- Add resend/retry only if it helps the demo.

How to test:
- Approve a PM reply and verify a delivery record appears.
- Assign a contractor and verify simulated email/SMS summary delivery is recorded.
- Send a contractor message and verify it persists after refresh.
- Force or seed a failed delivery and verify the UI shows it.

## Sprint 8: Contractor Schedule

Purpose: replace hardcoded schedule data with backend appointments.

Steps:
- Add appointment/schedule schema.
- Seed appointments with demo data.
- Replace static week arrays with backend schedule queries.
- Persist ETA and scheduled time when assigning a contractor.
- Add a simple reschedule action.
- Keep contractor schedule, tenant ETA, and ticket detail in sync.

How to test:
- Reload mock data and verify schedule matches seeded appointments.
- Assign a contractor with an ETA/scheduled slot and verify the schedule updates.
- Reschedule an appointment and verify contractor and tenant views both change.
- Clear demo data and verify schedule empty states work.

## Sprint 9: Owner Financials and Approvals

Purpose: make owner-facing financial and approval screens DB-backed.

Steps:
- Add backend financial summary endpoint for monthly spend, YTD spend, budget utilization, category breakdown, and critical-case costs.
- Replace hardcoded owner financial KPIs/charts.
- Export invoice CSV from backend-backed invoice data.
- Add approval clarification message flow, not just status update.
- Link approvals to related properties, tickets, documents, invoices, or quotes where available.
- Add audit events for approval decisions.

How to test:
- Reload mock data and verify owner charts match seeded invoice/approval values.
- Approve, reject, and request clarification; verify approval status changes and PM notification/audit entries exist.
- Export CSV and verify it contains the currently displayed invoices.
- Clear demo data and verify owner financials/approvals empty states work.

## Sprint 10: AI, Insights, Search, and Polish

Purpose: finish remaining visible controls and reduce unnecessary AI churn.

Steps:
- Cache AI summaries, reply drafts, missing-info checks, urgency classifications, and contractor suggestions.
- Add explicit regenerate actions where useful.
- Wire real translation calls or adjust UI copy to reflect localized toggle behavior.
- Add backend-backed AI insights endpoint.
- Implement global header search.
- Add server-side filtering/sorting/pagination for growing lists.
- Wire or remove settings/profile affordance.
- Replace quote `mailto:` with a demo quote-request workflow if it remains visible.

How to test:
- Open a ticket repeatedly and verify AI suggestions are reused unless regenerated.
- Click regenerate and verify a new AI suggestion record is created.
- Use translation controls and verify the expected backend or UI behavior.
- Search for a ticket/property/contractor globally and verify navigation/results.
- Verify insights change after ticket/contractor data changes.

## Sprint 11: Demo Safety and Regression Tests

Purpose: make the prototype safe and repeatable for live demos.

Steps:
- Add demo-role authorization checks on every write path.
- Add mutation toasts/errors consistently.
- Add tests for reset/seed, ticket creation, assignment, contractor actions, approval decisions, notifications, role scoping, and AI fallback.
- Add a demo operator guide with reset/reseed instructions and recommended walkthrough flows.
- Document which features are simulated versus real backend-backed.

How to test:
- Run the test suite and smoke-test all main role flows.
- Try write actions from the wrong demo role and verify they are rejected.
- Follow the operator guide from a clean reset and confirm the demo can be repeated end to end.
- Run clear/reseed after heavy demo mutations and verify the app returns to baseline.

