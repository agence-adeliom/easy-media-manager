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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
        <span>{t("upload_progress")}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
