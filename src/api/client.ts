import type {
  CreateFolderRequest,
  CreateFolderResponse,
  DeleteFileRequest,
  DeleteFileResponseItem,
  EditMetasRequest,
  EditMetasResponse,
  GetFileInfoRequest,
  GetFileInfoResponse,
  GetFilesRequest,
  GetFilesResponse,
  MoveFileRequest,
  MoveFileResponseItem,
  RenameFileRequest,
  RenameFileResponse,
  UploadCroppedRequest,
  UploadCroppedResponse,
  UploadLinkRequest,
  UploadLinkResponse,
  UploadResponseItem,
} from "@/types/api";
import { EasyMediaApiError, getJson, hasErrorMessage, parseJson, postJson } from "@/api/http";
import type { GlobalSearchItem, MediaFileItem } from "@/types/media";

export const easyMediaClient = {
  getFiles(route: string, body: GetFilesRequest): Promise<GetFilesResponse> {
    return getJson<GetFilesResponse>(route, { folder: body.folder, search: body.search, path: body.path });
  },

  async getFileInfo(route: string, body: GetFileInfoRequest): Promise<MediaFileItem> {
    const data = await getJson<GetFileInfoResponse>(route, { item: body.item });

    if (hasErrorMessage(data)) {
      throw new EasyMediaApiError(data.error);
    }

    return data;
  },

  async uploadFile(route: string, formData: FormData): Promise<UploadResponseItem[]> {
    const response = await fetch(route, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData,
    });

    return parseJson<UploadResponseItem[]>(response);
  },

  uploadCropped(route: string, body: UploadCroppedRequest): Promise<UploadCroppedResponse> {
    return postJson<UploadCroppedResponse, UploadCroppedRequest>(route, body);
  },

  uploadLink(route: string, body: UploadLinkRequest): Promise<UploadLinkResponse> {
    return postJson<UploadLinkResponse, UploadLinkRequest>(route, body);
  },

  createFolder(route: string, body: CreateFolderRequest): Promise<CreateFolderResponse> {
    return postJson<CreateFolderResponse, CreateFolderRequest>(route, body);
  },

  deleteFiles(route: string, body: DeleteFileRequest): Promise<DeleteFileResponseItem[]> {
    return postJson<DeleteFileResponseItem[], DeleteFileRequest>(route, body);
  },

  moveFiles(route: string, body: MoveFileRequest): Promise<MoveFileResponseItem[]> {
    return postJson<MoveFileResponseItem[], MoveFileRequest>(route, body);
  },

  renameFile(route: string, body: RenameFileRequest): Promise<RenameFileResponse> {
    return postJson<RenameFileResponse, RenameFileRequest>(route, body);
  },

  editMetas(route: string, body: EditMetasRequest): Promise<EditMetasResponse> {
    return postJson<EditMetasResponse, EditMetasRequest>(route, body);
  },

  globalSearch(route: string): Promise<GlobalSearchItem[]> {
    return getJson<GlobalSearchItem[]>(route);
  },
};

export { EasyMediaApiError };
