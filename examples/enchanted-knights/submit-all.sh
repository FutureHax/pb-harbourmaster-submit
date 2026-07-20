#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
files=(
  examples/enchanted-knights/01-lakeland-2026-07-25-afternoon.yaml
  examples/enchanted-knights/02-lakeland-2026-07-25-evening.yaml
  examples/enchanted-knights/03-lakeland-2026-07-26-afternoon.yaml
  examples/enchanted-knights/04-lakeland-2026-07-26-evening.yaml
  examples/enchanted-knights/05-volusia-2026-08-29-afternoon.yaml
  examples/enchanted-knights/06-volusia-2026-08-29-evening.yaml
  examples/enchanted-knights/07-volusia-2026-08-30-afternoon.yaml
  examples/enchanted-knights/08-volusia-2026-08-30-evening.yaml
  examples/enchanted-knights/09-sanford-2026-10-24-afternoon.yaml
  examples/enchanted-knights/10-sanford-2026-10-24-evening.yaml
  examples/enchanted-knights/11-sanford-2026-10-25-afternoon.yaml
  examples/enchanted-knights/12-sanford-2026-10-25-evening.yaml
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
echo "All Enchanted Knights events processed."
