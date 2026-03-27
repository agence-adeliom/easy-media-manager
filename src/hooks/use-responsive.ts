import { useEffect } from "react";

import { useMediaStore } from "@/store/media-store";

const SMALL_SCREEN_QUERY = "(max-width: 1023px)";

export function useResponsive() {
  const setSmallScreen = useMediaStore((state) => state.setSmallScreen);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SMALL_SCREEN_QUERY);

    const sync = () => {
      setSmallScreen(mediaQuery.matches);
    };

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, [setSmallScreen]);
}
