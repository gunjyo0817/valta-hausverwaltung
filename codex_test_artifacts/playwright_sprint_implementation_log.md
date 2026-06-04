# Playwright Sprint Implementation Log

This log records each sprint implementation, the code changed, and the behavior verified with Playwright MCP.

## Sprint 1: Fix Mutation Cache Errors

Status: complete

Code changes:

- Updated `src/lib/api/hooks.ts` so ticket mutation success handlers no longer assume every cached `["tickets"]` query value is an array.
- Added a shape-aware cache updater that updates ticket arrays and single ticket objects safely while leaving unrelated cache entries untouched.

Behavior verified:

- `npm.cmd run build` completed successfully.
- Playwright MCP reloaded demo data, opened `VLT-2041`, approved and sent the reply, requested missing info, changed manual status, assigned Müller Heizung GmbH, switched to contractor, started/completed the job, and sent a contractor message.
- Browser console no longer reported `tickets?.map is not a function`; the only error left in this pass was the pre-existing `/favicon.ico` 404 covered by Sprint 8.

## Sprint 2: Fix Tenant Ticket Creation And Scoping

Status: complete

Code changes:

- Updated `src/server/write/tickets.ts` so tenant-created tickets preserve the selected demo tenant identity, tenant id, user id, and property scope before returning the created ticket.
- Updated `src/routes/intake.tsx` to keep the created ticket response, show a success link to `/tenant/tickets/$id`, clean unknown tenant names, infer useful titles, clean descriptions, and normalize unit text.
- Updated `src/server/ai/fallbacks.ts` so the Anna/Linden deterministic sample only applies to heating reports and unit extraction stops at the unit token.
- Added `src/lib/ticketCopy.ts` and reused it in `src/server/ai/fallbacks.ts`, `src/routes/inbox.tsx`, and `src/routes/ticket.$id.tsx` so reply drafts match the ticket category instead of always using heating copy.

Behavior verified:

- `npm.cmd run build` completed successfully after the server, intake, and draft-copy changes.
- Playwright MCP reloaded demo data, switched to Anna Becker, submitted a water-leak report through `/tenant/new-request`, answered the leak follow-up, skipped the photo prompt, reviewed the generated ticket, and submitted successfully.
- Review showed `Wasserleck in der Wohnung`, `Sanitaer`, `Lindenstrasse 22 · WE 14`, and `Anna Becker`; the building/unit prompt did not repeat.
- Success state linked to `/tenant/tickets/VLT-2050`; the created ticket detail opened successfully.
- `/tenant/tickets` listed `VLT-2050` for Anna Becker, and PM `/inbox` showed the same ticket with Anna Becker and the correct property/unit.
- Regenerating the PM reply draft for `VLT-2050` produced water-leak-specific copy.
- Browser console did not report `Created ticket not found`; only the known `/favicon.ico` 404 remained.

## Sprint 3: Fix Property And Contractor Detail Routing

Status: complete

Code changes:

- Updated `src/routes/properties.tsx` so the `/properties` parent route renders an `Outlet` for nested property detail URLs and delegates the searchable property list to `PropertiesListPage`.
- Updated `src/routes/contractors.tsx` so the `/contractors` parent route renders an `Outlet` for nested contractor profile URLs and delegates the searchable contractor list to `ContractorsListPage`.
- Kept route switching hooks separate from list data/state hooks to avoid React hook-order errors during client-side navigation.

Behavior verified:

- `npm.cmd run build` completed successfully after the route changes.
- Playwright MCP opened `http://localhost:8080/properties/p-lindenstr-22` directly and verified the `Lindenstrasse 22` detail view rendered with the back link, property header, ticket/unit/document sections, and upload action instead of the object list.
- Playwright MCP opened `http://localhost:8080/contractors/c1` directly and verified the `Mueller Heizung GmbH` profile rendered with contact and service-area sections instead of the contractor list.
- Playwright MCP navigated from `/properties` by clicking the `Lindenstrasse 22` card; the app landed on `/properties/p-lindenstr-22`, rendered the detail page, and reported 0 console errors.
- Playwright MCP navigated from `/contractors` by clicking the `Mueller Heizung GmbH` card; the app landed on `/contractors/c1`, rendered the profile page, and reported 0 console errors.
- The earlier `Rendered fewer hooks than expected` runtime error was reproduced during the first link-navigation check, fixed, and no longer appears in the verified flows; only the known favicon warning remains.

