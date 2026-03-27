import { toast } from "sonner";

import { useUppy } from "@/hooks/use-uppy";
import { useMediaStore } from "@/store/media-store";

export function useFileUpload() {
  const setLoading = useMediaStore((state) => state.setLoading);
  const { uppy, uploadFiles } = useUppy();

  async function uploadInputFiles(files: FileList | File[] | null) {
    if (files === null || files.length === 0) {
      return [];
    }

    setLoading(true);

    try {
      uppy.clear();

      for (const file of Array.from(files)) {
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
        toast.success(`${successCount} fichier(s) envoye(s).`);
      }

      if (failedMessages.length > 0) {
        toast.error(failedMessages.join(" "));
      }

      return results;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Upload impossible.";
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
