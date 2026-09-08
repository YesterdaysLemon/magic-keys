#!/usr/bin/env bash
# Install ONLY the reviewed Magic Keys app integration. Run as root on the existing VPS.
set -euo pipefail
[[ $(id -u) == 0 ]] || { echo 'Run this script with sudo.' >&2; exit 1; }
bundle_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
secret_file="$bundle_dir/webhook-secret"
[[ -r "$secret_file" ]] || { echo 'Missing separately staged webhook secret.' >&2; exit 1; }
[[ -r "$bundle_dir/review/apps/magic-keys.env" ]] || { echo 'Missing reviewed configuration bundle.' >&2; exit 1; }
command -v flock >/dev/null
exec 9>/run/lock/magic-keys-install.lock
flock -n 9 || { echo 'Another Magic Keys installation is running.' >&2; exit 1; }
# New app only: do not overwrite an existing integration.
[[ ! -e /etc/deploy-manager/apps/magic-keys.env ]] || { echo 'Magic Keys already has host state. Inspect it before retrying.' >&2; exit 1; }
for port in 3110 3111; do
  if ss -H -lnt "sport = :$port" | read -r _; then echo "Port $port is already occupied." >&2; exit 1; fi
done
getent passwd codex >/dev/null
# Stop before changing config if the manager currently has a release in flight.
python3 - <<'PY'
import json, urllib.request
x=json.load(urllib.request.urlopen('http://127.0.0.1:9019/api/releases',timeout=5))
items=x.get('releases',x.get('jobs',[]))
if any(r.get('status') in ('queued','running','accepted') for r in items):
 raise SystemExit('A Deploy Manager release is in flight. Wait for it to finish before installation.')
PY
backup_dir="/root/magic-keys-backup-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$backup_dir"
cp -a /etc/caddy/Caddyfile /etc/deploy-manager/apps.json /etc/deploy-manager/deploy-manager.env "$backup_dir/"
if [[ -e /etc/deploy-manager/public-topology.json ]]; then
  cp -a /etc/deploy-manager/public-topology.json "$backup_dir/public-topology.json"
