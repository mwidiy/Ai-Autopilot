// scripts/chatgpt-playwright.js
const { launchBrowser, saveAuthState } = require('./helpers/browser');
const fs = require('fs');
const path = require('path');

const sel = {
  inputSelector: 'textarea[tabindex]:not([hidden]), textarea[aria-label="Message"], textarea[placeholder*="Send"]',
  sendButtonSelector: 'button:has-text("Send"), button[type="submit"], button[aria-label="Send"]',
  messageSelector: '.chat-message, .message, .flex.markdown, div[class*="message"]',
  loadingSelector: '.typing, .loading, [aria-busy="true"]'
};

async function safeWaitForSelector(page, selector, opts = {}) {
  if (page.isClosed && page.isClosed()) throw new Error('Page already closed');
  return page.waitForSelector(selector, opts);
}

async function sendPromptAndGetReply(page, prompt) {
  // pastikan page belum tertutup
  if (page.isClosed && page.isClosed()) throw new Error('Page already closed before sending');

  // tunggu input muncul; ini juga memastikan halaman siap
  await safeWaitForSelector(page, sel.inputSelector, { timeout: 15000 });

  // dapatkan jumlah pesan sebelum mengirim
  const before = await page.$$eval(sel.messageSelector, els => els.length).catch(() => 0);

  // isi dan kirim
  const input = await page.$(sel.inputSelector);
  await input.click();
  await input.fill(prompt);

  const sendBtn = await page.$(sel.sendButtonSelector);
  if (sendBtn) {
    await sendBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // tunggu elemen baru muncul (jumlah > before) atau sampai timeout
  const timeoutMs = 45000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (page.isClosed && page.isClosed()) throw new Error('Page closed while waiting reply');
    const count = await page.$$eval(sel.messageSelector, els => els.length).catch(() => 0);
    if (count > before) break;
    await page.waitForTimeout(250);
  }

  // tunggu stabil (loader hilang atau teks terakhir tidak berubah)
  let lastText = '';
  const stabilizeStart = Date.now();
  while (Date.now() - stabilizeStart < 20000) {
    if (page.isClosed && page.isClosed()) throw new Error('Page closed while stabilizing reply');
    const loading = await page.$(sel.loadingSelector);
    if (!loading) {
      const msgs = await page.$$(sel.messageSelector);
      if (msgs.length) {
        const last = msgs[msgs.length - 1];
        const text = (await last.innerText()).trim();
        if (text && text === lastText) break;
        lastText = text;
      }
    }
    await page.waitForTimeout(300);
  }

  const msgs = await page.$$(sel.messageSelector);
  const last = msgs[msgs.length - 1];
  return last ? (await last.innerText()).trim() : '';
}

async function run() {
  // override headless false supaya terlihat; bisa ganti saat panggil launchBrowser
  const { browser, context, page, storageStatePath } = await launchBrowser({ headless: false });
  try {
    // debug hooks
    page.on('close', () => console.log('DEBUG: page closed event'));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));

    await page.goto('https://chat.openai.com/', { waitUntil: 'domcontentloaded' });
    // tunggu sampai jaringan stabil agar UI load lebih lengkap
    await page.waitForLoadState('networkidle').catch(() => {});

    // cek apakah input chat tersedia (logged in). kalau tidak, minta login manual.
    const inputExists = await page.$(sel.inputSelector);
    if (!inputExists) {
      console.log('Tidak menemukan input chat. Jika perlu login, silakan login manual di browser yang terbuka.');
      console.log('Setelah login selesai, tekan ENTER di terminal untuk melanjutkan.');
      await new Promise(resolve => {
        process.stdin.resume();
        process.stdin.once('data', () => {
          process.stdin.pause();
          resolve();
        });
      });
      // simpan auth state kalau mau reuse
      await saveAuthState(context).catch(() => {});
      // reload dan tunggu stabil
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // contoh pengiriman prompt
    const prompt = 'Halo, jelaskan secara singkat bagaimana AI bekerja untuk pemula.';
    console.log('Sending prompt:', prompt);
    const reply = await sendPromptAndGetReply(page, prompt);
    console.log('Reply:', reply);

    // simpan output
    const outDir = path.join(process.cwd(), 'data/outputs');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'chatgpt-run.json'), JSON.stringify({ prompt, reply }, null, 2));
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error('Error in run:', err);
    // tangkap screenshot untuk debugging
    try { await page.screenshot({ path: path.join(process.cwd(), 'data/outputs/debug-screenshot.png') }); } catch {}
  } finally {
    await browser.close();
  }
}

run();
