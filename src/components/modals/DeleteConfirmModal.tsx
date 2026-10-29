import { AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { getErrorMessage } from "@/lib/error-message";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";

export function DeleteConfirmModal() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const currentPath = useMediaStore((state) => state.currentPath);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const bulkList = useMediaStore((state) => state.bulkList);
  const bulkMode = useMediaStore((state) => state.bulkMode);
  const clearSelection = useMediaStore((state) => state.clearSelection);
  const deselectAll = useMediaStore((state) => state.deselectAll);
  const queryClient = useQueryClient();
  const targets = bulkMode && bulkList.length > 0 ? bulkList : selectedFile ? [selectedFile] : [];

  const mutation = useMutation({
    mutationFn: () => {
      if (!routes?.deleteFile || targets.length === 0) {
        throw new Error(t("delete_unavailable"));
      }

      return easyMediaClient.deleteFiles(routes.deleteFile, {
        path: currentPath,
        deleted_files: targets.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          storage_path: item.storage_path,
        })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["files"] });
      clearSelection();
      deselectAll();
      closeModal();
      toast.success(t("delete_success"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t));
    },
  });

  return (
    <ModalShell bodyClassName="emm:p-0" onClose={closeModal} open={activeModal === CORE_MODAL_IDS.delete} title={t("delete_main")}>
      <div className="emm:flex emm:flex-col">
        <div className="emm:flex emm:items-start emm:gap-4 emm:px-6 emm:py-5">
          <div className="emm:flex emm:h-12 emm:w-12 emm:shrink-0 emm:items-center emm:justify-center emm:rounded-full emm:bg-emm-danger-50 emm:text-emm-danger-600">
            <AlertTriangle className="emm:h-5 emm:w-5" />
          </div>
          <div className="emm:space-y-2">
            <p className="emm:text-sm emm:leading-6 emm:text-emm-neutral-600">{t("delete_confirm_message").replace("%count%", String(targets.length))}</p>
            {mutation.error ? <p className="emm:text-sm emm:text-emm-danger-600">{getErrorMessage(mutation.error, t)}</p> : null}
          </div>
        </div>
        <div className="emm:flex emm:justify-end emm:gap-3 emm:border-t emm:border-emm-neutral-100 emm:bg-emm-neutral-50/80 emm:px-6 emm:py-4">
          <Button onClick={closeModal} type="button" variant="secondary">
            {t("cancel")}
          </Button>
          <Button disabled={targets.length === 0 || mutation.isPending} onClick={() => mutation.mutate()} type="button" variant="danger">
            {t("delete_main")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
