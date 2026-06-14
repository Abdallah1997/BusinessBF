# BusinessBF Crosslister (browser extension)

Marketplaces like **Mercari**, **Facebook Marketplace**, and **Poshmark** have no
public listing API, so BusinessBF can't post to them server-side the way it does
with eBay. This extension bridges that gap: the Composer sends a listing to the
extension, the extension opens the marketplace's sell page and fills the form,
and **you review and submit**. It never auto-submits and never logs in for you.

Currently supported: **Mercari** (title, description, price). Photos and category
are left for you to set on the page.

## Install (unpacked, for now)

1. Open `chrome://extensions` in Chrome (or `edge://extensions`).
2. Toggle **Developer mode** on (top right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the extension if you like.

That's it — no sign-in. The extension only talks to the BusinessBF app and Mercari.

## Use

1. In BusinessBF → **Composer**, pick an item / write the listing.
2. On the **Mercari** card, click **Send to Mercari**.
3. A Mercari sell tab opens with title/description/price filled. Add photos +
   category, review, and click **List**.

## How it works

- `bridge.js` runs only on the BusinessBF site and relays the listing (via
  `window.postMessage`) to the service worker. It also tells the app the
  extension is installed so the button enables.
- `background.js` stashes the listing and opens `mercari.com/sell`.
- `mercari.js` runs on the sell page and fills the fields.

## Maintenance

Mercari is a React app and changes its HTML periodically. If a field stops
filling, update the candidate selectors at the top of `mercari.js`.

## Notes / scope

- Human-in-the-loop by design (you click List). This is the standard, lower-risk
  approach for sites whose terms discourage automation.
- If the app moves to a custom domain, update the domain in `manifest.json`
  (`host_permissions` + the bridge content-script `matches`) and reload.
- Facebook Marketplace and Poshmark are not built yet — same pattern, added later.
