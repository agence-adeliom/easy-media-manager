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
    <label className="emm:flex emm:h-10 emm:w-56 emm:items-center emm:gap-2 emm:rounded-md emm:border emm:border-emm-neutral-300 emm:bg-emm-surface emm:px-3 emm:text-sm">
      <span className="emm:shrink-0">
        <Search className="emm:h-3.5 emm:w-3.5 emm:text-emm-neutral-400" />
      </span>
      <input
        className="emm:m-0 emm:block emm:h-10 emm:min-w-0 emm:flex-1 emm:border-0 emm:bg-transparent emm:p-0 emm:text-sm emm:leading-[2.5rem] emm:outline-none emm:ring-0 emm:focus:border-0 emm:focus:outline-none emm:focus:ring-0"
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search_placeholder")}
        value={value}
      />
      {value ? (
        <button aria-label={t("search_clear")} className="emm:flex emm:h-6 emm:w-6 emm:items-center emm:justify-center emm:rounded emm:text-emm-neutral-400 emm:hover:bg-emm-neutral-100 emm:hover:text-emm-neutral-600" onClick={() => setValue("")} type="button">
          <X className="emm:h-3.5 emm:w-3.5" />
        </button>
      ) : null}
    </label>
  );
}
