// scripts/helpers/selectors.js
module.exports = {
  // Input chat — sesuaikan bila ChatGPT update DOM
  inputSelector: 'textarea[tabindex]:not([hidden]), textarea[aria-label="Message"]',

  // Tombol kirim — beberapa UI punya tombol, beberapa hanya Enter
  sendButtonSelector: 'button:has-text("Send"), button[type="submit"], button[aria-label="Send"]',

  // Selector untuk pesan-balik model
  messageSelector: '.chat-message, .message, .flex.markdown, div[class*="message"]',

  // Selector indikator typing / loading jika ada
  loadingSelector: '.typing, .loading, [aria-busy="true"]',
};
