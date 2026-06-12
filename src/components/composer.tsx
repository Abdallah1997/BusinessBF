"use client";

import { useState } from "react";
import { IconSparkle } from "./icons";
import { Card, btnPrimary, inputCls, labelCls } from "./ui";
import { generateListing } from "@/server/compose";

interface MarketplaceProfile {
  key: string;
  label: string;
  titleLimit: number;
  tips: string;
  format: (input: ComposerInput) => string;
}

interface ComposerInput {
  title: string;
  brand: string;
  size: string;
  condition: string;
  measurements: string;
  flaws: string;
  description: string;
  hashtags: string;
}

function baseBody(input: ComposerInput): string {
  const parts: string[] = [];
  if (input.description) parts.push(input.description);
  const details: string[] = [];
  if (input.brand) details.push(`Brand: ${input.brand}`);
  if (input.size) details.push(`Size: ${input.size}`);
  if (input.condition) details.push(`Condition: ${input.condition}`);
  if (input.measurements) details.push(`Measurements: ${input.measurements}`);
  if (details.length) parts.push(details.join("\n"));
  if (input.flaws) parts.push(`Please note: ${input.flaws}`);
  return parts.join("\n\n");
}

const PROFILES: MarketplaceProfile[] = [
  {
    key: "EBAY",
    label: "eBay",
    titleLimit: 80,
    tips: "Use all 80 title characters: keyword-stuff naturally: brand, item type, size, color, condition.",
    format: (input) =>
      `${baseBody(input)}\n\nShips fast with tracking. Check out my other listings!`,
  },
  {
    key: "POSHMARK",
    label: "Poshmark",
    titleLimit: 80,
    tips: "Lead with brand. Buyers filter by brand and size. End description with hashtags.",
    format: (input) =>
      `${baseBody(input)}${input.hashtags ? `\n\n${input.hashtags}` : ""}\n\nSame/next-day shipping 📦 Bundle for a discount!`,
  },
  {
    key: "MERCARI",
    label: "Mercari",
    titleLimit: 80,
    tips: "Mention condition early: Mercari buyers are condition-sensitive. Hashtags help search.",
    format: (input) =>
      `${baseBody(input)}${input.hashtags ? `\n\n${input.hashtags}` : ""}`,
  },
  {
    key: "DEPOP",
    label: "Depop",
    titleLimit: 65,
    tips: "Casual tone wins on Depop. Hashtags are critical: Depop search is hashtag-driven.",
    format: (input) =>
      `${baseBody(input)}${input.hashtags ? `\n\n${input.hashtags}` : ""}\n\nDM with questions ✨`,
  },
  {
    key: "FACEBOOK",
    label: "Facebook Marketplace",
    titleLimit: 99,
    tips: "Local buyers skim: put price-justifying details (brand, condition) in the first line.",
    format: (input) => `${baseBody(input)}\n\nPorch pickup or can ship.`,
  },
];

