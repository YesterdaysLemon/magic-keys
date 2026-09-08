# Magic Keys deployment proposal

The host was inspected read-only on 2026-09-08. `codex` SSH access works using the configured Mac key and the VPS IP; `sudo` requires an operator. No production configuration was changed by preparing this bundle.

- App/repo: `magic-keys`, `YesterdaysLemon/magic-keys`, branch `main`.
- Route: `keys.alirezaafshan.com` → `127.0.0.1:3110`.
- Candidate: `127.0.0.1:3111`. Both ports were unused at inspection; the installer rechecks them.
- Container: port 3000, non-root Node static server, `/healthz`.
- Checkout: `/opt/magic-keys/app`, owned by the existing `codex` account.
- GitHub secrets: `DEPLOY_WEBHOOK_URL`, `DEPLOY_WEBHOOK_SECRET`.
- VPS secret name: `MAGIC_KEYS_DEPLOY_WEBHOOK_SECRET`.
- CI deployment remains disabled until the repository variable `DEPLOY_ENABLED` is `true`.
- The actual CI workflow is `.github/workflows/ci.yml`. Generated review workflow is a reference template only.

`review/` was produced by Deploy Manager's setup generator and passed its schema validation. The installer **merges** the one-app entries; copying the one-app review files over the full fleet would erase existing entries and must not be done.

## Exact privileged changes

1. Root-owned backup of Caddyfile, app allowlist, manager environment, and existing public topology under `/root/magic-keys-backup-*`.
2. New checkout `/opt/magic-keys/app`; new `/etc/deploy-manager/apps/magic-keys.env`.
3. Add exactly one app to `/etc/deploy-manager/apps.json` and one secret variable to `/etc/deploy-manager/deploy-manager.env`.
4. Preserve the existing public topology and append Magic Keys in `/etc/deploy-manager/public-topology.json`; point the manager at that persistent file.
5. Append one Caddy route, validate it, restart the manager after checking that no release is in flight, and reload Caddy.

No sudoers, systemd units, firewall, existing containers, or existing app files are modified by the installer. Subsequent signed CI release builds the new image and performs the standard candidate/production health checks. Existing-app deployments keep their normal behavior.

The desired DNS A record did not resolve at inspection. Create `keys` → `107.172.137.190` in the domain's DNS panel. A subdomain under the existing domain does not require a new domain purchase.

## Install

The separately staged `webhook-secret` file must be next to `install-vps.sh`. It is not committed. After reviewing this bundle, an operator with sudo runs:

```sh
sudo bash /home/codex/magic-keys-bootstrap/install-vps.sh
```

Then enable the GitHub deployment variable and run CI. A successful signed acceptance is not deployment proof: wait for the receipt to report `succeeded`, verify the SHA-tagged production image, and check public HTTPS `/healthz`.

A normal future app update has a short container cutover window. Deploy Manager restores the prior image if candidate/production health checks fail. On the first release there is no prior Magic Keys image. For installation rollback, restore the root backup, remove only the new Magic Keys app entry/env/route, and restart/reload the affected services after validation.