fi
rollback_install() {
  trap - ERR
  cp -a "$backup_dir/Caddyfile" /etc/caddy/Caddyfile
  cp -a "$backup_dir/apps.json" /etc/deploy-manager/apps.json
  cp -a "$backup_dir/deploy-manager.env" /etc/deploy-manager/deploy-manager.env
  if [[ -e "$backup_dir/public-topology.json" ]]; then
    cp -a "$backup_dir/public-topology.json" /etc/deploy-manager/public-topology.json
  else
    rm -f /etc/deploy-manager/public-topology.json
  fi
  rm -f /etc/deploy-manager/apps/magic-keys.env
  systemctl restart deploy-manager.service || true
  systemctl reload caddy || true
  echo "Installation failed; host config restored from $backup_dir. The new checkout is retained for inspection." >&2
}
trap rollback_install ERR
# Stage a public checkout owned by the existing unprivileged repository user.
install -d -o codex -g codex /opt/magic-keys
if [[ -e /opt/magic-keys/app ]]; then
  [[ $(runuser -u codex -- git -C /opt/magic-keys/app remote get-url origin) == https://github.com/YesterdaysLemon/magic-keys.git ]]
  [[ -z $(runuser -u codex -- git -C /opt/magic-keys/app status --porcelain) ]]
else
  runuser -u codex -- git clone --branch main --single-branch https://github.com/YesterdaysLemon/magic-keys.git /opt/magic-keys/app
fi
install -d /var/log/deploy-manager
install -o root -g root -m 644 "$bundle_dir/review/apps/magic-keys.env" /etc/deploy-manager/apps/magic-keys.env
export MAGIC_KEYS_BUNDLE="$bundle_dir" MAGIC_KEYS_BACKUP="$backup_dir"
python3 - <<'PY'
import json, pathlib, os, re, shutil
base=pathlib.Path(os.environ['MAGIC_KEYS_BUNDLE']);backup=pathlib.Path(os.environ['MAGIC_KEYS_BACKUP'])
secret=(base/'webhook-secret').read_text().strip()
if not re.fullmatch('[0-9a-f]{64}',secret):raise SystemExit('Invalid staged webhook secret')
def atomic(path,text,mode=None):
 path=pathlib.Path(path); temp=path.with_name(path.name+'.magic-keys-tmp');temp.write_text(text);os.chmod(temp,mode if mode is not None else path.stat().st_mode & 0o777);os.replace(temp,path)
app_path=pathlib.Path('/etc/deploy-manager/apps.json');apps=json.loads(app_path.read_text())
if 'magic-keys' in apps.get('apps',{}):raise SystemExit('App ID already exists')
apps.setdefault('apps',{}).update(json.loads((base/'review/apps.json').read_text())['apps'])
atomic(app_path,json.dumps(apps,indent=2)+'\n')
env_path=pathlib.Path('/etc/deploy-manager/deploy-manager.env');env=env_path.read_text()
if re.search(r'^MAGIC_KEYS_DEPLOY_WEBHOOK_SECRET=',env,re.M):raise SystemExit('Secret variable already exists')
env=env.rstrip()+'\nMAGIC_KEYS_DEPLOY_WEBHOOK_SECRET='+secret+'\n'
# Preserve the current fleet map and add a route in a root-owned persistent file.
match=re.search(r'^DEPLOY_MANAGER_PUBLIC_TOPOLOGY_FILE=(.*)$',env,re.M)
source=pathlib.Path(match.group(1).strip().strip('\"\'')) if match else pathlib.Path('/opt/deploy-manager-current/config/public-topology.json')
topology=json.loads(source.read_text())
if any(r.get('id')=='magic-keys' for r in topology.get('routes',[])):raise SystemExit('Public route already exists')
topology.setdefault('routes',[]).append({'id':'magic-keys','appId':'magic-keys','name':'Magic Keys','hostname':'keys.alirezaafshan.com','port':3110,'kind':'lab','description':'Programmable keyboard layouts and context-sensitive keys.','healthPath':'/healthz'})
path=pathlib.Path('/etc/deploy-manager/public-topology.json')
if path.exists():shutil.copy2(path,backup/'public-topology.json')
atomic(path,json.dumps(topology,indent=2)+'\n',0o644)
env=re.sub(r'^DEPLOY_MANAGER_PUBLIC_TOPOLOGY_FILE=.*\n?','',env,flags=re.M).rstrip()+'\nDEPLOY_MANAGER_PUBLIC_TOPOLOGY_FILE=/etc/deploy-manager/public-topology.json\n'
atomic(env_path,env,0o600)
caddy=pathlib.Path('/etc/caddy/Caddyfile');text=caddy.read_text()
if 'keys.alirezaafshan.com' in text:raise SystemExit('Hostname already present in Caddy config')
atomic(caddy,text.rstrip()+'\n\n# BEGIN MAGIC KEYS\nkeys.alirezaafshan.com {\n    encode zstd gzip\n    reverse_proxy 127.0.0.1:3110\n}\n# END MAGIC KEYS\n')
PY
if ! caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
  rollback_install
  exit 1
fi
systemctl restart deploy-manager.service
manager_ready=false
for attempt in $(seq 1 30); do
  if curl --fail --silent --max-time 2 http://127.0.0.1:9019/healthz >/dev/null; then
    manager_ready=true
    break
  fi
  sleep 1
done
if [[ $manager_ready != true ]]; then
  echo 'Deploy Manager did not become healthy within the startup window.' >&2
  rollback_install
  exit 1
fi
systemctl reload caddy
trap - ERR
printf 'Magic Keys integration installed. Backup: %s\n' "$backup_dir"
printf 'Next: enable DEPLOY_ENABLED=true in GitHub and run the validated CI release.\n'
printf 'DNS required: keys.alirezaafshan.com A 107.172.137.190 (no AAAA unless IPv6 is configured).\n'
