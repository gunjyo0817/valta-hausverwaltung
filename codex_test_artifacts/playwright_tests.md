# Playwright Tests

This document outlines end-to-end Playwright test steps for the Valta Hausverwaltung demo webapp. The goal is to test it like a real user moving through the full property-management lifecycle, while verifying that visible UI actions are backed by persistent backend state.

## Test Environment

Start the app from the repo root:

```powershell
npm.cmd run dev
```

Use the Vite URL from the terminal, usually:

```text
http://localhost:5173
```

Before each major test group, reset the demo data:

1. Open `/admin/demo-data`.
2. Click **Reload mock data**.
3. Confirm seeded counts are visible for tickets, properties, contractors, notifications, approvals, invoices, documents, AI records, and identity rows.

For empty-state tests:

1. Open `/admin/demo-data`.
2. Click **Clear demo data**.
3. Confirm mutable demo counts become zero while role switching still works.

Run the backend smoke check after UI testing:

```powershell
npm.cmd run test:demo
```

Expected result:

```text
Demo regression checks passed.
```

## General Playwright Rules

- Use role-based locators first: `getByRole`, `getByLabel`, `getByPlaceholder`, and visible text.
- Prefer real navigation through links, buttons, the role switcher, and search rather than jumping directly to every URL.
- Assert persisted state by refreshing the page after each mutation.
- Assert cross-role effects by switching roles and checking related pages.
- Check both seeded data and empty database states.
- Capture screenshots only when a visual or layout regression is suspected.
- Treat password login, real authentication, real email/SMS, and production file storage as out of scope for this prototype.

## Core Setup Test

### App Loads And Shell Works

Steps:

1. Open `/`.
2. Verify the app shell renders with navigation, role switcher, language switcher, notification button, search, and PM content.
3. Switch language from DE to EN and back.
4. Press `Ctrl+K` on Windows/Linux or `Meta+K` on macOS.
5. Verify global search focuses.
6. Open mobile viewport and verify the menu opens, closes, and navigation remains usable.

Expected:

- No console errors that indicate broken rendering or failed route loading.
- Header/sidebar controls remain usable at desktop and mobile widths.
- Keyboard search focus works.

## Admin Demo Data

### Reload And Clear Demo Data

Steps:

1. Navigate to `/admin/demo-data`.
2. Record visible seeded row counts.
3. Click **Clear demo data** and confirm the action.
4. Verify mutable counts become empty or zero.
5. Visit `/`, `/inbox`, `/properties`, `/contractors`, `/tenant/tickets`, `/contractor`, `/owner`, `/owner/financials`, and `/owner/approvals`.
6. Verify each page shows an intentional empty state, not stale mock data.
7. Return to `/admin/demo-data`.
8. Click **Reload mock data**.
9. Verify main pages repopulate.

Expected:

- Demo accounts and role switching survive clearing.
- DB-backed screens update immediately after clear/reload.
- Repeating clear/reload does not duplicate seed rows or crash the app.

## Role Switching

### PM, Tenant, Contractor, Owner Navigation

Steps:

1. Start as PM and verify dashboard, inbox, insights, properties, and contractors links.
2. Switch to tenant and verify tenant home, new request, and ticket list routes.
3. Switch to contractor and verify jobs, schedule, messages, and completed routes.
4. Switch to owner and verify dashboard, issues, financials, and approvals routes.
5. Refresh after each role switch.

Expected:

- Each role lands on its correct home page.
- The selected role persists through refresh.
- Navigation items match the active role.
- Data is scoped to the active demo identity.

## PM Ticket Lifecycle

### Dashboard And Inbox

Steps:

1. Reload mock data.
2. Switch to PM.
3. Open `/`.
4. Verify KPI cards, active tickets, AI activity, and notification preview are populated.
5. Open `/inbox`.
6. Search for a known ticket ID such as `VLT-2041`.
7. Use ticket filters and select a ticket.
8. Open the selected ticket detail page.

