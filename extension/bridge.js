// Runs on the BusinessBF web app. Relays listing payloads the app posts via
// window.postMessage to the extension's service worker, and announces that the
// extension is installed so the app can enable its "Send to Mercari" button.

window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data) return;

  // App -> extension: a listing to crosslist.
  if (e.data.source === "businessbf-crosslist" && e.data.marketplace) {
    chrome.runtime.sendMessage({
      type: "CROSSLIST",
      marketplace: e.data.marketplace,
      payload: e.data.payload,
    });
    return;
  }

  // App -> bridge: presence check. Reply so the app can enable the button.
  if (e.data.source === "businessbf-app" && e.data.type === "PING") {
    announce();
  }
});

function announce() {
  window.postMessage({ source: "businessbf-ext", type: "READY" }, "*");
}

// Announce on load too, in case the app mounted before this script ran.
announce();
