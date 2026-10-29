import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { useTranslations } from "@/hooks/use-translations";
import { useMediaStore } from "@/store/media-store";

export function SearchBar() {
  const t = useTranslations();
  const searchQuery = useMediaStore((state) => state.searchQuery);
  const setSearch = useMediaStore((state) => state.setSearch);
  const [value, setValue] = useState(searchQuery);

  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(value);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [setSearch, value]);

  return (
    <label className="flex h-10 w-56 items-center gap-2 rounded-md border border-emm-neutral-300 bg-emm-surface px-3 text-sm">
      <span className="shrink-0">
        <Search className="h-3.5 w-3.5 text-emm-neutral-400" />
      </span>
      <input
        className="m-0 block h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-[2.5rem] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0"
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search_placeholder")}
        value={value}
      />
      {value ? (
        <button aria-label={t("search_clear")} className="flex h-6 w-6 items-center justify-center rounded text-emm-neutral-400 hover:bg-emm-neutral-100 hover:text-emm-neutral-600" onClick={() => setValue("")} type="button">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </label>
  );
}
