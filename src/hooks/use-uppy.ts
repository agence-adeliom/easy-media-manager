import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Uppy from "@uppy/core";

import { EasyMediaApiError } from "@/api/client";
import { useMediaStore } from "@/store/media-store";

const CHUNK_SIZE = 1024 * 1024;
const TIMEOUT = 3_600_000;

export interface UploadResult {
  success: boolean;
  file_name?: string;
  message?: string;
}

function createUploadId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function appendBaseFields(formData: FormData, folderId: number | null, useRandomNames: boolean) {
  formData.append("upload_folder", folderId === null ? "" : String(folderId));
  formData.append("random_names", useRandomNames ? "1" : "0");
  formData.append("custom_attrs", "[]");
}

async function postUpload(route: string, formData: FormData) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, TIMEOUT);

  try {
    const response = await fetch(route, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new EasyMediaApiError(`HTTP ${response.status}`, response.status);
    }

    return (await response.json()) as UploadResult[];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function uploadSimpleFile(route: string, file: File, folderId: number | null, useRandomNames: boolean) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  appendBaseFields(formData, folderId, useRandomNames);

  return postUpload(route, formData);
}

async function uploadChunk(
  route: string,
  file: File,
  uploadId: string,
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  folderId: number | null,
  useRandomNames: boolean,
) {
  const formData = new FormData();
  formData.append("file", chunk, file.name);
  appendBaseFields(formData, folderId, useRandomNames);
  formData.append("dzuuid", uploadId);
  formData.append("dztotalfilesize", String(file.size));
  formData.append("dztotalchunkcount", String(totalChunks));
  formData.append("dzchunkindex", String(chunkIndex));
  formData.append("dzchunksize", String(CHUNK_SIZE));
  formData.append("dzchunkbyteoffset", String(chunkIndex * CHUNK_SIZE));

  return postUpload(route, formData);
}

export function useUppy() {
  const queryClient = useQueryClient();
  const routes = useMediaStore((state) => state.routes);
  const currentFolderId = useMediaStore((state) => state.currentFolderId);
  const useRandomNames = useMediaStore((state) => state.useRandomNames);
  const setUploadProgress = useMediaStore((state) => state.setUploadProgress);
  const setUploading = useMediaStore((state) => state.setUploading);

  const uppy = useMemo(() => {
    return new Uppy({
      autoProceed: false,
      restrictions: {
        maxNumberOfFiles: null,
      },
    });
  }, [routes?.upload]);

  useEffect(() => {
    return () => {
      void uppy.destroy();
    };
  }, [uppy]);

  async function uploadFiles() {
    if (!routes?.upload) {
      throw new EasyMediaApiError("Upload route is not configured.");
    }

    const files = uppy.getFiles();

    if (files.length === 0) {
      return [];
    }
    const results: UploadResult[] = [];
    const totalUploadUnits = files.reduce((count, fileState) => {
      const data = fileState.data;

      if (!(data instanceof File)) {
        return count;
      }

      if (data.size < CHUNK_SIZE) {
        return count + 1;
      }

      return count + Math.ceil(data.size / CHUNK_SIZE);
    }, 0);
    let completedUploadUnits = 0;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const fileState = files[fileIndex];
        const data = fileState.data;

        if (!(data instanceof File)) {
          continue;
        }

        const uploadStarted = Date.now();

        if (data.size < CHUNK_SIZE) {
          const response = await uploadSimpleFile(routes.upload, data, currentFolderId, useRandomNames);
          completedUploadUnits += 1;
          uppy.emit("upload-progress", fileState, {
            bytesUploaded: data.size,
            bytesTotal: data.size,
            percentage: 100,
            uploadStarted,
          });
          setUploadProgress(Math.round((completedUploadUnits / totalUploadUnits) * 100));
          results.push(...response);
          continue;
        }

        const uploadId = createUploadId();
        const totalChunks = Math.ceil(data.size / CHUNK_SIZE);
        let finalResponse: UploadResult[] = [];

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
          const start = chunkIndex * CHUNK_SIZE;
          const chunk = data.slice(start, start + CHUNK_SIZE);

          finalResponse = await uploadChunk(
            routes.upload,
            data,
            uploadId,
            chunk,
            chunkIndex,
            totalChunks,
            currentFolderId,
            useRandomNames,
          );

          completedUploadUnits += 1;
          uppy.emit("upload-progress", fileState, {
            bytesUploaded: Math.min((chunkIndex + 1) * CHUNK_SIZE, data.size),
            bytesTotal: data.size,
            percentage: Math.round((Math.min((chunkIndex + 1) * CHUNK_SIZE, data.size) / data.size) * 100),
            uploadStarted,
          });
          setUploadProgress(Math.round((completedUploadUnits / totalUploadUnits) * 100));
        }

        results.push(...finalResponse);
      }

      await queryClient.invalidateQueries({ queryKey: ["files"] });
      return results;
    } finally {
      setUploading(false);
    }
  }

  return {
    uppy,
    uploadFiles,
  };
}
