"use client";

import { useState } from "react";
import { ActionForm } from "./action-form";
import { IconMail, IconSparkle } from "./icons";
import { btnPrimary, inputCls, labelCls, tdCls, tdMoney, thCls } from "./ui";
import {
  extractOrderEmail,
  importExtractedItems,
  type ExtractedOrder,
} from "@/server/email-import";

export function EmailImportForm() {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<ExtractedOrder | null>(null);
  const [selected, setSelected] = useState<boolean[]>([]);

  async function handleExtract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setExtracting(true);
    const result = await extractOrderEmail(new FormData(e.currentTarget));
    setExtracting(false);
    if (!result.ok || !result.data) {
      setError(result.error ?? "Extraction failed");
      return;
    }
    setOrder(result.data);
    setSelected(result.data.items.map(() => true));
  }

  if (order) {
    const chosen = order.items.filter((_, i) => selected[i]);
    const payload = JSON.stringify({
      vendor: order.vendor,
      orderDate: order.orderDate,
      items: chosen.map((i) => ({
        name: i.name,
        brand: i.brand,
        quantity: i.quantity,
        costCents: Math.round(parseFloat(i.unitPriceDollars) * 100),
      })),
    });

    return (
      <div className="animate-fade-up">
        <p className="mb-1 flex items-center gap-2 text-sm text-emerald-700">
          <IconSparkle className="h-4 w-4" />
          Found {order.items.length} item{order.items.length > 1 ? "s" : ""}
          {order.vendor ? ` from ${order.vendor}` : ""}
          {order.orderDate ? ` · ordered ${order.orderDate}` : ""}
        </p>
        <p className="mb-4 text-xs text-zinc-400">Uncheck anything you don&apos;t want, then add to inventory.</p>

        <table className="w-full">
          <thead className="border-b border-zinc-200">
            <tr>
              <th className={thCls}></th>
              <th className={thCls}>Item</th>
              <th className={thCls}>Qty</th>
              <th className={thCls}>Unit cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 stagger-children">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className={tdCls}>
                  <input
                    type="checkbox"
                    checked={selected[i]}
                    onChange={() =>
                      setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                </td>
                <td className={tdCls}>
                  <span className="font-medium text-zinc-900">{item.name}</span>
                  {item.brand && <span className="ml-2 text-xs text-zinc-400">{item.brand}</span>}
                </td>
                <td className={tdCls}>{item.quantity}</td>
                <td className={tdMoney}>${item.unitPriceDollars}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center gap-3">
          <ActionForm action={importExtractedItems} submitLabel={`Add ${chosen.length} to inventory`}>
            <input type="hidden" name="payload" value={payload} />
          </ActionForm>
          <button
            type="button"
            onClick={() => setOrder(null)}
            className="mb-0 mt-4 self-start text-xs font-medium text-zinc-500 hover:text-zinc-800"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleExtract} className="animate-fade-up">
      <div>
        <label className={labelCls}>Paste the order-confirmation email</label>
        <textarea
          name="emailText"
          rows={8}
          className={inputCls}
          placeholder="Paste the full email here — raw source with headers works too…"
        />
      </div>
      <div className="mt-3 max-w-md">
        <label className={labelCls}>…or upload a .eml / .txt file</label>
        <input name="emailFile" type="file" accept=".eml,.txt,text/plain,message/rfc822" className={inputCls} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={extracting} className={btnPrimary}>
          <IconMail className="h-4 w-4" />
          {extracting ? "Reading email…" : "Extract items with AI"}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
