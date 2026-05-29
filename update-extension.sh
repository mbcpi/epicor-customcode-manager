#!/bin/bash
# update-extension.sh
# Downloads the latest release of epicor-efx-manager from GitHub and installs it.
# VS Code profiles, passwords, and API keys are stored outside the extension folder
# (settings.json and macOS Keychain) so they survive the update automatically.

set -e

REPO="mbcpi/epicor-customcode-manager"
EXT_ID="micah-bragg.epicor-efx-manager"

echo "Checking latest release..."
RELEASE_JSON=$(curl -sf "https://api.github.com/repos/$REPO/releases/latest")

if [ -z "$RELEASE_JSON" ]; then
    echo "Error: Could not reach GitHub API. Check your internet connection."
    exit 1
fi

VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')
VSIX_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep '\.vsix"' | head -1 | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/')

if [ -z "$VSIX_URL" ]; then
    echo "Error: No .vsix file found in release $VERSION."
    echo "Make sure a .vsix asset has been attached to the GitHub release."
    exit 1
fi

# Check what's currently installed
CURRENT=$(ls ~/.vscode/extensions/ 2>/dev/null | grep "^${EXT_ID}-" | sort -V | tail -1)
if [ -n "$CURRENT" ]; then
    CURRENT_VER=$(echo "$CURRENT" | sed "s/^${EXT_ID}-//")
    echo "Installed : $CURRENT_VER"
fi
echo "Available : $VERSION"

if [ "$CURRENT_VER" = "$VERSION" ]; then
    echo "Already up to date."
    exit 0
fi

echo ""
echo "Downloading $VSIX_URL ..."
TMPFILE=$(mktemp /tmp/epicor-efx-XXXXXX.vsix)
curl -L --progress-bar -o "$TMPFILE" "$VSIX_URL"

echo "Installing..."
code --install-extension "$TMPFILE" --force

rm -f "$TMPFILE"

# Remove old version folder(s) so VS Code doesn't get confused by duplicates
if [ -n "$CURRENT" ] && [ "$CURRENT_VER" != "$VERSION" ]; then
    echo "Removing old version ($CURRENT_VER)..."
    rm -rf "$HOME/.vscode/extensions/$CURRENT"
fi

echo ""
echo "Done! Updated to $VERSION."
echo "Reload VS Code to activate: Cmd+Shift+P → Developer: Reload Window"