## Sprint 4: Align Cross-View Counts And Status Semantics

Status: complete

Code changes:

- Added `src/lib/ticketStatus.ts` with shared predicates for open, resolved, critical, and high-or-critical ticket semantics.
- Updated `src/server/read/queries.ts`, `src/server/read/mappers.ts`, and `src/server/write/consistency.ts` so dashboard, AI insights, property counts, contractor job counts, and derived database counters use the same open/resolved model.
- Added `activeTicketCount` to `AiInsightsDto` and used it in `src/routes/insights.tsx` so the insights footer reports active tickets instead of total historical tickets.
- Updated property list/detail, contractor active/completed jobs, tenant tickets, and owner dashboard views to use the shared open/resolved predicates.
- Renamed the PM urgent KPI from strict critical wording to `Akute Fälle` / `Urgent cases` and the inbox filter from `Kritisch` / `Critical` to `Hoch/Kritisch` / `High/Critical`, matching the existing high-or-critical behavior.
- Updated the owner dashboard KPI sublabel from `Kritisch` to `Offene Tickets` because the number represents all open owner-visible cases.

Behavior verified:

- `npm.cmd run build` completed successfully after the shared semantics and label changes.
- Playwright MCP reloaded mock data from `/admin/demo-data`.
- Baseline PM dashboard showed 6 open tickets; AI insights footer showed `Demo-Daten · 6 aktive Tickets im Bestand`.
- Baseline Lindenstraße 22 detail showed 1 open ticket, `VLT-2041`; baseline Müller Heizung GmbH profile showed 1 active job and 0 completed jobs.
- Playwright MCP completed `VLT-2041` from `/contractor` with a completion note and invoice reference.
- After completion, contractor dashboard showed 0 active jobs.
- PM dashboard dropped to 5 open tickets and 2 urgent cases under the relabeled `Akute Fälle` / `Hoch oder kritisch` KPI.
- AI insights footer also showed 5 active tickets, and `VLT-2041` no longer appeared in the at-risk list.
- Lindenstraße 22 detail and property list both showed 0 open tickets; the list status changed to stable.
- Müller Heizung GmbH profile showed 0 active jobs and 1 completed job, with `VLT-2041` listed as resolved.
- Tenant tickets for Anna Becker showed 0 active and 2 resolved requests, including `VLT-2041` as resolved.
- Owner dashboard showed 5 open cases and Lindenstraße 22 with 0 open tickets.
- Inbox filter label showed `Hoch/Kritisch`, and `VLT-2041` displayed as `Erledigt` with the contractor completion event in the timeline.
- Browser console reported 0 errors during the verified Sprint 4 flows; only the known favicon warning remained.

## Sprint 5: Clean Empty-State And Static Demo Copy

Status: complete

Code changes:

- Updated `src/routes/index.tsx` so PM dashboard KPI deltas switch to `Keine Live-Daten` / `No live data` when tickets, AI activity, and notifications are all empty.
- Updated `src/routes/contractor.index.tsx` so contractor dashboard stats are derived from actual active jobs; cleared demo data now shows 0 due jobs, `0.0h` average response, and `—` rating instead of seeded performance claims.
- Updated `src/routes/owner.index.tsx` so the owner AI portfolio summary switches to empty portfolio copy when there are no properties, tickets, approvals, or invoice categories to summarize.

Behavior verified:

- `npm.cmd run build` completed successfully after the Sprint 5 copy and KPI changes.
- Playwright MCP cleared mutable demo data from `/admin/demo-data` and verified all mutable counters reached 0.
- PM `/` showed zero KPI values with `Keine Live-Daten` labels, and no stale `+3 heute`, `-38% MoM`, `2 überfällig`, or high/critical seeded KPI claims remained.
- Contractor `/contractor` showed 0 active jobs, 0 due this week, `0.0h` average response, and `—` rating, with an empty state linking back to the demo-data admin.
- Owner `/owner` showed the new empty AI portfolio summary and no seeded maintenance or reserve-fund claims.
- Insights `/insights` showed empty insight/category/risk/contractor states with links back to the demo-data admin and no seeded Sprint 5 phrases.
- Playwright MCP reloaded mock data from `/admin/demo-data` after verification; mutable demo rows were restored to 122.
- Browser console showed the pre-existing `/favicon.ico` 404 and TanStack route export warnings only; no Sprint 5 behavior errors were found.

