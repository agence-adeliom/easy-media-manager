import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'playground/data');
const DB_PATH = path.join(DATA_DIR, 'dev.sqlite');

let db: Database.Database | null = null;

export interface Folder {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export interface Media {
  id: number;
  name: string;
  slug: string;
  mime: string | null;
  size: number;
  last_modified: number | null;
  metas: string;
  folder_id: number | null;
}

export function initDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
  `).all();

  if (tables.length === 0) {
    db.exec(`
      CREATE TABLE folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE TABLE medias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        mime TEXT,
        size INTEGER DEFAULT 0,
        last_modified INTEGER,
        metas TEXT NOT NULL DEFAULT '{}',
        folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL
      );
    `);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    initDb();
  }
  return db!;
}

export function getFolderById(id: number): Folder | undefined {
  const stmt = getDb().prepare('SELECT * FROM folders WHERE id = ?');
  return stmt.get(id) as Folder | undefined;
}

export function getMediaById(id: number): Media | undefined {
  const stmt = getDb().prepare('SELECT * FROM medias WHERE id = ?');
  return stmt.get(id) as Media | undefined;
}

export function getFolderChildren(parentId: number | null): (Folder | Media)[] {
  const folders = getDb().prepare('SELECT * FROM folders WHERE parent_id = ? ORDER BY name')
    .all(parentId) as Folder[];
  const medias = getDb().prepare('SELECT * FROM medias WHERE folder_id = ? ORDER BY name')
    .all(parentId) as Media[];
  return [...folders, ...medias];
}

export function getFolderMedias(folderId: number | null, page: number = 1, perPage: number = 50) {
  const offset = (page - 1) * perPage;
  const items = getDb().prepare(
    'SELECT * FROM folders WHERE folder_id = ? ORDER BY name UNION ALL SELECT * FROM medias WHERE folder_id = ? ORDER BY name LIMIT ? OFFSET ?'
  ).all(folderId, folderId, perPage, offset);

  const countResult = getDb().prepare('SELECT COUNT(*) as count FROM folders WHERE folder_id = ? UNION ALL SELECT COUNT(*) as count FROM medias WHERE folder_id = ?')
    .all(folderId, folderId) as Array<{ count: number }>;

  const total = countResult.reduce((acc, row) => acc + row.count, 0);

  return {
    items,
    total,
    page,
    perPage,
    lastPage: Math.ceil(total / perPage),
  };
}

export function buildBreadcrumb(folderId: number | null): Array<{ id: number; name: string }> {
  const breadcrumb: Array<{ id: number; name: string }> = [];
  let currentId = folderId;

  while (currentId) {
    const folder = getFolderById(currentId);
    if (!folder) break;
    breadcrumb.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parent_id;
  }

  return breadcrumb;
}

export function buildFolderPath(folderId: number | null): string {
  if (!folderId) return '/';

  const breadcrumb = buildBreadcrumb(folderId);
  return '/' + breadcrumb.map(b => b.name).join('/');
}

export function createFolder(name: string, parentId: number | null): Folder {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const stmt = getDb().prepare(
    'INSERT INTO folders (name, slug, parent_id) VALUES (?, ?, ?)'
  );
  const result = stmt.run(name, slug, parentId);

  return {
    id: result.lastInsertRowid as number,
    name,
    slug,
    parent_id: parentId,
  };
}

export function createMedia(name: string, mime: string | null = null, size: number = 0, folderId: number | null = null): Media {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const lastModified = Date.now();
  const stmt = getDb().prepare(
    'INSERT INTO medias (name, slug, mime, size, last_modified, folder_id, metas) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, slug, mime, size, lastModified, folderId, '{}');

  return {
    id: result.lastInsertRowid as number,
    name,
    slug,
    mime,
    size,
    last_modified: lastModified,
    metas: '{}',
    folder_id: folderId,
  };
}

export function deleteMedia(id: number): void {
  getDb().prepare('DELETE FROM medias WHERE id = ?').run(id);
}

export function deleteFolder(id: number): void {
  getDb().prepare('DELETE FROM folders WHERE id = ?').run(id);
}

export function updateMedia(id: number, updates: Partial<Media>): Media {
  const current = getMediaById(id);
  if (!current) throw new Error(`Media ${id} not found`);

  const updated = { ...current, ...updates };
  const stmt = getDb().prepare(`
    UPDATE medias
    SET name = ?, slug = ?, mime = ?, size = ?, last_modified = ?, metas = ?, folder_id = ?
    WHERE id = ?
  `);
  stmt.run(updated.name, updated.slug, updated.mime, updated.size, updated.last_modified, updated.metas, updated.folder_id, id);

  return updated;
}

export function updateFolder(id: number, updates: Partial<Folder>): Folder {
  const current = getFolderById(id);
  if (!current) throw new Error(`Folder ${id} not found`);

  const updated = { ...current, ...updates };
  const stmt = getDb().prepare(`
    UPDATE folders
    SET name = ?, slug = ?, parent_id = ?
    WHERE id = ?
  `);
  stmt.run(updated.name, updated.slug, updated.parent_id, id);

  return updated;
}

export function searchMedias(query: string): Media[] {
  const stmt = getDb().prepare(
    'SELECT * FROM medias WHERE name LIKE ? ORDER BY name LIMIT 100'
  );
  return stmt.all(`%${query}%`) as Media[];
}

export function getDataDir(): string {
  return DATA_DIR;
}

export function getUploadsDir(): string {
  return path.join(DATA_DIR, 'uploads');
}

export function getChunksDir(): string {
  return path.join(DATA_DIR, 'chunks');
}
