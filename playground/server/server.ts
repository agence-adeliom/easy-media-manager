import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import {
  initDb,
  getDb,
  getFolderById,
  getMediaById,
  createFolder,
  createMedia,
  deleteMedia,
  deleteFolder,
  updateMedia,
  updateFolder,
  buildBreadcrumb,
  buildFolderPath,
  searchMedias,
  getChunksDir,
  getDataDir,
  Media,
} from './db';
import { seed } from './seed';
import {
  buildStoredMediaPath,
  ensureMediaBucket,
  getMediaSize,
  getMediaStream,
  migrateLegacyMediaFiles,
  removeMedia,
  storeMediaFromBuffer,
  storeMediaFromPath,
} from './storage';

const app = express();
const PORT = 3001;
const chunksDir = getChunksDir();
const tempUploadsDir = path.join(chunksDir, 'incoming');

for (const dir of [chunksDir, tempUploadsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve IIFE test page at /
app.use(express.static(path.join(process.cwd(), 'playground/iife')));
// Serve built IIFE assets at /dist/
app.use('/dist', express.static(path.join(process.cwd(), 'dist/iife')));
// Serve dev-server files (translations, external plugins…) at /dev-server/
app.use('/dev-server', express.static(path.join(process.cwd(), 'playground/server')));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tempUploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

function parseNullableInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getUploadFolderId(body: Request['body']): number | null {
  return parseNullableInt(body.folder ?? body.upload_folder);
}

function getUploadedFiles(files: Request['files']): Express.Multer.File[] {
  if (Array.isArray(files)) {
    return files;
  }

  if (!files) {
    return [];
  }

  return Object.values(files).flat();
}

function buildMediaFilename(media: Pick<Media, 'id' | 'name' | 'slug'>): string {
  return `${media.slug}-${media.id}${path.extname(media.name)}`;
}

function buildMediaStoragePath(media: Pick<Media, 'id' | 'name' | 'slug'>): string {
  return buildStoredMediaPath(buildMediaFilename(media));
}

function cleanupTempFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}

async function persistUploadedFile(file: Express.Multer.File, folderId: number | null) {
  const media = createMedia(file.originalname, file.mimetype, file.size, folderId);

  try {
    await storeMediaFromPath(buildMediaStoragePath(media), file.path);
  } finally {
    cleanupTempFile(file.path);
  }

  return { success: true, file_name: file.originalname };
}

function isChunkUpload(body: Request['body']): boolean {
  return typeof body.dzuuid === 'string'
    && body.dzuuid.length > 0
    && body.dztotalchunkcount !== undefined
    && body.dzchunkindex !== undefined;
}

async function finalizeChunkUpload(file: Express.Multer.File, body: Request['body'], folderId: number | null) {
  const uploadId = String(body.dzuuid);
  const chunkIndex = parseNullableInt(body.dzchunkindex);
  const totalChunks = parseNullableInt(body.dztotalchunkcount);
  const totalSize = parseNullableInt(body.dztotalfilesize) ?? file.size;

  if (chunkIndex === null || totalChunks === null || totalChunks < 1) {
    throw new Error('Invalid chunk metadata');
  }

  const uploadChunkDir = path.join(chunksDir, uploadId);
  fs.mkdirSync(uploadChunkDir, { recursive: true });

  const chunkFilename = `${String(chunkIndex).padStart(6, '0')}.part`;
  const chunkPath = path.join(uploadChunkDir, chunkFilename);
  fs.renameSync(file.path, chunkPath);

  if (chunkIndex < totalChunks - 1) {
    return [];
  }

  const media = createMedia(file.originalname, file.mimetype, totalSize, folderId);
  const finalTempPath = path.join(uploadChunkDir, `assembled${path.extname(file.originalname)}`);
  const chunkFiles = fs.readdirSync(uploadChunkDir)
    .filter((savedChunk) => savedChunk.endsWith('.part'))
    .sort();

  fs.writeFileSync(finalTempPath, '');

  try {
    for (const savedChunk of chunkFiles) {
      const savedChunkPath = path.join(uploadChunkDir, savedChunk);
      const buffer = fs.readFileSync(savedChunkPath);
      fs.appendFileSync(finalTempPath, buffer);
    }

    await storeMediaFromPath(buildMediaStoragePath(media), finalTempPath);
  } finally {
    fs.rmSync(uploadChunkDir, { recursive: true, force: true });
  }

  return [{ success: true, file_name: file.originalname }];
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
}

function getCategoryFromExtension(filename: string): string | null {
  const extension = path.extname(filename).toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'].includes(extension)) return 'image';
  if (['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv'].includes(extension)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(extension)) return 'audio';
  if (extension === '.pdf') return 'pdf';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) return 'compressed';

  return null;
}

