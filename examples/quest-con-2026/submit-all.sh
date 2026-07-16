#!/usr/bin/env bash
# Fill Harbourmaster forms for each Quest Con YAML, one at a time.
# After each fill: review, Submit in Chrome, then close the browser to continue.
set -euo pipefail
cd "$(dirname "$0")/.."
files=(
  examples/quest-con-2026/01-shot-across-bow-fri.yaml
  examples/quest-con-2026/02-shot-across-bow-sat.yaml
  examples/quest-con-2026/03-trapped-tropics-fri.yaml
  examples/quest-con-2026/04-trapped-tropics-sat.yaml
  examples/quest-con-2026/05-venom-veins-sat.yaml
)
n=${#files[@]}
i=0
for f in "${files[@]}"; do
  i=$((i + 1))
  echo
  echo "=== [$i/$n] $f ==="
  rm -f .browser-profile/SingletonLock .browser-profile/SingletonCookie .browser-profile/SingletonSocket 2>/dev/null || true
  npm run submit -- "$f"
  echo "=== [$i/$n] done ==="
done
echo "All Quest Con events processed."
