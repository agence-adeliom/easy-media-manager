# Generate Alt Plugin — API Routes

All routes are `POST`. Request and response bodies are JSON.

Route URLs are configurable via the `routes` object passed to `EasyMedia.init()`:

```typescript
EasyMedia.init({
  routes: {
    generateAlt:      '/api/generate-alt-file',
    generateAltGroup: '/api/generate-alt-group',
    generateAllAlt:   '/api/generate-all-alt',
    // ...other routes
  },
});
```

---

## POST /api/generate-alt-file

Generates alt text for a single file.

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | object | yes | Object with `id` (integer) of the media |
| `path` | string | yes | Storage path of the file |

**Example request:**
```json
{
  "file": { "id": 42 },
  "path": "/api/uploads/photo-slug-42.jpg"
}
```

**Response (200):**
```json
{
  "error": "",
  "alt": "A panoramic view of mountain peaks at sunset"
}
```

**Response (error):**
```json
{
  "error": "Failed to generate alt text",
  "alt": ""
}
```

> The `error` field is an empty string on success. On failure it contains the error message.

---

## POST /api/generate-alt-group

Generates alt text for a selection of files in bulk. The operation is typically asynchronous — the route acknowledges the request and processing happens in the background.

**Body:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | integer[] | yes | Array of media IDs to process |

**Example request:**
```json
{
  "files": [1, 4, 7, 12]
}
```

**Response (200):**
```json
{
  "error": null,
  "data": "Alt generation queued for 4 files"
}
```

**Response (error):**
```json
{
  "error": "Failed to queue alt generation",
  "data": ""
}
```

> The `error` field is `null` on success.

---

## POST /api/generate-all-alt

Triggers alt text generation for every file in the library. No request body required. The operation is typically asynchronous.

**Body:** _(empty)_

**Response (200):**
```json
{
  "error": null,
  "data": "Alt generation queued for all files"
}
```

**Response (error):**
```json
{
  "error": "Failed to queue alt generation",
  "data": ""
}
```

> The `error` field is `null` on success.
