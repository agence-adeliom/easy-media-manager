import { useMediaStore } from "@/store/media-store";
import { useTranslations } from "@/hooks/use-translations";

export function UploadProgress() {
  const t = useTranslations();
  const progress = useMediaStore((state) => state.uploadProgress);
  const isUploading = useMediaStore((state) => state.isUploading);

  if (!isUploading) {
    return null;
  }

  return (
    <div className="emm:rounded-xl emm:border emm:border-emm-neutral-200 emm:bg-emm-surface emm:p-4">
      <div className="emm:mb-2 emm:flex emm:items-center emm:justify-between emm:text-sm emm:text-emm-neutral-600">
        <span>{t("upload_progress")}</span>
        <span>{progress}%</span>
      </div>
      <div className="emm:h-2 emm:overflow-hidden emm:rounded-full emm:bg-emm-neutral-100">
        <div className="emm:h-full emm:rounded-full emm:bg-emm-neutral-900 emm:transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