## Sprint 6: Mobile Role And Route Consistency

Status: complete

Code changes:

- Updated `src/lib/role.tsx` to read the persisted demo role through a guarded helper on mount and to tolerate localStorage write failures without breaking the in-memory role.
- Updated `src/routes/index.tsx` so `/` remains the PM dashboard only for the PM role; when the active role is tenant, contractor, or owner, it redirects to that role's home route with history replacement.
- Kept the role provider's initial SSR/client role stable as PM to avoid hydration mismatches while still applying the persisted role immediately after mount.

Behavior verified:

- `npm.cmd run build` completed successfully after the role and route changes.
- Playwright MCP used a 390x844 mobile viewport and verified persisted owner role navigating directly to `/` redirects to `/owner`.
- Owner mobile drawer showed `Eigentümer-Sicht`, Dr. Karl Reichmann, and owner navigation while the visible page showed owner portfolio content and no PM dashboard copy.
- Persisted tenant role navigating directly to `/` redirected to `/tenant`; the drawer showed `Mieter-Sicht`, Anna Becker, tenant navigation, and no PM dashboard copy.
- Persisted contractor role navigating directly to `/` redirected to `/contractor`; the drawer showed `Handwerker-Sicht`, Thomas Müller, contractor navigation, and no PM dashboard copy.
- The stored demo role was reset to PM after verification.
- The first implementation attempt produced React hydration mismatch warnings when the role was read synchronously from localStorage; this was fixed and the fresh Playwright pass reported 0 browser errors.
- Browser console showed only the pre-existing TanStack route export warning for `src/routes/intake.tsx`.

## Sprint 7: Demo Regression Data Hygiene

Status: complete

Code changes:

- Updated `scripts/demo-regression.ts` so the mutation checks run inside a `try` block and always call `reloadDemoData()` in `finally`.
- Added a final row-count assertion comparing the post-test demo data status to the seeded baseline captured after the initial reload.
- Kept the existing success output, `Demo regression checks passed.`, but only after cleanup and row-count verification complete.

Behavior verified:

- `npm.cmd run build` completed successfully after the regression script change.
- `npm.cmd run test:demo` completed successfully and printed `Demo regression checks passed.`
- `npm.cmd run db:demo:status` reported the seeded baseline after the regression run: 7 tickets, 122 mutable rows, and 9 preserved identity rows.
- Playwright MCP opened `/admin/demo-data` and verified 122 mutable rows, 7 tickets, and no `Regression test issue` text.
- Playwright MCP opened `/` and `/inbox`; both showed seeded demo tickets and no `Regression test issue`, `kitchen sink`, or `VLT-2050`.
- Browser console only showed the known `/favicon.ico` 404 and TanStack `src/routes/intake.tsx` route export warning covered by Sprint 8.

## Sprint 8: Small Polish And Console Noise

Status: complete

Code changes:

- Added `public/favicon.svg` and linked it from `src/routes/__root.tsx` with `rel="icon"` so browsers no longer fall back to a missing `/favicon.ico`.
- Moved the shared intake UI from the route file into `src/components/IntakePage.tsx`.
- Reduced `src/routes/intake.tsx` to a route-only module and updated `src/routes/tenant.new-request.tsx` to import `IntakePage` from the component module, removing the TanStack route export warning.
- Added visible AI regenerate feedback in `src/routes/ticket.$id.tsx` so summary, reply draft, missing-info, and contractor suggestion refreshes show a success message even when deterministic fallback content is unchanged.

Behavior verified:

- `npm.cmd run build` completed successfully after the favicon, intake split, and ticket feedback changes.
- Build output no longer reported the TanStack `src/routes/intake.tsx` code-splitting/export warning.
- Playwright MCP loaded `/`; browser console reported 0 errors and 0 warnings.
- Playwright MCP fetched `/favicon.svg` and verified a 200 response with `image/svg+xml`.
- Playwright MCP opened `/ticket/VLT-2041`; summary, reply draft, missing-info, and contractor regenerate controls each produced visible `aktualisiert` feedback.
- Playwright MCP opened `/tenant/new-request`; the moved intake component rendered, initial intake copy was present, and the browser console still reported 0 errors and 0 warnings.
