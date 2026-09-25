// Rasterizes public/icon.svg into the PNGs the site and the TikTok portal need.
// Run it again whenever icon.svg changes: node scripts/render-icon.mjs
//
//   public/icon-1024.png      -> TikTok developer portal, Basic Info > App icon
//   public/apple-touch-icon.png (180)
//   public/favicon-32.png     -> fallback for browsers without SVG favicons
//
// sharp comes in with Astro, so this adds no dependency.
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const svg = await readFile(new URL("../public/icon.svg", import.meta.url));
const outputs = [
  ["icon-1024.png", 1024],
  ["apple-touch-icon.png", 180],
  ["favicon-32.png", 32],
];

for (const [name, size] of outputs) {
  const out = new URL(`../public/${name}`, import.meta.url);
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(fileURLToPath(out));
  console.log(`${name} ${size}x${size}`);
}
