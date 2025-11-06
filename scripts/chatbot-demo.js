// scripts/chatbot-demo.js
const { launchBrowser, saveAuthState } = require('./helpers/browser');
const { readPrompts, saveOutput } = require('./helpers/io');
const sel = require('./helpers/selectors');

async function gotoAndWait(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Tunggu elemen input muncul
  await page.waitForSelector(sel.inputSelector, { timeout: 15_000 });
}

async function sendPrompt(page, prompt) {
  // Fokus input
  const input = await page.waitForSelector(sel.inputSelector, { timeout: 10_000 });
  await input.click();
  await input.fill(prompt);

  // Klik tombol kirim (kalau ada), atau tekan Enter
  const sendBtn = await page.$(sel.sendButtonSelector);
  if (sendBtn) {
    await sendBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }
}

async function waitForResponse(page) {
  // Tunggu indikator loading selesai jika ada
  const loading = await page.$(sel.loadingSelector);
  if (loading) {
    // Tunggu sampai indikator hilang (maks 30 detik)
    await page.waitForSelector(sel.loadingSelector, { state: 'detached', timeout: 30_000 }).catch(() => {});
  }
  // Ambil pesan terakhir
  const last = await page.$(sel.lastMessageSelector);
  if (!last) {
    // fallback: ambil semua pesan
    const msgs = await page.$$(sel.messageSelector);
    return msgs.length ? msgs[msgs.length - 1].innerText() : '';
  }
  return await last.innerText();
}

async function run() {
  const { browser, context, page } = await launchBrowser();
  const url = 'https://example.com'; // GANTI ke URL chatbot kamu
  const prompts = readPrompts();     // isi data/prompts.txt baris per baris

  const outputs = [];

  try {
    await gotoAndWait(page, url);

    for (const prompt of prompts.length ? prompts : ['Halo, ini uji coba. Jelaskan dirimu singkat.']) {
      await sendPrompt(page, prompt);
      const answer = await waitForResponse(page);
      outputs.push({ prompt, answer, timestamp: new Date().toISOString() });
      console.log(`Prompt: ${prompt}\nAnswer: ${answer}\n---`);
      // Jeda kecil agar UI tidak kejar-kejaran
      await page.waitForTimeout(1500);
    }

    // Simpan state login (opsional dan hanya jika situs pakai auth)
    await saveAuthState(context);

    const file = saveOutput(outputs, 'chatbot-run');
    console.log(`Saved to: ${file}`);

    // Biarkan terbuka sebentar untuk inspeksi
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

run();
