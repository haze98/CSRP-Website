// Builds web assets from the official CSRP crest (Logo/CSRP_1.7.webp).
// Run: node scripts/export-logo.mjs
import sharp from "sharp";
const src = "Logo/CSRP_1.7.webp";
const meta = await sharp(src).metadata();
console.log("source", meta.width, meta.height, meta.hasAlpha);
const trimmed = await sharp(src).trim().toBuffer();
await sharp(trimmed).resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90 }).toFile("public/brand/csrp-logo.webp");
await sharp(trimmed).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88 }).toFile("public/brand/csrp-logo-256.webp");
await sharp(trimmed).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile("public/brand/csrp-logo-512.png");
const icon = (s) => sharp(trimmed).resize(Math.round(s * 0.92), Math.round(s * 0.92), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).extend({ top: Math.round(s * 0.04), bottom: s - Math.round(s * 0.92) - Math.round(s * 0.04), left: Math.round(s * 0.04), right: s - Math.round(s * 0.92) - Math.round(s * 0.04), background: { r: 3, g: 3, b: 4, alpha: 1 } }).flatten({ background: "#030304" }).png();
await icon(192).toFile("src/app/icon.png");
await icon(180).toFile("src/app/apple-icon.png");
console.log("done");
