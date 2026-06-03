# Test Notes

Use these notes while testing locally with Playwright MCP. Start from a clean baseline by opening `/admin/demo-data` and clicking **Reload mock data**.

## Admin Demo Data

Expected behavior:
- `/admin/demo-data` shows table counts for identity rows and mutable demo rows.
- **Clear demo data** removes mutable data but preserves demo accounts and role switching.
- **Reload mock data** restores the seeded demo state.

How to test:
- Open `/admin/demo-data`.
- Verify counts are visible for tickets, properties, contractors, notifications, approvals, invoices, documents, AI records, and identity rows.
- Click **Clear demo data**, confirm, then visit dashboards and verify empty states.
- Return to `/admin/demo-data`, click **Reload mock data**, then verify main screens repopulate.

## Role Switching

Expected behavior:
- Role switcher changes between PM, tenant, contractor, and owner demo views.
- Each role lands on the correct home page and keeps navigation usable even with empty demo data.

How to test:
- Switch through all four roles from the header/sidebar.
- Verify PM sees dashboard/inbox/insights/properties/contractors.
- Verify tenant sees home/new request/tickets.
- Verify contractor sees jobs/schedule/messages/completed.
- Verify owner sees properties/issues/financials/approvals.

## PM Dashboard And Inbox

Expected behavior:
- PM dashboard KPIs and active tickets are DB-backed.
- Inbox ticket list supports filters/search and opens selected ticket details.
- Empty DB shows empty states, not mock tickets.

How to test:
- Open `/` as PM after reloading mock data.
- Check active tickets and AI activity are populated.
- Open `/inbox`, search/filter tickets, select tickets, and verify details update.
- Clear demo data and confirm dashboard/inbox show empty states.

## Ticket Detail PM Flow

Expected behavior:
- PM can view ticket timeline, attachments, AI summary, reply draft, missing-info suggestions, urgency reasons, and contractor recommendation.
- AI suggestions are cached on repeated page loads.
- **Regenerate** creates a fresh AI suggestion.
- PM can approve/send reply, request missing info, manually change status, upload photos, and assign contractors.

How to test:
- Open a ticket from `/inbox` or `/ticket/$id`.
- Refresh the ticket page and verify AI text remains stable.
- Click **Regenerate** on AI sections and verify the text/confidence can update.
- Send/approve a reply and verify a manager event plus delivery events appear in the timeline.
- Request missing info and verify ticket status becomes waiting and tenant notification/timeline updates.
- Use manual status controls and verify status badges/counts update.
- Upload an image and verify it appears in attachments.

## Contractor Assignment And Quote Request

Expected behavior:
- PM can assign a contractor with a scheduled appointment.
- Assignment creates contractor/tenant notifications, ticket timeline entries, delivery simulation events, and schedule data.
- **Request quote** records a demo quote request in the ticket timeline instead of opening email.

How to test:
- Open a PM ticket and click assign contractor.
- Select a contractor, set appointment time, and submit.
- Verify ticket status becomes contractor assigned and ETA/schedule appears.
- Click **Request quote** and verify a quote-request event appears in the ticket timeline.
- Switch to contractor and verify the job appears.

## Contractor Jobs

Expected behavior:
- Contractor job list is DB-backed and scoped to the demo contractor.
- Contractor can accept, start, request info, complete jobs, and upload completion photo metadata.
- Completing a job updates ticket status, active/past job counts, tenant progress, and completed jobs.

How to test:
- Switch to contractor and open `/contractor`.
- Accept/start/complete a job.
- Add a note/photo during completion if visible.
- Verify the job moves out of active jobs and appears under `/contractor/completed`.
- Switch back to PM and tenant to verify ticket status/timeline updates.

## Contractor Schedule

Expected behavior:
- `/contractor/schedule` is backend-backed from ticket assignments.
- Rescheduling persists and appears in contractor, PM ticket, and tenant ticket views.

How to test:
- Open `/contractor/schedule`.
- Verify seeded appointments appear.
- Click reschedule on an appointment, save a new date/time, and verify the schedule updates.
- Open the related ticket and tenant ticket to confirm the new schedule is shown.
- Clear demo data and verify schedule empty state.

## Contractor Messages

Expected behavior:
- Contractor message threads are based on ticket events.
- Sending a contractor message persists after refresh and creates a delivery simulation event for PM.

How to test:
- Open `/contractor/messages`.
- Select a ticket thread and send a message.
- Refresh and verify the message remains.
- Switch to PM and verify the ticket timeline contains the contractor message.

## Tenant Intake And Tickets

Expected behavior:
- Tenant can create a new request with AI-assisted intake.
- Uploaded intake photos are stored as ticket document metadata.
- Tenant ticket list/detail are DB-backed and scoped to tenant records.
- Tenant can add information/photos and confirm resolved.

How to test:
- Switch to tenant and open `/tenant/new-request`.
- Enter a request, continue through AI follow-up, upload a photo, and submit.
- Verify success links to the created tenant ticket.
- Open `/tenant/tickets` and verify the new request appears.
- Add information/photo on the ticket detail and verify PM sees it.
- Confirm resolved and verify ticket status changes to resolved.