function getFileType(mime: string | null, filename: string): string {
  const categoryFromExtension = getCategoryFromExtension(filename);

  if (!mime) return categoryFromExtension ?? 'file';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/')) return 'text';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return 'compressed';
  if (categoryFromExtension) return categoryFromExtension;
  if (mime.startsWith('application/')) return 'application';
  return 'file';
}

function formatMedia(media: Media, parentPath: string = '/') {
  const fileType = getFileType(media.mime, media.name);
  const filename = buildMediaFilename(media);
  const downloadUrl = `/api/uploads/${filename}`;

  return {
    id: media.id,
    name: media.name,
    type: fileType,
    size: media.size,
    path: downloadUrl,
    download_url: downloadUrl,
    storage_path: buildMediaStoragePath(media),
    last_modified: media.last_modified,
    last_modified_formated: formatDate(media.last_modified),
    metas: JSON.parse(media.metas),
  };
}

function formatFolder(folder: any, parentPath: string = '/') {
  const folderPath = parentPath === '/' ? `/${folder.name}` : `${parentPath}/${folder.name}`;

  return {
    id: folder.id,
    name: folder.name,
    type: 'folder',
    path: folderPath,
    storage_path: `folders/${folder.id}`,
  };
}

function normalizeUploadRequestPath(requestedPath: string): string {
  const normalized = path.posix.normalize(requestedPath).replace(/^\/+/, '');

  if (normalized === '' || normalized.startsWith('..') || path.posix.isAbsolute(normalized)) {
    throw new Error('Invalid upload path');
  }

  return normalized;
}

function parseRangeHeader(rangeHeader: string | undefined, size: number): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const [startPart, endPart] = rangeHeader.replace('bytes=', '').split('-', 2);
  const start = startPart === '' ? 0 : Number.parseInt(startPart, 10);
  const end = endPart === '' || endPart === undefined ? size - 1 : Number.parseInt(endPart, 10);

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1),
  };
}

