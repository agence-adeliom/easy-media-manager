import type { GlobalSearchItem, MediaFileItem, MediaItem, MediaMetas } from "./media";

export interface ApiErrorResponse {
  error: string;
}

export interface GetFilesRequest {
  folder: number | null;
  search?: string;
  path?: string;
}

export interface PaginatedItems<TItem = MediaItem> {
  current_page: number;
  data: TItem[];
  total: number;
  per_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface FolderBreadcrumbItem {
  id: number;
  name: string;
}

export interface GetFilesResponse {
  files: {
    path: string;
    breadcrumb: FolderBreadcrumbItem[];
    items: PaginatedItems;
  };
  error?: string;
}

export interface GetFileInfoRequest {
  item: number;
}

export type GetFileInfoResponse = MediaFileItem | ApiErrorResponse;

export interface UploadResponseItem {
  success: boolean;
  file_name?: string;
  message?: string;
}

export interface UploadCroppedRequest {
  data: string;
  name: string;
  folder?: number | null;
  mime_type: string;
}

export interface UploadCroppedResponse {
  success: boolean;
  message: string;
}

export interface UploadLinkRequest {
  url: string;
  folder?: number | null;
  random_names: boolean;
}

export interface UploadLinkResponse {
  success: boolean;
  message: string;
}

export interface CreateFolderRequest {
  folder: number | null;
  new_folder_name: string;
}

export interface CreateFolderResponse {
  message: string;
  new_folder_name: string;
}

export interface DeleteFileTarget {
  id: number;
  name: string;
  type: string;
  storage_path: string;
}

export interface DeleteFileRequest {
  path: string;
  deleted_files: DeleteFileTarget[];
}

export interface DeleteFileResponseItem {
  id: number;
  name: string;
  type: string;
  path: string;
  success: boolean;
  message?: string;
}

export interface MoveFileTarget {
  id: number;
  name: string;
  type: string;
  storage_path: string;
}

export interface MoveFileRequest {
  destination: number | null;
  moved_files: MoveFileTarget[];
}

export interface MoveFileResponseItem {
  id?: number;
  type?: string;
  name?: string;
  old_path?: string;
  new_path?: string;
  success: boolean;
  message?: string;
}

export interface RenameFileRequest {
  file: {
    id: number;
    type: string;
  };
  new_filename: string;
}

export interface RenameFileResponse {
  message: string;
  new_filename: string;
}

export interface EditMetasRequest {
  file: {
    id: number;
  };
  path: string;
  new_metas: {
    title: string;
    alt: string;
    description: string;
  };
}

export interface EditMetasResponse {
  message: string;
  metas: MediaMetas;
}

export type GlobalSearchResponse = GlobalSearchItem[];

export type MediaListResponse = MediaItem[];