Expected:

- Search and filters update the ticket list.
- Selecting a ticket updates the preview panel.
- Ticket detail route loads the same ticket.
- Refreshing keeps the same backend data visible.

### PM Ticket Detail Actions

Steps:

1. Open a seeded PM ticket detail page from the inbox.
2. Verify tenant, property, status, urgency, timeline, attachments, AI summary, reply draft, missing-info suggestion, and contractor recommendation are visible where applicable.
3. Refresh the page and verify cached AI text remains stable.
4. Click **Regenerate** on available AI sections.
5. Approve or send the reply draft.
6. Verify manager and delivery simulation events appear in the timeline.
7. Request missing information.
8. Verify ticket status changes to waiting or the expected demo waiting state.
9. Manually change status through visible status controls.
10. Upload a valid image.
11. Refresh and verify the uploaded attachment persists.

Expected:

- Every PM mutation creates a durable ticket event.
- Ticket badges, inbox counts, and dashboard metrics update after status changes.
- Tenant notifications are created for relevant actions.
- Delivery appears as simulated timeline/system events, not real external delivery.

### Contractor Assignment And Quote Request

Steps:

1. Open a PM ticket.
2. Click the assign contractor action.
3. Select a contractor.
4. Set a scheduled appointment date/time.
5. Submit the assignment.
6. Verify ticket status, contractor name, ETA/schedule, and timeline update.
7. Click **Request quote** if visible.
8. Verify a quote-request timeline event appears.
9. Refresh the ticket detail.

Expected:

- Assignment persists after refresh.
- Contractor and tenant notifications are created.
- Quote request is represented as a demo timeline event, not a `mailto:` or real email.

## Tenant Journey

### Tenant New Request

Steps:

1. Reload mock data.
2. Switch to tenant.
3. Open `/tenant/new-request`.
4. Enter a realistic maintenance request, for example a heating leak or water damage.
5. Continue through the AI follow-up questions.
6. Upload one valid image.
7. Review the structured request.
8. Keep the seeded tenant identity unless the test intentionally checks edited identity behavior.
9. Submit the request.
10. Follow the success link.
11. Open `/tenant/tickets`.

Expected:

- A new ticket is created and visible in the tenant ticket list.
- Success navigation points to the created ticket or a valid tracking page.
- Uploaded intake photo appears as ticket document metadata.
- The same ticket appears in the PM inbox after switching to PM.

### Tenant Ticket Detail

Steps:

1. Open a tenant ticket detail page.
2. Verify progress/status, property, timeline, attachments, and contact information.
3. Add text information when the UI allows it.
4. Upload another valid photo.
5. Refresh and verify the text/photo persists.
6. Switch to PM and open the same ticket.
7. Verify PM can see the tenant update.
8. If the ticket is resolved, click tenant confirm resolved.

Expected:

- Tenant actions create ticket events and PM notifications.
- Attachments persist after refresh.
- Confirm resolved changes the ticket status only when the UI presents that action.

## Contractor Journey

### Contractor Jobs

Steps:

1. Reload mock data.
2. Assign a contractor from a PM ticket if no active seeded job exists.
3. Switch to contractor.
4. Open `/contractor`.
5. Accept a job.
6. Start the job.
7. Request more information if the action is visible.
8. Complete the job with a note and optional photo.
9. Open `/contractor/completed`.
10. Switch back to PM and tenant and open the related ticket.

Expected:

- Job action buttons update the backend state.
- Completed job moves out of active jobs and into completed jobs.
- PM and tenant ticket timelines show contractor activity.
- Ticket status and contractor active/past job counts update.

### Contractor Schedule

Steps:

1. Switch to contractor.
2. Open `/contractor/schedule`.
3. Toggle today/week views.
4. Move between available weeks.
5. Select an appointment.
6. Reschedule it to a new valid date/time.
7. Refresh the schedule.
8. Open the related PM ticket and tenant ticket.

