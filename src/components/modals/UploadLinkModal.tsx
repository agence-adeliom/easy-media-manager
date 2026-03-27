import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";

export function UploadLinkModal() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const currentFolderId = useMediaStore((state) => state.currentFolderId);
  const useRandomNames = useMediaStore((state) => state.useRandomNames);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!routes?.uploadLink) {
        throw new Error(t("upload_link_unavailable"));
      }

      return easyMediaClient.uploadLink(routes.uploadLink, {
        folder: currentFolderId,
        random_names: useRandomNames,
        url,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["easy-media", "files"] });
      setUrl("");
      closeModal();
      toast.success(t("upload_link_success"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <ModalShell onClose={closeModal} open={activeModal === CORE_MODAL_IDS.uploadLink} title={t("upload_via_url")}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="upload-link-url">
            {t("link")}
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            id="upload-link-url"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            value={url}
          />
        </div>
        {mutation.error ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
        <div className="flex justify-end gap-2 mt-3">
          <Button onClick={closeModal} type="button" variant="ghost">
            {t("cancel")}
          </Button>
          <Button disabled={!url.trim() || mutation.isPending} onClick={() => mutation.mutate()} type="button" variant="primary">
            {t("save_main")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
