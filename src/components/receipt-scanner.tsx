"use client";

import { useState } from "react";
import { ActionForm } from "./action-form";
import { IconCamera, IconSparkle } from "./icons";
import { ItemFields } from "./item-fields";
import { btnPrimary, inputCls, labelCls } from "./ui";
import { scanReceipt, type ReceiptScanResult } from "@/server/receipt";
import { createItem } from "@/server/items";

function parseLocalDate(v: string): Date {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function ReceiptScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<NonNullable<ReceiptScanResult["data"]> | null>(null);

  async function handleScan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setScanning(true);
    const result = await scanReceipt(new FormData(e.currentTarget));
    setScanning(false);
    if (!result.ok || !result.data) {
      setError(result.error ?? "Scan failed");
      return;
    }
    setExtracted(result.data);
  }

  if (extracted) {
    return (
      <div className="animate-fade-up">
        <p className="mb-4 flex items-center gap-2 text-sm text-emerald-700">
          <IconSparkle className="h-4 w-4" />
          Receipt read: review the fields below, then save.
        </p>
        <ActionForm action={createItem} submitLabel="Add to inventory">
          <ItemFields
            defaults={{
              name: extracted.name,
              brand: extracted.brand,
              category: extracted.category,
              costCents: Math.round(parseFloat(extracted.cost) * 100),
              quantity: extracted.quantity,
              purchasedAt: extracted.purchasedAt ? parseLocalDate(extracted.purchasedAt) : null,
              source: extracted.source,
              notes: extracted.notes,
            }}
          />
        </ActionForm>
        <button
          type="button"
          onClick={() => setExtracted(null)}
          className="mt-3 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          Scan a different receipt
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleScan} className="animate-fade-up">
      <div className="max-w-md">
        <label className={labelCls}>Receipt photo (JPEG/PNG/WebP, max 5 MB)</label>
        <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" required className={inputCls} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={scanning} className={btnPrimary}>
          <IconCamera className="h-4 w-4" />
          {scanning ? "Reading receipt…" : "Scan with AI"}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        AI reads the store, date, items and total, then pre-fills the inventory form for your review.
      </p>
    </form>
  );
}
