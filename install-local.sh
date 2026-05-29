#!/usr/bin/env bash
# install-local.sh — package from this dev repo and install into Antigravity
# Usage:
#   ./install-local.sh          — repackage at current version and install
#   ./install-local.sh --bump   — bump patch version, repackage, and install

set -euo pipefail

ANTIGRAVITY="/Users/micahbragg-cpi/.antigravity/antigravity/bin/antigravity"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# ── Optional patch version bump ──────────────────────────────────────────────
if [[ "${1:-}" == "--bump" ]]; then
    CURRENT=$(node -p "require('./package.json').version")
    BUMPED=$(node -p "
        const [maj, min, pat] = '${CURRENT}'.split('.').map(Number);
        \`\${maj}.\${min}.\${pat + 1}\`
    ")
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '${BUMPED}';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');
    "
    echo "Bumped version: ${CURRENT} → ${BUMPED}"
fi

VERSION=$(node -p "require('./package.json').version")
VSIX="${DIR}/epicor-efx-manager-${VERSION}.vsix"

# ── Package ──────────────────────────────────────────────────────────────────
echo "Packaging v${VERSION}..."
npx --yes @vscode/vsce package --no-yarn --out "$VSIX" 2>&1 | tail -5

if [[ ! -f "$VSIX" ]]; then
    echo "ERROR: ${VSIX} not found after packaging." >&2
    exit 1
fi

# ── Install ───────────────────────────────────────────────────────────────────
echo "Installing ${VSIX} into Antigravity..."
"$ANTIGRAVITY" --install-extension "$VSIX"

# Clean up the vsix after install (it's an artifact, not source)
rm -f "$VSIX"

echo ""
echo "Done. Reload Antigravity window (Developer: Reload Window) to activate."