function isMissingFileError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('ENOENT') || message.includes('no such file or directory');
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/get-files', (req: Request, res: Response) => {
  try {
    const { folder, search } = req.query;
    const requestedPage = parseNullableInt(req.query.page) ?? 1;
    const perPage = 50;
    const page = Math.max(requestedPage, 1);
    const offset = (page - 1) * perPage;
    const folderId = parseNullableInt(folder);
    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    const hasSearch = normalizedSearch !== '' && normalizedSearch !== '0';
    const searchValue = `%${normalizedSearch}%`;

    const folderQuery = folderId === null
      ? `SELECT * FROM folders WHERE parent_id IS NULL${hasSearch ? ' AND name LIKE ?' : ''} ORDER BY name`
      : `SELECT * FROM folders WHERE parent_id = ?${hasSearch ? ' AND name LIKE ?' : ''} ORDER BY name`;
    const mediasQuery = folderId === null
      ? `SELECT * FROM medias WHERE folder_id IS NULL${hasSearch ? ' AND name LIKE ?' : ''} ORDER BY name LIMIT ? OFFSET ?`
      : `SELECT * FROM medias WHERE folder_id = ?${hasSearch ? ' AND name LIKE ?' : ''} ORDER BY name LIMIT ? OFFSET ?`;
    const totalMediasQuery = folderId === null
      ? `SELECT COUNT(*) as count FROM medias WHERE folder_id IS NULL${hasSearch ? ' AND name LIKE ?' : ''}`
      : `SELECT COUNT(*) as count FROM medias WHERE folder_id = ?${hasSearch ? ' AND name LIKE ?' : ''}`;
    const totalFoldersQuery = folderId === null
      ? `SELECT COUNT(*) as count FROM folders WHERE parent_id IS NULL${hasSearch ? ' AND name LIKE ?' : ''}`
      : `SELECT COUNT(*) as count FROM folders WHERE parent_id = ?${hasSearch ? ' AND name LIKE ?' : ''}`;

    const folders = folderId === null
      ? getDb().prepare(folderQuery).all(...(hasSearch ? [searchValue] : [])) as any[]
      : getDb().prepare(folderQuery).all(folderId, ...(hasSearch ? [searchValue] : [])) as any[];
    const medias = folderId === null
      ? getDb().prepare(mediasQuery).all(...(hasSearch ? [searchValue] : []), perPage, offset) as Media[]
      : getDb().prepare(mediasQuery).all(folderId, ...(hasSearch ? [searchValue] : []), perPage, offset) as Media[];

    const totalMediasResult = folderId === null
      ? getDb().prepare(totalMediasQuery).get(...(hasSearch ? [searchValue] : [])) as { count: number }
      : getDb().prepare(totalMediasQuery).get(folderId, ...(hasSearch ? [searchValue] : [])) as { count: number };

    const totalFoldersResult = folderId === null
      ? getDb().prepare(totalFoldersQuery).get(...(hasSearch ? [searchValue] : [])) as { count: number }
      : getDb().prepare(totalFoldersQuery).get(folderId, ...(hasSearch ? [searchValue] : [])) as { count: number };

    const totalMediaCount = totalMediasResult?.count || 0;
    const totalFolderCount = totalFoldersResult?.count || 0;
    const lastPage = Math.ceil(totalMediaCount / perPage) || 1;
    const currentFolderPath = buildFolderPath(folderId);

    const items = [
      ...folders.map((folderItem) => formatFolder(folderItem, currentFolderPath)),
      ...medias.map((mediaItem) => formatMedia(mediaItem, currentFolderPath)),
    ];

    const nextPageUrl = page < lastPage ? `/api/get-files?page=${page + 1}` : null;
    const prevPageUrl = page > 1 ? `/api/get-files?page=${page - 1}` : null;

    res.json({
      files: {
        path: currentFolderPath,
        breadcrumb: buildBreadcrumb(folderId),
        items: {
          current_page: page,
          data: items,
          total: totalMediaCount + totalFolderCount,
          per_page: perPage,
          last_page: lastPage,
          next_page_url: nextPageUrl,
          prev_page_url: prevPageUrl,
        },
      },
    });
  } catch (error) {
    console.error('Error in get-files:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

app.get('/api/get-file-info', (req: Request, res: Response) => {
  try {
    const item = parseNullableInt(req.query.item);
    if (item === null) {
      return res.status(400).json({ error: 'Missing item id' });
    }
    const media = getMediaById(item);

    if (!media) {
      return res.status(404).json({ error: 'File not found' });
    }

    const folderPath = buildFolderPath(media.folder_id);
    return res.json(formatMedia(media, folderPath));
  } catch (error) {
    console.error('Error in get-file-info:', error);
    return res.status(500).json({ error: 'Failed to get file info' });
  }
});

app.post('/api/upload', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 50 },
]), async (req: Request, res: Response) => {
  try {
    const folderId = getUploadFolderId(req.body);
    const files = getUploadedFiles(req.files);

    if (files.length === 0) {
      return res.json([{ success: false, message: 'No files uploaded' }]);
    }

    const results = await Promise.all(files.map(async (file) => {
      try {
        if (isChunkUpload(req.body)) {
          return finalizeChunkUpload(file, req.body, folderId);
        }

        return persistUploadedFile(file, folderId);
      } catch (error) {
        console.error('File upload error:', error);
        cleanupTempFile(file.path);
        return { success: false, message: 'Failed to save file' };
      }
    }));

    return res.json(results.flat());
  } catch (error) {
    console.error('Error in upload:', error);
    return res.status(500).json([{ success: false, message: 'Upload failed' }]);
  }
});

