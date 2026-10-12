"use client";
import { Billboard } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * SURYA → CHANDRA → CSRP
 * A real 3D composition: a shader-driven Sun (slow self-rotation, animated
 * surface, corona), a cratered Moon lit only by the Sun on a slow elliptical
 * orbit (Sun at one focus), and the real CSRP crest orbiting the Moon as a
 * camera-facing billboard. No orbit controls — the camera only drifts a few
 * degrees with the mouse and eases forward as the section scrolls in.
 *
 * Loaded lazily (next/dynamic, ssr:false) by CelestialStage, which also
 * pauses rendering when the section is off-screen or the tab is hidden.
 */

export type SceneSignals = {
  /** 0 → section just entering the viewport, 1 → section centred. */
  progress: MutableRefObject<number>;
  /** Normalised pointer, -1..1 (0,0 when idle / touch). */
  pointer: MutableRefObject<{ x: number; y: number }>;
};

/* Periods in seconds (visual only — deliberately slow). */
const SUN_SPIN = 96;
const MOON_ORBIT = 72;
const MOON_SPIN = 48;
const LOGO_ORBIT = 22;
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ GLSL */
// Ashima / Stefan Gustavson 3D simplex noise (MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.03;a*=0.5;}return f;}
`;

const SUN_VERT = /* glsl */ `
varying vec3 vPos; varying vec3 vNormal; varying vec3 vView;
void main(){
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

// Granulation + slow convective drift in object space (so it turns with the
// sphere), limb darkening and a hot rim. Colours stay below white.
const SUN_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vPos; varying vec3 vNormal; varying vec3 vView;
${NOISE}
void main(){
  vec3 p = normalize(vPos);
  float big = fbm(p * 1.6 + vec3(0.0, uTime * 0.012, uTime * 0.008));
  float cells = fbm(p * 5.5 + vec3(uTime * 0.02, -uTime * 0.015, big));
  float heat = clamp(0.52 + 0.42 * big + 0.28 * cells, 0.0, 1.0);
  vec3 deep = vec3(0.42, 0.03, 0.02);
  vec3 mid  = vec3(0.96, 0.28, 0.05);
  vec3 hot  = vec3(1.0, 0.72, 0.34);
  vec3 col = mix(deep, mid, smoothstep(0.18, 0.62, heat));
  col = mix(col, hot, smoothstep(0.62, 0.98, heat));
  float mu = clamp(dot(vNormal, vView), 0.0, 1.0);
  col *= 0.28 + 0.8 * pow(mu, 0.5);          // limb darkening
  col += vec3(1.0, 0.3, 0.08) * pow(1.0 - mu, 2.6) * 0.55; // hot rim
  gl_FragColor = vec4(col, 1.0);
}`;

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Corona: soft falloff + slowly shifting streamers, additive.
const CORONA_FRAG = /* glsl */ `
uniform float uTime; uniform float uInner; uniform float uStrength;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float d = max(r - uInner, 0.0);
  float streak = 0.5 + 0.5 * snoise(vec3(cos(a) * 2.2, sin(a) * 2.2, d * 3.0 - uTime * 0.05));
  float glow = exp(-d * 9.0) * 0.85 + exp(-d * 3.2) * 0.32;
  glow *= mix(0.7, 1.3, streak);
  glow *= smoothstep(1.0, 0.55, r);
  vec3 col = mix(vec3(1.0, 0.42, 0.16), vec3(0.82, 0.06, 0.14), smoothstep(0.0, 0.4, d));
  vec3 o = col * glow * uStrength;
  gl_FragColor = vec4(o, max(o.r, max(o.g, o.b)));
}`;

// Moon rim: cool fresnel on the silhouette.
const RIM_VERT = /* glsl */ `
varying vec3 vNormal; varying vec3 vView;
void main(){
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const RIM_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uStrength;
varying vec3 vNormal; varying vec3 vView;
void main(){
  float f = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), 3.2);
  vec3 o = uColor * f * uStrength;
  gl_FragColor = vec4(o, max(o.r, max(o.g, o.b)));
}`;

// Crest glow: soft halo drifting between Surya red and Chandra blue.
const HALO_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float g = exp(-r * r * 4.5) * 0.55;
  float t = 0.5 + 0.5 * sin(atan(p.y, p.x) + uTime * 0.35);
  vec3 col = mix(vec3(0.86, 0.08, 0.24), vec3(0.37, 0.52, 1.0), t);
  vec3 o = col * g;
  gl_FragColor = vec4(o, max(o.r, max(o.g, o.b)));
}`;

