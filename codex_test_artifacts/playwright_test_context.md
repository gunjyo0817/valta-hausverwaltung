# Playwright Test Context

This repo is the source of truth. Ignore assumptions from previous chats unless they are confirmed in the code.

## Current Goal

Run the local web app, open it with Playwright MCP, and inspect whether all visible UI interactions are backed by working backend integrations.

Start local hosting from the repo root:

```powershell
npm.cmd run dev
```

Then open the Vite localhost URL shown in the terminal, usually `http://localhost:5173`.

## Important Setup

- This is a demo/prototype. Password login and real authentication are intentionally not implemented.
- Use the in-app role switcher to test PM, tenant, contractor, and owner views.
- Use `/admin/demo-data` to reset data:
  - **Reload mock data** restores the seeded demo state.
  - **Clear demo data** removes mutable demo rows but keeps demo accounts/role switching.
- Email/SMS delivery is simulated as timeline/system events. No real messages are sent.
- Uploads are demo metadata/data URLs, not production object storage.

## Regression Command

Run this from the repo root if backend behavior needs a quick smoke test:

```powershell
npm.cmd run test:demo
```

Expected output:

```text
Demo regression checks passed.
```

## Main Flows To Test

### Admin Demo Data

Test:
- Open `/admin/demo-data`.
- Click **Clear demo data** and confirm dashboards/lists show empty states.
- Click **Reload mock data** and confirm seeded data returns.

Watch for:
- Counts that do not update after clear/reload.
- Screens still showing static mock data after the DB is empty.

### PM Dashboard And Inbox

Test:
- As PM, open `/` and `/inbox`.
- Search/filter tickets.
- Open ticket detail pages.
- Clear DB and verify empty states.

Watch for:
- KPI cards still showing seeded/static numbers after clear.
- Ticket details not refreshing after PM actions.

### PM Ticket Detail

Test:
- Open a ticket from `/inbox`.
- Regenerate AI sections.
- Approve/send a reply.
- Request missing information.
- Change status manually.
- Upload an image.
- Assign a contractor.
- Request a quote.

Expected:
- Timeline events persist.
- Notifications are created where relevant.
- Status and assignment changes propagate to tenant/contractor views.
- Quote request becomes a ticket timeline event, not an email.

### Tenant Intake And Tickets

Test:
- Switch to tenant.
- Open `/tenant/new-request`.
- Enter a request, continue through AI follow-up, upload a photo, review, and submit.
- Open `/tenant/tickets` and verify the new request appears.
- Open the ticket detail.
- Add text information.
- Add a photo.
- Confirm resolved when available.

Known area to inspect carefully:
- The submit success card currently appeared to link to `/portal`, not necessarily the created `/tenant/tickets/$id`.
- Tenant-created ticket visibility may depend on the demo tenant identity `Anna Becker`. Try both keeping and editing the tenant name in the review step.
- Confirm resolved only appeared when the ticket status was already `resolved`; verify whether this matches the intended tenant flow.

### Contractor Jobs

Test:
- Switch to contractor.
- Open `/contractor`.
- Accept a job.
- Start a job.
- Request info if available.
- Complete a job, with note/photo if visible.
- Open `/contractor/completed`.

Expected:
- Active/past job counts update.
- Completed job moves out of active jobs.
- PM and tenant ticket timelines/statuses update.

### Contractor Schedule

Test:
- Open `/contractor/schedule`.
- Reschedule an appointment.
- Verify contractor schedule updates.
- Check PM ticket detail and tenant ticket detail for the new schedule.
- Clear demo data and verify empty state.

### Contractor Messages

Test:
- Open `/contractor/messages`.
- Select a thread.
- Send a message.
- Refresh and verify persistence.
- Switch to PM and verify the ticket timeline contains the contractor message.

### Properties

Test:
- Open `/properties`.
- Use search/status/city filters.
- Open property detail.
- Upload a property document.
- Create or resolve a ticket for that property and verify counts update.

Watch for:
- Counts that do not react to ticket create/status changes.
- Filters that only work locally if they are expected to be backend-backed.

### Contractors Directory

Test:
- Open `/contractors`.
- Use search/specialty/availability filters.
- Open contractor profile.
- Assign and complete a job.
- Verify active/past counts update.

### AI Insights

Test:
- Open `/insights` after mock reload.
- Regenerate AI suggestions on a ticket.
- Return to `/insights` and verify metrics can change.
- Clear demo data and verify no static mock insight data remains.

Known area to inspect:
- Earlier manual observation: AI insights still showed mock data when DB was empty. Verify after current implementation.

### Global Header Search

Test:
- Search for a ticket id, property name, tenant name, and contractor name.
- Click results and verify navigation.
- Press `Ctrl+K` on Windows/Linux or `Cmd+K` on macOS and verify the search input is focused.

### Owner Dashboard

Test:
- Switch to owner.
- Open `/owner`.
- Verify portfolio counts, pending approvals, and cost breakdown.
- Approve/reject an approval.
- Clear demo data and verify empty states.

### Owner Financials

Test:
- Open `/owner/financials`.
- Verify KPIs, budget chart, category breakdown, and invoice table.
- Export CSV and inspect downloaded file.
- Clear demo data and verify zero/empty states.

### Owner Approvals

Test:
- Open `/owner/approvals`.
- Approve one item.
- Reload mock data, reject one item.
- Reload mock data, request clarification with a message.
- Switch to PM and check notifications/activity.

### Notifications

Test:
- Open notification panel for each role.
- Trigger actions that should create notifications:
  - ticket creation
  - assignment
  - missing-info request
  - status change
  - attachment upload
  - owner decision
  - contractor action
- Mark one notification read.
- Mark all read.
- Switch roles and verify unread state is role-scoped.

## Known Prototype Limits

- No password login/auth.
- No real email/SMS sending.
- No production file storage.
- Quote request does not contact contractors; it records a demo timeline event.
- Demo authorization is a prototype guard, not production authorization.

## Suggested Testing Order

1. Reload mock data in `/admin/demo-data`.
2. Run a PM ticket from inbox through reply, missing-info, contractor assignment, and quote request.
3. Switch to contractor and complete the assigned job.
4. Switch to tenant and verify progress/timeline/attachments/status.
5. Clear demo data and check every major dashboard for empty states.
6. Reload mock data and test owner approvals/financials.
7. Run `npm.cmd run test:demo` after UI testing.

