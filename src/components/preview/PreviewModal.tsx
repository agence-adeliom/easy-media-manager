import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

import { ModalShell } from "@/components/modals/ModalShell";
import { AudioPlayer } from "@/components/preview/AudioPlayer";
import { ImagePreview } from "@/components/preview/ImagePreview";
import { OembedViewer } from "@/components/preview/OembedViewer";
import { PdfViewer } from "@/components/preview/PdfViewer";
import { VideoPlayer } from "@/components/preview/VideoPlayer";
import { FileDetails } from "@/components/sidebar/FileDetails";
import { Button } from "@/components/ui/Button";
import { useFileType } from "@/hooks/use-file-type";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";
import type { MediaItem } from "@/types/media";
import { getMediaItemKey, isMediaFile } from "@/types/media";

interface PreviewModalProps {
  items: MediaItem[];
}

export function PreviewModal({ items }: PreviewModalProps) {
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const selectFile = useMediaStore((state) => state.selectFile);
  const fileType = useFileType();
  const isPreviewOpen = activeModal === CORE_MODAL_IDS.preview && selectedFile !== null && isMediaFile(selectedFile);

  const previewableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          isMediaFile(item) &&
          (fileType.isImage(item) || fileType.isVideo(item) || fileType.isAudio(item) || fileType.isPdf(item) || fileType.isOembed(item)),
      ),
    [fileType, items],
  );
  const currentPreviewIndex = isPreviewOpen ? previewableItems.findIndex((item) => getMediaItemKey(item) === getMediaItemKey(selectedFile)) : -1;
  const hasNavigation = isPreviewOpen && currentPreviewIndex !== -1 && previewableItems.length > 1;
  const previousItem = hasNavigation ? previewableItems[(currentPreviewIndex - 1 + previewableItems.length) % previewableItems.length] : null;
  const nextItem = hasNavigation ? previewableItems[(currentPreviewIndex + 1) % previewableItems.length] : null;

  function goToItem(item: MediaItem | null) {
    if (!item) {
      return;
    }

    const nextIndex = items.findIndex((entry) => getMediaItemKey(entry) === getMediaItemKey(item));

    if (nextIndex === -1) {
      return;
    }

    selectFile(item, nextIndex);
  }

  useEffect(() => {
    if (!hasNavigation || !isPreviewOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToItem(previousItem);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToItem(nextItem);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goToItem, hasNavigation, isPreviewOpen, nextItem, previousItem]);

  if (!isPreviewOpen) {
    return null;
  }

  return (
    <ModalShell
      onClose={closeModal}
      open
      title={selectedFile.name}
      titlePrefix={
        <a
          aria-label="Download file"
          className="inline-flex items-center justify-center p-2 text-slate-700 transition-colors hover:text-slate-900"
          download
          href={selectedFile.download_url ?? selectedFile.path}
          rel="noreferrer noopener"
          target="_blank"
        >
          <Download className="h-4 w-4" />
        </a>
      }
      widthClassName="max-w-5xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          {hasNavigation ? (
            <Button
              aria-label="Element precedent"
              className="h-11 w-11 shrink-0 rounded-full border-slate-200 p-0"
              onClick={() => goToItem(previousItem)}
              type="button"
              variant="ghost"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            {fileType.isImage(selectedFile) ? <ImagePreview file={selectedFile} /> : null}
            {fileType.isVideo(selectedFile) ? <VideoPlayer file={selectedFile} /> : null}
            {fileType.isAudio(selectedFile) ? <AudioPlayer file={selectedFile} /> : null}
            {fileType.isPdf(selectedFile) ? <PdfViewer file={selectedFile} /> : null}
            {fileType.isOembed(selectedFile) ? <OembedViewer file={selectedFile} /> : null}
          </div>
          {hasNavigation ? (
            <Button
              aria-label="Element suivant"
              className="h-11 w-11 shrink-0 rounded-full border-slate-200 p-0"
              onClick={() => goToItem(nextItem)}
              type="button"
              variant="ghost"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : null}
        </div>
        <FileDetails file={selectedFile} />
      </div>
    </ModalShell>
  );
}
