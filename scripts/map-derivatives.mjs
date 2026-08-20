import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const SOURCE = resolve("src/assets/map.webp");
const OUT_DIR = resolve("public/assets");
const QUALITY = Number(process.env.MAP_QUALITY ?? 78);
const widths = process.argv.slice(2).map(Number).filter(Boolean);
const targets = widths.length ? widths : [3000];

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

await mkdir(OUT_DIR, { recursive: true });

const source = await stat(SOURCE);
const meta = await sharp(SOURCE).metadata();
console.log(`source ${SOURCE}`);
console.log(`  ${meta.width}x${meta.height}  ${mb(source.size)}  ${meta.format}\n`);

for (const width of targets) {
  const out = resolve(OUT_DIR, `map-${width}.webp`);
  const info = await sharp(SOURCE)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out);
  const saved = await stat(out);
  console.log(`map-${width}.webp  ${info.width}x${info.height}  ${mb(saved.size)}  q${QUALITY}`);
  console.log(`  decode ram ~${mb(info.width * info.height * 4)}`);
}
