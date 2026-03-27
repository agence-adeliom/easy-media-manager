// Playground IIFE entry — bundles the library + example plugins together.
// Do NOT use this as the distribution build entry (use src/index.ts instead).
import { generateAltPlugin } from '../../examples/plugins/generate-alt/index';

export * from '../../src/index';

(window as Window & { GenerateAltPlugin: typeof generateAltPlugin }).GenerateAltPlugin = generateAltPlugin;
