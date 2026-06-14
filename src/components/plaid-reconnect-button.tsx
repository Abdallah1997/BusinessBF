"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { markReconnected } from "@/server/bank";

/**
 * Opens Plaid Link in UPDATE MODE to repair a broken connection or add newly
 * available accounts. The update-mode link token is fetched on mount so open()
 * runs inside the click gesture. On success we clear the prompt immediately
 * (the LOGIN_REPAIRED webhook clears it too).
 */
export function PlaidReconnectButton({
  bankAccountId,
  accountSelection = false,
  label = "Reconnect",
}: {
  bankAccountId: string;
  accountSelection?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/plaid/link-token/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankAccountId, accountSelection }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setToken(data.link_token as string);
        }
      } catch {
        /* leave button disabled if the token can't be fetched */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bankAccountId, accountSelection]);

  const onSuccess = useCallback(async () => {
    setBusy(true);
    await markReconnected(bankAccountId);
    setBusy(false);
    router.refresh();
  }, [bankAccountId, router]);

  const { open, ready } = usePlaidLink({ token, onSuccess });

  return (
    <button
      type="button"
      onClick={() => open()}
      disabled={!ready || busy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
    >
      {busy ? "Updating…" : label}
    </button>
  );
}
