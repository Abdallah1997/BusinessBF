// Runs on https://www.mercari.com/sell/. Reads the pending listing stashed by
// the service worker and fills the title, description and price. Photos and
// category are left to the user (Mercari requires manual photo upload, and
// category/condition use custom pickers). The user reviews everything and
// clicks List — this never auto-submits.
//
// NOTE: Mercari is a React app and changes its markup periodically. The
// selectors below are best-effort with fallbacks; if a field stops filling,
// update the candidate selectors here.

(async () => {
  const store = await chrome.storage.local.get("bbfPendingMercari");
  const data = store.bbfPendingMercari;
  if (!data) return;
  await chrome.storage.local.remove("bbfPendingMercari");

  const waitFor = (selector, timeout = 15000) =>
    new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - start > timeout) return resolve(null);
        setTimeout(tick, 300);
      };
      tick();
    });

  // React tracks input values via its own setter; we must call the native
  // setter and dispatch input/change so React picks up the value.
  const setValue = (el, value) => {
    if (!el || value == null || value === "") return;
    const proto =
      el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const titleEl = await waitFor(
    '[data-testid="Name"] input, input[name="name"], input[placeholder*="What are you selling" i], input[placeholder*="title" i]',
  );
  setValue(titleEl, data.title);

  const descEl = await waitFor(
    '[data-testid="Description"] textarea, textarea[name="description"], textarea[placeholder*="Describe" i]',
  );
  setValue(descEl, data.description);

  const priceEl = await waitFor(
    '[data-testid="Price"] input, input[name="sellPrice"], input[name="price"], input[placeholder*="price" i]',
  );
  setValue(priceEl, data.price);

  const banner = document.createElement("div");
  banner.textContent =
    "BusinessBF filled the title, description and price. Add photos + category, then review and List.";
  banner.style.cssText =
    "position:fixed;z-index:2147483647;top:0;left:0;right:0;background:#ea580c;color:#fff;font:600 14px system-ui,sans-serif;padding:10px 16px;text-align:center";
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 9000);
})();
