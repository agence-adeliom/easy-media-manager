import { EasyMedia, frTranslations } from '@adeliom/easy-media-manager';
// Note: when using the published package, add: import '@adeliom/easy-media-manager/style.css'
// In dev mode the CSS is included automatically via the source alias.

import { generateAltPlugin } from '../../examples/plugins/generate-alt/index';

EasyMedia.use(generateAltPlugin);
EasyMedia.configure({
  locale: 'fr',
  translations: frTranslations,
  config: {
    baseUrl: '/api',
    generatingAlts: true,
  },
  features: {
    enableEditor: true,
    enableUpload: true,
    enableMove: true,
    enableRename: true,
    enableMetas: true,
    enableDelete: true,
    enableBulkSelection: true,
    enableGeneratingAlts: true,
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
EasyMedia.mount({ target: '#app' });
