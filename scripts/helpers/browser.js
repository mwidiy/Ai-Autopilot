// scripts/helpers/browser.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function loadStorageStateIfValid(filePath = path.join(process.cwd(), 'data/storage/auth-state.json')) {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    if (!raw) return undefined;
    JSON.parse(raw); // throw kalau JSON tidak valid
    return filePath;
  } catch {
    return undefined;
  }
}

async function launchBrowser(options = {}) {
  const storageStatePath = loadStorageStateIfValid(options.storageState);
  const browser = await chromium.launch({
    headless: options.headless ?? false,
    args: options.args ?? ['--disable-dev-shm-usage'],
    ...options.launchOverrides,
  });

  const contextOptions = {
    viewport: options.viewport ?? { width: 1366, height: 768 },
  };
  if (storageStatePath) contextOptions.storageState = storageStatePath;

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  return { browser, context, page, storageStatePath };
}

async function saveAuthState(context, targetPath = path.join(process.cwd(), 'data/storage/auth-state.json')) {
  const state = await context.storageState();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(state, null, 2));
  return targetPath;
}

module.exports = { launchBrowser, saveAuthState, loadStorageStateIfValid };
