import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";
import { isMediaFile } from "@/types/media";

export function EditMetasModal() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const [form, setForm] = useState({ title: "", alt: "", description: "" });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedFile && isMediaFile(selectedFile)) {
      setForm({
        title: String(selectedFile.metas.title ?? ""),
        alt: String(selectedFile.metas.alt ?? ""),
        description: String(selectedFile.metas.description ?? ""),
      });
    }
  }, [selectedFile]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!routes?.editMetas || selectedFile === null || !isMediaFile(selectedFile)) {
        throw new Error(t("edit_metas_unavailable"));
      }

      return easyMediaClient.editMetas(routes.editMetas, {
        file: { id: selectedFile.id },
        path: selectedFile.path,
        new_metas: form,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["easy-media", "files"] });
      closeModal();
      toast.success(t("edit_metas_success"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (selectedFile === null || !isMediaFile(selectedFile)) {
    return null;
  }

  return (
    <ModalShell onClose={closeModal} open={activeModal === CORE_MODAL_IDS.editMetas} title={t("edit_metas_modal_title")}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="edit-metas-title">
            {t("seo_title")}
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            id="edit-metas-title"
            onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
            placeholder={t("seo_title")}
            value={form.title}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="edit-metas-alt">
            {t("seo_alt")}
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            id="edit-metas-alt"
            onChange={(event) => setForm((state) => ({ ...state, alt: event.target.value }))}
            placeholder={t("seo_alt")}
            value={form.alt}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="edit-metas-description">
            {t("seo_description")}
          </label>
          <textarea
            className="min-h-32 w-full rounded-xl border border-slate-300 px-3 py-2"
            id="edit-metas-description"
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
            placeholder={t("seo_description")}
            value={form.description}
          />
        </div>
        {mutation.error ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
        <div className="flex justify-end gap-2 mt-3">
          <Button onClick={closeModal} type="button" variant="ghost">
            {t("cancel")}
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} type="button" variant="primary">
            {t("save_main")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