/**
 * Additive light for glows on a transparent canvas: colour adds (ONE, ONE)
 * and alpha accumulates the glow's own brightness, so empty parts of the
 * plane leave the page behind untouched (plain AdditiveBlending would write
 * alpha = 1 across the whole quad → an opaque black rectangle).
 */
const GLOW = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;

/* ---------------------------------------------------- procedural moon maps */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Equirectangular albedo + bump maps (1024×512): maria, craters with rims, fine regolith noise. */
function makeMoonMaps() {
  const W = 1024, H = 512;
  const color = document.createElement("canvas");
  const bump = document.createElement("canvas");
  color.width = bump.width = W;
  color.height = bump.height = H;
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;
  const rand = rng(1997);

  c.fillStyle = "#8e8d89";
  c.fillRect(0, 0, W, H);
  b.fillStyle = "#808080";
  b.fillRect(0, 0, W, H);

  // draws f at x, and again across the seam when near an edge
  const wrap = (x: number, r: number, f: (x: number) => void) => {
    f(x);
    if (x - r < 0) f(x + W);
    if (x + r > W) f(x - W);
  };
  const blob = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, stops: [number, string][]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();
    ctx.restore();
  };
  const stretch = (y: number) => 1 / Math.max(0.22, Math.cos(((y / H) - 0.5) * Math.PI));

  // maria — large dark basalt plains, mostly mid-latitudes
  for (let i = 0; i < 22; i++) {
    const x = rand() * W, y = H * (0.25 + rand() * 0.5), r = 40 + rand() * 120;
    const k = stretch(y);
    wrap(x, r * k, (xx) => blob(c, xx, y, r * k, r * (0.6 + rand() * 0.4), [[0, "rgba(58,60,64,0.55)"], [0.7, "rgba(66,68,72,0.35)"], [1, "rgba(70,72,76,0)"]]));
  }
  // brightness variation
  for (let i = 0; i < 260; i++) {
    const x = rand() * W, y = rand() * H, r = 6 + rand() * 40, k = stretch(y);
    const v = rand() > 0.5 ? "255,255,250" : "40,40,44";
    wrap(x, r * k, (xx) => blob(c, xx, y, r * k, r, [[0, `rgba(${v},${0.05 + rand() * 0.06})`], [1, `rgba(${v},0)`]]));
  }
  // craters: bowl (dark, low) + raised bright rim; a few with rays
  const crater = (x: number, y: number, r: number) => {
    const k = stretch(y);
    wrap(x, r * k * 1.4, (xx) => {
      blob(c, xx, y, r * k, r, [[0, "rgba(48,48,50,0.55)"], [0.72, "rgba(70,70,72,0.35)"], [0.86, "rgba(214,212,205,0.55)"], [1, "rgba(214,212,205,0)"]]);
      blob(b, xx, y, r * k, r, [[0, "rgba(30,30,30,0.9)"], [0.7, "rgba(80,80,80,0.6)"], [0.86, "rgba(235,235,235,0.9)"], [1, "rgba(128,128,128,0)"]]);
    });
  };
  for (let i = 0; i < 9; i++) crater(rand() * W, H * (0.12 + rand() * 0.76), 18 + rand() * 22);
  for (let i = 0; i < 120; i++) crater(rand() * W, H * (0.06 + rand() * 0.88), 5 + rand() * 11);
  for (let i = 0; i < 1400; i++) crater(rand() * W, H * (0.03 + rand() * 0.94), 1.2 + rand() * 3.5);
  // rayed craters (Tycho-like)
  for (let i = 0; i < 3; i++) {
    const x = rand() * W, y = H * (0.3 + rand() * 0.45);
    for (let j = 0; j < 26; j++) {
      const ang = rand() * TAU, len = 40 + rand() * 120;
      c.strokeStyle = `rgba(230,228,220,${0.04 + rand() * 0.05})`;
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(ang) * len * stretch(y), y + Math.sin(ang) * len);
      c.stroke();
    }
    crater(x, y, 9);
  }
  // regolith grain on the bump map
  const img = b.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 18;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  b.putImageData(img, 0, 0);

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bumpMap = new THREE.CanvasTexture(bump);
  return { map, bumpMap };
}

