import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";

export function NewFolderModal() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const currentFolderId = useMediaStore((state) => state.currentFolderId);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!routes?.newFolder) {
        throw new Error(t("new_folder_unavailable"));
      }

      return easyMediaClient.createFolder(routes.newFolder, {
        folder: currentFolderId,
        new_folder_name: name,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["files"] });
      setName("");
      closeModal();
      toast.success(t("create_folder_notif"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <ModalShell onClose={closeModal} open={activeModal === CORE_MODAL_IDS.newFolder} title={t("add_new_folder")}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="new-folder-name">
            {t("new_folder_name")}
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            id="new-folder-name"
            onChange={(event) => setName(event.target.value)}
            placeholder={t("new_folder_name")}
            value={name}
          />
        </div>
        {mutation.error ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
        <div className="flex justify-end gap-2 mt-3">
          <Button onClick={closeModal} type="button" variant="ghost">
            {t("cancel")}
          </Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()} type="button" variant="primary">
            {t("create")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
