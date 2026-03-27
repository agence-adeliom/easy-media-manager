import { postJson, postVoid } from '@adeliom/easy-media-manager/plugin-sdk';

export interface GenerateAltRequest {
  file: {
    id: number;
  };
  path: string;
}

export interface GenerateAltResponse {
  error: string;
  alt: string;
}

export interface GenerateAltGroupRequest {
  files: number[];
}

export interface GenerateAltBatchResponse {
  error: string | null;
  data: string;
}

export const generateAltClient = {
  generateAlt(route: string, body: GenerateAltRequest): Promise<GenerateAltResponse> {
    return postJson<GenerateAltResponse, GenerateAltRequest>(route, body);
  },

  generateAltGroup(route: string, body: GenerateAltGroupRequest): Promise<GenerateAltBatchResponse> {
    return postJson<GenerateAltBatchResponse, GenerateAltGroupRequest>(route, body);
  },

  generateAllAlt(route: string): Promise<GenerateAltBatchResponse> {
    return postVoid<GenerateAltBatchResponse>(route);
  },
};
