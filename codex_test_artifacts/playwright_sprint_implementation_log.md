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
