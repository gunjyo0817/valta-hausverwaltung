# Playwright Test Findings

Test date: 2026-06-03  
App URL: `http://localhost:8080`  
Runner: Playwright MCP plus `npm.cmd run test:demo`  
Final demo-data state: restored with 122 mutable rows and 9 identity rows.

## Summary

The main seeded demo can be navigated across PM, tenant, contractor, and owner roles. Read-heavy screens, role switching, CSV export, notifications, contractor completion, owner approvals, and empty states mostly work.

The largest functional issue is a repeated React Query cache update error:

```text
tickets?.map is not a function
```

This appears after many successful backend mutations. The write often persists, but the UI reports failure or logs console errors, which makes the user-facing result misleading.

## Commands

Started app:

```powershell
npm.cmd run dev
```

Regression command:

```powershell
npm.cmd run test:demo
```

Result:

```text
Demo regression checks passed.
```

The regression script leaves a generated test ticket visible in the UI before a final data reload. I reloaded mock data after the command to restore the seeded baseline.

## Passed

- Admin `/admin/demo-data` clear and reload controls work.
- Clear preserved identity rows and role switching.
- Reload restored seeded mutable data to 122 rows.
- PM dashboard, inbox, ticket detail, properties, contractors, insights, tenant, contractor, and owner routes load.
- Desktop role switching works for PM, tenant, contractor, and owner.
- Language toggle works between DE and EN.
- `Ctrl+K` focuses global search when the desktop search input is visible.
- Inbox search works, for example `VLT-2039`.
- Global search finds tickets and navigates to ticket detail.
- Tenant intake accepts image upload and creates a PM-visible ticket record.
- Contractor start, completion note, completion photo, and contractor message persisted.
- Contractor completed page showed completed `VLT-2041`.
- PM notifications received contractor and owner activity.
- Mark all notifications read worked and removed the bell badge.
- Owner financials display KPIs and invoices.
- CSV export downloaded `.playwright-mcp\valta-invoices.csv` with the displayed invoice rows.
- Owner approval approve and clarification actions worked and updated pending counts.
- Empty states mostly work after clearing data for inbox, properties, contractors, tenant home, contractor jobs, and AI insights.

## Findings

### High: Mutation success is reported as failure

Observed on PM ticket actions, contractor job actions, contractor completion, and contractor messages.

Error:

```text
tickets?.map is not a function
```

Examples:

- PM approve/send reply showed `Aktion fehlgeschlagen: tickets?.map is not a function`.
- PM request-more-info showed the same failure.
- PM manual status update showed the same failure.
- PM contractor assignment submit showed the same failure in the modal.
- Contractor start logged `Contractor job action failed TypeError: tickets?.map is not a function`.
- Contractor completion logged `Contractor completion failed TypeError: tickets?.map is not a function`.
- Contractor message send logged the same cache update error.

Important nuance: many of these writes did persist. The ticket timeline later showed PM reply, delivery events, missing-info request, status note, assignment, contractor accept/start, completion photo, completion note, and contractor message.

### High: Tenant submit reports created ticket not found

Tenant intake submission produced a console error:

```text
Created ticket not found: VLT-2050
```

The UI stayed on the review step and did not show success. However, global search later found `VLT-2050`, and the PM ticket detail route `/ticket/VLT-2050` opened.

Related data-quality issues on the review step:

- Tenant name became `Unbekannte:r Mieter:in`.
- Title was only `Sanitaer`.
- Description contained the chat transcript instead of a clean issue summary.
- Anna Becker's tenant list did not show the created ticket because it was not scoped to Anna.

### High: Detail routes render list pages for properties and contractors

Opening these URLs changed the browser location but did not render the expected detail page:

- `/properties/p-lindenstr-22`
- `/contractors/c1`

The visible UI remained the filtered list view, with the clicked card still active. The same issue affects navigation from list cards and likely global search/property links.

### Medium: Critical filter includes high-priority tickets

In `/inbox`, clicking `Kritisch` showed the critical ticket plus high-priority tickets such as `VLT-2039` and `VLT-2037`.

This may be intentional grouping, but the label reads like it should only show critical severity.

### Medium: Dashboard and insight counts diverge

After contractor completion, PM dashboard showed 6 open tickets while AI insights showed:

```text
Demo-Daten · 8 aktive Tickets im Bestand
```

This suggests the insights count is computed differently or includes non-active/resolved/test records.

### Medium: Property counts did not update after contractor completion

After completing `VLT-2041`, `/properties` still showed Lindenstrasse 22 with 1 open ticket.

If contractor completion is meant to resolve or remove the ticket from open counts, the property count is stale or status mapping is inconsistent.

### Medium: Empty DB still shows static supporting metrics/copy

After clearing demo data:

- PM dashboard primary KPIs were zero, but supporting copy still showed `+3 today`, `-38% MoM`, and `2 overdue`.
- Contractor empty state showed 0 active jobs, but still showed 5 due this week, 2.1h average response, and 4.9 rating.
- Owner dashboard numeric KPIs were zero, but AI portfolio summary still described seeded heating cases.

### Medium: Mobile owner-role route mismatch

After `npm.cmd run test:demo`, the active role was owner. Navigating to `/` at mobile width showed PM dashboard content, while the opened mobile drawer showed owner identity and owner navigation.

Expected behavior should either redirect owner role to `/owner` or keep shell/navigation/content aligned.

### Medium: Regression script leaves test data before reload

`npm.cmd run test:demo` passed, but afterwards the UI showed an extra `VLT-2050 Regression test issue`. A final `/admin/demo-data` reload removed it and restored 122 mutable rows.

For repeatable demos, the regression should either clean up after itself or document that a reload is required afterward.

### Low: Favicon 404

Initial and repeated navigations reported:

```text
Failed to load resource: the server responded with a status of 404 () @ /favicon.ico
```

This is low risk but keeps console output noisy.

### Low: Tenant guided intake duplicate prompt

During tenant intake, after selecting `Kueche`, the building/unit question appeared twice in the transcript.

The flow still advanced after choosing the unit and phone number.

## Empty-State Results

- Admin clear: passed, mutable rows became 0 and identity rows stayed 9.
- PM dashboard: mostly passed, but static supporting text remained.
- PM inbox: passed with clear empty state and admin reload link.
- Properties: passed with clear empty state and admin reload link.
- Contractors: passed with clear empty state and admin reload link.
- AI insights: passed with zeroed metrics and empty sections.
- Tenant home: passed with 0 active requests and empty state.
- Contractor jobs: mostly passed, but some static metrics remained.
- Owner dashboard: partially passed, numeric KPIs zeroed but AI summary stayed stale.

## Artifacts

- CSV export: `.playwright-mcp\valta-invoices.csv`
- Playwright snapshots and console logs: `.playwright-mcp\`

## Final State

I reloaded mock data after testing. Admin reported:

```text
Mutable demo rows: 122
Identity rows preserved: 9
Controls: Enabled
```
