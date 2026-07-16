#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
files=(
  examples/trapped-tropics-p2/01-aug05.yaml
  examples/trapped-tropics-p2/02-aug12.yaml
  examples/trapped-tropics-p2/03-aug19.yaml
  examples/trapped-tropics-p2/04-aug26.yaml
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
echo "All Trapped in the Tropics Part 2 sessions processed."
