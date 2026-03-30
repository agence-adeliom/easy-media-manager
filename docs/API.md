# API Routes Documentation

Fetch routes use `GET` with query parameters. Mutation routes use `POST` with JSON bodies, except file uploads (multipart/form-data).

---

## GET /api/get-files

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `folder` | integer | no | Folder ID to list (null = root) |
| `search` | string | no | Filter by name |
| `page` | integer | no | Page number (default: 1) |

**Response:**
```json
{
  "files": {
    "path": "/folder/path",
    "breadcrumb": [
      { "id": null, "name": "root", "path": "/" },
      { "id": 1, "name": "images", "path": "/images" }
    ],
    "items": {
      "current_page": 1,
      "data": [
        {
          "id": 1,
          "name": "images",
          "type": "folder",
          "path": "/images",
          "storage_path": "folders/1"
        },
        {
          "id": 2,
          "name": "photo.jpg",
          "type": "image",
          "size": 102400,
          "path": "/api/uploads/photo-slug-2.jpg",
          "download_url": "/api/uploads/photo-slug-2.jpg",
          "storage_path": "uploads/photo-slug-2.jpg",
          "last_modified": 1700000000,
          "last_modified_formated": "14/11/2023",
          "metas": { "alt": "", "title": "" }
        }
      ],
      "total": 42,
      "per_page": 50,
      "last_page": 1,
      "next_page_url": null,
      "prev_page_url": null
    }
  }
}
```

**Possible file types:** `image`, `video`, `audio`, `pdf`, `compressed`, `text`, `application`, `application/json+oembed`, `file`, `folder`

oEmbed items carry a rich `metas` object:
```json
{
  "id": 42,
  "name": "My YouTube Video",
  "type": "application/json+oembed",
  "size": 0,
  "path": "/api/uploads/my-youtube-video-42",
  "metas": {
    "url": "https://www.youtube.com/watch?v=...",
    "title": "My YouTube Video",
    "alt": "My YouTube Video",
    "image": "https://i.ytimg.com/vi/.../hqdefault.jpg",
    "code": {
      "html": "<iframe ...></iframe>",
      "ratio": 56.25
    },
    "provider": { "name": "YouTube", "url": "https://www.youtube.com/" },
    "author": { "name": "Channel Name", "url": "https://www.youtube.com/@..." },
    "type": "video"
  }
}
```

---

## POST /api/upload

**Content-Type:** `multipart/form-data`

**Form fields:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `file` / `files` | file(s) | yes | File(s) to upload (max 50) |
| `folder` / `upload_folder` | integer | no | Target folder ID |
| `dzuuid` | string | no | Upload session UUID (chunked upload) |
| `dzchunkindex` | integer | no | Current chunk index (0-based) |
| `dztotalchunkcount` | integer | no | Total number of chunks |
| `dztotalfilesize` | integer | no | Total file size in bytes |

The `dz*` parameters are used for chunked uploads (Dropzone.js). Chunks are assembled automatically when the last chunk is received.

**Response:**
```json
[
  { "success": true, "file_name": "document.pdf" },
  { "success": false, "message": "Failed to save file" }
]
```

---

## POST /api/upload-cropped

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | string | yes | Base64-encoded image (`data:image/png;base64,...`) |
| `name` | string | yes | File name |
| `mime_type` | string | no | MIME type (default: `image/png`) |
| `folder` | integer | no | Target folder ID |

**Response (200):**
```json
{ "success": true, "message": "Image uploaded successfully" }
```

**Response (error):**
```json
{ "success": false, "message": "Missing data or name" }
{ "success": false, "message": "Invalid base64 data" }
{ "success": false, "message": "Upload failed" }
```

---

## POST /api/upload-link

Imports a remote URL. The endpoint automatically detects oEmbed-capable URLs (YouTube, Vimeo, SoundCloud, Dailymotion, Flickr, TED, Twitter/X) and stores them as `application/json+oembed` items with full metadata (title, thumbnail, embed code, provider, author). For all other URLs the raw file is downloaded and stored normally.

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | yes | Remote URL to import |
| `folder` | integer | no | Target folder ID |
| `random_names` | boolean | no | Generate a random filename (only applies to non-oEmbed downloads) |

