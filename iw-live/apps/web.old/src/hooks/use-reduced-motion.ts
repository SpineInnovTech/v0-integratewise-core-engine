import { useState, useEffect } from "react";

/**
 * useReducedMotion - Hook to detect user's motion preference
 *
 * Returns true if user prefers reduced motion (accessibility setting)
 * Use this to conditionally disable animations in components
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * // In component
 * {!prefersReducedMotion && (
 *   <motion.div animate={{...}}>...</motion.div>
 * )}
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;
