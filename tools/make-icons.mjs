/**
 * Generates all app icon/splash assets from tools/icon-master.png
 * (run from tools/: `npm run icons`)
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER = path.join(__dirname, 'icon-master.png');
const OUT = path.resolve(__dirname, '../mobile/assets');

async function main() {
  const meta = await sharp(MASTER).metadata();
  console.log('master image:', meta.width, 'x', meta.height, meta.format);

  // App icon (full-bleed square).
  await sharp(MASTER)
    .resize(1024, 1024, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(OUT, 'icon.png'));

  // Pre-rendered logo (transparent background) reused by adaptive + splash.
  const logoSize = 660; // ~66% safe zone for adaptive icons
  const logo = await sharp(MASTER)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const placeOnTransparent = async (size, logoTargetSize, file) => {
    const scaled = await sharp(logo)
      .resize(logoTargetSize, logoTargetSize, { fit: 'contain' })
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: scaled, blend: 'over' }])
      .png()
      .toFile(path.join(OUT, file));
  };

  await placeOnTransparent(1024, 660, 'android-icon-foreground.png');

  // Monochrome (Android 13 themed icons): white silhouette of the logo.
  const white = await sharp({
    create: { width: logoSize, height: logoSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: logo, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } },
  })
    .composite([{ input: white, blend: 'over' }])
    .png()
    .toFile(path.join(OUT, 'android-icon-monochrome.png'));

  await placeOnTransparent(1024, 560, 'splash-icon.png');

  await sharp(MASTER).resize(48, 48, { fit: 'cover' }).png().toFile(path.join(OUT, 'favicon.png'));

  for (const f of [
    'icon.png',
    'android-icon-foreground.png',
    'android-icon-monochrome.png',
    'splash-icon.png',
    'favicon.png',
  ]) {
    const m = await sharp(path.join(OUT, f)).metadata();
    console.log(`  ${f}: ${m.width}x${m.height} ${m.format} (alpha: ${m.hasAlpha})`);
  }
  console.log('Icons generated ✔');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
