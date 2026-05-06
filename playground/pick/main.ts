import { EasyMedia, enTranslations } from '@adeliom/easy-media-manager';
import type { MediaItem } from '@adeliom/easy-media-manager';

EasyMedia.configure({
  locale: 'en',
  translations: enTranslations,
  config: {
    baseUrl: '/api',
    generatingAlts: false,
  },
  features: {
    enableEditor: true,
    enableUpload: true,
    enableMove: true,
    enableRename: true,
    enableMetas: true,
    enableDelete: true,
    enableBulkSelection: true,
    enableGeneratingAlts: false,
  },
  routes: {
    files: '/get-files',
    upload: '/upload',
    fileInfos: '/get-file-info',
    uploadCropped: '/upload-cropped',
    uploadLink: '/upload-link',
    newFolder: '/create-new-folder',
    deleteFile: '/delete-file',
    moveFile: '/move-file',
    renameFile: '/rename-file',
    editMetas: '/edit-metas-file',
    generateAlt: '/generate-alt-file',
    generateAltGroup: '/generate-alt-group',
    generateAllAlt: '/generate-all-alt',
    globalSearch: '/global-search',
    folderDownload: '/folder-download',
    filesDownload: '/files-download',
  },
});

// --- Instance 1 : Featured image (all types, bulk selection enabled) ---

const preview1 = document.getElementById('preview-1')!;
const result1 = document.getElementById('result-1')!;

function renderResult1(file: MediaItem | null) {
  if (!file) {
    preview1.textContent = 'No file selected';
    result1.textContent = '';
    result1.classList.remove('visible');
    return;
  }

  if (file.type !== 'folder' && file.type.startsWith('image/')) {
    preview1.innerHTML = `<img src="${file.download_url}" alt="${file.metas?.alt ?? ''}" />`;
  } else if (file.type === 'folder') {
    preview1.textContent = `📁 ${file.name}`;
  } else {
    preview1.textContent = `📄 ${file.name}`;
  }

  result1.textContent = JSON.stringify(file, null, 2);
  result1.classList.add('visible');
}

document.getElementById('pick-any-1')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick();
  renderResult1(file);
});

document.getElementById('pick-image-1')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick({ restrictions: { types: 'images' } });
  renderResult1(file);
});

document.getElementById('pick-image-pdf-1')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick({ restrictions: { types: ['images', 'pdf'] } });
  renderResult1(file);
});

document.getElementById('clear-1')!.addEventListener('click', () => {
  renderResult1(null);
});

// --- Instance 2 : Attached document (restricted to documents & PDFs) ---

const preview2 = document.getElementById('preview-2')!;
const result2 = document.getElementById('result-2')!;

function renderResult2(file: MediaItem | null) {
  if (!file) {
    preview2.textContent = 'No file selected';
    result2.textContent = '';
    result2.classList.remove('visible');
    return;
  }

  if (file.type !== 'folder' && file.type.startsWith('image/')) {
    preview2.innerHTML = `<img src="${file.download_url}" alt="${file.metas?.alt ?? ''}" />`;
  } else if (file.type === 'folder') {
    preview2.textContent = `📁 ${file.name}`;
  } else {
    preview2.textContent = `📄 ${file.name}`;
  }

  result2.textContent = JSON.stringify(file, null, 2);
  result2.classList.add('visible');
}

document.getElementById('pick-docs-2')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick({ restrictions: { types: ['pdf', 'documents'] } });
  renderResult2(file);
});

document.getElementById('pick-images-2')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick({ restrictions: { types: 'images' } });
  renderResult2(file);
});

document.getElementById('pick-any-2')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick();
  renderResult2(file);
});

document.getElementById('clear-2')!.addEventListener('click', () => {
  renderResult2(null);
});
