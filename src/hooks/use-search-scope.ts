import { useTranslations } from "@/hooks/use-translations";
import { useMediaStore } from "@/store/media-store";

/** Labels of the two search scopes: the whole library (or the `restrictions.path` folder tree) and the current folder. */
export function useSearchScope() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const scope = useMediaStore((state) => state.searchScope);
  const folderStack = useMediaStore((state) => state.folderStack);
  const pathRootDepth = useMediaStore((state) => state.pathRootDepth);
  const restrictionsPath = useMediaStore((state) => state.restrictions.path);
  const canSearchLibrary = Boolean(routes?.globalSearch);
  // In a picker restricted to a folder, "the whole library" is that folder and its subfolders.
  const pathRoot = pathRootDepth !== null
    ? folderStack[pathRootDepth - 1]?.name
    : restrictionsPath?.split("/").filter(Boolean).pop();
  const folderName = folderStack[folderStack.length - 1]?.name ?? t("library");

  return {
    canSearchLibrary,
    scope,
    libraryLabel: pathRoot ? t("search_scope_subtree").replace("%folder%", pathRoot) : t("search_scope_library"),
    folderLabel: folderName,
    placeholder: !canSearchLibrary
      ? t("search_placeholder")
      : scope === "folder"
        ? t("search_placeholder_folder").replace("%folder%", folderName)
        : pathRoot
          ? t("search_placeholder_subtree").replace("%folder%", pathRoot)
          : t("search_placeholder_library"),
  };
}
