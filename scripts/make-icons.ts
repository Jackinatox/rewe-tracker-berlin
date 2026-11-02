// One-off: renders the app icons in public/icons and app/icon.svg. Run: bun scripts/make-icons.ts
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

/** A white shopping cart on red. `pad` shrinks the cart for maskable icons (safe zone). */
const svg = (rounded: boolean, pad = 0) => {
  const s = 1 - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <title>Rewe-Tracker</title>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="#cc071e"/>
  <g transform="translate(${256 - 256 * s} ${256 - 256 * s}) scale(${s})">
    <g fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
      <path d="M92 132h52l44 196h188l36-136H164"/>
    </g>
    <circle cx="208" cy="388" r="26" fill="#fff"/>
    <circle cx="352" cy="388" r="26" fill="#fff"/>
  </g>
</svg>`;
};

mkdirSync("public/icons", { recursive: true });
writeFileSync("app/icon.svg", svg(true));
await sharp(Buffer.from(svg(true)))
  .resize(192)
  .png()
  .toFile("public/icons/icon-192.png");
await sharp(Buffer.from(svg(true)))
  .resize(512)
  .png()
  .toFile("public/icons/icon-512.png");
await sharp(Buffer.from(svg(false, 0.12)))
  .resize(512)
  .png()
  .toFile("public/icons/icon-maskable-512.png");
await sharp(Buffer.from(svg(false)))
  .resize(180)
  .png()
  .toFile("public/icons/apple-touch-icon.png");
console.log("Icons written");
