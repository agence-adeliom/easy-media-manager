import { getFileSize } from "@/lib/file-utils";
import { useTranslations } from "@/hooks/use-translations";
import type { MediaFileItem } from "@/types/media";

export function FileDetails({ file }: { file: MediaFileItem }) {
  const t = useTranslations();
  const dimensions = file.metas.dimensions;
  const extraMetas = Object.entries(file.metas.extra ?? {});

  return (
    <dl className="emm:grid emm:grid-cols-2 emm:text-sm">
      <dt className="emm:font-medium emm:text-emm-neutral-500">{t("type_label")}</dt>
      <dd className="emm:text-emm-neutral-900">{file.type}</dd>
      <dt className="emm:font-medium emm:text-emm-neutral-500">{t("size")}</dt>
      <dd className="emm:text-emm-neutral-900">{getFileSize(file.size)}</dd>
      <dt className="emm:font-medium emm:text-emm-neutral-500">{t("last_modified")}</dt>
      <dd className="emm:text-emm-neutral-900">{file.last_modified_formated}</dd>
      {dimensions?.width && dimensions?.height ? (
        <>
          <dt className="emm:font-medium emm:text-emm-neutral-500">{t("dimension")}</dt>
          <dd className="emm:text-emm-neutral-900">{`${dimensions.width} x ${dimensions.height}`}</dd>
        </>
      ) : null}
      {file.metas.title ? (
        <>
          <dt className="emm:font-medium emm:text-emm-neutral-500">{t("seo_title")}</dt>
          <dd className="emm:text-emm-neutral-900">{file.metas.title}</dd>
        </>
      ) : null}
      {file.metas.alt ? (
        <>
          <dt className="emm:font-medium emm:text-emm-neutral-500">{t("seo_alt")}</dt>
          <dd className="emm:text-emm-neutral-900">{file.metas.alt}</dd>
        </>
      ) : null}
      {file.metas.description ? (
        <>
          <dt className="emm:font-medium emm:text-emm-neutral-500">{t("seo_description")}</dt>
          <dd className="emm:text-emm-neutral-900">{file.metas.description}</dd>
        </>
      ) : null}
      {extraMetas.map(([key, value]) => (
        <div className="emm:contents" key={key}>
          <dt className="emm:font-medium emm:text-emm-neutral-500">{key}</dt>
          <dd className="emm:text-emm-neutral-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