## Properties

Expected behavior:
- Property list/detail are DB-backed.
- Property open/critical ticket counts update after ticket creation, status changes, assignment, and completion.
- Property documents can be uploaded by PM.
- Search/filter controls are backend-backed.

How to test:
- Open `/properties`.
- Use search, status, and city filters.
- Open a property detail and verify units, documents, and related tickets.
- Upload a property document and verify it appears with a usable link.
- Create or resolve a ticket for the property and verify counts update.

## Contractors Directory

Expected behavior:
- Contractor list/detail are DB-backed.
- Active/past job counts update after assignment and completion.
- Search/specialty/availability filters are backend-backed.

How to test:
- Open `/contractors`.
- Use search, specialty, and availability filters.
- Open a contractor profile and verify rating, reliability, active jobs, past jobs, contact details.
- Assign/complete a job and verify counts change.

## AI Insights

Expected behavior:
- `/insights` is DB-backed and changes based on tickets, contractors, and AI suggestion rows.
- Empty DB shows empty/zero states.
- Regenerating AI suggestions can affect AI insight metrics.

How to test:
- Open `/insights` after reloading mock data and verify charts/KPIs are populated.
- Regenerate AI suggestions on a ticket, return to `/insights`, and verify values can update.
- Clear demo data and verify no static mock insight data remains.

## Global Header Search

Expected behavior:
- Header search queries backend tickets, properties, and contractors.
- Results navigate to the correct detail pages.
- `Cmd/Ctrl+K` focuses the search box.

How to test:
- Search for a known ticket id, property name, tenant name, or contractor name.
- Click a result and verify navigation.
- Press `Cmd+K` on macOS or `Ctrl+K` on Windows/Linux and verify search focuses.

## Owner Dashboard

Expected behavior:
- Owner dashboard portfolio counts, pending approvals, and cost breakdown are DB-backed.
- Empty DB shows empty states.

How to test:
- Switch to owner and open `/owner`.
- Verify property health, pending approvals, and cost breakdown show seeded values.
- Approve/reject an approval and verify pending approval count changes.
- Clear demo data and verify owner dashboard empty states.

## Owner Financials

Expected behavior:
- Financial KPIs, budget utilization, monthly chart, category breakdown, and invoice table are DB-backed.
- CSV export uses currently displayed invoice rows.

How to test:
- Open `/owner/financials`.
- Verify KPI cards and invoice rows are populated after reload.
- Click CSV export and inspect downloaded file contents.
- Clear demo data and verify zero/empty financial states.

## Owner Approvals

Expected behavior:
- Approval cards are DB-backed.
- Owner can approve, reject, or request clarification with a message.
- Decisions create PM notifications and audit-style AI activity records.
- Cards link to related property/financial views where available.

How to test:
- Open `/owner/approvals`.
- Approve one item and verify it disappears from pending approvals.
- Reload mock data, reject one item and verify status changes.
- Reload mock data, request clarification with a message, then switch to PM and check notifications/activity.

## Notifications

Expected behavior:
- Notifications are role-scoped.
- Mark read and mark all read only affect the active demo role.
- Notifications are created by major actions: ticket creation, assignment, missing info, status changes, attachments, owner decisions, contractor actions.

How to test:
- Open notification panel for each role.
- Trigger actions that create notifications.
- Mark one notification read, then mark all read.
- Switch roles and verify unread state is separate.

## Uploads And Documents

Expected behavior:
- Demo uploads validate file type/size/count.
- Ticket and property uploads store document metadata and usable data URLs.
- Uploaded images show previews where applicable.

How to test:
- Upload a valid image on intake, tenant ticket detail, PM ticket detail, and contractor completion.
- Upload a valid property document from property detail.
- Try invalid file types or oversized files and verify an error is shown.

## Delivery Simulation

Expected behavior:
- Email/SMS/in-app delivery claims are simulated as system ticket events.
- No real email/SMS is sent.

How to test:
- Approve a PM reply, request missing info, assign contractor, or send contractor message.
- Verify ticket timeline shows delivery/status events.

## Demo Authorization

Expected behavior:
- Server write paths enforce demo roles.
- Invalid role writes fail with `Demo authorization denied`.
- Normal UI flows still work because API hooks attach the selected demo role.

How to test:
- Run `npm run test:demo`.
- Try normal role flows through the UI.
- Optionally alter a request payload in Playwright/network tooling to use the wrong role and verify the backend rejects it.

## Regression Script

Expected behavior:
- `npm run test:demo` reloads demo data and checks critical backend behavior.

How to test:
- Run `npm run test:demo`.
- Expected output: `Demo regression checks passed.`

## Known Prototype Limits

- Password login/auth is intentionally not implemented.
- Email/SMS delivery is simulated only.
- File storage is demo metadata/data URLs, not production object storage.
- Quote requests are timeline events, not real contractor emails.
- This is a prototype safety layer, not production authorization.
