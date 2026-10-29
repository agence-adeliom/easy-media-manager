import { EasyMedia, frTranslations } from '@agence-adeliom/easy-media-manager';
// Note: when using the published package, add: import '@agence-adeliom/easy-media-manager/style.css'
// In dev mode the CSS is included automatically via the source alias.

import { generateAltPlugin } from '../../examples/plugins/generate-alt/index';

EasyMedia.use(generateAltPlugin);

// `?theme` shows the `theme` option (and lets the e2e tests check it): an indigo accent scale,
// a serif font and a darker toolbar.
const theme = new URLSearchParams(window.location.search).has('theme')
  ? { accent: '#6366f1', font: 'Georgia, serif', tokens: { toolbar: '#312e81' } }
  : undefined;

EasyMedia.configure({
  locale: 'fr',
  translations: frTranslations,
  config: {
    baseUrl: '/api',
    theme,
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