function buildTitle(input: ComposerInput, limit: number): string {
  // Skip brand/size prefixes the title already contains (AI titles include them).
  const lower = input.title.toLowerCase();
  const brand = input.brand && !lower.includes(input.brand.toLowerCase()) ? input.brand : "";
  const size =
    input.size && !lower.includes(input.size.toLowerCase()) ? `Size ${input.size}` : "";
  const raw = [brand, input.title, size].filter(Boolean).join(" ");
  return raw.length <= limit ? raw : raw.slice(0, limit - 1).trimEnd() + "…";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-zinc-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-neutral-400 hover:bg-zinc-50 dark:hover:bg-neutral-800"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export function Composer({
  items,
  aiConfigured,
}: {
  items: { id: string; name: string; sku: string | null }[];
  aiConfigured: boolean;
}) {
  const [input, setInput] = useState<ComposerInput>({
    title: "",
    brand: "",
    size: "",
    condition: "",
    measurements: "",
    flaws: "",
    description: "",
    hashtags: "",
  });
  const [itemId, setItemId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<string | null>(null);

  function set<K extends keyof ComposerInput>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInput((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleGenerate() {
    if (!itemId) {
      setAiError("Pick an inventory item first");
      return;
    }
    setAiError(null);
    setGenerating(true);
    const fd = new FormData();
    fd.set("itemId", itemId);
    const result = await generateListing(fd);
    setGenerating(false);
    if (!result.ok || !result.data) {
      setAiError(result.error ?? "Generation failed");
      return;
    }
    const d = result.data;
    setInput({
      title: d.title,
      brand: d.brand,
      size: d.size,
      condition: d.condition,
      measurements: d.measurements,
      flaws: d.flaws,
      description: d.description,
      hashtags: d.hashtags,
    });
    setSuggestedPrice(d.suggestedPriceDollars);
  }

  const hasContent = input.title.trim().length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="p-5 lg:col-span-2 animate-fade-up">
        <div className="mb-5 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-800 dark:text-orange-300">
            <IconSparkle className="h-3.5 w-3.5" /> Generate from inventory
          </p>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-neutral-400">Add inventory items first, then AI writes the listing for you.</p>
          ) : (
            <>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className={`${inputCls} mt-2`}
              >
                <option value="">— Pick an item —</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.sku ? `[${i.sku}] ` : ""}{i.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !aiConfigured}
                className={`${btnPrimary} mt-2 w-full`}
                title={aiConfigured ? undefined : "Add ANTHROPIC_API_KEY to .env to enable"}
              >
                <IconSparkle className="h-4 w-4" />
                {generating ? "Writing listing…" : "Generate with AI"}
              </button>
              {!aiConfigured && (
                <p className="mt-1.5 text-xs text-zinc-400 dark:text-neutral-500">Requires ANTHROPIC_API_KEY in .env</p>
              )}
              {aiError && <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">{aiError}</p>}
              {suggestedPrice && (
                <p className="mt-1.5 text-xs text-orange-700 dark:text-orange-400">
                  AI suggested price: <span className="money font-semibold">${suggestedPrice}</span>
                </p>
              )}
            </>
          )}
        </div>

        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-neutral-100">Write once</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Item title *</label>
            <input value={input.title} onChange={set("title")} maxLength={120} className={inputCls} placeholder="Vintage Wool Sweater Cream Cable Knit" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Brand</label>
              <input value={input.brand} onChange={set("brand")} maxLength={60} className={inputCls} placeholder="L.L.Bean" />
            </div>
            <div>
              <label className={labelCls}>Size</label>
              <input value={input.size} onChange={set("size")} maxLength={30} className={inputCls} placeholder="M" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Condition</label>
            <input value={input.condition} onChange={set("condition")} maxLength={120} className={inputCls} placeholder="Excellent pre-owned, no flaws" />
          </div>
          <div>
            <label className={labelCls}>Measurements</label>
            <input value={input.measurements} onChange={set("measurements")} maxLength={200} className={inputCls} placeholder='Pit to pit 22", length 27"' />
          </div>
          <div>
            <label className={labelCls}>Flaws (be honest: fewer returns)</label>
            <input value={input.flaws} onChange={set("flaws")} maxLength={300} className={inputCls} placeholder="Tiny pull on left cuff, pictured" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={input.description} onChange={set("description")} maxLength={3000} rows={4} className={inputCls} placeholder="Cozy heavyweight knit, perfect for fall…" />
          </div>
          <div>
            <label className={labelCls}>Hashtags</label>
            <input value={input.hashtags} onChange={set("hashtags")} maxLength={300} className={inputCls} placeholder="#vintage #wool #cableknit #fallstyle" />
          </div>
        </div>
      </Card>

      <div className="space-y-4 lg:col-span-3">
        {!hasContent ? (
          <Card className="p-8 text-center text-sm text-zinc-400 dark:text-neutral-500">
            Start typing on the left: formatted listings for every marketplace appear here.
          </Card>
        ) : (
          PROFILES.map((profile) => {
            const title = buildTitle(input, profile.titleLimit);
            const body = profile.format(input);
            return (
              <Card key={profile.key} className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">{profile.label}</h3>
                  <div className="flex gap-2">
                    <CopyButton text={title} />
                    <CopyButton text={`${title}\n\n${body}`} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">{profile.tips}</p>
                <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-neutral-800/50 p-3">
                  <p className="text-sm font-medium text-zinc-800 dark:text-neutral-200">
                    {title}{" "}
                    <span className={`text-xs ${title.length >= profile.titleLimit ? "text-amber-600" : "text-zinc-400 dark:text-neutral-500"}`}>
                      ({title.length}/{profile.titleLimit})
                    </span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-600 dark:text-neutral-400">{body}</p>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
