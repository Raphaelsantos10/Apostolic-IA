"use client";

import { useEffect, type RefObject } from "react";

export function useArenaMotionStage<T extends HTMLElement>(rootRef: RefObject<T | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;
    let active: HTMLElement | null = null;
    const reset = (element: HTMLElement | null) => {
      element?.style.setProperty("--arena-rx", "0deg");
      element?.style.setProperty("--arena-ry", "0deg");
      element?.style.setProperty("--arena-glare-x", "50%");
      element?.style.setProperty("--arena-glare-y", "50%");
    };
    const move = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-arena-motion]") : null;
      if (!target || !root.contains(target)) { reset(active); active = null; return; }
      if (active !== target) reset(active);
      active = target;
      const rect = target.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      target.style.setProperty("--arena-rx", `${((.5 - y) * 11).toFixed(2)}deg`);
      target.style.setProperty("--arena-ry", `${((x - .5) * 13).toFixed(2)}deg`);
      target.style.setProperty("--arena-glare-x", `${(x * 100).toFixed(1)}%`);
      target.style.setProperty("--arena-glare-y", `${(y * 100).toFixed(1)}%`);
    };
    const leave = () => { reset(active); active = null; };
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", leave, { passive: true });
    return () => { root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", leave); };
  }, [rootRef]);
}
