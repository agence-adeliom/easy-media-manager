import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { getErrorMessage } from "@/lib/error-message";
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
        throw new Error(t("new_unavailable"));
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
      toast.success(t("new_create_folder_notif"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t));
    },
  });

  return (
    <ModalShell onClose={closeModal} open={activeModal === CORE_MODAL_IDS.newFolder} title={t("add_new_folder")}>
      <div className="emm:space-y-4">
        <div className="emm:space-y-2">
          <label className="emm:block emm:text-sm emm:font-medium emm:text-emm-neutral-700" htmlFor="new-folder-name">
            {t("new_folder_name")}
          </label>
          <input
            className="emm:w-full emm:rounded-xl emm:border emm:border-emm-neutral-300 emm:px-3 emm:py-2"
            id="new-folder-name"
            onChange={(event) => setName(event.target.value)}
            placeholder={t("new_folder_name")}
            value={name}
          />
        </div>
        {mutation.error ? <p className="emm:text-sm emm:text-emm-danger-600">{getErrorMessage(mutation.error, t)}</p> : null}
        <div className="emm:flex emm:justify-end emm:gap-2 emm:mt-3">
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
