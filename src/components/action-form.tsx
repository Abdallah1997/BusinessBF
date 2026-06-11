"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/server/action-helpers";
import { btnPrimary } from "./ui";

/**
 * Generic wrapper around a server action: renders children (form fields),
 * shows the first validation error, resets the form on success.
 */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {state && !state.ok && (
          <p role="alert" className="text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && <p className="text-sm text-emerald-600">Saved.</p>}
      </div>
    </form>
  );
}
