import { useMediaStore } from "@/store/media-store";

export function useTranslations() {
  return useMediaStore((state) => state.t);
}
