import { AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
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
      toast.error(error.message);
    },
  });

  return (
    <ModalShell bodyClassName="p-0" onClose={closeModal} open={activeModal === CORE_MODAL_IDS.delete} title={t("delete_main")}>
      <div className="flex flex-col">
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm leading-6 text-slate-600">{t("delete_confirm_message").replace("%count%", String(targets.length))}</p>
            {mutation.error ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
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
