# Deployment

This prototype is configured for Vercel with Neon Postgres. TanStack Start deploys on Vercel through Nitro, which is enabled in `vite.config.ts`.

## Required Services

- Vercel project connected to this Git repository.
- Neon Postgres database.
- Optional: Vercel Blob for real file storage. Without it, Sprint 11 stores file metadata only.

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables for Production and Preview:

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon pooled Postgres connection string. Use SSL. |
| `BLOB_READ_WRITE_TOKEN` | No | Required only when Vercel Blob uploads are wired to binary storage. |
| `OPENAI_API_KEY` | No | Required only after Sprint 12 AI backend is enabled. |
| `OPENAI_MODEL` | No | Optional OpenAI model override. Defaults to `gpt-4.1-mini`. |

For local checks:

```sh
npm run env:check
```

This prints only whether variables are present, never their values.

## Vercel Project Settings

- Framework preset: TanStack Start if detected, otherwise Other.
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default. Nitro/Vercel handles the server output.
- Node version: use the Vercel Node.js runtime selected by Nitro. Local development should use Node 20+.

Vercel automatically runs a build for Git deployments. Vercel environment variables are managed in the dashboard; for local development you can pull them into `.env` with:

```sh
vercel env pull
```

If you use `vercel build` or `vercel dev`, run `vercel pull` instead so Vercel can cache project settings and environment variables under `.vercel/`.

## Production Database Setup

Run these against the production Neon database from a machine with `DATABASE_URL` set to the production connection string:

```sh
npm install
npm run db:migrate
npm run db:seed
```

`db:seed` resets and repopulates the demo dataset. Use it for prototype/demo environments, not for preserving user-entered production data.

## First Deploy Checklist

1. Create the Neon database.
2. Add `DATABASE_URL` to Vercel for Preview and Production.
3. Add `OPENAI_API_KEY` if Sprint 12 AI generation should call OpenAI instead of deterministic fallbacks.
4. Optional: create Vercel Blob and add `BLOB_READ_WRITE_TOKEN`.
5. Deploy once from Vercel or GitHub.
6. Run migrations and seed against the deployed database.
7. Redeploy if environment variables changed after the first build.

## Smoke Test

After deployment, verify these flows:

- Open `/` and confirm the dashboard loads.
- Switch roles in the existing role switcher.
- Create a PM ticket and open it.
- Submit tenant intake and confirm it appears in PM inbox.
- Assign a contractor and refresh.
- Mark a notification read and refresh.
- Open `/owner/approvals`, approve/reject one item, and refresh.
- Open `/contractor`, accept/start/complete a job, and confirm PM timeline updates.
- Open `/properties/p-lindenstr-22` and confirm documents render.

## References

- Vercel TanStack Start docs: https://vercel.com/docs/frameworks/full-stack/tanstack-start/
- Vercel build docs: https://vercel.com/docs/builds
- Vercel environment variable docs: https://vercel.com/docs/projects/environment-variables
- Vercel CLI env pull docs: https://vercel.com/docs/cli/pull
- Vercel Blob SDK docs: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
