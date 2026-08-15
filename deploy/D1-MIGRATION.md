# D1 → Singapore PostgreSQL migration

This is a one-time, server-to-server transfer. It sends no account records to
GitHub and writes every D1 row into the PostgreSQL migration archive before
projecting the identity, existing sessions, and account snapshot used by the
application.

## Before the transfer

1. Keep `mirror.lumeword.com` pointed at the existing Sites deployment.
2. Keep `beta.lumeword.com` pointed at the Singapore server and verify it opens.
3. On the Singapore server, add a fresh `D1_MIGRATION_TOKEN` value to
   `.env.production` (generate it with `openssl rand -hex 32`). Do not commit
   it or paste it into an issue, chat, or workflow input.
4. In the existing Sites project’s production environment, add the same value
   as the secret `D1_MIGRATION_TOKEN`, and set the non-secret
   `MIGRATION_TARGET_URL=https://beta.lumeword.com`.
5. Add the existing Resend values as `RESEND_API_KEY` and `EMAIL_FROM` in the
   Singapore `.env.production` so passwordless email sign-in continues to work.

## Run and verify

Use **Actions → Deploy LifeMirror Singapore → Run workflow** and turn on
`migrate_legacy_d1`. The workflow sends D1 chunks directly to the beta server,
then verifies every source table count against the immutable target archive.
It fails rather than reporting success when any count differs.

## After verified success

1. Sign in on beta with an existing account and check the people list, chat
   threads, saved facts/history, and profile on a second device.
2. Keep the old D1 deployment untouched during this acceptance pass.
3. Only then point `mirror.lumeword.com` to the Singapore server and update
   `APP_DOMAIN` and `WEB_ORIGIN` in `.env.production` to the formal domain.
4. Redeploy normally, check sign-in and cross-device sync, then remove
   `D1_MIGRATION_TOKEN` from both environments and delete the temporary
   migration endpoint in a follow-up release.