Expected:

- Schedule data comes from backend assignments/appointments.
- Reschedule persists after refresh.
- PM and tenant views show the new appointment time.
- Empty demo data produces an empty schedule state.

### Contractor Messages

Steps:

1. Switch to contractor.
2. Open `/contractor/messages`.
3. Select a ticket thread.
4. Send a realistic message.
5. Refresh and verify the message remains.
6. Switch to PM and open the related ticket.

Expected:

- Contractor message persists.
- PM ticket timeline includes the contractor message.
- Delivery simulation event is created for PM where applicable.

## Properties

### Property List And Detail

Steps:

1. Reload mock data.
2. Switch to PM.
3. Open `/properties`.
4. Search by property name.
5. Use status and city filters if visible.
6. Open a property detail page.
7. Verify units, related tickets, documents, owner/tenant context, and counts.
8. Upload a valid property document.
9. Refresh and verify the document remains available.
10. Create or resolve a ticket for that property.
11. Return to the property detail.

Expected:

- Filters and search affect visible results.
- Property detail uses backend data.
- Open/critical ticket counts update after ticket creation or resolution.
- Uploaded documents persist with usable links.

## Contractors Directory

### Directory Filters And Profile

Steps:

1. Open `/contractors`.
2. Search by contractor name.
3. Use specialty and availability filters if visible.
4. Open a contractor profile.
5. Verify rating, reliability, contact details, active jobs, and past jobs.
6. Assign a new job to that contractor from a PM ticket.
7. Return to the contractor profile.
8. Complete the job as contractor.
9. Recheck the profile.

Expected:

- Directory filters work against the displayed contractor set.
- Active job count increases after assignment.
- Active/past job counts update after completion.

## AI Insights

### Insights Are Backend-Backed

Steps:

1. Reload mock data.
2. Switch to PM.
3. Open `/insights`.
4. Verify KPIs, charts, risk lists, and top performers are populated.
5. Open a ticket and regenerate AI suggestions.
6. Return to `/insights`.
7. Verify metrics can reflect changed AI/ticket data.
8. Clear demo data.
9. Reopen `/insights`.

Expected:

- Insights are populated from backend rows after reload.
- Empty data shows empty/zero states rather than static mock insight data.
- Regenerated AI records do not create duplicate or inconsistent insight rows.

## Global Search And Notifications

### Search

Steps:

1. Reload mock data.
2. Use global search for a ticket ID.
3. Click the ticket result and verify navigation.
4. Search for a property name.
5. Click the property result and verify navigation.
6. Search for a contractor name.
7. Click the contractor result and verify navigation.
8. Search for a tenant name if tenant results are supported.

Expected:

- Results are relevant to the query.
- Clicking results navigates to the correct detail route.
- Empty queries and no-result queries behave cleanly.

### Notifications

Steps:

1. Open the notification panel as PM.
2. Record unread count.
3. Trigger notification-producing actions:
   - create ticket
   - assign contractor
   - request missing information
   - upload attachment
   - change status
   - send contractor message
   - make owner approval decision
4. Reopen notification panel.
5. Mark one notification read.
6. Mark all read.
7. Switch roles and verify unread state is role-scoped.

Expected:

- Notification count changes after relevant backend actions.
- Read/unread state persists after refresh.
- Role switching does not leak unread state between demo users.
- Notification links navigate to the relevant ticket or page.

## Owner Journey

### Owner Dashboard And Issues

Steps:

1. Reload mock data.
2. Switch to owner.
3. Open `/owner`.
4. Verify portfolio counts, property health, pending approvals, and cost breakdown.
5. Open `/owner/issues`.
6. Open a related issue/ticket.
7. Clear demo data and revisit owner pages.

Expected:

- Owner dashboard and issue lists are backend-backed.
- Empty states appear when demo data is cleared.
- Links to properties and tickets work.

### Owner Financials

Steps:

