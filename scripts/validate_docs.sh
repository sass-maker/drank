#!/usr/bin/env bash
# Validate the docs corpus.
#
# Source-of-truth internal-link check across docs/ and root *.md.
#
# Run from repo root: `pnpm docs:check` (which calls this script).
# CI runs the same gate in .github/workflows/ci.yml (docs job).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> 1/1  docs internal-link check (scripts/check_docs_links.py)"
python3 scripts/check_docs_links.py

echo "==> docs validation OK"
