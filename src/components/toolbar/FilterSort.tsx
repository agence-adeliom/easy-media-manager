import { ChevronDown, Filter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "@/hooks/use-translations";
import { resolvePickFilterTypes } from "@/lib/file-utils";
import { useMediaStore } from "@/store/media-store";
import type { FileCategory } from "@/types/media";

interface FilterOption {
  value: "" | FileCategory;
  label: string;
}

export function FilterSort() {
  const t = useTranslations();
  const features = useMediaStore((state) => state.features);
  const filterName = useMediaStore((state) => state.filterName);
  const sortField = useMediaStore((state) => state.sortField);
  const sortDirection = useMediaStore((state) => state.sortDirection);
  const restrictions = useMediaStore((state) => state.restrictions);
  const mimeTypes = useMediaStore((state) => state.config?.mimeTypes);
  const setFilter = useMediaStore((state) => state.setFilter);
  const setSort = useMediaStore((state) => state.setSort);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const allFilterOptions = useMemo<FilterOption[]>(() => [
    { value: "", label: t("filter_all") },
    { value: "image", label: t("filter_images") },
    { value: "video", label: t("filter_videos") },
    { value: "audio", label: t("filter_audio") },
    { value: "folder", label: t("filter_folders") },
    { value: "text", label: t("filter_text") },
    { value: "pdf", label: t("filter_pdf") },
    { value: "application", label: t("filter_applications") },
    { value: "compressed", label: t("filter_archives") },
    { value: "oembed", label: t("filter_oembed") },
  ], [t]);
  const filterOptions = useMemo(() => {
    const allowedTypes = resolvePickFilterTypes(restrictions.types, mimeTypes);

    if (allowedTypes === null) {
      return allFilterOptions;
    }

    const allowedTypeSet = new Set<FileCategory>(allowedTypes);

    return allFilterOptions.filter((option) => option.value === "" || allowedTypeSet.has(option.value));
  }, [allFilterOptions, mimeTypes, restrictions.types]);
  const filterTypeOptionsCount = filterOptions.filter((option) => option.value !== "").length;
  const showFilter = features.enableFilter && filterTypeOptionsCount > 1;
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

  useEffect(() => {
    if (filterName && (!showFilter || !filterOptions.some((option) => option.value === filterName))) {
      setFilter(null);
    }
  }, [filterName, filterOptions, setFilter, showFilter]);

  if (!showFilter && !features.enableSort) {
    return null;
  }

  const activeFilterLabel = filterOptions.find((option) => option.value === (filterName ?? ""))?.label ?? t("filter_all");
  const activeSortLabel = sortOptions.find((option) => option.value === (sortField ?? ""))?.label ?? t("sort_none");
  const activeSortDirectionLabel = sortField ? (sortDirection === 1 ? t("sort_ascending") : t("sort_descending")) : "";
  const hasActiveFilter = showFilter && Boolean(filterName);
  const hasActiveSort = features.enableSort && Boolean(sortField);
  const hasActiveState = hasActiveFilter || hasActiveSort;

  const buttonLabel = (() => {
    if (showFilter && features.enableSort) {
      return `${activeFilterLabel} · ${activeSortLabel}${activeSortDirectionLabel ? ` (${activeSortDirectionLabel})` : ""}`;
    }
    if (showFilter) {
      return activeFilterLabel;
    }
    return `${activeSortLabel}${activeSortDirectionLabel ? ` (${activeSortDirectionLabel})` : ""}`;
  })();

  return (
    <div className="emm:relative" ref={containerRef}>
      <button
        className={`emm:flex emm:h-10 emm:items-center emm:gap-2 emm:rounded-md emm:border emm:px-3 emm:text-sm emm:transition ${
          hasActiveState
            ? "emm:border-emm-accent-300 emm:bg-emm-accent-50 emm:text-emm-accent-950 emm:hover:bg-emm-accent-100"
            : "emm:border-emm-neutral-300 emm:bg-emm-surface emm:text-emm-neutral-900 emm:hover:bg-emm-neutral-100"
        }`}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <Filter className={`emm:h-3.5 emm:w-3.5 ${hasActiveState ? "emm:text-emm-accent-600" : "emm:text-emm-neutral-500"}`} />
        <span className="emm:max-w-44 emm:truncate">{buttonLabel}</span>
        <ChevronDown className={`emm:h-3.5 emm:w-3.5 emm:transition ${hasActiveState ? "emm:text-emm-accent-600" : "emm:text-emm-neutral-500"} ${isOpen ? "emm:rotate-180" : ""}`} />
      </button>
      {isOpen ? (
        <div className="emm:absolute emm:right-0 emm:top-12 emm:z-20 emm:w-64 emm:rounded-lg emm:border emm:border-emm-neutral-200 emm:bg-emm-surface emm:p-2 emm:shadow-xl">
          {showFilter ? (
            <div className={features.enableSort ? "emm:border-b emm:border-emm-neutral-100 emm:pb-2" : ""}>
              <p className="emm:px-2 emm:pb-1 emm:text-xs emm:font-semibold emm:uppercase emm:tracking-wide emm:text-emm-neutral-400">{t("filter_section")}</p>
              {filterOptions.map((option) => {
                const isActive = (filterName ?? "") === option.value;

                return (
                  <button
                    className={`emm:flex emm:w-full emm:items-center emm:rounded-md emm:px-2 emm:py-2 emm:text-left emm:text-sm ${isActive ? "emm:bg-emm-accent-100 emm:text-emm-neutral-900" : "emm:text-emm-neutral-600 emm:hover:bg-emm-neutral-100 emm:hover:text-emm-neutral-900"}`}
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
            <div className={showFilter ? "emm:pt-2" : ""}>
              <p className="emm:px-2 emm:pb-1 emm:text-xs emm:font-semibold emm:uppercase emm:tracking-wide emm:text-emm-neutral-400">{t("sort_section")}</p>
              {sortOptions.map((option) => {
                const isActive = (sortField ?? "") === option.value;

                return (
                  <button
                    className={`emm:flex emm:w-full emm:items-center emm:justify-between emm:rounded-md emm:px-2 emm:py-2 emm:text-left emm:text-sm ${isActive ? "emm:bg-emm-accent-100 emm:text-emm-neutral-900" : "emm:text-emm-neutral-600 emm:hover:bg-emm-neutral-100 emm:hover:text-emm-neutral-900"}`}
                    key={option.value}
                    onClick={() => setSort(option.value || null)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    {isActive && option.value ? <span className="emm:text-xs emm:uppercase emm:text-emm-neutral-500">{sortDirection === 1 ? "Asc" : "Desc"}</span> : null}
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
