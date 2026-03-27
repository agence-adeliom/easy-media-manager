import { useFileInfo } from "@/api/queries";
import { FileDetails } from "@/components/sidebar/FileDetails";
import { EmptyState } from "@/components/browser/EmptyState";
import { useTranslations } from "@/hooks/use-translations";
import { useMediaStore } from "@/store/media-store";
import { isMediaFile } from "@/types/media";

export function InfoSidebar() {
  const t = useTranslations();
  const routes = useMediaStore((state) => state.routes);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const mediaId = selectedFile && isMediaFile(selectedFile) ? selectedFile.id : null;

  const query = useFileInfo(routes?.fileInfos ?? "", mediaId, Boolean(routes?.fileInfos));

  if (selectedFile === null || !isMediaFile(selectedFile)) {
    return (
      <aside className="w-full rounded-2xl border border-slate-200 bg-white p-5 xl:w-80">
        <EmptyState
          description={t("no_file_description")}
          title={t("no_file_title")}
        />
      </aside>
    );
  }

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-5 xl:w-80">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{selectedFile.name}</h2>
      {query.isLoading ? <p className="text-sm text-slate-500">{t("loading")}</p> : null}
      {query.error ? <p className="text-sm text-red-600">{query.error.message}</p> : null}
      {query.data ? <FileDetails file={query.data} /> : null}
    </aside>
  );
}
