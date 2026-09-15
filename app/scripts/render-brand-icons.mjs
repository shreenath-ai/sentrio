import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

// Render the original Stitch SVG unchanged at launcher resolutions.
const svg = await readFile(new URL('../public/sentrio-brand.svg', import.meta.url));
for (const size of [192, 512]) {
  await sharp(svg, { density: 192 }).resize(size, size).png()
    .toFile(new URL(`../public/sentrio-icon-${size}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
}
// Preserve the entire artwork inside the circular mask-safe area.
const mark = await sharp(svg, { density: 192 }).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#2C3726' } })
  .composite([{ input: mark, gravity: 'centre' }]).png()
  .toFile(new URL('../public/sentrio-icon-maskable-512.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
