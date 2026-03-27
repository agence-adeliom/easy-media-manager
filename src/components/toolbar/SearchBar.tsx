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
    <label className="flex h-10 w-56 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm">
      <span className="shrink-0">
        <Search className="h-3.5 w-3.5 text-slate-400" />
      </span>
      <input
        className="m-0 block h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-[2.5rem] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0"
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search_placeholder")}
        value={value}
      />
      {value ? (
        <button className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={() => setValue("")} type="button">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </label>
  );
}
