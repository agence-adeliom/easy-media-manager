import { type DragEvent as ReactDragEvent, useEffect, useRef, useState } from "react";
import { Inbox, Upload } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/error-message";
import { hasDraggedFiles } from "@/lib/file-drop";
import { resolvePickAccept } from "@/lib/file-utils";
import { useMediaStore } from "@/store/media-store";

interface UploadZoneProps {
  className?: string;
  forceVisible?: boolean;
}

export function UploadZone({ className, forceVisible = false }: UploadZoneProps) {
  const t = useTranslations();
  const uploadPanelOpen = useMediaStore((state) => state.uploadPanelOpen);
  const pickTypes = useMediaStore((state) => state.restrictions.types);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const { uploadInputFiles } = useFileUpload();

  useEffect(() => {
    if (!uploadPanelOpen) {
      setIsDraggingFiles(false);
      dragDepthRef.current = 0;
    }
  }, [uploadPanelOpen]);

  if (!uploadPanelOpen && !forceVisible) {
    return null;
  }

  async function onFiles(files: FileList | null) {
    if (files === null || files.length === 0) {
      return;
    }

    setError(null);

    try {
      await uploadInputFiles(files);
    } catch (caughtError) {
      const message = getErrorMessage(caughtError, t);
      setError(message);
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDragEnter(event: ReactDragEvent<HTMLElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  }

  function handleDragOver(event: ReactDragEvent<HTMLElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: ReactDragEvent<HTMLElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  }

  function handleDrop(event: ReactDragEvent<HTMLElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    void onFiles(event.dataTransfer.files);
  }

  return (
    <section
      className={cn(
        "flex min-h-[280px] flex-1 rounded-2xl transition-colors px-6 mt-3",
        isDraggingFiles ? "bg-emm-accent-50" : "bg-transparent",
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center transition-colors",
          // The drop zone stays dark in dark mode: the reversed scale would turn it light.
          isDraggingFiles
            ? "border-emm-accent-400 bg-emm-neutral-800 emm-dark:bg-emm-neutral-100"
            : "border-emm-neutral-400 bg-emm-neutral-700 emm-dark:bg-emm-neutral-200",
        )}
      >
        <div className={cn("rounded-full p-4", isDraggingFiles
              ? "bg-emm-accent-500/15 text-emm-accent-100 emm-dark:text-emm-accent-900"
              : "bg-emm-inverse/10 text-emm-neutral-100 emm-dark:bg-emm-neutral-950/10 emm-dark:text-emm-neutral-900")}>
          <Inbox className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-emm-inverse emm-dark:text-emm-neutral-950">{t("upload_main")}</h3>
          <p className={cn("max-w-md text-sm", isDraggingFiles ? "text-emm-accent-50 emm-dark:text-emm-accent-950" : "text-emm-neutral-200 emm-dark:text-emm-neutral-800")}>
            {t("upload_hint")}
          </p>
        </div>
        <input
          accept={resolvePickAccept(pickTypes)}
          className="hidden"
          multiple
          onChange={(event) => void onFiles(event.target.files)}
          ref={inputRef}
          type="file"
        />
        <Button onClick={() => inputRef.current?.click()} type="button" variant="primary">
          <Upload className="mr-2 h-4 w-4" />
          {t("upload_choose_files")}
        </Button>
        {error ? <p className="text-sm text-emm-danger-200 emm-dark:text-emm-danger-800">{error}</p> : null}
      </div>
    </section>
  );
}
