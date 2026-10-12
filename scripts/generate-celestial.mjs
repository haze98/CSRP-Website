/**
 * Original procedural artwork for the CSRP Chandra + Surya identity.
 * No photographs or third-party assets — everything is computed here.
 *
 *   npm run art   → public/art/moon.webp, public/art/sun.webp
 *
 * Moon: seeded crater heightmap + maria noise, lit from the right (toward the
 *       sun) as a crescent, with faint blue earthshine on the dark side.
 * Sun:  turbulent granulation, limb darkening, crimson→white temperature
 *       ramp, a few sunspots and a streaked corona.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/art", { recursive: true });

/* ---------------------------------------------------------------- noise */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNoise(seed) {
  const rnd = mulberry(seed);
  const perm = new Uint16Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const vals = Float32Array.from({ length: 256 }, () => rnd());
  const fade = (t) => t * t * (3 - 2 * t);
  const v = (x, y) => vals[perm[(perm[x & 255] + y) & 511] & 255];
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = fade(xf), w = fade(yf);
    const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct = 5, lac = 2, gain = 0.5) => {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * noise(x * f, y * f);
      norm += amp;
      amp *= gain;
      f *= lac;
    }
    return sum / norm;
  };
  const turb = (x, y, oct = 5) => {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * Math.abs(noise(x * f, y * f) * 2 - 1);
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };
  return { noise, fbm, turb, rnd };
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const toSrgb = (v) => Math.round(clamp(v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);

/* ----------------------------------------------------------------- moon */
async function moon(S = 1024) {
  const { fbm, rnd } = makeNoise(7);
  const R = S * 0.47, cx = S / 2, cy = S / 2;
  const H = new Float32Array(S * S); // crater heightmap

  // Power-law crater population: many small, few large.
  const craters = [];
  for (let i = 0; i < 1600; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.99;
    const rad = 0.003 + Math.pow(rnd(), 4.2) * 0.075;
    // big craters are relatively shallower; rims vary in sharpness
    const depth = rad * (0.18 + rnd() * 0.22) * (rad > 0.03 ? 0.6 : 1);
    craters.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, rad, depth, rim: 0.22 + rnd() * 0.25, rimH: 0.25 + rnd() * 0.35 });
  }
  for (const c of craters) {
    const px = cx + c.x * R, py = cy + c.y * R, pr = c.rad * R * 1.4;
    for (let y = Math.max(0, Math.floor(py - pr)); y < Math.min(S, Math.ceil(py + pr)); y++) {
      for (let x = Math.max(0, Math.floor(px - pr)); x < Math.min(S, Math.ceil(px + pr)); x++) {
        const t = Math.hypot(x - px, y - py) / (c.rad * R);
        let h = 0;
        if (t < 1) h -= (1 - t * t) ** 1.5 * c.depth;
        h += c.depth * c.rimH * Math.exp(-(((t - 1) / c.rim) ** 2));
        H[y * S + x] += h;
      }
    }
  }

  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) H[y * S + x] += (fbm(x / S * 40, y / S * 40, 4) - 0.5) * 0.004;

  const L = (() => {
    const v = [0.9, -0.14, -0.4]; // thick crescent lit from the right (toward the sun) // from the right (toward the sun), slightly above
    const m = Math.hypot(...v);
    return v.map((x) => x / m);
  })();
  const out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R;
      const d2 = dx * dx + dy * dy;
      const i = (y * S + x) * 4;
      if (d2 > 1.004) continue;
      const nz = Math.sqrt(Math.max(0, 1 - d2));
      // perturb sphere normal by heightmap gradient (fades toward the limb)
      const gx = (H[y * S + Math.min(S - 1, x + 1)] - H[y * S + Math.max(0, x - 1)]) * 0.5;
      const gy = (H[Math.min(S - 1, y + 1) * S + x] - H[Math.max(0, y - 1) * S + x]) * 0.5;
      const k = 34 * nz;
      let nx = dx - gx * k, ny = dy - gy * k, nzz = nz;
      const nm = Math.hypot(nx, ny, nzz);
      nx /= nm; ny /= nm; nzz /= nm;
      const ndl = nx * L[0] + ny * L[1] + nzz * L[2];

      // albedo: dark maria + fine regolith detail + bright crater floors
      const maria = smooth(0.46, 0.62, fbm(dx * 1.6 + 3.1, dy * 1.6 - 1.7, 6));
      const detail = fbm(dx * 30, dy * 30, 4) - 0.5;
      let albedo = 0.84 - maria * 0.52 + detail * 0.22;
      albedo = clamp(albedo, 0.2, 1);

      const lit = smooth(-0.02, 0.16, ndl) * Math.max(0, ndl) ** 0.75;
      const earthshine = 0.0045 * (0.5 + 0.5 * nz);
      const limb = 0.82 + 0.18 * nz;
      const I = albedo * limb;
      // cold blue-white light, bluer ambient on the night side
      const r = I * (lit * 0.84 + earthshine * 0.5);
      const g = I * (lit * 0.88 + earthshine * 0.75);
      const b = I * (lit * 0.96 + earthshine * 1.6);
      const edge = clamp((1.004 - d2) / 0.012);
      out[i] = toSrgb(r);
      out[i + 1] = toSrgb(g);
      out[i + 2] = toSrgb(b);
      out[i + 3] = Math.round(edge * 255);
    }
  }
  await sharp(out, { raw: { width: S, height: S, channels: 4 } }).webp({ quality: 88, alphaQuality: 95 }).toFile("public/art/moon.webp");
  console.log("moon ✓");
}

