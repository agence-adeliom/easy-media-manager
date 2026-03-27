import fs from 'fs';
import path from 'path';
import { createFolder, createMedia, getDb } from './db';
import { buildStoredMediaPath, storeMediaFromPath } from './storage';

export async function seed() {
  const samplesDir = '/Users/jeandavid/Documents/Samples';

  // Create demo directories
  const photos = createFolder('Photos', null);
  const documents = createFolder('Documents', null);
  const vacations = createFolder('Vacations', photos.id);

  // Create demo files mapped to actual sample files
  const demoFiles = [
    {
      name: 'cliff.jpg',
      sourcePath: path.join(samplesDir, 'cliff.jpg'),
      mime: 'image/jpeg',
      folder: vacations.id,
      metas: { alt: 'Cliff landscape', title: 'Cliff View', dimensions: { width: 1920, height: 1080 } },
    },
    {
      name: 'desert.jpg',
      sourcePath: path.join(samplesDir, 'desert.jpg'),
      mime: 'image/jpeg',
      folder: vacations.id,
      metas: { alt: 'Desert landscape', title: 'Desert Dunes', dimensions: { width: 1920, height: 1080 } },
    },
    {
      name: 'dive.jpg',
      sourcePath: path.join(samplesDir, 'dive.jpg'),
      mime: 'image/jpeg',
      folder: photos.id,
      metas: { alt: 'Diving underwater', title: 'Underwater Dive', dimensions: { width: 1600, height: 900 } },
    },
    {
      name: 'night-sky.jpg',
      sourcePath: path.join(samplesDir, 'night-sky.jpg'),
      mime: 'image/jpeg',
      folder: photos.id,
      metas: { alt: 'Night sky stars', title: 'Starry Night', dimensions: { width: 2560, height: 1600 } },
    },
    {
      name: 'paris.jpg',
      sourcePath: path.join(samplesDir, 'paris.jpg'),
      mime: 'image/jpeg',
      folder: photos.id,
      metas: { alt: 'Paris cityscape', title: 'City of Light', dimensions: { width: 1920, height: 1080 } },
    },
    {
      name: 'sea-500K.jpg',
      sourcePath: path.join(samplesDir, 'sea-500K.jpg'),
      mime: 'image/jpeg',
      folder: vacations.id,
      metas: { alt: 'Sea waves', title: 'Ocean Waves', dimensions: { width: 1600, height: 900 } },
    },
    {
      name: 'sample-pdf-1.pdf',
      sourcePath: path.join(samplesDir, 'sample-pdf-1.pdf'),
      mime: 'application/pdf',
      folder: documents.id,
      metas: { title: 'Sample Report 1' },
    },
    {
      name: 'sample-pdf-2.pdf',
      sourcePath: path.join(samplesDir, 'sample-pdf-2.pdf'),
      mime: 'application/pdf',
      folder: documents.id,
      metas: { title: 'Sample Report 2' },
    },
  ];

  for (const file of demoFiles) {
    try {
      if (!fs.existsSync(file.sourcePath)) {
        console.warn(`Source file not found: ${file.sourcePath}`);
        continue;
      }

      const stats = fs.statSync(file.sourcePath);
      const media = createMedia(file.name, file.mime, stats.size, file.folder);

      const stmt = getDb().prepare('UPDATE medias SET metas = ? WHERE id = ?');
      stmt.run(JSON.stringify(file.metas), media.id);

      const filename = `${media.slug}-${media.id}${path.extname(file.name)}`;
      await storeMediaFromPath(buildStoredMediaPath(filename), file.sourcePath);
      console.log(`✅ Seeded: ${file.name} (${(stats.size / 1024).toFixed(2)}KB)`);
    } catch (error) {
      console.error(`❌ Failed to seed ${file.name}:`, error);
    }
  }
}