1. Reload mock data.
2. Switch to owner.
3. Open `/owner/financials`.
4. Verify financial KPIs, budget utilization, monthly chart, category breakdown, and invoice table.
5. Apply any visible filters.
6. Click CSV export.
7. Inspect the downloaded CSV content.
8. Clear demo data and reload the page.

Expected:

- Financial values are populated from invoice/backend rows.
- CSV contains the currently displayed invoice rows.
- Empty data shows zero/empty states.

### Owner Approvals

Steps:

1. Reload mock data.
2. Switch to owner.
3. Open `/owner/approvals`.
4. Approve one item.
5. Verify it leaves the pending list or changes status.
6. Reload mock data.
7. Reject one item.
8. Reload mock data.
9. Request clarification with a message.
10. Switch to PM and inspect notifications or activity.

Expected:

- Approval decisions persist after refresh.
- PM receives relevant notifications/activity records.
- Clarification requires and stores the provided message.

## Upload Validation

### Valid And Invalid Uploads

Steps:

1. Upload a valid image during tenant intake.
2. Upload a valid image from tenant ticket detail.
3. Upload a valid image from PM ticket detail.
4. Upload a valid image from contractor completion.
5. Upload a valid property document from property detail.
6. Try invalid file types.
7. Try oversized files if fixture support is available.
8. Try too many files if the UI supports multiple uploads.

Expected:

- Valid uploads show previews or download links.
- Upload metadata persists after refresh.
- Invalid uploads show user-facing errors.
- Failed uploads do not create partial documents or duplicate events.

## Negative And Consistency Tests

### Authorization Guard

Steps:

1. Run `npm.cmd run test:demo`.
2. Through Playwright network tooling, attempt a write with the wrong demo role if practical.
3. Continue normal UI flows with valid role switching.

Expected:

- Invalid role writes fail with a demo authorization error.
- Normal UI writes work because API hooks attach the selected demo role.

### Repeated Clicks And Idempotency

Steps:

1. Double-click major mutation buttons where Playwright can safely reproduce the behavior:
   - reload mock data
   - clear demo data
   - approve reply
   - assign contractor
   - complete job
   - mark all notifications read
2. Refresh related pages.

Expected:

- No duplicate ticket events, notifications, documents, assignments, or approval records.
- Buttons show loading/disabled states during mutations.
- The UI recovers cleanly from repeated actions.

### Browser And Viewport Coverage

Steps:

1. Run the primary smoke flow in Chromium desktop.
2. Run shell/navigation, tenant intake, PM ticket detail, and notification tests in a mobile viewport.
3. Run at least one smoke pass in Firefox or WebKit if configured.

Expected:

- Text does not overlap at mobile or desktop widths.
- Dialogs, drawers, file inputs, and navigation controls remain reachable.
- No critical browser-specific failures appear.

## Recommended Test Order

1. Admin reload and shell/navigation.
2. Role switching.
3. PM dashboard, inbox, ticket detail, assignment, and notifications.
4. Contractor accepts, starts, reschedules, messages, and completes the assigned job.
5. Tenant creates a new request and verifies ticket progress.
6. Properties and contractors directory consistency checks.
7. Owner financials and approvals.
8. Empty-state pass after clearing demo data.
9. Upload validation and negative/idempotency tests.
10. `npm.cmd run test:demo`.

## Minimum Smoke Suite

Use this smaller suite before demos or deployments:

1. Reload mock data.
2. Open `/` as PM and verify dashboard data.
3. Open `/inbox`, select a ticket, and open detail.
4. Assign a contractor to the ticket.
5. Switch to contractor, accept/start/complete the job.
6. Switch to tenant and verify the ticket timeline/status.
7. Switch to owner and approve one approval.
8. Open notifications and mark all read.
9. Clear demo data and verify empty states on PM dashboard, tenant tickets, contractor jobs, and owner approvals.
10. Reload mock data.
11. Run `npm.cmd run test:demo`.
