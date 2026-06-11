import { inputCls, labelCls } from "./ui";
import { CONDITION_LABELS, ITEM_CONDITIONS, ITEM_STATUSES } from "@/lib/constants";
import { centsToInputValue } from "@/lib/money";

export interface ItemDefaults {
  name?: string;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  size?: string | null;
  condition?: string;
  costCents?: number;
  quantity?: number;
  purchasedAt?: Date | null;
  source?: string | null;
  notes?: string | null;
  status?: string;
}

/** Shared field grid for create + edit item forms. */
export function ItemFields({ defaults = {}, showStatus = false }: { defaults?: ItemDefaults; showStatus?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <label className={labelCls}>Name *</label>
        <input name="name" required maxLength={200} defaultValue={defaults.name ?? ""} className={inputCls} placeholder="Nike Air Max 90, size 10" />
      </div>
      <div>
        <label className={labelCls}>SKU</label>
        <input name="sku" maxLength={100} defaultValue={defaults.sku ?? ""} className={inputCls} placeholder="A-104" />
      </div>
      <div>
        <label className={labelCls}>Brand</label>
        <input name="brand" maxLength={100} defaultValue={defaults.brand ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Category</label>
        <input name="category" maxLength={100} defaultValue={defaults.category ?? ""} className={inputCls} placeholder="Shoes" />
      </div>
      <div>
        <label className={labelCls}>Size</label>
        <input name="size" maxLength={50} defaultValue={defaults.size ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Condition</label>
        <select name="condition" defaultValue={defaults.condition ?? "GOOD"} className={inputCls}>
          {ITEM_CONDITIONS.map((c) => (
            <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Cost (what you paid) $</label>
        <input
          name="cost"
          inputMode="decimal"
          defaultValue={defaults.costCents != null ? centsToInputValue(defaults.costCents) : ""}
          className={inputCls}
          placeholder="12.50"
        />
      </div>
      <div>
        <label className={labelCls}>Quantity</label>
        <input name="quantity" type="number" min={1} defaultValue={defaults.quantity ?? 1} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Purchased on</label>
        <input
          name="purchasedAt"
          type="date"
          defaultValue={defaults.purchasedAt ? localDateValue(defaults.purchasedAt) : ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Source</label>
        <input name="source" maxLength={200} defaultValue={defaults.source ?? ""} className={inputCls} placeholder="Goodwill, estate sale…" />
      </div>
      {showStatus && (
        <div>
          <label className={labelCls}>Status</label>
          <select name="status" defaultValue={defaults.status ?? "ACTIVE"} className={inputCls}>
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:col-span-2 lg:col-span-3">
        <label className={labelCls}>Notes</label>
        <input name="notes" maxLength={5000} defaultValue={defaults.notes ?? ""} className={inputCls} />
      </div>
    </div>
  );
}

function localDateValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
