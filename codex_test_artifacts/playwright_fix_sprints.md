# Playwright Fix Sprints

This backlog groups the Playwright findings into implementation-sized sprints. Each sprint should be testable with Playwright after implementation and should preserve the existing frontend design unless a finding explicitly requires UI copy/state correction.

## Sprint 1: Fix Mutation Cache Errors

Goal: remove the recurring `tickets?.map is not a function` failure so successful writes do not appear as failed actions.

Findings covered:

- PM approve/send reply reports failure.
- PM request-more-info reports failure.
- PM manual status update reports failure.
- PM contractor assignment reports failure.
- Contractor start/completion/message logs cache update errors.

Likely scope:

- Fix React Query cache update code that assumes cached ticket query data is always an array.
- Audit all `setQueryData` and `setQueriesData` paths touching ticket lists.
- Handle paged/object-shaped list responses and empty/missing caches safely.
- Ensure mutation success toasts/errors reflect the actual backend result.

Acceptance criteria:

- PM reply approval creates timeline and delivery events without an error banner.
- PM missing-info request updates status/timeline without an error banner.
- PM status update changes visible status without an error banner.
- Contractor start and completion persist without console errors.
- Contractor message persists without console errors.

Playwright retest:

1. Reload mock data.
2. Open `/ticket/VLT-2041`.
3. Approve/send reply.
4. Request more info.
5. Update manual status.
6. Assign contractor.
7. Switch to contractor, start and complete the job.
8. Send contractor message.
9. Assert no `tickets?.map is not a function` in console.

## Sprint 2: Fix Tenant Ticket Creation And Scoping

Goal: make tenant-created tickets complete the UI flow successfully and appear under the correct tenant identity.

Findings covered:

- Tenant submit reports `Created ticket not found: VLT-2050`.
- Success state is not shown.
- Created ticket exists for PM but not Anna Becker.
- Review data uses `Unbekannte:r Mieter:in`.
- Tenant ticket title/description are poor quality.
- Building/unit prompt appears twice.

Likely scope:

- Fix tenant ticket creation response so the created ticket can be read immediately.
- Preserve selected demo tenant identity, especially Anna Becker, during intake.
- Ensure unit/property selection maps to the tenant/user used by tenant list queries.
- Improve deterministic intake extraction for title, description, category, name, and unit.
- Remove duplicate follow-up prompt generation for building/unit.
- Confirm success navigation goes to the created ticket or valid tenant tracking page.

Acceptance criteria:

- Tenant submits a new request and lands on success.
- Success link opens the created ticket.
- Created ticket appears in `/tenant/tickets` for Anna Becker.
- Created ticket appears in PM inbox/search.
- Review step shows Anna Becker, a useful title, and a clean issue description.
- The building/unit prompt appears only once.

Playwright retest:

1. Reload mock data.
2. Switch to tenant.
3. Open `/tenant/new-request`.
4. Upload image and submit a water leak request.
5. Follow success link.
6. Open `/tenant/tickets`.
7. Switch to PM and search the created ticket.
8. Assert no `Created ticket not found` console error.

## Sprint 3: Fix Detail Route Rendering

Goal: make property and contractor detail routes render their detail pages instead of list views.

Findings covered:

- `/properties/p-lindenstr-22` changes URL but keeps rendering the properties list.
- `/contractors/c1` changes URL but keeps rendering the contractors list.
- Global search/list-card navigation is affected.

Likely scope:

- Inspect TanStack route configuration and generated route tree for nested/detail routes.
- Verify list and detail route components are not sharing stale parent content incorrectly.
- Fix route matching, file route definitions, or outlet rendering as needed.
- Confirm direct navigation and link navigation both work.

Acceptance criteria:

- `/properties/p-lindenstr-22` renders property detail content: units, documents, related tickets, counts, and upload controls.
- `/contractors/c1` renders contractor profile content: contact details, active/past jobs, rating, reliability, and job history.
- List search state does not mask detail content.
- Global search property/contractor results navigate to detail pages.

Playwright retest:

1. Reload mock data.
2. Open `/properties`, search `Linden`, click result.
3. Assert detail page content appears.
4. Open `/contractors`, search `Müller`, click result.
5. Assert profile content appears.
6. Use global search for `Lindenstraße` and `Müller`.

## Sprint 4: Align Cross-View Counts And Status Semantics

Goal: ensure ticket lifecycle changes produce consistent counts across dashboard, insights, property detail/list, contractor directory, tenant view, and owner view.

Findings covered:

- PM dashboard count and AI insights active-ticket count diverge.
- Property open-ticket count did not drop after contractor completion.
- Contractor active count updated correctly, but related property/dashboard semantics were unclear.
- Critical filter includes high-priority tickets under a critical label.

Likely scope:

- Define ticket status semantics for `new`, `waiting`, `contractor_assigned`, `in_progress`, `resolved`, and completed contractor jobs.
- Decide whether contractor completion should set ticket to resolved or another non-open status.
- Reuse one backend count model for dashboard, insights, properties, owners, and contractors.
- Clarify or rename the inbox `Kritisch` filter if it intentionally includes high severity.

Acceptance criteria:

