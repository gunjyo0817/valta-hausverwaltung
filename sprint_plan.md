# Backend Sprint Plan

Implementation constraint: preserve the current frontend appearance. Backend work should replace mock/local state with real data and mutations without redesigning screens, layouts, copy, colors, or component structure.

Seed constraint: keep the current demo values as the seed source of truth. Use existing values from `src/lib/mockData.ts`, `src/lib/properties.ts`, `src/lib/contractors.ts`, and `src/lib/role.tsx` when populating Neon.

## Sprint 0: Backend Foundation

Goal: add Neon/Postgres infrastructure while the app still renders exactly as it does now.

Codex steps:

1. Add backend dependencies: `drizzle-orm`, `drizzle-kit`, Neon/Postgres driver, env validation helper.
2. Add `.env.example` with required vars, but no secrets.
3. Create `src/server/db` or `src/lib/server` DB module.
4. Add Drizzle config.
5. Define first schema:
   - organizations
   - users
   - user roles
   - properties
   - units
   - tenants
   - contractors
   - tickets
   - ticket events
   - assignments
   - documents
   - notifications
6. Add migration scripts to `package.json`.
7. Add seed script that imports/transforms current demo data from `src/lib/mockData.ts`, `properties.ts`, `contractors.ts`, and `role.tsx`.
8. Keep existing UI imports untouched for now.
9. Verify TypeScript/build still passes.

Manual steps:

1. Create a Neon project.
2. Copy the pooled connection string.
3. Create local `.env` with `DATABASE_URL=...`.
4. Run install after dependencies are added.
5. Run migration.
6. Run seed.

Acceptance:

- DB schema exists in Neon.
- Seed data contains current demo values.
- App still runs with mock frontend data.

## Sprint 1: Read API Layer

Goal: add backend read endpoints/functions without yet replacing every screen.

Codex steps:

1. Add server-only query functions:
   - list tickets
   - get ticket by ID
   - list properties
   - get property by ID
   - list contractors
   - get contractor by ID
   - list notifications
2. Add API response mappers that return the same shape the frontend currently expects where practical.
3. Add typed frontend API helpers.
4. Add React Query hooks:
   - `useTickets`
   - `useTicket`
   - `useProperties`
   - `useProperty`
   - `useContractors`
   - `useContractor`
   - `useNotifications`
5. Keep visual loading states minimal and consistent with existing UI.
6. Add basic not-found handling for missing IDs.
7. Verify seeded DB values round-trip correctly.

Manual steps:

1. Run app locally.
2. Confirm API can read seeded data.
3. Spot-check records:
   - `VLT-2041`
   - `p-lindenstr-22`
   - `c1`

Acceptance:

- API returns the same demo content from Neon.
- No visual UI changes.

## Sprint 2: Connect Core Property Manager Views

Goal: replace static imports in the PM flow with backend data.

Codex steps:

1. Connect dashboard `/`:
   - ticket list
   - KPI calculations from DB
   - AI activity seed records if modeled
   - notifications preview
2. Connect `/inbox`:
   - ticket list
   - selected ticket detail
   - filters
   - search, if scoped simple client-side initially
3. Connect `/ticket/$id`:
   - ticket detail
   - tenant/property/contractor info
   - timeline events
   - attachments placeholders
4. Connect `/properties` and `/properties/$id`.
5. Connect `/contractors` and `/contractors/$id`.
6. Preserve current component layout and class names.
7. Leave action buttons local/non-mutating until later sprints.

Manual steps:

1. Compare core screens to current demo.
2. Confirm seeded records appear in same order or acceptable equivalent order.
3. Refresh pages and confirm content persists.

Acceptance:

- PM views are DB-backed.
- Current demo values still appear.
- UI appearance is unchanged.

## Sprint 3: Ticket Creation

Goal: make PM-created tickets real.

Codex steps:

1. Add `POST ticket` backend mutation.
2. Add ticket ID generation, preserving current `VLT-####` style.
3. Add manual ticket creation from `NewTicketModal`.
4. Add AI intake create flow using current deterministic sample extraction first.
5. Persist:
   - ticket
   - tenant info if new or matched
   - ticket event
   - suggested contractor if selected
   - initial AI suggestion metadata
6. Fix success button to navigate to the newly created ticket ID.
7. Invalidate React Query caches after creation.
8. Keep modal UI unchanged.

Manual steps:

1. Create a manual PM ticket.
2. Create an AI intake PM ticket.
3. Refresh and verify both appear in dashboard/inbox.
4. Confirm newly created ticket opens correctly.

Acceptance:

- Ticket creation persists in Neon.
- No more hardcoded navigation to `VLT-2041`.
- Current modal design remains unchanged.

## Sprint 4: Tenant Intake And Tenant Views

Goal: make tenant-facing request creation and tracking real.

Codex steps:

