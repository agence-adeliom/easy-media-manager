import { useInfiniteQuery } from "@tanstack/react-query";

import type { GetFilesResponse } from "@/types/api";

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
        throw new EasyMediaApiError(response.error, undefined, true);
      }

      return response;
    },
    getNextPageParam: (lastPage) => lastPage.files.items.next_page_url ?? undefined,
  });
}
