"use client";

import { useEffect, useRef, useState } from "react";
import { formatCents } from "@/lib/money";

/**
 * Counts up from 0 to the target on mount (600ms, spring-out easing).
 * Respects prefers-reduced-motion by jumping straight to the value.
 */
export function AnimatedMoney({ cents }: { cents: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const duration = reduced ? 0 : 600;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(cents * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [cents]);

  return <span className="money">{formatCents(display)}</span>;
}
