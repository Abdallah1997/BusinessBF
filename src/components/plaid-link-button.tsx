"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { IconBank } from "./icons";
import { btnPrimary } from "./ui";

/**
 * Opens Plaid Link. The link token is fetched on mount (not on click) so that
 * open() can run synchronously inside the button's click handler. Browsers
 * block the Plaid modal when open() is called outside a user gesture, which is
 * what happened when the token was fetched on click and open() fired after the
 * async response resolved.
 */
export function PlaidLinkButton() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/plaid/link-token", { method: "POST" });
        if (!res.ok) {
          if (!cancelled) setError("Could not start bank linking. Check your Plaid keys.");
          return;
        }
        const data = await res.json();
        if (!cancelled) setLinkToken(data.link_token as string);
      } catch {
        if (!cancelled) setError("Could not reach the bank linking service.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      router.refresh();
    },
    [router],
  );

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  const label = busy ? "Connecting…" : !linkToken ? "Loading…" : "Connect a bank with Plaid";

  return (
    <div>
      <button type="button" onClick={() => open()} disabled={!ready || busy} className={btnPrimary}>
        <IconBank className="h-4 w-4" />
        {label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
