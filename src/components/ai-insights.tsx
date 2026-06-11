"use client";

import { useState } from "react";
import { IconSparkle } from "./icons";
import { Card, btnGhost } from "./ui";
import { generateInsights } from "@/server/insights";

export function AiInsights({ aiConfigured }: { aiConfigured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[] | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    const result = await generateInsights();
    setLoading(false);
    if (!result.ok || !result.insights) {
      setError(result.error ?? "Failed");
      return;
    }
    setInsights(result.insights);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <IconSparkle className="h-4 w-4 text-emerald-600" /> AI insights
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !aiConfigured}
          className={btnGhost}
          title={aiConfigured ? undefined : "Add ANTHROPIC_API_KEY to .env to enable"}
        >
          {loading ? "Analyzing…" : insights ? "Refresh" : "Analyze my business"}
        </button>
      </div>

      {!aiConfigured && (
        <p className="mt-3 text-xs text-zinc-400">
          Requires <code className="rounded bg-zinc-100 px-1">ANTHROPIC_API_KEY</code> in .env
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="mt-4 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-4/6" />
        </div>
      )}

      {insights && !loading && (
        <ul className="mt-4 space-y-2.5 stagger-children">
          {insights.map((line, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {line}
            </li>
          ))}
        </ul>
      )}

      {!insights && !loading && aiConfigured && (
        <p className="mt-3 text-xs text-zinc-400">
          AI reads your sales, fees, expenses and stale listings, then tells you what to do about them.
        </p>
      )}
    </Card>
  );
}
