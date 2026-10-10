// Gera versões WebP responsivas das fotos em assets/img/src.
// Uso: npm run images
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "assets/img/src";
const OUT = "assets/img";
const WIDTHS = [640, 1280];

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));

for (const file of files) {
  const name = path.parse(file).name;
  const image = sharp(path.join(SRC, file)).rotate();
  const { width } = await image.metadata();

  for (const w of WIDTHS) {
    if (w > width && w !== WIDTHS[0]) continue; // não amplia fotos pequenas
    await image
      .clone()
      .resize({ width: Math.min(w, width), withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  console.log(`✔ ${name}`);
}
