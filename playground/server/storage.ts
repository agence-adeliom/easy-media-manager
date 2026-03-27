import fs from 'fs';
import { Provider, Storage } from '@tweedegolf/storage-abstraction';
import path from 'path';
import { getDataDir, getUploadsDir, Media } from './db';

const STORAGE_BUCKET = 'media';
const STORAGE_DIRECTORY = path.join(getDataDir(), 'storage');
const LEGACY_UPLOADS_DIRECTORY = getUploadsDir();

const storage = new Storage({
  provider: Provider.LOCAL,
  directory: STORAGE_DIRECTORY,
  bucketName: STORAGE_BUCKET,
});

function ensureStorageSuccess<T>(result: { error: string | null; value: T | null }, action: string): T {
  if (result.error !== null || result.value === null) {
    throw new Error(result.error ?? `Storage action failed: ${action}`);
  }

  return result.value;
}

export function buildStoredMediaPath(filename: string): string {
  return path.posix.join('uploads', filename);
}

function getLegacyMediaPath(targetPath: string): string | null {
  if (!targetPath.startsWith('uploads/')) {
    return null;
  }

  return path.join(LEGACY_UPLOADS_DIRECTORY, targetPath.slice('uploads/'.length));
}

export async function ensureMediaBucket(): Promise<void> {
  const bucketExists = await storage.bucketExists();

  if (bucketExists.error !== null) {
    throw new Error(bucketExists.error);
  }

  if (bucketExists.value) {
    return;
  }

  ensureStorageSuccess(await storage.createBucket(), 'create bucket');
}

export async function storeMediaFromBuffer(targetPath: string, buffer: Buffer): Promise<void> {
  ensureStorageSuccess(
    await storage.addFileFromBuffer({
      buffer,
      targetPath,
    }),
    `store buffer at ${targetPath}`,
  );
}

export async function storeMediaFromPath(targetPath: string, sourcePath: string): Promise<void> {
  ensureStorageSuccess(
    await storage.addFileFromPath({
      origPath: sourcePath,
      targetPath,
    }),
    `store file from ${sourcePath}`,
  );
}

export async function getMediaStream(targetPath: string, options?: { start?: number; end?: number }) {
  const result = await storage.getFileAsStream(targetPath, options);

  if (result.error === null && result.value !== null) {
    return result.value;
  }

  const legacyPath = getLegacyMediaPath(targetPath);
  if (legacyPath !== null && fs.existsSync(legacyPath)) {
    return fs.createReadStream(legacyPath, options);
  }

  throw new Error(result.error ?? `Storage action failed: open stream for ${targetPath}`);
}

export async function getMediaSize(targetPath: string): Promise<number> {
  const result = await storage.sizeOf(targetPath);

  if (result.error === null && result.value !== null) {
    return result.value;
  }

  const legacyPath = getLegacyMediaPath(targetPath);
  if (legacyPath !== null && fs.existsSync(legacyPath)) {
    return fs.statSync(legacyPath).size;
  }

  throw new Error(result.error ?? `Storage action failed: get size of ${targetPath}`);
}

export async function getMediaPublicPath(targetPath: string): Promise<string> {
  return ensureStorageSuccess(
    await storage.getPublicURL(targetPath, { withoutDirectory: true }),
    `get public path for ${targetPath}`,
  );
}

export async function removeMedia(targetPath: string): Promise<void> {
  const exists = await storage.fileExists(targetPath);

  if (exists.error !== null) {
    throw new Error(exists.error);
  }

  if (!exists.value) {
    const legacyPath = getLegacyMediaPath(targetPath);
    if (legacyPath !== null && fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { force: true });
    }
    return;
  }

  ensureStorageSuccess(await storage.removeFile(targetPath), `remove ${targetPath}`);

  const legacyPath = getLegacyMediaPath(targetPath);
  if (legacyPath !== null && fs.existsSync(legacyPath)) {
    fs.rmSync(legacyPath, { force: true });
  }
}

export async function migrateLegacyMediaFiles(medias: Media[]): Promise<void> {
  for (const media of medias) {
    const targetPath = buildStoredMediaPath(`${media.slug}-${media.id}${path.extname(media.name)}`);
    const legacyPath = getLegacyMediaPath(targetPath);

    if (legacyPath === null || !fs.existsSync(legacyPath)) {
      continue;
    }

    const exists = await storage.fileExists(targetPath);
    if (exists.error !== null) {
      throw new Error(exists.error);
    }

    if (exists.value) {
      continue;
    }

    await storeMediaFromPath(targetPath, legacyPath);
  }
}