app.post('/api/upload-cropped', async (req: Request, res: Response) => {
  try {
    const { data, name, folder, mime_type } = req.body;

    if (!data || !name) {
      return res.status(400).json({ success: false, message: 'Missing data or name' });
    }

    const matches = data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Invalid base64 data' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const media = createMedia(name, mime_type || 'image/png', buffer.length, folder ? parseInt(folder, 10) : null);

    await storeMediaFromBuffer(buildMediaStoragePath(media), buffer);

    return res.json({ success: true, message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error in upload-cropped:', error);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

app.post('/api/upload-link', async (req: Request, res: Response) => {
  try {
    const { url, folder, random_names } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Missing URL' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Failed to fetch URL' });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const urlPath = new URL(url).pathname;
    const filename = random_names ? `image-${Date.now()}.jpg` : path.basename(urlPath);

    const media = createMedia(filename, contentType, buffer.byteLength, folder ? parseInt(folder, 10) : null);
    await storeMediaFromBuffer(buildMediaStoragePath(media), Buffer.from(buffer));

    return res.json({ success: true, message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error in upload-link:', error);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

app.post('/api/create-new-folder', (req: Request, res: Response) => {
  try {
    const { folder, new_folder_name } = req.body;
    const newFolder = createFolder(new_folder_name, folder ? parseInt(folder, 10) : null);
    return res.json({ message: 'Folder created', new_folder_name: newFolder.name });
  } catch (error) {
    console.error('Error in create-new-folder:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.post('/api/delete-file', async (req: Request, res: Response) => {
  try {
    const { deleted_files } = req.body;
    const results = [];

    for (const file of deleted_files) {
      try {
        if (file.type === 'folder') {
          deleteFolder(file.id);
        } else {
          deleteMedia(file.id);
          await removeMedia(file.storage_path);
        }

        results.push({ id: file.id, name: file.name, type: file.type, path: file.storage_path, success: true });
      } catch (error) {
        console.error('Delete error:', error);
        results.push({ id: file.id, name: file.name, type: file.type, path: file.storage_path, success: false, message: 'Failed to delete' });
      }
    }

    return res.json(results);
  } catch (error) {
    console.error('Error in delete-file:', error);
    return res.status(500).json({ error: 'Failed to delete files' });
  }
});

app.post('/api/move-file', (req: Request, res: Response) => {
  try {
    const { destination, moved_files } = req.body;

    const results = moved_files.map((file: any) => {
      try {
        if (file.type === 'folder') {
          const folder = getFolderById(file.id);
          if (folder) {
            updateFolder(file.id, { parent_id: destination });
          }
        } else {
          const media = getMediaById(file.id);
          if (media) {
            updateMedia(file.id, { folder_id: destination });
          }
        }

        return { id: file.id, name: file.name, type: file.type, old_path: file.storage_path, new_path: file.storage_path, success: true };
      } catch (_error) {
        return { id: file.id, name: file.name, type: file.type, success: false, message: 'Failed to move' };
      }
    });

    return res.json(results);
  } catch (error) {
    console.error('Error in move-file:', error);
    return res.status(500).json({ error: 'Failed to move files' });
  }
});

app.post('/api/rename-file', (req: Request, res: Response) => {
  try {
    const { file, new_filename } = req.body;
    const media = getMediaById(file.id);

    if (!media) {
      return res.status(404).json({ error: 'File not found' });
    }

    updateMedia(file.id, { name: new_filename });

    return res.json({ message: 'File renamed', new_filename });
  } catch (error) {
    console.error('Error in rename-file:', error);
    return res.status(500).json({ error: 'Failed to rename file' });
  }
});

app.post('/api/edit-metas-file', (req: Request, res: Response) => {
  try {
    const { file, new_metas } = req.body;
    const media = getMediaById(file.id);

    if (!media) {
      return res.status(404).json({ error: 'File not found' });
    }

    const metas = JSON.parse(media.metas);
    const updated = { ...metas, ...new_metas };
    updateMedia(file.id, { metas: JSON.stringify(updated) });

    return res.json({ message: 'Metadata updated', metas: updated });
  } catch (error) {
    console.error('Error in edit-metas-file:', error);
    return res.status(500).json({ error: 'Failed to update metadata' });
  }
});

app.post('/api/generate-alt-file', async (req: Request, res: Response) => {
  try {
    const { file } = req.body;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return res.json({ error: '', alt: `Generated alt for file ${file.id}` });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to generate alt' });
  }
});

app.post('/api/generate-alt-group', async (_req: Request, res: Response) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return res.json({ error: null, data: 'Alts generated for group' });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to generate alts' });
  }
});

app.post('/api/generate-all-alt', async (_req: Request, res: Response) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return res.json({ error: null, data: 'All alts generated' });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to generate alts' });
  }
});

app.get('/api/global-search', (req: Request, res: Response) => {
  try {
    const { q = '' } = req.query;
    const query = String(q);

    if (query.length < 2) {
      return res.json([]);
    }

    const results = searchMedias(query).map((media) => ({
      name: media.name,
      type: getFileType(media.mime, media.name),
      path: '/' + media.name,
      dir_path: '/',
      storage_path: buildMediaStoragePath(media),
      size: media.size,
      last_modified: media.last_modified,
      last_modified_formated: formatDate(media.last_modified),
    }));

    return res.json(results);
  } catch (error) {
    console.error('Error in global-search:', error);
    return res.json([]);
  }
});

app.post('/api/folder-download', (_req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="folder.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err?: Error) => {
      if (err) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);
    archive.finalize();
  } catch (_error) {
    res.status(500).json({ error: 'Failed to download folder' });
  }
});

app.post('/api/files-download', (_req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err?: Error) => {
      if (err) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);
    archive.finalize();
  } catch (_error) {
    res.status(500).json({ error: 'Failed to download files' });
  }
});

app.get(/^\/api\/uploads\/(.+)$/, async (req: Request, res: Response) => {
  try {
    const requestedPath = normalizeUploadRequestPath(String(req.params[0] ?? ''));
    const storagePath = buildStoredMediaPath(requestedPath);
    const size = await getMediaSize(storagePath);
    const range = parseRangeHeader(req.headers.range, size);

    res.type(requestedPath);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = range === null
      ? await getMediaStream(storagePath)
      : await getMediaStream(storagePath, range);

    if (range !== null) {
      res.status(206);
      res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
      res.setHeader('Content-Length', String(range.end - range.start + 1));
    } else {
      res.setHeader('Content-Length', String(size));
    }

    stream.on('error', (error) => {
      console.error('Error streaming upload:', error);
      if (!res.headersSent) {
        res.status(500).end();
        return;
      }

      res.destroy(error);
    });

    stream.pipe(res);
  } catch (error) {
    if (isMissingFileError(error)) {
      return res.status(404).json({ error: 'File not found' });
    }

    console.error('Error serving upload:', error);
    return res.status(500).json({ error: 'Failed to read file' });
  }
});

async function bootstrap(): Promise<void> {
  initDb();
  await ensureMediaBucket();
  await migrateLegacyMediaFiles(getDb().prepare('SELECT * FROM medias').all() as Media[]);

  const count = getDb().prepare('SELECT COUNT(*) as count FROM medias').get() as { count: number };
  if (count.count === 0) {
    console.log('📦 Seeding database with demo data...');
    await seed();
    console.log('✅ Database seeded!');
  }

  app.listen(PORT, () => {
    console.log(`\n🎬 Express server running on http://localhost:${PORT}`);
    console.log(`💾 Data directory: ${getDataDir()}`);
  });
}

void bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
