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
        "emm:flex emm:min-h-[280px] emm:flex-1 emm:rounded-2xl emm:transition-colors emm:px-6 emm:mt-3",
        isDraggingFiles ? "emm:bg-emm-accent-50" : "emm:bg-transparent",
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "emm:flex emm:min-h-[280px] emm:flex-1 emm:flex-col emm:items-center emm:justify-center emm:gap-4 emm:rounded-2xl emm:border emm:border-dashed emm:text-center emm:transition-colors",
          // The drop zone stays dark in dark mode: the reversed scale would turn it light.
          isDraggingFiles
            ? "emm:border-emm-accent-400 emm:bg-emm-neutral-800 emm:emm-dark:bg-emm-neutral-100"
            : "emm:border-emm-neutral-400 emm:bg-emm-neutral-700 emm:emm-dark:bg-emm-neutral-200",
        )}
      >
        <div className={cn("emm:rounded-full emm:p-4", isDraggingFiles
              ? "emm:bg-emm-accent-500/15 emm:text-emm-accent-100 emm:emm-dark:text-emm-accent-900"
              : "emm:bg-emm-inverse/10 emm:text-emm-neutral-100 emm:emm-dark:bg-emm-neutral-950/10 emm:emm-dark:text-emm-neutral-900")}>
          <Inbox className="emm:h-8 emm:w-8" />
        </div>
        <div>
          <h3 className="emm:text-lg emm:font-semibold emm:text-emm-inverse emm:emm-dark:text-emm-neutral-950">{t("upload_main")}</h3>
          <p className={cn("emm:max-w-md emm:text-sm", isDraggingFiles ? "emm:text-emm-accent-50 emm:emm-dark:text-emm-accent-950" : "emm:text-emm-neutral-200 emm:emm-dark:text-emm-neutral-800")}>
            {t("upload_hint")}
          </p>
        </div>
        <input
          accept={resolvePickAccept(pickTypes)}
          className="emm:hidden"
          multiple
          onChange={(event) => void onFiles(event.target.files)}
          ref={inputRef}
          type="file"
        />
        <Button onClick={() => inputRef.current?.click()} type="button" variant="primary">
          <Upload className="emm:mr-2 emm:h-4 emm:w-4" />
          {t("upload_choose_files")}
        </Button>
        {error ? <p className="emm:text-sm emm:text-emm-danger-200 emm:emm-dark:text-emm-danger-800">{error}</p> : null}
      </div>
    </section>
  );
}
