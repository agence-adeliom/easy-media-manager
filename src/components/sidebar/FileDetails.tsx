import { getFileSize } from "@/lib/file-utils";
import { useTranslations } from "@/hooks/use-translations";
import type { MediaFileItem } from "@/types/media";

export function FileDetails({ file }: { file: MediaFileItem }) {
  const t = useTranslations();
  const dimensions = file.metas.dimensions;
  const extraMetas = Object.entries(file.metas.extra ?? {});

  return (
    <dl className="grid grid-cols-2 text-sm">
      <dt className="font-medium text-slate-500">{t("type_label")}</dt>
      <dd className="text-slate-900">{file.type}</dd>
      <dt className="font-medium text-slate-500">{t("size")}</dt>
      <dd className="text-slate-900">{getFileSize(file.size)}</dd>
      <dt className="font-medium text-slate-500">{t("last_modified")}</dt>
      <dd className="text-slate-900">{file.last_modified_formated}</dd>
      {dimensions?.width && dimensions?.height ? (
        <>
          <dt className="font-medium text-slate-500">{t("dimension")}</dt>
          <dd className="text-slate-900">{`${dimensions.width} x ${dimensions.height}`}</dd>
        </>
      ) : null}
      {file.metas.title ? (
        <>
          <dt className="font-medium text-slate-500">{t("seo_title")}</dt>
          <dd className="text-slate-900">{file.metas.title}</dd>
        </>
      ) : null}
      {file.metas.alt ? (
        <>
          <dt className="font-medium text-slate-500">{t("seo_alt")}</dt>
          <dd className="text-slate-900">{file.metas.alt}</dd>
        </>
      ) : null}
      {file.metas.description ? (
        <>
          <dt className="font-medium text-slate-500">{t("seo_description")}</dt>
          <dd className="text-slate-900">{file.metas.description}</dd>
        </>
      ) : null}
      {extraMetas.map(([key, value]) => (
        <div className="contents" key={key}>
          <dt className="font-medium text-slate-500">{key}</dt>
          <dd className="text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
