# Singapore production deployment

This deployment is intentionally separate from the Sites verification release.
It runs the static Next web app, Fastify API, and PostgreSQL on the same
Singapore server behind Caddy HTTPS.

## One-time server preparation

The GitHub Actions runner needs Docker access:

```bash
usermod -aG docker github-runner
systemctl restart actions.runner.ancientboy-LifeMirror.lifemirror-sg.service
sudo -u github-runner docker ps
```

Create the persistent deployment directory:

```bash
install -d -m 750 -o github-runner -g github-runner /home/github-runner/lifemirror-production
```

Run the workflow once. It safely copies the deploy source and then stops because
the environment file is absent. Afterwards create it from the copied example:

```bash
cp /home/github-runner/lifemirror-production/.env.production.example /home/github-runner/lifemirror-production/.env.production
chown github-runner:github-runner /home/github-runner/lifemirror-production/.env.production
chmod 600 /home/github-runner/lifemirror-production/.env.production
```

Fill the real secrets in `.env.production` and run the workflow a second time.
The project does not migrate existing Sites/D1 account data automatically;
keep Sites as the rollback target until a deliberate data migration is planned.

## Release sequence

1. Point a temporary subdomain such as `beta.lumeword.com` at the Singapore
   server and use it as `APP_DOMAIN`/`WEB_ORIGIN` for the first test.
2. Run **Deploy LifeMirror Singapore** manually from GitHub Actions twice: once
   to copy the example configuration, and once after the real environment file
   has been completed.
3. Verify the beta URL, sign-in, chat streaming, and saved
   relationship data.
4. Only then add `push: branches: [main]` to the workflow trigger and migrate
   data before changing `mirror.lumeword.com`.
