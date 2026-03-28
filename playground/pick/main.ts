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

const preview = document.getElementById('preview')!;
const result = document.getElementById('result')!;

function renderResult(file: MediaItem | null) {
  if (!file) {
    preview.textContent = 'No file selected';
    result.textContent = '';
    result.classList.remove('visible');
    return;
  }

  if (file.type !== 'folder' && file.type.startsWith('image/')) {
    preview.innerHTML = `<img src="${file.download_url}" alt="${file.metas?.alt ?? ''}" />`;
  } else if (file.type === 'folder') {
    preview.textContent = `📁 ${file.name}`;
  } else {
    preview.textContent = `📄 ${file.name}`;
  }

  result.textContent = JSON.stringify(file, null, 2);
  result.classList.add('visible');
}

document.getElementById('pick-any')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick();
  renderResult(file);
});

document.getElementById('pick-image')!.addEventListener('click', async () => {
  const file = await EasyMedia.pick({
    restrictions: {
      uploadTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    },
  });
  renderResult(file);
});

document.getElementById('clear')!.addEventListener('click', () => {
  renderResult(null);
});
