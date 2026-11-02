import { X } from "lucide-react";

import { useSearchScope } from "@/hooks/use-search-scope";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/cn";
import { useMediaStore } from "@/store/media-store";
import type { EasyMediaSearchScope } from "@/types/config";

// Shown instead of the breadcrumb while searching: where the search looks, and how many files it found.
export function SearchScopeBar() {
  const t = useTranslations();
  const setSearchScope = useMediaStore((state) => state.setSearchScope);
  const setSearch = useMediaStore((state) => state.setSearch);
  const resultCount = useMediaStore((state) => state.searchResultCount);
  const { scope, libraryLabel, folderLabel } = useSearchScope();
  const options: Array<{ value: EasyMediaSearchScope; label: string }> = [
    { value: "library", label: libraryLabel },
    { value: "folder", label: folderLabel },
  ];

  return (
    <nav className="emm:flex emm:flex-wrap emm:items-center emm:gap-2 emm:border-b emm:bg-emm-neutral-100 emm:px-3 emm:py-2 emm:text-sm emm:text-emm-neutral-600">
      <div aria-label={t("search_scope")} className="emm:flex emm:flex-wrap emm:items-center emm:gap-1" role="radiogroup">
        <span aria-hidden="true" className="emm:mr-1">
          {t("search_scope")}
        </span>
        {options.map((option) => {
          const checked = option.value === scope;

          return (
            <button
              aria-checked={checked}
              className={cn(
                "emm:cursor-pointer emm:rounded-full emm:border emm:px-3 emm:py-1 emm:text-sm emm:transition-colors emm:focus-visible:outline-hidden emm:focus-visible:ring-3 emm:focus-visible:ring-emm-accent-200",
                checked
                  ? "emm:border-emm-accent-500 emm:bg-emm-surface emm:font-medium emm:text-emm-accent-700 emm:shadow-sm"
                  : "emm:border-transparent emm:text-emm-neutral-600 emm:hover:bg-emm-neutral-200",
              )}
              key={option.value}
              onClick={() => setSearchScope(option.value)}
              role="radio"
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="emm:ml-auto emm:flex emm:items-center emm:gap-3">
        {resultCount !== null ? (
          <span aria-live="polite" className="emm:text-xs emm:text-emm-neutral-500">
            {resultCount === 1 ? t("search_results_one") : t("search_results_other").replace("%count%", resultCount.toLocaleString())}
          </span>
        ) : null}
        <button
          className="emm:flex emm:cursor-pointer emm:items-center emm:gap-1 emm:rounded-full emm:px-2 emm:py-1 emm:text-xs emm:font-medium emm:text-emm-neutral-600 emm:transition-colors emm:hover:bg-emm-neutral-200 emm:hover:text-emm-neutral-900 emm:focus-visible:outline-hidden emm:focus-visible:ring-3 emm:focus-visible:ring-emm-accent-200"
          onClick={() => setSearch("")}
          type="button"
        >
          <X className="emm:h-3.5 emm:w-3.5" />
          {t("search_close")}
        </button>
      </div>
    </nav>
  );
}
