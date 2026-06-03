# Vercel Hosting Guide

This guide is for deploying this Valta TanStack Start app to Vercel from GitHub.

Current project facts:

- Framework: TanStack Start
- Build command: `npm run build`
- Package manager: npm, using `package-lock.json`
- Deployment adapter: Nitro with `preset: "vercel"` in `vite.config.ts`
- Vercel output directory: `dist`, enforced by `vercel.json`
- Required production env var: `DATABASE_URL`
- Optional feature env vars: `BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `DEMO_ADMIN_ENABLED`

## 1. Prepare The Repo

From the project root, make sure the app builds locally:

```powershell
npm install
npm run build
```

Check what you are about to push:

```powershell
git status
```

Before pushing, decide whether `codex_test_artifacts/` should be committed. It contains Playwright/Codex notes, logs, and screenshots. It is useful history, but it is not required for hosting.

## 2. Push To GitHub

Commit your app changes and push to `main`:

```powershell
git add .
git commit -m "Prepare Valta app for Vercel deployment"
git push origin main
```

If you want to keep the artifact folder out of production commits, do not add it, or add it to `.gitignore` before committing.

## 3. Create The Production Database

This app uses Postgres through `@neondatabase/serverless`, so use a hosted Postgres database. Neon is the simplest match.

Recommended path:

1. Go to Vercel Dashboard.
2. Open Storage or Marketplace.
3. Create/connect a Neon Postgres database for this project, or create one directly at Neon.
4. Copy the pooled Postgres connection string.
5. Confirm it looks like:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

You will use that value as `DATABASE_URL`.

## 4. Import The Project In Vercel

1. Go to https://vercel.com/dashboard.
2. Click `Add New...` then `Project`.
3. Select the GitHub repository.
4. Click `Import`.
5. In project settings, use:

```text
Framework Preset: TanStack Start if detected; otherwise Other
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Root Directory: leave as repository root
```

The root `vercel.json` also sets these values so Vercel does not rely on dashboard auto-detection. This matters because Nitro generates this app's Vercel build output in `dist`.

## 5. Add Environment Variables

In the Vercel import screen, or later under Project Settings -> Environment Variables, add:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
OPENAI_MODEL=gpt-4.1-mini
```

Optional, but recommended if you want the full demo behavior:

```text
OPENAI_API_KEY=your_openai_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
DEMO_ADMIN_ENABLED=true
```

Notes:

- `DATABASE_URL` is required. Without it, server/database routes will fail.
- `OPENAI_API_KEY` is optional. Without it, AI calls fall back or fail depending on the route.
- `BLOB_READ_WRITE_TOKEN` is optional unless you need file upload/blob behavior.
- `DEMO_ADMIN_ENABLED=true` enables the admin demo-data controls in deployed environments. Turn it off for a real public production app.
- Add the variables to both `Production` and `Preview` if you want preview deployments to work.

## 6. Deploy

Click `Deploy`.

Vercel will:

1. Clone the GitHub repo.
2. Run `npm install`.
3. Run `npm run build`.
4. Deploy the Nitro output as Vercel Functions.

If the deployment succeeds, open the generated Vercel URL.

## 7. Create Tables And Seed Demo Data

The first deploy may load but fail on data routes until the production database has tables and seed data.

On your local machine, temporarily point `.env` at the same production `DATABASE_URL`, then run:

```powershell
npm run env:check
npm run db:push
npm run db:seed
```

Then check demo data status:

```powershell
npm run db:demo:status
```

Important: this writes to the production database. Use a separate Preview database if you do not want preview/testing data mixed with production.

## 8. Verify The Live App

Open the Vercel deployment URL and check:

1. `/` loads the PM dashboard.
2. `/inbox` loads tickets.
3. `/properties/p-lindenstr-22` renders the property detail page.
4. `/contractors/c1` renders the contractor profile page.
5. `/tenant` loads the tenant portal.
6. `/tenant/new-request` can submit a demo request.
7. `/admin/demo-data` can reload demo data if `DEMO_ADMIN_ENABLED=true`.

If something fails, open Vercel Project -> Deployments -> latest deployment -> Logs.

## 9. Common Fixes

### Build succeeds, live site shows Vercel 404

This usually means Vercel did not deploy the Nitro output directory. Confirm the root `vercel.json` exists and contains:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Check `vite.config.ts` still contains:

```ts
nitro: {
  preset: "vercel",
}
```

Also confirm Vercel is building from the repository root and that Project Settings -> Build and Development Settings does not override the output directory to anything other than `dist`.

### Build fails with missing env vars

Add `DATABASE_URL` in Vercel Project Settings -> Environment Variables, then redeploy.

### App loads but data pages fail

Run the production DB setup:

```powershell
npm run db:push
npm run db:seed
```

Make sure your local `.env` points to the same database URL used by Vercel before running those commands.

### File upload fails

Create a Vercel Blob store for the same project. Vercel should create `BLOB_READ_WRITE_TOKEN` automatically for that project. Redeploy after confirming the env var exists.

### AI features fail

Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. Then redeploy.

### Preview works but production fails

Vercel stores env vars per environment. Confirm the variables exist for `Production`, not only `Preview` or `Development`.

## 10. Recommended After First Successful Deploy

1. Add your custom domain in Vercel Project -> Domains.
2. Turn off `DEMO_ADMIN_ENABLED` if this is public production.
3. Keep separate databases for production and previews.
4. Add a short deployment note to the project README once the exact working settings are confirmed.

## Reference Docs

- Vercel TanStack Start docs: https://vercel.com/docs/frameworks/full-stack/tanstack-start
- Vercel import project docs: https://vercel.com/docs/getting-started-with-vercel/import
- Vercel builds and env vars: https://vercel.com/docs/deployments/builds
- Vercel Blob token docs: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
- TanStack Start hosting docs: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
