// playwright.config.js
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  // Jalankan di semua browser utama (ubah sesuai kebutuhan)
  projects: [
    { name: 'chromium', use: { channel: 'chrome' } },
    { name: 'firefox' },
    { name: 'webkit' },
  ],

  // Pengaturan default untuk semua test dan script (bisa di-override)
  use: {
    headless: false,                      // lihat browser saat eksperimen
    viewport: { width: 1366, height: 768 },
    baseURL: 'https://example.com',       // ganti kalau perlu
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',        // bisa 'on' saat debugging
    video: 'retain-on-failure',           // rekam video saat gagal
    trace: 'on-first-retry',              // jejak interaksi untuk analisis
    // Simpan state login agar sesi tidak perlu ulang (opsional)
    storageState: 'data/storage/auth-state.json',
  },

  // Stabilitas
  timeout: 60_000,                        // timeout per test
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1,                             // 1 worker saat eksperimen biar rapi
  fullyParallel: false,
};
module.exports = config;
