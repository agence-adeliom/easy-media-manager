import { useEffect, useState } from "react";

import type { EasyMediaThemeMode } from "@/types/config";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The color scheme to render: the theme mode, or the system one for `auto`. */
export function useColorScheme(mode: EasyMediaThemeMode): "light" | "dark" {
  const [systemIsDark, setSystemIsDark] = useState(() => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    if (mode !== "auto") {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_QUERY);
    const sync = () => {
      setSystemIsDark(mediaQuery.matches);
    };

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, [mode]);

  if (mode === "auto") {
    return systemIsDark ? "dark" : "light";
  }

  return mode;
}
