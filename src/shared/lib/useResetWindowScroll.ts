import { useLayoutEffect } from "react";

export function useResetWindowScroll(dependency: unknown) {
  useLayoutEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [dependency]);
}
