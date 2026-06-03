# Demo Operator Guide

## Reset

1. Ensure `DEMO_ADMIN_ENABLED=true` is present in the local environment.
2. Open `/admin/demo-data`.
3. Use **Reload mock data** before a demo to return the app to baseline.
4. Use **Clear demo data** when testing empty states. Demo accounts, users, roles, and organizations stay available.

CLI fallback:

```bash
npm run db:demo:status
npm run db:demo:clear
npm run db:demo:reload
```

## Recommended Walkthrough

1. Start as PM and review dashboard, inbox, AI insights, properties, and contractors.
2. Open a ticket, regenerate AI summary/reply/missing-info/contractor suggestion, and approve a reply.
3. Assign a contractor with a scheduled appointment.
4. Switch to contractor, accept/start/complete the job, and reschedule from the schedule page if needed.
5. Switch to tenant, upload additional information, review ticket progress, and confirm resolution.
6. Switch to owner, review financials, approve/reject/request clarification for an approval.
7. Return to `/admin/demo-data` and reload mock data.

## Simulated Features

- Email, SMS, and in-app delivery are simulated as ticket events and notifications.
- File uploads store demo metadata and data URLs; there is no production object-storage lifecycle here.
- Quote requests are recorded as ticket timeline events, not external email.
- Authentication is demo role switching only; password login remains intentionally out of scope.

## Backend-Backed Features

- Tickets, ticket events, notifications, properties, contractors, appointments, documents, approvals, invoices, AI activities, and AI suggestions are stored in the database.
- Owner financials and AI insights are computed from database rows.
- Global search reads tickets, properties, and contractors through backend queries.
- Demo reset/reseed preserves identity tables and replaces mutable demo data.

## Regression Check

Run:

```bash
npm run test:demo
```

This reloads demo data, verifies role guards reject invalid writes, creates a tenant ticket, checks tenant scoping, exercises AI fallback/classification, and reads notifications.
