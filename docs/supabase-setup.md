# Supabase and Vercel setup

The app uses one private study record. Next.js verifies a long-lived browser cookie and calls Supabase on the server. No Supabase Auth user, public database policy, or browser Supabase client is needed.

## 1. Create the database

Open [your project's SQL Editor](https://supabase.com/dashboard/project/apzwvsffbyccwrmdwezq/sql/new). Paste and run the complete contents of [`supabase/migrations/202610270001_progress.sql`](../supabase/migrations/202610270001_progress.sql).

The SQL runs in a transaction and can be rerun without resetting progress. It creates:

- `study_progress`: one row with JSON progress, a revision, the last mutation ID, and an update timestamp. A null snapshot means migration has not started; an empty snapshot after reset remains initialized.
- `unlock_attempts`: short-lived hashed-IP counters, enforcing ten unlock attempts per ten minutes across Vercel instances.
- Two RPC functions executable only by `service_role`.

RLS is enabled, and direct privileges for `anon` and `authenticated` are revoked. Do not add public read/write policies. The SQL integration tests exercise permissions, revision conflicts, reset, and lost-response deduplication in embedded PostgreSQL.

### Initialize from your supplied backup

A private seed file has been prepared locally at `supabase/private/initial-progress.sql` from `ielts-vocab-2026-10-27.json`. After running the schema migration above, run this seed in the same SQL Editor **before opening the new app**. It preserves all 110 learned words, review schedules, settings, activity, and the two dictation results. The only new field is `drafts: {}`, since the backup contains no writing drafts.

The seed initializes an empty record atomically. Rerunning the same seed immediately is safe; it refuses to overwrite existing or subsequently changed cloud progress. If the app has already initialized cloud progress, use the confirmed backup-import flow in Settings instead. After seeding, unlock the app normally; no browser migration is needed.

The original backup and generated seed are ignored by Git and must stay private. The seed is not bundled into the app or automatically applied during a deployment.

## 2. Add environment variables

In Supabase, open **Project Settings → API Keys** and copy a **secret key** (`sb_secret_…`). The publishable key supplied earlier is insufficient for this server-only design. A legacy `service_role` key also works, but use a new secret key when available.

Add these to the ignored `.env.local` for local development and **Vercel → Project → Settings → Environment Variables → Production**:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://apzwvsffbyccwrmdwezq.supabase.co` |
| `SUPABASE_SECRET_KEY` | Your Supabase secret key |
| `APP_ACCESS_CODE` | A long private code you will enter once per browser; an existing code can be reused |
| `APP_SESSION_SECRET` | A random secret of at least 32 characters |

Generate the session secret locally with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep existing `ANTHROPIC_API_KEY` and optional AI settings. Never prefix secret variables with `NEXT_PUBLIC_`, commit them, or paste them into client code. The old `NEXT_PUBLIC_SUPABASE_*` variables are unused and can be removed. The app reports a configuration error rather than reverting to local storage if configuration is missing.

Preview deployments are blocked from database access by default. To enable them, create a separate Supabase project, run the same migration, configure its credentials under Vercel's **Preview** environment, and set `ALLOW_PREVIEW_DATABASE=1` there. Use separate access/session secrets too. Do not use the production database for previews.

## 3. Deploy and migrate

Apply the SQL first, then deploy this code through your normal Vercel Git workflow. Redeploy after environment changes. For a rollback, retain the database and backup files; older local-storage versions do not sync cloud progress.

1. Visit the deployed site in the browser where your current progress exists.
2. Unlock with `APP_ACCESS_CODE`. Access is remembered for one year; clearing cookies or rotating the code/session secret requires unlocking again. The old AI access-code setting is replaced by this unlock screen.
3. If cloud progress is uninitialized, accept **Sao lưu và chuyển tiến độ**. The app downloads a backup including weekly writing drafts before uploading. Existing local data stays untouched.
4. If cloud progress already exists, use **Cài đặt → Nhập tiến độ cũ trên máy** to explicitly replace it, or import a JSON backup. Replacement asks for confirmation and downloads a backup first. Reset clears cloud progress and drafts and does not offer automatic reimport afterward.
5. Unlock in another browser/device. Confirm the same progress and draft appear. Make a small change, wait for **Đã lưu trên Supabase**, and return to the first device to verify it refreshes.

Migration reads local storage only on the same origin where progress was saved. If your deployment URL changed, export a backup from the old URL before importing it on the new one. Browser download settings may require allowing backup downloads.

## Saving and recovery

Study changes save in order. Writing drafts debounce for 500 ms and flush when leaving the editor or hiding the tab. Returning to a tab finishes pending writes before refreshing cloud data.

Network failures pause the queue. Keep the tab open and select **Thử lại**; retrying a request whose response was lost does not duplicate progress. Unsaved data is held in memory, so closing the browser can lose it. This version requires an internet connection and warns on closing with unsaved changes; mobile browsers may not honor that warning.

If another device updated the record, saving stops with a conflict. Download **Tải bản khôi phục** before **Tải lại từ đám mây**. Inspect your backup and use Settings import if you want to replace cloud progress. Automatic merging and simultaneous study on multiple devices are outside this version.

Backups include learning data and drafts, never access codes or server keys. Requests are limited to 3 MB to remain below Vercel's function body limit; histories are not automatically pruned. If this limit is reached, download recovery data before reloading, and reduce historical data in a backup before importing it.

## Verification

```sh
npm test
npm run lint
npm run build
```

After deployment, verify incorrect codes fail, unlocking succeeds, settings and drafts survive reload, and a second device sees saved progress. In Supabase, check that the single study row updates. An unauthenticated request to `/api/progress` must return 401 after configuration is complete; direct table/RPC access using a publishable key must be denied.

The repository tests use an isolated embedded PostgreSQL database and do not touch your Supabase project. Local tests do not verify your deployed secrets or applied production migration.