1. Connect `/tenant` ticket list to DB.
2. Connect `/tenant/tickets`.
3. Connect `/tenant/tickets/$id`.
4. Connect `/tenant/new-request` and `/intake` final submit to ticket creation.
5. Persist structured tenant intake:
   - title
   - category
   - description
   - apartment/unit
   - contact info
   - access availability
   - photo count/attachments placeholder
   - initial timeline events
6. Keep the guided chat flow scripted for prototype.
7. Add demo tenant scoping using current `Anna Becker` values.
8. Keep `/portal` hardcoded or map it to `VLT-2041` from DB, depending on effort.

Manual steps:

1. Submit a tenant request.
2. Confirm it appears in tenant list.
3. Confirm it appears in PM inbox.
4. Confirm tenant tracking page shows the DB-created ticket.

Acceptance:

- Tenant-created requests persist.
- PM and tenant see the same ticket.
- Passwords/auth still not implemented.

## Sprint 5: Demo Identity And Role Scoping

Goal: make the role switcher backend-aware without adding passwords.

Codex steps:

1. Seed demo users:
   - Sarah Kruger / PM
   - Anna Becker / tenant
   - Thomas Muller / contractor
   - Dr. Karl Reichmann / owner
2. Add `GET /me` or equivalent server function.
3. Store selected demo role/user in local storage or a simple demo cookie.
4. Scope reads:
   - PM: organization tickets/properties/contractors
   - Tenant: own unit/tickets
   - Contractor: assigned jobs/messages/schedule
   - Owner: owned portfolio
5. Keep the current visible role switcher exactly as is.
6. Add server-side guard helpers, but keep permissive enough for prototype.

Manual steps:

1. Confirm demo identities are correct.
2. Switch roles and verify data scope changes logically.
3. Decide whether role switcher stays visible in deployed prototype.

Acceptance:

- Role switcher remains visually unchanged.
- Backend understands selected demo user.
- No passwords, login page, or signup flow.

## Sprint 6: Ticket Timeline And PM Actions

Goal: make ticket buttons update backend state.

Codex steps:

1. Add mutations:
   - add ticket event
   - approve/send reply draft
   - request missing info
   - update ticket status
2. Wire ticket detail reply draft approval.
3. Wire inbox reply approval.
4. Persist edited draft text if user edits before sending.
5. Add event types:
   - tenant
   - ai
   - manager
   - contractor
   - system
6. Invalidate ticket/inbox/dashboard queries after mutations.
7. Preserve timeline layout and button styling.

Manual steps:

1. Approve a draft.
2. Refresh ticket detail and confirm event remains.
3. Request missing info and confirm event/status behavior.
4. Check inbox and dashboard update.

Acceptance:

- Ticket timeline is real.
- PM actions persist.
- No visual redesign.

## Sprint 7: Contractor Assignment

Goal: make contractor dispatch real.

Codex steps:

1. Add assignment mutation.
2. Wire `AssignContractorModal`.
3. Persist selected contractor, status, ETA if available.
4. Update ticket:
   - contractor ID/name
   - status, likely `contractor_assigned`
5. Add timeline event.
6. Create notification for contractor and tenant/PM as needed.
7. Reflect assignment in:
   - ticket detail
   - inbox
   - contractor dashboard
   - contractor profile active jobs

Manual steps:

1. Assign `Muller Heizung GmbH` to `VLT-2041`.
2. Refresh all related pages.
3. Confirm assignment appears in PM and contractor views.

Acceptance:

- Contractor assignment persists.
- Related lists update.
- Modal appearance remains unchanged.

## Sprint 8: Notifications

Goal: make the notification panel and bell count real.

Codex steps:

1. Connect notification panel to DB.
2. Replace static `seed` notifications with backend records.
3. Implement:
   - mark one read
   - mark all read
   - unread count
   - filters
4. Create notifications from key mutations:
   - new critical ticket
   - photos uploaded
   - contractor assigned
   - owner approval needed
   - status changed
5. Fix current issue where unread count is static.
6. Keep notification UI unchanged.

Manual steps:

1. Trigger a few actions.
2. Open notification panel.
3. Mark one read and all read.
4. Refresh and confirm state persists.

Acceptance:

- Bell count is accurate.
- Read/unread persists.
- Notifications link to correct routes.

## Sprint 9: Contractor Portal

Goal: make contractor pages DB-backed and action-capable.

Codex steps:

1. Connect `/contractor` to assignments.
2. Implement mutations:
   - accept job
   - mark in progress
   - request info
   - mark complete
3. Connect `/contractor/schedule` to appointments table.
4. Seed current schedule demo values as appointments.
5. Connect `/contractor/messages` to real message threads.
6. Implement send message.
7. Connect `/contractor/completed` to completed assignments.
8. Update ticket status/timeline from contractor actions.