**Response (200) — oEmbed:**
```json
{ "success": true, "message": "oEmbed imported successfully" }
```

**Response (200) — regular file:**
```json
{ "success": true, "message": "File uploaded successfully" }
```

**Response (error):**
```json
{ "success": false, "message": "Missing URL" }
{ "success": false, "message": "Failed to fetch URL" }
{ "success": false, "message": "Upload failed" }
```

---

## POST /api/create-new-folder

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `new_folder_name` | string | yes | Name of the new folder |
| `folder` | integer | no | Parent folder ID (null = root) |

**Response (200):**
```json
{ "message": "Folder created", "new_folder_name": "my-folder" }
```

**Response (500):**
```json
{ "error": "Failed to create folder" }
```

---

## POST /api/delete-file

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `deleted_files` | array | yes | List of files/folders to delete |

Each item in `deleted_files`:
```json
{
  "id": 1,
  "type": "file",
  "name": "photo.jpg",
  "storage_path": "uploads/photo-slug-1.jpg"
}
```
`type` can be `"file"` or `"folder"`.

**Response:**
```json
[
  { "id": 1, "name": "photo.jpg", "type": "file", "path": "uploads/...", "success": true },
  { "id": 2, "name": "my-folder", "type": "folder", "path": "folders/...", "success": false, "message": "Failed to delete" }
]
```

---

## POST /api/move-file

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `destination` | integer | yes | Target folder ID |
| `moved_files` | array | yes | List of files/folders to move |

Each item in `moved_files`:
```json
{
  "id": 1,
  "type": "file",
  "name": "photo.jpg",
  "storage_path": "uploads/photo-slug-1.jpg"
}
```

**Response:**
```json
[
  { "id": 1, "name": "photo.jpg", "type": "file", "old_path": "uploads/...", "new_path": "new/uploads/...", "success": true },
  { "id": 2, "name": "my-folder", "type": "folder", "success": false, "message": "Failed to move" }
]
```

---

## POST /api/rename-file

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | yes | Object with `id` (integer) of the media |
| `new_filename` | string | yes | New file name |

**Response (200):**
```json
{ "message": "File renamed", "new_filename": "new-name.jpg" }
```

**Response (404):**
```json
{ "error": "File not found" }
```

---

## POST /api/edit-metas-file

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | yes | Object with `id` (integer) of the media |
| `new_metas` | object | yes | Metadata to merge with existing metadata |

New metadata is **shallow-merged** with existing metadata.

**Response (200):**
```json
{
  "message": "Metadata updated",
  "metas": {
    "alt": "Image description",
    "title": "Image title",
    "custom_field": "value"
  }
}
```

**Response (404):**
```json
{ "error": "File not found" }
```

---

## GET /api/global-search

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search term (min. 2 characters) |

**Response:**
```json
[
  {
    "name": "photo.jpg",
    "type": "image",
    "path": "/api/uploads/photo-slug-2.jpg",
    "dir_path": "/images",
    "storage_path": "uploads/photo-slug-2.jpg",
    "size": 102400,
    "last_modified": 1700000000,
    "last_modified_formated": "14/11/2023"
  }
]
```

Returns an empty array if `q` is less than 2 characters.

---

## POST /api/folder-download

Downloads an entire folder as a ZIP archive.

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `folder` | integer | yes | Folder ID to download |

**Response:** Binary ZIP stream
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="folder.zip"`

---

## POST /api/files-download

Downloads a selection of files as a ZIP archive.

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | array | yes | List of file IDs to download |

**Response:** Binary ZIP stream
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="files.zip"`

---

## GET /api/uploads/:filename

Serves an uploaded file. Supports partial requests (video streaming).

**Path param:**
| Param | Type | Description |
|-------|------|-------------|
| `:filename` | string | File name (e.g. `photo-slug-2.jpg`) |

**Optional headers:**
| Header | Description |
|--------|-------------|
| `Range` | Byte range (e.g. `bytes=0-1023`) |

**Response:**
- `200 OK` — full file
- `206 Partial Content` — partial content (with `Range` header)
- `404 Not Found` — file not found
