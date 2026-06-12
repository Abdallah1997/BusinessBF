"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { IconBank } from "./icons";
import { btnPrimary } from "./ui";

/**
 * Opens Plaid Link. Two-step: fetch a link token from our API, then open the
 * Plaid modal; on success, exchange the public token server-side.
 */
export function PlaidLinkButton() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setBusy(true);
      const res = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });
      setBusy(false);
      if (!res.ok) {
        setError("Bank linking failed. Try again.");
        return;
      }
      setLinkToken(null);
      router.refresh();
    },
    [router],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  async function start() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/plaid/link-token", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not start bank linking. Check your Plaid keys.");
      return;
    }
    const data = await res.json();
    setLinkToken(data.link_token);
  }

  // Once the token arrives and Link is ready, open the modal.
  if (linkToken && ready && !busy) {
    open();
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={busy} className={btnPrimary}>
        <IconBank className="h-4 w-4" />
        {busy ? "Connecting…" : "Connect a bank with Plaid"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
