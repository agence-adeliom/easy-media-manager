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
  const toolbarButtonClassName = "emm:border-emm-neutral-300 emm:bg-emm-surface emm:text-emm-neutral-900 emm:hover:border-emm-accent-200 emm:hover:bg-emm-accent-200";
  const uploadButtonClassName = uploadPanelOpen
    ? "emm:border-emm-accent-700 emm:bg-emm-accent-700 emm:text-emm-inverse emm:shadow-sm emm:hover:bg-emm-accent-600 emm:hover:text-emm-inverse"
    : toolbarButtonClassName;
  const bulkButtonClassName = bulkMode
    ? "emm:border-emm-accent-700 emm:bg-emm-accent-700 emm:text-emm-inverse emm:shadow-sm emm:hover:bg-emm-accent-600"
    : toolbarButtonClassName;
  const pluginContext = createPluginContext(store);
  const pluginActions = getPluginToolbarActions();
  const primaryPluginActions = resolvePluginActions(pluginActions, "primary", pluginContext);
  const selectionPluginActions = resolvePluginActions(pluginActions, "selection", pluginContext);
  const utilityPluginActions = resolvePluginActions(pluginActions, "utility", pluginContext);
  const hasSelectionToolbar = Boolean(selectedFile || canEditImage || selectionPluginActions.length > 0);

  return (
    <div className="emm:flex emm:flex-wrap emm:items-start emm:gap-2 emm:bg-emm-toolbar emm:px-3 emm:py-2 emm:md:flex-nowrap emm:md:items-center emm:md:justify-between">
      <div className="emm:flex emm:items-center emm:gap-1">
        {features.enableUpload ? (
          <Tooltip content={t("upload_main")} side="bottom">
            <Button
              aria-pressed={uploadPanelOpen}
              className={`emm:px-2 ${uploadButtonClassName}`}
              onClick={toggleUploadPanel}
              type="button"
              variant={uploadPanelOpen ? "primary" : "ghost"}
            >
              <Upload className="emm:h-4 emm:w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {features.enableUpload ? (
          <Tooltip content={t("add_new_folder")} side="bottom">
            <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.newFolder)} type="button" variant="ghost">
              <FolderPlus className="emm:h-4 emm:w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {features.enableUpload ? (
          <Tooltip content={t("upload_via_url")} side="bottom">
            <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.uploadLink)} type="button" variant="ghost">
              <Link2 className="emm:h-4 emm:w-4" />
            </Button>
          </Tooltip>
        ) : null}
        {primaryPluginActions.map((action) => (
          <PluginToolbarButton action={action} buttonClassName={toolbarButtonClassName} context={pluginContext} key={`${action.pluginId}:${action.id}`} />
        ))}
      </div>
      {hasSelectionToolbar ? (
        <div className={`emm:flex emm:items-center emm:gap-1 ${features.enableUpload ? "emm:border-l emm:border-emm-neutral-300 emm:pl-2" : ""}`}>
          {features.enableEditor && canEditImage ? (
            <Tooltip content={t("editor")} side="bottom">
              <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.editor)} type="button" variant="ghost">
                <WandSparkles className="emm:h-4 emm:w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {features.enableRename && canRename ? (
            <Tooltip content={t("rename")} side="bottom">
              <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.rename)} type="button" variant="ghost">
                <Pencil className="emm:h-4 emm:w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {features.enableMetas && canEditMetas ? (
            <Tooltip content={t("edit_metas")} side="bottom">
              <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.editMetas)} type="button" variant="ghost">
                <Hash className="emm:h-4 emm:w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {selectionPluginActions.map((action) => (
            <PluginToolbarButton action={action} buttonClassName={toolbarButtonClassName} context={pluginContext} key={`${action.pluginId}:${action.id}`} />
          ))}
          {features.enableDelete && selectedFile ? (
            <Tooltip content={t("delete_main")} side="bottom">
              <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => openModal(CORE_MODAL_IDS.delete)} type="button" variant="ghost">
                <Trash2 className="emm:h-4 emm:w-4" />
              </Button>
            </Tooltip>
          ) : null}
          {features.enableMove && selectedItemsToMove.length > 0 ? (
            <Tooltip content={`${t("move")} (${selectedItemsToMove.length})`} side="bottom">
              <Button
                className={`emm:px-2 ${toolbarButtonClassName}`}
                onClick={() => {
                  setMovableList(selectedItemsToMove);
                  openModal(CORE_MODAL_IDS.move);
                }}
                type="button"
                variant="ghost"
              >
                <FolderTree className="emm:h-4 emm:w-4" />
              </Button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
      <div className="emm:flex emm:items-center emm:gap-1 emm:md:ml-auto emm:md:justify-end emm:md:shrink-0">
        <Tooltip content={t("refresh")} side="bottom">
          <Button className={`emm:px-2 ${toolbarButtonClassName}`} onClick={() => window.dispatchEvent(new CustomEvent("easy-media:refresh"))} type="button" variant="primary">
            <RefreshCcw className="emm:h-4 emm:w-4" />
          </Button>
        </Tooltip>
        {features.enableBulkSelection ? (
          <Tooltip content={t("select_bulk")} side="bottom">
            <Button
              aria-pressed={bulkMode}
              className={`emm:px-2 ${bulkButtonClassName}`}
              onClick={toggleBulkMode}
              type="button"
              variant={bulkMode ? "primary" : "ghost"}
            >
              <ListPlus className="emm:h-4 emm:w-4" />
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
    <Tooltip content={context.t(action.labelKey)} side="bottom">
      <Button className={`emm:px-2 ${buttonClassName}`} disabled={isDisabled} onClick={() => action.onClick(context)} type="button" variant="ghost">
        <Icon className="emm:h-4 emm:w-4" />
      </Button>
    </Tooltip>
  );
}
