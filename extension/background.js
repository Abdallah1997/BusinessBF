// Service worker: receives a listing payload relayed from the BusinessBF web
// app (via bridge.js), stashes it, and opens the Mercari sell page where
// mercari.js fills the form.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "CROSSLIST" && msg.marketplace === "mercari") {
    chrome.storage.local.set({ bbfPendingMercari: msg.payload }, () => {
      chrome.tabs.create({ url: "https://www.mercari.com/sell/" });
    });
    sendResponse({ ok: true });
  }
  // Keep the message channel open for the async sendResponse.
  return true;
});
