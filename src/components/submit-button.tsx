"use client";

import { useFormStatus } from "react-dom";
import { btnPrimary } from "./ui";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className ?? btnPrimary}>
      {pending ? "Saving…" : children}
    </button>
  );
}