/* ------------------------------------------------------------ scene parts */
function Sun({ radius }: { radius: number }) {
  const body = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const corona = useMemo(() => ({ uTime: { value: 0 }, uInner: { value: 1 / 2.8 }, uStrength: { value: 0.8 } }), []);
  const haze = useMemo(() => ({ uTime: { value: 0 }, uInner: { value: 1 / 6 }, uStrength: { value: 0.32 } }), []);
  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 20);
    if (body.current) body.current.rotation.y += (TAU / SUN_SPIN) * d;
    uniforms.uTime.value += d;
    corona.uTime.value = haze.uTime.value = uniforms.uTime.value;
  });
  return (
    <group>
      <mesh ref={body} rotation={[0.22, 0, 0.1]}>
        <sphereGeometry args={[radius, 96, 64]} />
        <shaderMaterial vertexShader={SUN_VERT} fragmentShader={SUN_FRAG} uniforms={uniforms} />
      </mesh>
      {/* corona + wide haze: additive billboards (a cheap, controlled bloom) */}
      <Billboard>
        <mesh renderOrder={1}>
          <planeGeometry args={[radius * 5.6, radius * 5.6]} />
          <shaderMaterial vertexShader={PLANE_VERT} fragmentShader={CORONA_FRAG} uniforms={corona} {...GLOW} />
        </mesh>
        <mesh renderOrder={1}>
          <planeGeometry args={[radius * 12, radius * 12]} />
          <shaderMaterial vertexShader={PLANE_VERT} fragmentShader={CORONA_FRAG} uniforms={haze} {...GLOW} />
        </mesh>
      </Billboard>
    </group>
  );
}

function Moon({ radius }: { radius: number }) {
  const body = useRef<THREE.Mesh>(null);
  const maps = useMemo(() => makeMoonMaps(), []);
  useEffect(() => () => {
    maps.map.dispose();
    maps.bumpMap.dispose();
  }, [maps]);
  useFrame((_, dt) => {
    if (body.current) body.current.rotation.y += (TAU / MOON_SPIN) * Math.min(dt, 1 / 20);
  });
  const rim = useMemo(() => ({ uColor: { value: new THREE.Color("#a9c0ff") }, uStrength: { value: 0.55 } }), []);
  return (
    <group>
      <mesh ref={body} rotation={[0.1, 0, 0.12]}>
        <sphereGeometry args={[radius, 96, 64]} />
        <meshStandardMaterial map={maps.map} bumpMap={maps.bumpMap} bumpScale={3.2} roughness={0.96} metalness={0} />
      </mesh>
      <mesh scale={1.012} renderOrder={2}>
        <sphereGeometry args={[radius, 64, 48]} />
        <shaderMaterial vertexShader={RIM_VERT} fragmentShader={RIM_FRAG} uniforms={rim} {...GLOW} />
      </mesh>
    </group>
  );
}

/** The real CSRP crest, always facing the camera, with a soft red/blue halo. */
function Crest({ size }: { size: number }) {
  const tex = useLoader(THREE.TextureLoader, "/brand/csrp-logo-256.webp");
  tex.colorSpace = THREE.SRGBColorSpace;
  const halo = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => (halo.uTime.value += Math.min(dt, 1 / 20)));
  return (
    <Billboard>
      <mesh position={[0, 0, -0.01]} renderOrder={3}>
        <planeGeometry args={[size * 2.6, size * 2.6]} />
        <shaderMaterial vertexShader={PLANE_VERT} fragmentShader={HALO_FRAG} uniforms={halo} {...GLOW} />
      </mesh>
      <mesh renderOrder={4}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

/** A faint closed path; colours blend along the loop (blue → red → blue). */
function useOrbitLine(points: THREE.Vector3[], from: string, to: string, opacity: number) {
  return useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const a = new THREE.Color(from), b = new THREE.Color(to), cols: number[] = [];
    points.forEach((_, i) => {
      const t = 0.5 - 0.5 * Math.cos((i / points.length) * TAU);
      const c = a.clone().lerp(b, t);
      cols.push(c.r, c.g, c.b);
    });
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity, depthWrite: false });
    return new THREE.LineLoop(geo, mat);
  }, [points, from, to, opacity]);
}

/**
 * Kepler's equation (a few Newton steps) → position on the ellipse with the
 * Sun at a focus: the Moon lingers far from the Sun and sweeps quickly past
 * it. `depth` flattens the orbit toward the camera so the Moon never looms
 * over the headline (visual, not to scale).
 */
