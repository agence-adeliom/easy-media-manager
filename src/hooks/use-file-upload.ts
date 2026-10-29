import { toast } from "sonner";

import { useTranslations } from "@/hooks/use-translations";
import { useUppy } from "@/hooks/use-uppy";
import { getFileSize, isPickTypeAllowed } from "@/lib/file-utils";
import { useMediaStore } from "@/store/media-store";

export function useFileUpload() {
  const t = useTranslations();
  const setLoading = useMediaStore((state) => state.setLoading);
  const restrictions = useMediaStore((state) => state.restrictions);
  const mimeTypes = useMediaStore((state) => state.config?.mimeTypes);
  const { uppy, uploadFiles } = useUppy();

  /** Error message when `restrictions` (a `pick()` session) refuse the file, `null` otherwise. */
  function rejectionOf(file: File): string | null {
    const onlyFolders = [restrictions.types].flat().every((type) => type === "folder" || type === "folders");

    if (restrictions.uploadSize && file.size > restrictions.uploadSize) {
      return t("upload_rejected_size").replace("%name%", file.name).replace("%size%", getFileSize(restrictions.uploadSize));
    }

    if (!onlyFolders && !isPickTypeAllowed(file.type, restrictions.types, mimeTypes)) {
      return t("upload_rejected_type").replace("%name%", file.name);
    }

    return null;
  }

  async function uploadInputFiles(selectedFiles: FileList | File[] | null) {
    if (selectedFiles === null || selectedFiles.length === 0) {
      return [];
    }

    const rejections = Array.from(selectedFiles).map(rejectionOf).filter((message): message is string => message !== null);
    const files = Array.from(selectedFiles).filter((file) => rejectionOf(file) === null);

    if (rejections.length > 0) {
      toast.error(rejections.join(" "));
    }

    if (files.length === 0) {
      return [];
    }

    setLoading(true);

    try {
      uppy.clear();

      for (const file of files) {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      }

      const results = await uploadFiles();
      const successCount = results.filter((item) => item.success).length;
      const failedMessages = results.filter((item) => item.success === false && item.message).map((item) => item.message);

      if (successCount > 0) {
        toast.success(t("upload_files_success").replace("%count%", String(successCount)));
      }

      if (failedMessages.length > 0) {
        toast.error(failedMessages.join(" "));
      }

      return results;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : t("upload_failed");
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  return {
    uploadInputFiles,
  };
}
