"use strict";
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = []; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k; return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") result[k[i]] = mod[k[i]];
        result["default"] = mod; return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateCommand = registerUpdateCommand;
exports.checkForUpdatesOnStartup = checkForUpdatesOnStartup;

const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURE THIS — set to your actual GitHub owner/repo
// ─────────────────────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'micah-bragg';
const GITHUB_REPO  = 'epicor-efx-manager';
// ─────────────────────────────────────────────────────────────────────────────

const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const SNOOZE_KEY   = 'efx.updateSnoozedVersion';

// ── Semver compare: returns true if remoteVersion > localVersion ──
function isNewer(localVersion, remoteVersion) {
    const parse = v => String(v || '0').replace(/^v/, '').split('.').map(n => parseInt(n) || 0);
    const [lMaj, lMin, lPatch] = parse(localVersion);
    const [rMaj, rMin, rPatch] = parse(remoteVersion);
    if (rMaj !== lMaj) return rMaj > lMaj;
    if (rMin !== lMin) return rMin > lMin;
    return rPatch > lPatch;
}

// ── Fetch JSON from a URL, following up to 3 redirects ──
function fetchJson(url, redirectsLeft = 3) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'epicor-efx-manager-vscode' },
        }, res => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirectsLeft > 0) {
                return resolve(fetchJson(res.headers.location, redirectsLeft - 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`GitHub API returned ${res.statusCode}`));
            }
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Failed to parse GitHub API response')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('Update check timed out')); });
    });
}

// ── Download a URL to a local file path ──
function downloadFile(url, destPath, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const req = https.get(url, {
            headers: { 'User-Agent': 'epicor-efx-manager-vscode' },
        }, res => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirectsLeft > 0) {
                file.close();
                fs.unlink(destPath, () => {});
                return resolve(downloadFile(res.headers.location, destPath, redirectsLeft - 1));
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {});
                return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
        });
        req.on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
        req.setTimeout(60000, () => { req.destroy(); reject(new Error('Download timed out')); });
    });
}

// ── Core: fetch latest release info from GitHub ──
async function getLatestRelease() {
    const data = await fetchJson(RELEASES_API);

    // Find the .vsix asset
    const asset = (data.assets || []).find(a => a.name && a.name.endsWith('.vsix'));
    if (!asset) throw new Error('No .vsix asset found in latest GitHub release');

    return {
        version:     (data.tag_name || '').replace(/^v/, ''),
        tagName:     data.tag_name || '',
        releaseNotes: data.body || '',
        downloadUrl: asset.browser_download_url,
        assetName:   asset.name,
    };
}

// ── Download + install a .vsix ──
async function installRelease(release) {
    const tmpPath = path.join(os.tmpdir(), release.assetName);

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `EFx: Downloading v${release.version}...`, cancellable: false },
        async () => {
            await downloadFile(release.downloadUrl, tmpPath);
        }
    );

    // VS Code installs a .vsix from a URI
    const vsixUri = vscode.Uri.file(tmpPath);
    await vscode.commands.executeCommand('workbench.extensions.installExtension', vsixUri);

    // Clean up temp file after a short delay
    setTimeout(() => { try { fs.unlinkSync(tmpPath); } catch (_) {} }, 5000);

    const reload = await vscode.window.showInformationMessage(
        `EFx Manager updated to v${release.version}. Reload window to activate?`,
        'Reload Now',
        'Later'
    );
    if (reload === 'Reload Now') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
}

// ── Main check logic — used by both startup and manual command ──
async function checkForUpdates(context, silent = false) {
    const ext = vscode.extensions.getExtension(`${GITHUB_OWNER}.epicor-efx-manager`);
    const localVersion = ext?.packageJSON?.version || '0.0.0';

    let release;
    try {
        release = await getLatestRelease();
    } catch (err) {
        if (!silent) {
            vscode.window.showWarningMessage(`EFx: Update check failed — ${err.message}`);
        }
        return;
    }

    if (!isNewer(localVersion, release.version)) {
        if (!silent) {
            vscode.window.showInformationMessage(`EFx Manager is up to date (v${localVersion})`);
        }
        return;
    }

    // Don't re-nag if user already snoozed this exact version
    const snoozed = context.globalState.get(SNOOZE_KEY, '');
    if (silent && snoozed === release.version) return;

    const choice = await vscode.window.showInformationMessage(
        `EFx Manager v${release.version} is available (you have v${localVersion})`,
        'Update Now',
        'Later'
    );

    if (choice === 'Update Now') {
        try {
            await installRelease(release);
        } catch (err) {
            vscode.window.showErrorMessage(`EFx: Update failed — ${err.message}`);
        }
    } else if (choice === 'Later') {
        // Snooze until next version — won't nag again for this version on startup
        await context.globalState.update(SNOOZE_KEY, release.version);
    }
    // choice === undefined means the notification was dismissed — don't snooze,
    // so it shows again next startup
}

// ── Register the manual "EFx: Check for Updates" command ──
function registerUpdateCommand(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('efx.checkForUpdates', async () => {
            await checkForUpdates(context, /* silent */ false);
        })
    );
}

// ── Called on startup — runs silently in background, only speaks up if update found ──
function checkForUpdatesOnStartup(context) {
    // Small delay so it doesn't compete with extension initialization
    setTimeout(() => {
        checkForUpdates(context, /* silent */ true).catch(() => {});
    }, 5000);
}