/* ------------------------------------------------------------------ sun */
async function sun(S = 1024) {
  const { fbm, turb, rnd } = makeNoise(21);
  const R = S * 0.34, cx = S / 2, cy = S / 2;
  const ramp = [
    [0.0, [0.12, 0.004, 0.006]],
    [0.3, [0.36, 0.012, 0.012]], // deep crimson
    [0.52, [0.78, 0.07, 0.03]],
    [0.72, [1.0, 0.26, 0.05]], // solar orange
    [0.88, [1.0, 0.55, 0.16]],
    [1.0, [1.0, 0.84, 0.55]], // warm white
  ];
  const color = (t) => {
    t = clamp(t);
    for (let k = 1; k < ramp.length; k++) {
      if (t <= ramp[k][0]) {
        const [t0, c0] = ramp[k - 1], [t1, c1] = ramp[k];
        const f = (t - t0) / (t1 - t0);
        return c0.map((v, j) => v + (c1[j] - v) * f);
      }
    }
    return ramp[ramp.length - 1][1];
  };
  const spots = Array.from({ length: 4 }, () => {
    const a = rnd() * Math.PI * 2, r = 0.2 + rnd() * 0.55;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 0.012 + rnd() * 0.02 };
  });

  const out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R;
      const d = Math.hypot(dx, dy);
      const i = (y * S + x) * 4;
      let rgb = [0, 0, 0], alpha = 0;
      if (d <= 1) {
        const mu = Math.sqrt(1 - d * d);
        // ridged turbulence → bright plasma filaments; fine granulation on top
        const ridge = (1 - turb(dx * 4.2 + 1, dy * 4.2 + 9, 6)) ** 4;
        const ridge2 = (1 - turb(dx * 11 + 7, dy * 11 - 3, 4)) ** 3;
        const gran = 1 - turb(dx * 48 + 5, dy * 48 - 2, 3);
        const cells = fbm(dx * 2.6, dy * 2.6, 4);
        let I = 0.42 + ridge * 0.55 + ridge2 * 0.2 + gran * 0.1 + (cells - 0.5) * 0.28;
        for (const s of spots) {
          const t = Math.hypot(dx - s.x, dy - s.y) / s.s;
          if (t < 2.6) I -= (t < 1 ? 0.5 : 0.16 * (2.6 - t) / 1.6) * mu;
        }
        const ld = 1 - 0.7 * (1 - mu) - 0.25 * (1 - mu) ** 2;
        rgb = color(I * ld * 1.12);
        alpha = clamp((1 - d) / 0.004);
        // chromosphere: thin bright crimson rim
        if (d > 0.985) rgb = rgb.map((v, j) => v + [0.25, 0.03, 0.02][j] * smooth(0.985, 1, d));
      }
      if (d > 0.985) {
        // corona: soft glow + noisy streaks, mostly crimson/orange
        const a = Math.atan2(dy, dx);
        const r = Math.max(0, d - 1);
        const streak = fbm(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + r * 1.5, 5);
        const glow = Math.exp(-r * 7) * 0.85 + Math.exp(-r * 2.6) * 0.32 * smooth(0.4, 0.75, streak);
        const cA = clamp(glow);
        const cRGB = [0.95 * cA, 0.14 * cA + 0.12 * cA * Math.exp(-r * 12), 0.06 * cA];
        if (d > 1) {
          rgb = cRGB.map((v) => v / Math.max(cA, 1e-4));
          alpha = cA;
        } else {
          alpha = Math.max(alpha, cA);
        }
      }
      if (alpha <= 0) continue;
      out[i] = toSrgb(rgb[0]);
      out[i + 1] = toSrgb(rgb[1]);
      out[i + 2] = toSrgb(rgb[2]);
      out[i + 3] = Math.round(clamp(alpha) * 255);
    }
  }
  await sharp(out, { raw: { width: S, height: S, channels: 4 } }).webp({ quality: 86, alphaQuality: 92 }).toFile("public/art/sun.webp");
  console.log("sun ✓");
}

await moon();
await sun();
