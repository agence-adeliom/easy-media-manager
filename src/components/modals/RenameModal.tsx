import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/hooks/use-translations";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";
import { isFolder, isMediaFile } from "@/types/media";

function replaceLastPathSegment(path: string, name: string): string {
  const segments = path.split("/");

  if (segments.length === 0) {
    return name;
  }

  segments[segments.length - 1] = name;

  return segments.join("/");
}

export function RenameModal() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const selectedIndex = useMediaStore((state) => state.selectedIndex);
  const selectFile = useMediaStore((state) => state.selectFile);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    setName(selectedFile?.name ?? "");
  }, [selectedFile]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!routes?.renameFile || selectedFile === null) {
        throw new Error(t("rename_unavailable"));
      }

      return easyMediaClient.renameFile(routes.renameFile, {
        file: {
          id: selectedFile.id,
          type: selectedFile.type,
        },
        new_filename: name,
      });
    },
    onSuccess: async (result) => {
      if (selectedFile !== null && selectedIndex !== null) {
        selectFile(
          {
            ...selectedFile,
            name: result.new_filename,
            path: replaceLastPathSegment(selectedFile.path, result.new_filename),
            storage_path: replaceLastPathSegment(selectedFile.storage_path, result.new_filename),
          },
          selectedIndex,
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["files"] });
      closeModal();
      toast.success(t("rename_success"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (selectedFile === null || (!isFolder(selectedFile) && !isMediaFile(selectedFile))) {
    return null;
  }

  return (
    <ModalShell onClose={closeModal} open={activeModal === CORE_MODAL_IDS.rename} title={t("rename_main")}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="rename-file-name">
            {t("rename_main")}
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            id="rename-file-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        {mutation.error ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
        <div className="flex justify-end gap-2 mt-3">
          <Button onClick={closeModal} type="button" variant="ghost">
            {t("cancel")}
          </Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()} type="button" variant="primary">
            {t("save_main")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
