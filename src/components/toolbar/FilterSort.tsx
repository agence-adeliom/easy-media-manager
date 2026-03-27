import { ChevronDown, Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTranslations } from "@/hooks/use-translations";
import { useMediaStore } from "@/store/media-store";

export function FilterSort() {
  const t = useTranslations();
  const features = useMediaStore((state) => state.features);
  const filterName = useMediaStore((state) => state.filterName);
  const sortField = useMediaStore((state) => state.sortField);
  const sortDirection = useMediaStore((state) => state.sortDirection);
  const setFilter = useMediaStore((state) => state.setFilter);
  const setSort = useMediaStore((state) => state.setSort);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const filterOptions = [
    { value: "", label: t("filter_all") },
    { value: "image", label: t("filter_images") },
    { value: "video", label: t("filter_videos") },
    { value: "audio", label: t("filter_audio") },
    { value: "folder", label: t("filter_folders") },
    { value: "text", label: t("filter_text_pdf") },
    { value: "application", label: t("filter_applications") },
  ];
  const sortOptions = [
    { value: "", label: t("sort_none") },
    { value: "name", label: t("name") },
    { value: "size", label: t("size") },
    { value: "last_modified", label: t("last_modified") },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeFilterLabel = filterOptions.find((option) => option.value === (filterName ?? ""))?.label ?? t("filter_all");
  const activeSortLabel = sortOptions.find((option) => option.value === (sortField ?? ""))?.label ?? t("sort_none");
  const activeSortDirectionLabel = sortField ? (sortDirection === 1 ? t("sort_ascending") : t("sort_descending")) : "";
  const hasActiveFilter = Boolean(filterName);
  const hasActiveState = hasActiveFilter;

  const buttonLabel = (() => {
    if (features.enableFilter && features.enableSort) {
      return `${activeFilterLabel} · ${activeSortLabel}${activeSortDirectionLabel ? ` (${activeSortDirectionLabel})` : ""}`;
    }
    if (features.enableFilter) {
      return activeFilterLabel;
    }
    return `${activeSortLabel}${activeSortDirectionLabel ? ` (${activeSortDirectionLabel})` : ""}`;
  })();

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition ${
          hasActiveState
            ? "border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100"
            : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
        }`}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <Filter className={`h-3.5 w-3.5 ${hasActiveState ? "text-sky-600" : "text-slate-500"}`} />
        <span className="max-w-44 truncate">{buttonLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${hasActiveState ? "text-sky-600" : "text-slate-500"} ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          {features.enableFilter ? (
            <div className={features.enableSort ? "border-b border-slate-100 pb-2" : ""}>
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("filter_section")}</p>
              {filterOptions.map((option) => {
                const isActive = (filterName ?? "") === option.value;

                return (
                  <button
                    className={`flex w-full items-center rounded-md px-2 py-2 text-left text-sm ${isActive ? "bg-sky-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                    key={option.value}
                    onClick={() => setFilter(option.value || null)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {features.enableSort ? (
            <div className={features.enableFilter ? "pt-2" : ""}>
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("sort_section")}</p>
              {sortOptions.map((option) => {
                const isActive = (sortField ?? "") === option.value;

                return (
                  <button
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${isActive ? "bg-sky-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                    key={option.value}
                    onClick={() => setSort(option.value || null)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    {isActive && option.value ? <span className="text-xs uppercase text-slate-500">{sortDirection === 1 ? "Asc" : "Desc"}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