- Completing a contractor job updates ticket status consistently.
- PM dashboard, AI insights, property list/detail, contractor profile, tenant ticket, and owner issue counts agree.
- Filters match labels, or labels are adjusted to match behavior.

Playwright retest:

1. Reload mock data.
2. Record PM dashboard, insights, property, and contractor counts.
3. Complete `VLT-2041` as contractor.
4. Recheck all related counts.
5. Assert the same ticket is not counted as open in one view and resolved/completed in another unless explicitly intended.

## Sprint 5: Empty-State And Static Copy Cleanup

Goal: remove stale seeded metrics/copy after demo data is cleared.

Findings covered:

- PM dashboard shows zero KPIs but still shows `+3 today`, `-38% MoM`, and `2 overdue`.
- Contractor empty state still shows 5 due this week, 2.1h response, and 4.9 rating.
- Owner dashboard zeroes numeric KPIs but keeps seeded AI portfolio summary.

Likely scope:

- Make secondary metric text conditional on available backend data.
- Replace stale AI summary with empty-state summary when there are no properties/tickets/invoices.
- Ensure contractor stats derive from DB rows or show neutral empty values.

Acceptance criteria:

- After clear, no seeded operational claims remain on PM dashboard.
- After clear, contractor stats do not imply active seeded performance data.
- After clear, owner AI summary does not mention seeded incidents.
- Empty states still link to `/admin/demo-data`.

Playwright retest:

1. Open `/admin/demo-data`.
2. Clear demo data.
3. Visit `/`, `/contractor`, `/owner`, `/insights`.
4. Assert no stale seeded claims remain.
5. Reload mock data.

## Sprint 6: Mobile Role And Route Consistency

Goal: keep active role, route, drawer identity, and rendered content aligned on mobile.

Findings covered:

- With owner active, mobile navigation to `/` showed PM dashboard content while drawer showed owner identity/navigation.

Likely scope:

- Review role home redirect behavior for `/`.
- Ensure role switcher and persisted role route to the correct home.
- Handle direct navigation to `/` when the active role is not PM.
- Verify mobile drawer reads the same active role as the page content.

Acceptance criteria:

- Active owner role navigating to `/` redirects to `/owner` or renders owner content.
- Active tenant role navigating to `/` redirects to `/tenant` or renders tenant content.
- Active contractor role navigating to `/` redirects to `/contractor` or renders contractor content.
- Mobile drawer identity/navigation matches visible page content.

Playwright retest:

1. Set mobile viewport.
2. Switch to owner, navigate to `/`, open drawer.
3. Repeat for tenant and contractor.
4. Assert route, header, drawer identity, nav links, and main content match the active role.

## Sprint 7: Demo Regression Data Hygiene

Goal: make `npm.cmd run test:demo` safe to run before demos without leaving extra UI-visible data.

Findings covered:

- Regression passed but left a `VLT-2050 Regression test issue` until mock data was reloaded.

Likely scope:

- Make regression script clean up records it creates, or run in a transaction that rolls back where practical.
- Alternatively, end the script with a demo reload if that is acceptable.
- Document any intentional data mutation clearly in operator docs.

Acceptance criteria:

- Running `npm.cmd run test:demo` does not leave extra tickets, notifications, documents, or approvals in the demo UI.
- Admin row counts return to baseline after the script.
- The script still prints `Demo regression checks passed.`

Playwright retest:

1. Reload mock data.
2. Record admin mutable row count.
3. Run `npm.cmd run test:demo`.
4. Open PM dashboard and search for `Regression test issue`.
5. Assert no extra test ticket is visible, or assert script clearly restored baseline.

## Sprint 8: Small Polish And Console Noise

Goal: clean up lower-risk issues that make test output noisy or UX less clear.

Findings covered:

- `/favicon.ico` returns 404.
- Tenant prompt duplication if not fully fixed in Sprint 2.
- AI regenerate buttons produced no visible change in one pass.

Likely scope:

- Add a favicon or suppress the missing favicon request.
- Make AI regenerate buttons show loading/success state and update a timestamp/confidence/content where possible.
- Confirm tenant prompt generation remains clean after Sprint 2.

Acceptance criteria:

- No favicon 404 appears in console.
- AI regenerate gives visible feedback or a documented no-change state.
- Tenant guided intake transcript has no duplicated prompts.

Playwright retest:

1. Load `/`.
2. Assert console has no favicon 404.
3. Open ticket detail and click AI regenerate controls.
4. Assert visible feedback or changed suggestion metadata.

## Recommended Order

1. Sprint 1: Fix mutation cache errors.
2. Sprint 2: Fix tenant ticket creation and scoping.
3. Sprint 3: Fix detail route rendering.
4. Sprint 4: Align cross-view counts and status semantics.
5. Sprint 5: Empty-state and static copy cleanup.
6. Sprint 6: Mobile role and route consistency.
7. Sprint 7: Demo regression data hygiene.
8. Sprint 8: Small polish and console noise.

This order prioritizes broken user trust first: actions should not report failure when writes persist, tenant submission needs a reliable success path, and detail routes must render correctly before deeper detail-page testing can be trusted.
