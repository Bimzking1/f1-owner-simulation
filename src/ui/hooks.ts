import { useRef } from "react";

/** Touch handlers that open something after a press-and-hold (~450ms). */
export function useHoldOpen(onOpen: () => void, ms = 450) {
  const timer = useRef<number | null>(null);
  const start = () => {
    timer.current = window.setTimeout(onOpen, ms);
  };
  const end = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return { onTouchStart: start, onTouchEnd: end, onTouchMove: end };
}
