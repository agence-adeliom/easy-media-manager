// IIFE entry for the generate-alt plugin.
// Exposes the plugin as window.GenerateAltPlugin so the host page can register
// it manually: EasyMedia.use(GenerateAltPlugin)
export { generateAltPlugin as default } from './index';
