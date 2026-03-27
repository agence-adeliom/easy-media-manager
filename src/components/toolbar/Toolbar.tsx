import { FolderPlus, FolderTree, Hash, Link2, ListPlus, Pencil, RefreshCcw, Trash2, Upload, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { FilterSort } from "@/components/toolbar/FilterSort";
import { SearchBar } from "@/components/toolbar/SearchBar";
import { useFileType } from "@/hooks/use-file-type";
import { useTranslations } from "@/hooks/use-translations";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { createPluginContext } from "@/plugins/context";
import { getPluginToolbarActions } from "@/plugins/registry";
import type { EasyMediaPluginContext, EasyMediaToolbarAction } from "@/plugins/types";
import { useMediaStore } from "@/store/media-store";
import { isMediaFile } from "@/types/media";

export function Toolbar() {
  const t = useTranslations();
  const store = useMediaStore((state) => state);
  const features = useMediaStore((state) => state.features);
  const bulkMode = useMediaStore((state) => state.bulkMode);
  const bulkList = useMediaStore((state) => state.bulkList);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const uploadPanelOpen = useMediaStore((state) => state.uploadPanelOpen);
  const toggleUploadPanel = useMediaStore((state) => state.toggleUploadPanel);
  const toggleBulkMode = useMediaStore((state) => state.toggleBulkMode);
  const setMovableList = useMediaStore((state) => state.setMovableList);
  const openModal = useMediaStore((state) => state.openModal);
  const fileType = useFileType();
  const hasMultipleSelection = bulkMode && bulkList.length > 1;
  const canEditImage = !hasMultipleSelection && selectedFile && isMediaFile(selectedFile) && fileType.isImage(selectedFile);
  const canRename = !hasMultipleSelection && selectedFile !== null;
  const canEditMetas = !hasMultipleSelection && selectedFile !== null && isMediaFile(selectedFile);
  const selectedItemsToMove = bulkMode && bulkList.length > 0 ? bulkList : selectedFile ? [selectedFile] : [];
  const toolbarButtonClassName = "border-slate-300 bg-white text-slate-900 hover:border-sky-200 hover:bg-sky-200";
  const uploadButtonClassName = uploadPanelOpen
    ? "border-sky-700 bg-sky-700 text-white shadow-sm hover:bg-sky-600 hover:text-white"
    : toolbarButtonClassName;
  const bulkButtonClassName = bulkMode
    ? "border-sky-700 bg-sky-700 text-white shadow-sm hover:bg-sky-600"
    : toolbarButtonClassName;
  const pluginContext = createPluginContext(store);
  const pluginActions = getPluginToolbarActions();
  const primaryPluginActions = resolvePluginActions(pluginActions, "primary", pluginContext);
  const selectionPluginActions = resolvePluginActions(pluginActions, "selection", pluginContext);
  const utilityPluginActions = resolvePluginActions(pluginActions, "utility", pluginContext);
  const hasSelectionToolbar = Boolean(selectedFile || canEditImage || selectionPluginActions.length > 0);

  return (
    <div className="flex flex-wrap items-start gap-2 bg-neutral-700 px-3 py-2 md:flex-nowrap md:items-center md:justify-between">
      <div className="flex items-center gap-1">
        {features.enableUpload ? (
          <Tooltip content={t("upload")}>
            <Button
              aria-pressed={uploadPanelOpen}
              className={`px-2 ${uploadButtonClassName}`}
              onClick={toggleUploadPanel}
              type="button"
              variant={uploadPanelOpen ? "primary" : "ghost"}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {features.enableUpload ? (
          <Tooltip content={t("new_folder")}>
            <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.newFolder)} type="button" variant="ghost">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {features.enableUpload ? (
          <Tooltip content={t("upload_via_url")}>
            <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.uploadLink)} type="button" variant="ghost">
              <Link2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {primaryPluginActions.map((action) => (
          <PluginToolbarButton action={action} buttonClassName={toolbarButtonClassName} context={pluginContext} key={`${action.pluginId}:${action.id}`} />
        ))}
      </div>
      {hasSelectionToolbar ? (
        <div className={`flex items-center gap-1 ${features.enableUpload ? "border-l border-slate-300 pl-2" : ""}`}>
          {features.enableEditor && canEditImage ? (
            <Tooltip content={t("editor")}>
              <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.editor)} type="button" variant="ghost">
                <WandSparkles className="h-4 w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {features.enableRename && canRename ? (
            <Tooltip content={t("rename")}>
              <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.rename)} type="button" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {features.enableMetas && canEditMetas ? (
            <Tooltip content={t("edit_metas")}>
              <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.editMetas)} type="button" variant="ghost">
                <Hash className="h-4 w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {selectionPluginActions.map((action) => (
            <PluginToolbarButton action={action} buttonClassName={toolbarButtonClassName} context={pluginContext} key={`${action.pluginId}:${action.id}`} />
          ))}
          {features.enableDelete && selectedFile ? (
            <Tooltip content={t("delete_main")}>
              <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.delete)} type="button" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {features.enableMove && selectedItemsToMove.length > 0 ? (
            <Tooltip content={`${t("move")} (${selectedItemsToMove.length})`}>
              <Button
                className={`px-2 ${toolbarButtonClassName}`}
                onClick={() => {
                  setMovableList(selectedItemsToMove);
                  openModal(CORE_MODAL_IDS.move);
                }}
                type="button"
                variant="ghost"
              >
                <FolderTree className="h-4 w-4" />
              </Button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center gap-1 md:ml-auto md:justify-end md:shrink-0">
        <Tooltip content={t("refresh")}>
          <Button className={`px-2 ${toolbarButtonClassName}`} onClick={() => window.dispatchEvent(new CustomEvent("easy-media:refresh"))} type="button" variant="primary">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </Tooltip>
        {features.enableBulkSelection ? (
          <Tooltip content={t("select_bulk")}>
            <Button
              aria-pressed={bulkMode}
              className={`px-2 ${bulkButtonClassName}`}
              onClick={toggleBulkMode}
              type="button"
              variant={bulkMode ? "primary" : "ghost"}
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {utilityPluginActions.map((action) => (
          <PluginToolbarButton action={action} buttonClassName={toolbarButtonClassName} context={pluginContext} key={`${action.pluginId}:${action.id}`} />
        ))}
        {features.enableSearch ? <SearchBar /> : null}
        {features.enableFilter || features.enableSort ? <FilterSort /> : null}
      </div>
    </div>
  );
}

function resolvePluginActions(
  actions: EasyMediaToolbarAction[],
  section: "primary" | "selection" | "utility",
  context: EasyMediaPluginContext,
): EasyMediaToolbarAction[] {
  return actions.filter((action) => (action.section ?? "utility") === section && action.isVisible(context));
}

interface PluginToolbarButtonProps {
  action: EasyMediaToolbarAction;
  buttonClassName: string;
  context: EasyMediaPluginContext;
}

function PluginToolbarButton({ action, buttonClassName, context }: PluginToolbarButtonProps) {
  const Icon = action.icon;
  const isDisabled = action.isDisabled?.(context) ?? false;

  return (
    <Tooltip content={context.t(action.labelKey)}>
      <Button className={`px-2 ${buttonClassName}`} disabled={isDisabled} onClick={() => action.onClick(context)} type="button" variant="ghost">
        <Icon className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
}