function keplerPosition(meanAnomaly: number, a: number, e: number, depth: number, out: THREE.Vector3) {
  let E = meanAnomaly;
  for (let i = 0; i < 4; i++) E -= (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
  return out.set(a * (Math.cos(E) - e), 0, a * depth * Math.sin(E));
}

function System({ signals }: { signals: SceneSignals }) {
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(1, size.height);

  // Layout adapts to the section's aspect ratio: the Sun burns right of the
  // headline; the Moon's far point (where it lingers) sits left of it.
  const L = useMemo(() => {
    const halfW = 6.2 * aspect; // visible half-width at the Sun's depth (camera ≈ 18 away, fov 38)
    const sunX = halfW * 0.6;
    const e = 0.45;
    const a = (sunX + halfW * 0.6) / (1 + e); // apoapsis at x ≈ -0.6·halfW
    const small = aspect < 1.4;
    return { sunX, sunR: small ? 1.25 : 1.5, moonR: small ? 0.55 : 0.68, a, e, depth: 0.32, logoR: small ? 1.15 : 1.4, logoSize: small ? 0.5 : 0.6 };
  }, [aspect]);

  const moonPivot = useRef<THREE.Group>(null);
  const logoPivot = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const t = useRef({ moon: Math.PI * 0.82, logo: 0 }); // start near the far (left) side
  const look = useMemo(() => new THREE.Vector3(), []);
  const cam = useRef({ x: 0, y: 0 });

  const moonPath = useMemo(() => Array.from({ length: 220 }, (_, i) => keplerPosition((i / 220) * TAU, L.a, L.e, L.depth, new THREE.Vector3())), [L]);
  const logoPath = useMemo(() => Array.from({ length: 120 }, (_, i) => new THREE.Vector3(Math.cos((i / 120) * TAU) * L.logoR, Math.sin((i / 120) * TAU) * L.logoR, 0)), [L]);
  const moonLine = useOrbitLine(moonPath, "#5f86ff", "#d4163c", 0.2);
  const logoLine = useOrbitLine(logoPath, "#f4f5f7", "#d4163c", 0.13);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20); // after a pause, continue smoothly instead of jumping
    t.current.moon += (TAU / MOON_ORBIT) * dt;
    t.current.logo += (TAU / LOGO_ORBIT) * dt;
    if (moonPivot.current) keplerPosition(t.current.moon, L.a, L.e, L.depth, moonPivot.current.position);
    if (logoPivot.current) logoPivot.current.position.set(Math.cos(t.current.logo) * L.logoR, Math.sin(t.current.logo) * L.logoR, 0);

    // scroll: gentle push-in + reveal; mouse: a few degrees of drift (no orbit controls)
    const p = signals.progress.current;
    const ease = 1 - Math.pow(1 - p, 3);
    const px = signals.pointer.current.x, py = signals.pointer.current.y;
    cam.current.x += (px - cam.current.x) * Math.min(1, dt * 2.2);
    cam.current.y += (py - cam.current.y) * Math.min(1, dt * 2.2);
    const z = 22 - 3.8 * ease;
    camera.position.set(cam.current.x * 1.1, 1.9 + cam.current.y * 0.7, z);
    camera.lookAt(look.set(L.sunX * 0.18, 0, 0));
    if (world.current) world.current.scale.setScalar(0.9 + 0.1 * ease);
  });

  return (
    <group ref={world}>
      <ambientLight intensity={0.11} color="#8ea2ff" />
      {/* the Sun is the light: lit side / shadow side on the Moon */}
      <pointLight position={[L.sunX, 0, -1.5]} intensity={3.6} decay={0} color="#ffd8b8" />
      {/* subtle cool rim from behind-left */}
      <directionalLight position={[-10, 5, -8]} intensity={0.45} color="#9fb6ff" />

      <group position={[L.sunX, 0, -1.5]}>
        <Sun radius={L.sunR} />
        {/* Moon orbit plane: slightly tilted so the ellipse opens toward the camera */}
        <group rotation={[0.08, 0, -0.05]}>
          <primitive object={moonLine} />
          <group ref={moonPivot}>
            <Moon radius={L.moonR} />
            {/* crest orbit faces the camera (tilted 18°), so the crest circles the Moon without covering it */}
            <group rotation={[-0.32, 0.12, 0]}>
              <primitive object={logoLine} />
              <group ref={logoPivot}>
                <Crest size={L.logoSize} />
              </group>
            </group>
          </group>
        </group>
      </group>
      <Stars count={420} />
    </group>
  );
}

function Stars({ count }: { count: number }) {
  const pts = useMemo(() => {
    const r = rng(7);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * 90;
      pos[i * 3 + 1] = (r() - 0.5) * 50;
      pos[i * 3 + 2] = -30 - r() * 30;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  return (
    <points geometry={pts}>
      <pointsMaterial size={1.4} sizeAttenuation={false} color="#dfe7ff" transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

export default function CelestialScene({ signals, active, onReady }: { signals: SceneSignals; active: boolean; onReady: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ position: [0, 1.9, 21], fov: 38, near: 0.1, far: 200 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        requestAnimationFrame(onReady);
      }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <System signals={signals} />
      </Suspense>
    </Canvas>
  );
}
