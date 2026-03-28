import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type { GetFilesResponse } from "@/types/api";
import type { GlobalSearchItem } from "@/types/media";

import { EasyMediaApiError, easyMediaClient } from "./client";

export function useFiles(route: string, folderId: number | null, search?: string, path?: string) {
  return useInfiniteQuery<GetFilesResponse, Error>({
    queryKey: ["easy-media", "files", route, folderId, search ?? "", path ?? ""],
    initialPageParam: route,
    queryFn: async ({ pageParam }) => {
      const response = await easyMediaClient.getFiles(String(pageParam), {
        folder: folderId,
        search,
        path,
      });

      if (response.error) {
        throw new EasyMediaApiError(response.error);
      }

      return response;
    },
    getNextPageParam: (lastPage) => lastPage.files.items.next_page_url ?? undefined,
  });
}

export function useGlobalSearch(route: string, query: string, enabled = false) {
  const normalizedQuery = query.trim().toLowerCase();

  return useQuery<GlobalSearchItem[], Error>({
    queryKey: ["easy-media", "global-search", route, normalizedQuery],
    queryFn: async () => {
      const items = await easyMediaClient.globalSearch(route);

      if (!normalizedQuery) {
        return items;
      }

      return items.filter((item) => {
        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.dir_path.toLowerCase().includes(normalizedQuery) ||
          item.storage_path.toLowerCase().includes(normalizedQuery)
        );
      });
    },
    enabled: enabled && normalizedQuery.length > 0,
  });
}