Manual steps:

1. Switch to contractor role.
2. Accept/start/complete a seeded job.
3. Send a contractor message.
4. Confirm PM ticket timeline updates.

Acceptance:

- Contractor views are DB-backed.
- Contractor actions affect PM-visible tickets.
- Schedule values preserve current demo sample dates/times where possible.

## Sprint 10: Owner Views

Goal: make owner pages DB-backed.

Codex steps:

1. Seed current owner dashboard approval examples.
2. Seed current financial invoice examples.
3. Connect `/owner`.
4. Connect `/owner/issues`.
5. Connect `/owner/financials`.
6. Connect `/owner/approvals`.
7. Implement approval actions:
   - approve
   - reject
   - request clarification
8. Add timeline/notification side effects for approval actions.
9. Keep charts and cards visually unchanged.

Manual steps:

1. Review seeded approval values.
2. Approve/reject an item.
3. Refresh and verify status persists.
4. Confirm owner dashboard counts update.

Acceptance:

- Owner data comes from Neon.
- Approval decisions persist.
- Financials remain seeded prototype data.

## Sprint 11: Attachments And Documents

Goal: support real file metadata and optional upload.

Codex steps:

1. Add attachment/document API.
2. Connect ticket photo lists to DB metadata.
3. Connect property documents to DB metadata.
4. Add upload flow behind existing photo/document UI.
5. Store files in chosen object storage, not Neon.
6. Store only metadata/URLs in Neon.
7. Keep existing placeholder grid layout.

Manual steps:

1. Choose storage provider:
   - Vercel Blob
   - Cloudflare R2
   - S3-compatible storage
2. Create bucket/token.
3. Add storage env vars locally and on Vercel.
4. Upload a test ticket photo.
5. Upload or seed property documents.

Acceptance:

- Attachments survive refresh.
- Documents can be downloaded.
- Existing UI layout remains intact.

## Sprint 12: AI Backend

Goal: replace scripted AI with real server-side AI, without making the prototype dependent on it everywhere.

Codex steps:

1. Add server-only OpenAI client.
2. Add AI endpoints/functions:
   - structure intake
   - classify urgency
   - generate summary
   - suggest contractor
   - generate reply draft
   - detect missing info
   - translate DE/EN
3. Store outputs in `ai_suggestions`.
4. Keep deterministic fallback if AI call fails.
5. Never expose API key to browser.
6. Preserve human approval flow.

Manual steps:

1. Provide OpenAI API key.
2. Add `OPENAI_API_KEY` to local and Vercel env.
3. Decide model and rough cost ceiling.
4. Test German and English examples.

Acceptance:

- AI-generated values persist.
- UI flow remains the same.
- Prototype still works if AI is temporarily unavailable.

## Sprint 13: Deployment

Goal: deploy the working prototype.

Codex steps:

1. Add Vercel-compatible build/deploy notes.
2. Add production env validation.
3. Add DB migration instructions.
4. Add seed command for demo/prototype environment.
5. Add smoke test checklist.
6. Verify app builds locally.
7. Fix any server/client import boundary issues.

Manual steps:

1. Create Vercel project.
2. Connect GitHub repo.
3. Add env vars:
   - `DATABASE_URL`
   - storage vars if used
   - `OPENAI_API_KEY` if used
4. Run production migration.
5. Run production seed.
6. Open deployed URL and test role flows.

Acceptance:

- Deployed app uses Neon.
- Demo data is present.
- App can be shown reliably.

## Sprint 14: Prototype Hardening

Goal: remove sharp edges without turning it into full production.

Codex steps:

1. Add basic server-side validation for all mutations.
2. Add better error responses.
3. Add idempotent seed behavior.
4. Add basic audit logging for ticket/approval changes.
5. Add simple optimistic updates where useful.
6. Add smoke tests for:
   - read dashboard
   - create ticket
   - assign contractor
   - send message
   - mark notification read
7. Check for accidental secret exposure.

Manual steps:

1. Try demo flows in production.
2. Report any behavior mismatches.
3. Decide which fake/demo labels should remain visible.

Acceptance:

- Prototype is stable enough for repeated demos.
- Data persists.
- No passwords yet.
- No frontend redesign.

## Recommended Working Order

Implement in this order:

1. Sprint 0
2. Sprint 1
3. Sprint 2
4. Sprint 3
5. Sprint 4
6. Sprint 5
7. Sprint 6
8. Sprint 7

That gives the core working product: PM dashboard/inbox, tenant intake, real tickets, real timeline, real contractor assignment, and demo role scoping.

Then choose from:

- Contractor portal: Sprint 9
- Owner portal: Sprint 10
- Files: Sprint 11
- Real AI: Sprint 12

For a prototype, delay passwords/auth, real accounting, full file handling, and real AI until after the core ticket lifecycle works end to end.
