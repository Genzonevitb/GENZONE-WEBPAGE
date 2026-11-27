// keep in sync with root src/components/panel3d/PanelLanyardScene.ts
// ─── PanelLanyardScene.ts ─────────────────────────────────────────────────────
// ONE shared WebGL canvas for the entire Meet the Panel section.
// N cards, each with its own physics sim (local coords: anchor at origin).
// Slot world X = (slotIndex - visibleStart) * cardSpacing; camera looks at x=0.
// Adapted from IDCard.jsx (uploaded reference). Keep in sync with backend/src/components/panel3d.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { CardConfig, SocialPlatform } from './cardDefaults';
import {
  MemberData,
  drawFront,
  drawBack,
  loadImg,
  getBackSocialHitBoxes,
  getFrontSocialHitBoxes,
  normalizeSocialLink,
} from './cardTexture';

// ─── Constants (from IDCard.jsx) ─────────────────────────────────────────────
const CARD_SIZES = { portrait: [1.6, 2.25] as const, landscape: [2.25, 1.6] as const };
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FLIP_SPIN = 9;

const FINISHES = {
  glossy:      { roughness: 0.42, metalness: 0,    clearcoat: 1,   clearcoatRoughness: 0.06, foil: 0, anisotropy: 0 },
  matte:       { roughness: 0.85, metalness: 0,    clearcoat: 0,   clearcoatRoughness: 0.6,  foil: 0, anisotropy: 0 },
  holographic: { roughness: 0.3,  metalness: 0,    clearcoat: 1,   clearcoatRoughness: 0.04, foil: 1, anisotropy: 0 },
  metallic:    { roughness: 0.36, metalness: 0.75, clearcoat: 0.5, clearcoatRoughness: 0.18, foil: 0, anisotropy: 0.7 },
};

const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND    = [-0.95, -0.28, 0.28, 0.95];

const METALS = {
  silver:   { color: '#d9dce2', roughness: 0.16 },
  gold:     { color: '#e4b965', roughness: 0.2 },
  graphite: { color: '#4d4f55', roughness: 0.28 },
};

// ─── FOIL shader strings (verbatim from IDCard.jsx) ──────────────────────────
const FOIL_VERTEX_HEAD = `
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;
`;
const FOIL_VERTEX_BODY = `
vFoilUv = uv;
vFoilX = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
vFoilY = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
`;
const FOIL_FRAGMENT_HEAD = `
uniform float foilStrength;
uniform float foilAspect;
uniform vec3 foilKey;
uniform vec3 foilFill;
uniform vec3 foilTop;
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;

float foilHash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float foilBump(float t, float center, float width) {
  float x = (t - center) / width;
  return max(0.0, 1.0 - x * x);
}
vec3 foilSpectrum(float t) {
  return vec3(
    foilBump(t, 0.82, 0.32) + 0.4 * foilBump(t, 0.02, 0.12),
    foilBump(t, 0.5, 0.26),
    foilBump(t, 0.18, 0.24)
  );
}
vec3 foilGrating(float u, float spacing) {
  vec3 color = vec3(0.0);
  for (int m = 1; m <= 2; m++) {
    float order = float(m);
    float t = (spacing * abs(u) / order - 0.38) / 0.32;
    color += foilSpectrum(t) / order;
  }
  return color;
}
vec3 foilShard(vec2 p) {
  vec2 base = floor(p);
  float best = 9.0; float edge = 9.0;
  vec2 id = base;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      vec2 site = cell + vec2(foilHash(cell), foilHash(cell + 7.31)) * 0.9 + 0.05;
      float d = length(site - p);
      if (d < best) { edge = best; best = d; id = cell; } else if (d < edge) { edge = d; }
    }
  }
  return vec3(foilHash(id + 3.17), foilHash(id + 11.73), edge - best);
}
`;
const FOIL_FRAGMENT_BODY = `
if (foilStrength > 0.0) {
  vec3 foilView = normalize(vViewPosition);
  vec3 foilNormal = normalize(normal);
  vec2 foilP = vec2(vFoilUv.x, vFoilUv.y * foilAspect);
  vec3 shard = foilShard(foilP * 26.0);
  vec2 ray = foilP - vec2(-1.6, 2.6 * foilAspect);
  float angle = atan(ray.y, ray.x) + (shard.x - 0.5) * 0.16;
  vec3 grating = normalize(vFoilX * cos(angle) + vFoilY * sin(angle));
  float spacing = 1.7 * (0.95 + shard.y * 0.1);
  vec3 rainbow = foilGrating(dot(foilKey + foilView, grating), spacing);
  rainbow += 0.6 * foilGrating(dot(foilTop + foilView, grating), spacing);
  rainbow *= 0.8 + 0.2 * smoothstep(0.0, 0.04, shard.z);
  rainbow = max(rainbow - 0.35 * min(rainbow.r, min(rainbow.g, rainbow.b)), 0.0);
  vec2 grid = foilP * 64.0;
  vec2 cell = floor(grid);
  vec2 jitter = vec2(foilHash(cell + 1.7), foilHash(cell + 9.2));
  float flake = smoothstep(0.32, 0.06, length(fract(grid) - jitter * 0.6 - 0.2)) * step(0.45, foilHash(cell + 4.4));
  vec3 facet = normalize(foilNormal + (vFoilX * (jitter.x - 0.5) + vFoilY * (jitter.y - 0.5)) * 0.8);
  float glint = pow(max(dot(reflect(-foilKey, facet), foilView), 0.0), 28.0);
  glint += 0.7 * pow(max(dot(reflect(-foilTop, facet), foilView), 0.0), 28.0);
  float fine = 1.0 - smoothstep(0.35, 0.9, max(fwidth(grid.x), fwidth(grid.y)));
  vec3 sparkle = flake * glint * fine * (vec3(0.7) + foilGrating(dot(foilKey + foilView, grating) + jitter.x * 0.4, spacing));
  float ink = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float foil = foilStrength * (0.08 + 0.92 * smoothstep(0.04, 0.7, ink));
  float facing = clamp(dot(foilNormal, foilView), 0.0, 1.0);
  float tint = clamp(dot(rainbow, vec3(0.4)), 0.0, 1.0);
  outgoingLight = outgoingLight * (1.0 - foil * (0.3 + 0.32 * tint)) + (rainbow * 0.62 * (0.4 + 0.6 * facing) + sparkle * 1.6) * foil;
}
`;

// ─── Types ───────────────────────────────────────────────────────────────────
interface SimBody {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  previousQuaternion: THREE.Quaternion;
  angular: THREE.Vector3;
  mass: number;
  inverseInertia: THREE.Vector3;
  hang: THREE.Vector3;
}
interface Sim {
  nodes: THREE.Vector3[];
  previous: THREE.Vector3[];
  velocities: THREE.Vector3[];
  lengths: Float64Array;
  impulses: Float64Array;
  rest: number;
  anchor: THREE.Vector3;
  body: SimBody;
  grab: GrabState | null;
  turn: number;
  twist: number;
  twistRaw: number;
  calm: number;
}
interface GrabState {
  local: THREE.Vector3;
  rotation: THREE.Quaternion;
  reach: number;
  from: THREE.Vector3;
  target: THREE.Vector3;
}
interface PhysicsParams {
  gravity: number; hold: number; stiffness: number; spring: number;
  bandDamping: number; linearDrag: number; angularDrag: number;
  air: number; broadside: number; spinAir: number; nodeDrag: number;
  nodeAir: number; twist: number; twistDamping: number;
  grip: number; gripDamping: number; breeze: number;
}

export interface CardSlot {
  member: MemberData;
  slotIndex: number;
  sim: Sim;
  group: THREE.Group;
  bandMesh: THREE.Mesh;
  clampGroup: THREE.Group;
  clampMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  frontMesh: THREE.Mesh;
  backMesh: THREE.Mesh;
  ring: THREE.Mesh;
  frontCanvas: HTMLCanvasElement;
  backCanvas: HTMLCanvasElement;
  strapCanvas: HTMLCanvasElement;
  frontTexture: THREE.CanvasTexture;
  backTexture: THREE.CanvasTexture;
  strapTexture: THREE.CanvasTexture;
  frontMaterial: THREE.MeshPhysicalMaterial;
  backMaterial: THREE.MeshPhysicalMaterial;
  edgeMaterial: THREE.MeshPhysicalMaterial;
  bandMaterial: THREE.MeshStandardMaterial;
  metalMaterial: THREE.MeshStandardMaterial;
  foilUniforms: Record<string, THREE.IUniform>;
  active: boolean;
  press: { x: number; y: number; time: number; point: THREE.Vector3; hitObject?: THREE.Object3D; uv?: THREE.Vector2 | null } | null;
  flipped: boolean;
  placed: boolean;
  logoImg?: HTMLImageElement | null;
  photoImg?: HTMLImageElement | null;
  hoveredButton?: { face: 'front' | 'back'; platform: SocialPlatform } | null;
}

// ─── Band work state (per slot) ───────────────────────────────────────────────
interface BandWork {
  controls: THREE.Vector3[];
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  sides: THREE.Vector3[];
  bends: [number, number][];
  // FIX: separate axis vector — never aliased to other work vecs
  axis: THREE.Vector3;
  mouth: THREE.Vector3;
  tuck: THREE.Vector3;
  work: {
    tangent: THREE.Vector3;
    toCamera: THREE.Vector3;
    across: THREE.Vector3;
    facing: THREE.Vector3;
    end: THREE.Vector3;
  };
  strapScale: number;
  tileRatio: number;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────
const clampVal = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mixVal   = (a: number, b: number, t: number)   => a + (b - a) * t;

function seeded(start: number): () => number {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function traceRoundedRect(path: THREE.Path | THREE.Shape, x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.bezierCurveTo(x + w - k, y, x + w, y + k, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.bezierCurveTo(x + w, y + h - k, x + w - k, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.bezierCurveTo(x + k, y + h, x, y + h - k, x, y + h - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
}

function cardLayout(orientation: string, cornerRadius: number) {
  const [width, height] = CARD_SIZES[orientation as 'portrait' | 'landscape'] ?? CARD_SIZES.portrait;
  const radius = mixVal(0.03, Math.min(width, height) * 0.2, clampVal(cornerRadius, 0, 1));
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
}

function buildCardGeometry(layout: ReturnType<typeof cardLayout>) {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(outline, -width / 2 + BEVEL, -height / 2 + BEVEL, width - BEVEL * 2, height - BEVEL * 2, Math.max(radius - BEVEL, 0.005));
  const hole = new THREE.Path();
  traceRoundedRect(hole, -slot.width / 2 - BEVEL, slot.y - slot.height / 2 - BEVEL, slot.width + BEVEL * 2, slot.height + BEVEL * 2, slot.height / 2 + BEVEL);
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS, bevelEnabled: true,
    bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 5, curveSegments: 24
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute('position') as THREE.BufferAttribute;
  const uv = face.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
}

function buildBandGeometry(count: number): THREE.BufferGeometry {
  const cols = BAND_COLUMNS.length;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * cols * 3), 3));
  geo.setAttribute('normal',   new THREE.BufferAttribute(new Float32Array(count * cols * 3), 3));
  geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(count * cols * 2), 2));
  const idx: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = i * cols + c;
      idx.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1);
    }
  }
  geo.setIndex(idx);
  return geo;
}

function buildClampGeometry(w: number): THREE.ExtrudeGeometry {
  const cw = w * 1.16;
  const shape = new THREE.Shape();
  traceRoundedRect(shape, -cw / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, cw - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02, bevelEnabled: true,
    bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 6, curveSegments: 10
  });
  geo.translate(0, 0, -0.01);
  return geo;
}

function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geo = new THREE.PlaneGeometry(1, 1);
  const mats: THREE.Material[] = [];
  const panel = (intensity: number, pos: [number, number, number], scale: [number, number], rotZ = 0) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide
    });
    mats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotZ);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8],  [9, 4]);
  panel(6,   [-5.5, 0.5, 7], [0.9, 14]);
  panel(4,   [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9],   [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9],  [24, 0.2],  Math.PI / 3);
  panel(1.4, [0, 6, -6],   [12, 4]);
  panel(0.5, [0, -7, 1],   [16, 6]);
  panel(0.9, [8, 0, -2],   [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose(); geo.dispose();
  mats.forEach(m => m.dispose());
  return target;
}

function buildGrainTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const h2d = (x: number, y: number) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++)
        sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
    return (sum / 9) * 1.6;
  };
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = h2d((x - 1 + size) % size, y) - h2d((x + 1) % size, y);
      const ny = h2d(x, (y - 1 + size) % size) - h2d(x, (y + 1) % size);
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      img.data[i]   = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i+1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i+2] = ((1  / len) * 0.5 + 0.5) * 255;
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 7);
  return tex;
}

function buildWeaveTexture(): THREE.DataTexture {
  const size = 128, threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = (f: number) => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const h2d = (x: number, y: number) => {
    const px = ((x % size) + size) % size, py = ((y % size) + size) % size;
    const u = (px / size) * threads, v = (py / size) * threads;
    const cu = Math.floor(u), cv = Math.floor(v);
    const fu = u - cu - 0.5, fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (h2d(x - 1, y) - h2d(x + 1, y)) * 1.6;
      const ny = (h2d(x, y - 1) - h2d(x, y + 1)) * 1.6;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i]   = ((nx / len) * 0.5 + 0.5) * 255;
      data[i+1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i+2] = ((1  / len) * 0.5 + 0.5) * 255;
      data[i+3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// ─── Simulation helpers ───────────────────────────────────────────────────────
function createSimulation(): Sim {
  const vecs = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    nodes: vecs(), previous: vecs(), velocities: vecs(),
    lengths: new Float64Array(JOINTS), impulses: new Float64Array(JOINTS),
    rest: 1, anchor: new THREE.Vector3(),
    body: {
      position: new THREE.Vector3(), previous: new THREE.Vector3(), velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(), previousQuaternion: new THREE.Quaternion(),
      angular: new THREE.Vector3(), mass: 1, inverseInertia: new THREE.Vector3(1, 1, 1),
      hang: new THREE.Vector3(),
    },
    grab: null, turn: 0, twist: 0, twistRaw: 0, calm: 0,
  };
}

// Module-level scratch vectors (never aliased across call frames)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(),
      _d = new THREE.Vector3(), _e = new THREE.Vector3(), _f = new THREE.Vector3(),
      _g = new THREE.Vector3(), _pin = new THREE.Vector3(),
      _q = new THREE.Quaternion(), _r = new THREE.Quaternion();

function applyInverseInertia(body: SimBody, vector: THREE.Vector3, out: THREE.Vector3) {
  _r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(_r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
}
function rotateBody(q: THREE.Quaternion, w: THREE.Vector3) {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
}
function bodyWeight(body: SimBody, r: THREE.Vector3, normal: THREE.Vector3) {
  const rn = _c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, _d));
}
function pushBody(body: SimBody, r: THREE.Vector3, impulse: THREE.Vector3) {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, _e.crossVectors(r, impulse), _f));
}
function solveSegment(sim: Sim, i: number, h: number, physics: PhysicsParams) {
  const { nodes, body } = sim;
  const a = nodes[i], wa = i === 0 ? 0 : NODE_WEIGHT, last = i === JOINTS - 1;
  const r = _g;
  let b = nodes[i + 1];
  if (last) { r.copy(body.hang).applyQuaternion(body.quaternion); b = _b.copy(body.position).add(r); }
  const delta = _a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch + physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
}
function solvePin(body: SimBody, grab: GrabState, target: THREE.Vector3) {
  const r = _g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = _a.copy(target).sub(body.position).sub(r);
  const dist = delta.length();
  if (dist < 1e-9) return;
  const normal = delta.divideScalar(dist);
  pushBody(body, r, normal.multiplyScalar(dist / bodyWeight(body, r, normal)));
}
function placeHanging(sim: Sim, layout: ReturnType<typeof cardLayout>, intro: boolean) {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) {
      nodes[i].x += sim.rest * 0.5;
      nodes[i].y -= sim.rest * 0.866;
    } else {
      nodes[i].y -= sim.rest;
      nodes[i].z += Math.sin((i / JOINTS) * Math.PI) * 0.04;
    }
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.3);
  body.hang.set(0, layout.hangY, 0);
  const offset = _a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0.35, 0.2); // gentle natural settling sway
  for (let i = 0; i <= JOINTS; i++) { previous[i].copy(nodes[i]); velocities[i].set(0, 0, 0); }
  sim.lengths.fill(sim.rest);
  sim.turn = sim.twist = sim.twistRaw = sim.calm = 0;
}
function configureSimulation(sim: Sim, layout: ReturnType<typeof cardLayout>, strapWorldLen: number) {
  sim.rest = strapWorldLen / JOINTS;
  const { width, height } = layout;
  const body = sim.body, t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(
    12 / (height * height + t * t),
    12 / (width * width + t * t),
    12 / (width * width + height * height)
  );
  body.hang.set(0, layout.hangY, 0);
}
function stepSimulation(sim: Sim, dt: number, physics: PhysicsParams, time: number) {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const nodeDrag    = Math.exp(-physics.nodeDrag * h);
  const linearDrag  = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= physics.gravity * h; v.x += windX * h; v.z += windZ * h;
      previous[i].copy(nodes[i]); nodes[i].addScaledVector(v, h);
    }
    body.previous.copy(body.position); body.previousQuaternion.copy(body.quaternion);
    if (grab) {
      const turn = _q.copy(grab.rotation).multiply(_r.copy(body.quaternion).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = _a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, _b), h);
    }
    const up = _a.set(0, 1, 0).applyQuaternion(body.quaternion);
    const front = _b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = _d.set(0, 0, 1).applyQuaternion(body.quaternion);
      const raw = Math.atan2(_e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2; else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned; sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h);
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h; body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, _f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) _pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let it = 0; it < ITERATIONS; it++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, _pin);
    }
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = _q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = _a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const crossV = body.velocity.dot(normal);
    const along = _b.copy(body.velocity).addScaledVector(normal, -crossV);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity.copy(along)
      .addScaledVector(normal, crossV / (1 + physics.broadside * Math.abs(crossV) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    // Update last node: attach to card's hang point in world space
    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }
  if (grab) grab.from.copy(grab.target);
  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
}

// ─── Strap helpers ────────────────────────────────────────────────────────────
function luminance(r: number, g: number, b: number) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function toCssRgb(r: number, g: number, b: number, a = 1) {
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}
function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function paintStrap(canvas: HTMLCanvasElement, strapHex: string, strapColor2Hex: string, pattern: string): number {
  const across = 256, along = across * 2;
  canvas.width = across; canvas.height = along;
  const ctx = canvas.getContext('2d')!;
  const [r, g, b] = parseHexRgb(strapHex);

  // Cylindrical lighting gradient across width (dark edges, highlighted center)
  const baseGrad = ctx.createLinearGradient(0, 0, across, 0);
  baseGrad.addColorStop(0, toCssRgb(r * 0.72, g * 0.72, b * 0.72));
  baseGrad.addColorStop(0.12, toCssRgb(r * 0.9, g * 0.9, b * 0.9));
  baseGrad.addColorStop(0.5, toCssRgb(r, g, b));
  baseGrad.addColorStop(0.88, toCssRgb(r * 0.9, g * 0.9, b * 0.9));
  baseGrad.addColorStop(1, toCssRgb(r * 0.72, g * 0.72, b * 0.72));
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, across, along);

  // Woven twill / herringbone texture lines
  const lum = luminance(r, g, b);
  const inkDark = lum > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.25)';
  const inkLight = lum > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';

  // Ribbed longitudinal weave lines
  ctx.fillStyle = inkDark;
  for (let x = 0; x < across; x += 6) {
    ctx.fillRect(x, 0, 1.5, along);
  }

  // Cross stitch texture
  for (let y = 0; y < along; y += 4) {
    ctx.fillStyle = (y % 8 === 0) ? inkDark : inkLight;
    ctx.fillRect(0, y, across, 1.2);
  }

  // Heavy woven selvedge edge borders
  ctx.fillStyle = inkDark;
  ctx.fillRect(0, 0, across * 0.08, along);
  ctx.fillRect(across * 0.92, 0, across * 0.08, along);

  // Seam stitch line on borders
  ctx.fillStyle = lum > 0.5 ? '#ffffff' : '#000000';
  ctx.globalAlpha = 0.35;
  for (let y = 2; y < along; y += 8) {
    ctx.fillRect(across * 0.08 + 1, y, 2, 4);
    ctx.fillRect(across * 0.92 - 3, y, 2, 4);
  }
  ctx.globalAlpha = 1;

  if (pattern === 'stripes') {
    const [r2, g2, b2] = parseHexRgb(strapColor2Hex);
    ctx.fillStyle = toCssRgb(r2, g2, b2, 0.75);
    for (let y = -across; y < along + across; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(across, y + across * 0.7);
      ctx.lineTo(across, y + across * 0.7 + 14);
      ctx.lineTo(0, y + 14);
      ctx.closePath();
      ctx.fill();
    }
  } else if (pattern === 'text') {
    ctx.save();
    ctx.translate(across / 2, along / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "900 24px 'Unbounded', 'Space Grotesk', sans-serif";
    ctx.fillStyle = lum > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GENZONE ✦', 0, 0);
    ctx.restore();
  }

  return along / across; // tileRatio
}

// ─── PanelLanyardScene class ──────────────────────────────────────────────────
export class PanelLanyardScene {
  public onFlipChange?: (flipped: boolean) => void;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private environment: THREE.WebGLRenderTarget;
  private grain: THREE.CanvasTexture;
  private weave: THREE.DataTexture;
  private anisotropy: number;
  private slots: CardSlot[] = [];
  private rafId = 0;
  private lastTime = performance.now();
  private elapsedTime = 0;
  private alive = true;
  private cfg: CardConfig;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private activeGrab: { slot: CardSlot } | null = null;
  private reducedMotion = false;

  // Track page so world X centers visible cards around camera origin (x=0)
  private visibleStart = 0;
  private visibleCount = 1; // cards-per-view; set by positionSlots()

  private bandWork: Map<CardSlot, BandWork> = new Map();

  // Per-slot cached layout (avoid recomputing in tick)
  private layout: ReturnType<typeof cardLayout>;

  constructor(canvas: HTMLCanvasElement, cfg: CardConfig) {
    this.cfg = cfg;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.layout = cardLayout(cfg.orientation, cfg.cornerRadius);

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.scene = new THREE.Scene();
    this.environment = buildEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;

    // Lighting — add ambient light and back directional light so rotated/flipped card is clearly illuminated
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    const backKey = new THREE.DirectionalLight(0xffffff, 1.2);
    backKey.position.set(2.5, 3, -6);
    this.scene.add(ambient, backKey);

    if (cfg.lighting === 'neon') {
      const key  = new THREE.DirectionalLight(0x00f0ff, 1.4); key.position.set(-2.5, 4, 6);
      const fill = new THREE.DirectionalLight(0xff007f, 0.5); fill.position.set(3, -1, 4);
      const top  = new THREE.DirectionalLight(0xffffff, 0.6); top.position.set(0, 5, 2);
      this.scene.add(key, fill, top);
    } else {
      const key  = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2.5, 4, 6);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(3, -1, 4);
      this.scene.add(key, fill);
    }

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    this.grain = buildGrainTexture();
    this.weave = buildWeaveTexture();
  }

  // slotWorldX: center visible cards around x=0 so camera (looking at origin) sees them symmetrically
  // e.g. 3 cards at indices 0,1,2 → world x = -2, 0, +2  (not 0, 2, 4)
  private slotWorldX(slot: CardSlot): number {
    const center = this.visibleStart + (this.visibleCount - 1) / 2;
    return (slot.slotIndex - center) * this.cfg.cardSpacing;
  }

  // ─── addCard ───────────────────────────────────────────────────────────────
  addCard(member: MemberData, slotIndex: number): CardSlot {
    const { cfg, layout } = this;
    const geo = buildCardGeometry(layout);

    const frontCanvas = document.createElement('canvas');
    const backCanvas  = document.createElement('canvas');
    const strapCanvas = document.createElement('canvas');

    const mkTex = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = this.anisotropy;
      return t;
    };
    const frontTexture = mkTex(frontCanvas);
    const backTexture  = mkTex(backCanvas);
    const strapTexture = new THREE.CanvasTexture(strapCanvas);
    strapTexture.wrapS = THREE.ClampToEdgeWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;

    const foilUniforms: Record<string, THREE.IUniform> = {
      foilStrength: { value: 0 },
      foilAspect:   { value: layout.height / layout.width },
      foilKey:      { value: new THREE.Vector3() },
      foilFill:     { value: new THREE.Vector3() },
      foilTop:      { value: new THREE.Vector3() },
    };

    const injectFoil = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, foilUniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${FOIL_VERTEX_HEAD}`)
        .replace('#include <project_vertex>', `#include <project_vertex>\n${FOIL_VERTEX_BODY}`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FOIL_FRAGMENT_HEAD}`)
        .replace('#include <opaque_fragment>', `${FOIL_FRAGMENT_BODY}\n#include <opaque_fragment>`);
    };

    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontTexture, normalMap: this.grain, normalScale: new THREE.Vector2(0.06, 0.06),
      // Pull front face toward camera in depth buffer so it never z-fights with the body bevel
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backTexture, normalMap: this.grain, normalScale: new THREE.Vector2(0.06, 0.06),
      side: THREE.DoubleSide,
      // Same for back face
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    frontMaterial.onBeforeCompile = injectFoil;
    backMaterial.onBeforeCompile  = injectFoil;

    const edgeMaterial  = new THREE.MeshPhysicalMaterial();
    const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1 });
    const bandMaterial  = new THREE.MeshStandardMaterial({
      map: strapTexture, normalMap: this.weave,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.6, metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // Apply finish
    const finish = FINISHES[cfg.finish] ?? FINISHES.glossy;
    [frontMaterial, backMaterial].forEach(m => {
      m.roughness = finish.roughness; m.metalness = finish.metalness;
      m.clearcoat = finish.clearcoat; m.clearcoatRoughness = finish.clearcoatRoughness;
      m.anisotropy = finish.anisotropy;
    });
    foilUniforms.foilStrength.value = finish.foil;
    const baseRgb = parseHexRgb(cfg.baseColor);
    edgeMaterial.color.setRGB(baseRgb[0] * 0.92, baseRgb[1] * 0.92, baseRgb[2] * 0.92);
    edgeMaterial.roughness = Math.min(finish.roughness, 0.35);
    edgeMaterial.metalness = finish.metalness; edgeMaterial.clearcoat = 1; edgeMaterial.clearcoatRoughness = 0.08;
    const metalLook = METALS[cfg.metal] ?? METALS.silver;
    metalMaterial.color.set(metalLook.color); metalMaterial.roughness = metalLook.roughness;

    // Card group
    const group = new THREE.Group();
    const bodyMesh  = new THREE.Mesh(geo.body, edgeMaterial);
    const frontMesh = new THREE.Mesh(geo.face, frontMaterial);
    const backMesh  = new THREE.Mesh(geo.face.clone(), backMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
    ring.rotation.y = Math.PI / 2 - 0.7;
    ring.position.set(0, layout.ringY, 0);
    // Push faces well clear of the extruded body — 0.0006 caused z-fighting at bevel edges
    const FACE_Z = THICKNESS / 2 + BEVEL + 0.004;
    frontMesh.position.z =  FACE_Z;
    backMesh.rotation.y  = Math.PI;
    backMesh.position.z  = -FACE_Z;
    group.add(bodyMesh, frontMesh, backMesh, ring);
    this.scene.add(group);

    // Strap band mesh
    const strapWidth = STRAP_WIDTH * clampVal(cfg.strapWidth, 0.4, 2);
    const bandGeometry = buildBandGeometry(SAMPLES);
    const bandMesh = new THREE.Mesh(bandGeometry, bandMaterial);
    bandMesh.frustumCulled = false;
    this.scene.add(bandMesh);

    // Clamp
    const clampGroup = new THREE.Group();
    const clampMesh = new THREE.Mesh(buildClampGeometry(strapWidth), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
    clampGroup.add(clampMesh, eyelet);
    this.scene.add(clampGroup);

    // Physics — always in local space (anchor at x=0).
    // Always start in the natural hanging position (intro=false) to avoid
    // the sideways-layout hourglass/bowtie strap that occurs during intro.
    const sim = createSimulation();
    this.setupPhysicsAnchor(sim, layout);
    placeHanging(sim, layout, false);

    // Update foil uniforms from camera
    this.updateFoilUniforms(foilUniforms);

    // Paint strap
    const tileRatio = paintStrap(strapCanvas, cfg.strapColor, cfg.strapColor2, cfg.strapPattern);
    this.weave.repeat.set(2, 2 * tileRatio);
    strapTexture.needsUpdate = true;

    const slot: CardSlot = {
      member, slotIndex, sim, group,
      bandMesh, clampGroup, clampMesh, bodyMesh, frontMesh, backMesh, ring,
      frontCanvas, backCanvas, strapCanvas,
      frontTexture, backTexture, strapTexture,
      frontMaterial, backMaterial, edgeMaterial, bandMaterial, metalMaterial,
      foilUniforms, active: true, press: null, flipped: false, placed: true,
      logoImg: null, photoImg: null, hoveredButton: null,
    };

    // Band work: each slot gets its OWN axis vector — never shared/aliased
    const bw: BandWork = {
      controls: [],
      curve: new THREE.CatmullRomCurve3([], false, 'centripetal'),
      points: Array.from({ length: SAMPLES }, () => new THREE.Vector3()),
      sides:  Array.from({ length: SAMPLES }, () => new THREE.Vector3()),
      bends:  BAND_BEND.map(a => [Math.cos(a), Math.sin(a)] as [number, number]),
      axis:   new THREE.Vector3(),   // ← dedicated, never aliased
      mouth:  new THREE.Vector3(),
      tuck:   new THREE.Vector3(),
      work: {
        tangent:  new THREE.Vector3(),
        toCamera: new THREE.Vector3(),
        across:   new THREE.Vector3(),
        facing:   new THREE.Vector3(),
        end:      new THREE.Vector3(),
      },
      strapScale: strapWidth,
      tileRatio,
    };
    this.bandWork.set(slot, bw);
    this.slots.push(slot);

    // Draw a quick placeholder immediately so the card is never transparent while
    // the async texture drawing (font loading, image loading) completes.
    const texW = 1024;
    const texH = Math.round(texW * layout.height / layout.width);
    [slot.frontCanvas, slot.backCanvas].forEach((c, ci) => {
      c.width = texW; c.height = texH;
      const ctx2 = c.getContext('2d');
      if (!ctx2) return;
      const g = ctx2.createLinearGradient(0, 0, 0, texH);
      g.addColorStop(0, '#15152a'); g.addColorStop(1, '#0e0e1a');
      ctx2.fillStyle = g; ctx2.fillRect(0, 0, texW, texH);
      ctx2.fillStyle = ci === 0 ? '#00f0ff' : '#ff007f';
      ctx2.globalAlpha = 0.15;
      ctx2.fillRect(0, 0, texW * 0.03, texH);
      ctx2.globalAlpha = 1;
    });
    slot.frontTexture.needsUpdate = true;
    slot.backTexture.needsUpdate = true;

    // Draw full card textures — fire-and-forget async (textures update when ready)
    void this.updateCardTextures(slot, member);
    return slot;
  }

  // ── setupPhysicsAnchor: anchor is at top-centre, x=0 (local space) ──────
  private setupPhysicsAnchor(sim: Sim, layout: ReturnType<typeof cardLayout>, viewHeight = 3.26) {
    const halfFrustum = viewHeight / 2;
    // Place anchor comfortably inside visible canvas (never clipped at top)
    const anchorY = Math.max(1.30, halfFrustum - 0.24);
    // Card center hangs slightly below center at Y = -0.22
    const cardCenterY = -0.22;
    const cardTop = cardCenterY + layout.height / 2;
    const hangTop = cardTop + (layout.hangY - layout.height / 2);

    sim.anchor.set(0, anchorY, 0); // x=0 always; world offset applied at render time
    configureSimulation(sim, layout, anchorY - hangTop);
    sim.nodes[0].copy(sim.anchor);
    sim.previous[0].copy(sim.anchor);
  }

  // ── flipActiveCard: programmatic flip for keyboard accessibility & UI buttons ─
  flipActiveCard() {
    const slot = this.slots[0];
    if (!slot) return;
    const body = slot.sim.body;
    const up = _a.set(0, 1, 0).applyQuaternion(body.quaternion);
    const direction = slot.sim.turn > 0 ? -1 : 1;
    slot.sim.turn = slot.sim.turn === 0 ? Math.PI * direction : 0;
    body.angular.addScaledVector(up, FLIP_SPIN * direction);
    slot.flipped = slot.sim.turn !== 0;
    this.onFlipChange?.(slot.flipped);
    this.wake();
  }

  // ── resetFlip: reset flip state when navigating or closing modal ─────────
  resetFlip() {
    const slot = this.slots[0];
    if (!slot) return;
    slot.sim.turn = 0;
    slot.flipped = false;
    this.onFlipChange?.(false);
    this.wake();
  }

  // ── positionSlots: tell scene which page is visible and how many cards show ─
  positionSlots(visStart: number, visCount = 1) {
    this.visibleStart = visStart;
    this.visibleCount = visCount;
    this.wake();
  }

  // ── updateCardTextures ─────────────────────────────────────────────────────
  // async: loads logo + portrait, then draws front and back textures without QR.
  // Both drawFront and drawBack are async and must be awaited before setting needsUpdate.
  async updateCardTextures(slot: CardSlot, member: MemberData) {
    const { cfg, layout } = this;
    const texW = 1024;
    const texH = Math.round(texW * layout.height / layout.width);

    // Ensure canvas is sized before drawing
    if (slot.frontCanvas.width !== texW || slot.frontCanvas.height !== texH) {
      slot.frontCanvas.width  = texW;
      slot.frontCanvas.height = texH;
    }
    if (slot.backCanvas.width !== texW || slot.backCanvas.height !== texH) {
      slot.backCanvas.width  = texW;
      slot.backCanvas.height = texH;
    }

    // Load logo and portrait in parallel (crossOrigin set inside loadImg)
    const [logoImg, photoImg] = await Promise.all([
      cfg.logoUrl ? loadImg(cfg.logoUrl) : Promise.resolve(null),
      member.portrait_url ? loadImg(member.portrait_url) : Promise.resolve(null),
    ]);
    slot.logoImg = logoImg;
    slot.photoImg = photoImg;

    // drawFront(canvas, member, cfg, logoImg, photoImg) — 5 args, fully async with error capture
    try {
      const hoveredFront = slot.hoveredButton?.face === 'front' ? slot.hoveredButton.platform : null;
      await drawFront(slot.frontCanvas, member, cfg, logoImg, photoImg, hoveredFront);
      slot.frontTexture.needsUpdate = true;
    } catch (err) {
      console.warn('Failed to draw front of card:', err);
    }

    // drawBack(canvas, member, cfg) — fully async with error capture
    try {
      const hoveredBack = slot.hoveredButton?.face === 'back' ? slot.hoveredButton.platform : null;
      await drawBack(slot.backCanvas, member, cfg, null, hoveredBack);
      slot.backTexture.needsUpdate = true;
    } catch (err) {
      console.warn('Failed to draw back of card:', err);
    }

    this.wake();
  }

  updateConfig(nextCfg: CardConfig) {
    this.cfg = nextCfg;
    for (const slot of this.slots) {
      void this.updateCardTextures(slot, slot.member);
    }
    this.wake();
  }

  private hitTestSocialButton(
    slot: CardSlot,
    hitObject: THREE.Object3D | undefined,
    uv: THREE.Vector2 | null | undefined,
  ): { face: 'front' | 'back'; platform: SocialPlatform; url: string } | null {
    if (!hitObject || !uv) return null;

    if (hitObject === slot.frontMesh) {
      const boxes = getFrontSocialHitBoxes(slot.frontCanvas.width, slot.frontCanvas.height, slot.member, this.cfg);
      for (const box of boxes) {
        if (uv.x >= box.minU && uv.x <= box.maxU && uv.y >= box.minV && uv.y <= box.maxV) {
          return { face: 'front', platform: box.platform, url: box.url };
        }
      }
    } else if (hitObject === slot.backMesh) {
      const vis = slot.member.social_visibility;
      const igNorm = (!vis || vis.instagram !== false) ? normalizeSocialLink('instagram', slot.member.instagram_url || slot.member.social_instagram) : null;
      const liNorm = (!vis || vis.linkedin !== false) ? normalizeSocialLink('linkedin', slot.member.linkedin_url || slot.member.social_linkedin) : null;
      const boxes = getBackSocialHitBoxes(slot.backCanvas.width, slot.backCanvas.height, Boolean(igNorm), Boolean(liNorm));
      if (igNorm && uv.x >= boxes.instagram.minU && uv.x <= boxes.instagram.maxU && uv.y >= boxes.instagram.minV && uv.y <= boxes.instagram.maxV) {
        return { face: 'back', platform: 'instagram', url: igNorm.url };
      }
      if (liNorm && uv.x >= boxes.linkedin.minU && uv.x <= boxes.linkedin.maxU && uv.y >= boxes.linkedin.minV && uv.y <= boxes.linkedin.maxV) {
        return { face: 'back', platform: 'linkedin', url: liNorm.url };
      }
    }
    return null;
  }

  private setSlotHoveredButton(slot: CardSlot, next: { face: 'front' | 'back'; platform: SocialPlatform } | null) {
    const prev = slot.hoveredButton ?? null;
    if (prev?.face === next?.face && prev?.platform === next?.platform) return;
    slot.hoveredButton = next;
    if (this.cfg.socialButtonGlow === false) return;

    if (prev?.face === 'front' || next?.face === 'front') {
      const hp = next?.face === 'front' ? next.platform : null;
      void drawFront(slot.frontCanvas, slot.member, this.cfg, slot.logoImg ?? null, slot.photoImg ?? null, hp).then(() => {
        slot.frontTexture.needsUpdate = true;
        this.wake();
      });
    }
    if (prev?.face === 'back' || next?.face === 'back') {
      const hp = next?.face === 'back' ? next.platform : null;
      void drawBack(slot.backCanvas, slot.member, this.cfg, null, hp).then(() => {
        slot.backTexture.needsUpdate = true;
        this.wake();
      });
    }
  }

  // ── updateFoilUniforms ────────────────────────────────────────────────────
  private updateFoilUniforms(uniforms: Record<string, THREE.IUniform>) {
    this.camera.updateMatrixWorld();
    uniforms.foilKey.value.set(-2.5, 4, 6).normalize().transformDirection(this.camera.matrixWorldInverse);
    uniforms.foilFill.value.set(3, -1, 4).normalize().transformDirection(this.camera.matrixWorldInverse);
    uniforms.foilTop.value.set(0.5, 4.5, 8).normalize().transformDirection(this.camera.matrixWorldInverse);
  }

  // ── updateBand (per slot) — FIXED: separate axis vector, correct world X ─
  private updateBand(slot: CardSlot) {
    const bw = this.bandWork.get(slot)!;
    const { sim } = slot;
    const { controls, curve, points, sides, bends, axis, mouth, tuck, work, strapScale, tileRatio } = bw;

    // World X offset for this slot (physics nodes are at x≈0; shift to world)
    const wx = this.slotWorldX(slot);

    const hang = sim.nodes[JOINTS];

    // FIX: use dedicated `axis` vector, NOT work.toCamera
    let guide = JOINTS - 1;
    while (guide > 0 && sim.nodes[guide].distanceTo(hang) < (EYELET_RADIUS + CLAMP_BODY + 0.05) * 1.1) guide--;
    axis.subVectors(sim.nodes[guide], hang); // safe: axis is its own Vector3
    if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
    axis.normalize();

    const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
    mouth.copy(hang).addScaledVector(axis, reach);
    tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);

    controls.length = 0;
    for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
    controls.push(mouth, tuck);
    curve.points = controls;
    curve.updateArcLengths();
    for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);

    const length = curve.getLength();
    const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
    const position  = slot.bandMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const normalAttr = slot.bandMesh.geometry.getAttribute('normal') as THREE.BufferAttribute;
    const uvAttr    = slot.bandMesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
    const cols = BAND_COLUMNS.length;
    const restLength = sim.rest * JOINTS;
    const repeats = restLength / (strapScale * tileRatio);
    const width = strapScale / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);

    for (let i = 0; i < SAMPLES; i++) {
      work.tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
      if (work.tangent.lengthSq() < 1e-12) work.tangent.set(0, -1, 0);
      work.tangent.normalize();

      // FIX: stable side vector — use toCamera as reference, but fall back to world-up
      // when toCamera ≈ tangent (strap pointing at camera) which makes the cross product degenerate.
      work.toCamera.subVectors(this.camera.position, points[i]).normalize();
      const tcDotT = Math.abs(work.toCamera.dot(work.tangent));
      const ref = tcDotT > 0.95
        ? (Math.abs(work.tangent.y) < 0.95 ? _a.set(0, 1, 0) : _a.set(1, 0, 0))
        : work.toCamera;
      const side = sides[i].crossVectors(ref, work.tangent);
      if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : _a.set(1, 0, 0));
      side.normalize();
      if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();

      const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
      work.facing.crossVectors(work.tangent, side);
      work.across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(work.facing, Math.sin(angle));
      work.facing.crossVectors(work.tangent, work.across);

      const p = points[i];
      const v = (1 - i / (SAMPLES - 1)) * repeats;
      // Natural 3D drape along length of strap: forward curve in Z
      const drapeProgress = i / (SAMPLES - 1);
      const drapeZ = Math.sin(drapeProgress * Math.PI) * 0.05;
      for (let c = 0; c < cols; c++) {
        const k = i * cols + c;
        const off = (BAND_COLUMNS[c] - 0.5) * width;
        const [bcos, bsin] = bends[c];
        // Curvature across strap width (edges fold slightly in Z)
        const edgeZ = Math.abs(bcos) * width * 0.06;
        const totalZ = drapeZ + edgeZ;
        position.setXYZ(k,
          p.x + wx + work.across.x * off + work.facing.x * totalZ,
          p.y      + work.across.y * off + work.facing.y * totalZ,
          p.z      + work.across.z * off + work.facing.z * totalZ,
        );
        normalAttr.setXYZ(k,
          work.facing.x * bcos + work.across.x * bsin,
          work.facing.y * bcos + work.across.y * bsin,
          work.facing.z * bcos + work.across.z * bsin,
        );
        uvAttr.setXY(k, BAND_COLUMNS[c], v);
      }
    }
    work.end.copy(work.across);
    position.needsUpdate = true; normalAttr.needsUpdate = true; uvAttr.needsUpdate = true;

    // Clamp orientation + position (FIX: use wx for world X)
    work.across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
    work.facing.crossVectors(work.across, axis).normalize();
    const basis = new THREE.Matrix4().makeBasis(work.across, axis, work.facing);
    slot.clampGroup.quaternion.setFromRotationMatrix(basis);
    // FIX: clampGroup world position = physics hang + wx offset
    slot.clampGroup.position.set(hang.x + wx, hang.y, hang.z);
  }

  // ── resize ────────────────────────────────────────────────────────────────
  resize(w: number, h: number, cpv = 1) {
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const { cfg, layout } = this;
    const aspect = w / h;

    // Card 3D object fills roughly 70% of canvas height (layout.height is 2.25)
    let viewHeight = layout.height / 0.69;

    // Minimum horizontal span: ensure card width (1.6) never clips with margin
    const minSpan = Math.max(layout.width * 1.28, cpv * cfg.cardSpacing * 1.1);
    if (viewHeight * aspect < minSpan) {
      viewHeight = minSpan / aspect;
    }

    this.camera.aspect = aspect;
    const camZ = (viewHeight / 2) / Math.tan((FOV * Math.PI) / 360);
    this.camera.position.set(0, 0, camZ);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    // Re-configure strap length and anchor for all slots
    this.slots.forEach(slot => {
      this.setupPhysicsAnchor(slot.sim, layout, viewHeight);
    });

    this.slots.forEach(slot => this.updateFoilUniforms(slot.foilUniforms));
    this.wake();
  }

  // ── physicsParams ─────────────────────────────────────────────────────────
  private physicsParams(): PhysicsParams {
    const { cfg, reducedMotion } = this;
    const gravity = 40 * clampVal(cfg.gravity, 0, 3);
    const weight  = Math.max(gravity, 20);
    const springy = clampVal(cfg.elasticity, 0, 1);
    const settle  = clampVal(cfg.damping, 0, 1);
    return {
      gravity, hold: weight * mixVal(2.2, 5.5, springy),
      stiffness: weight * 10 * JOINTS, spring: weight * mixVal(0.1, 0.4, springy) * JOINTS,
      bandDamping: weight * mixVal(0.3, 0.08, springy) * JOINTS,
      linearDrag: 0.25 * Math.pow(16, settle), angularDrag: 0.5 * Math.pow(12, settle),
      air: 0.15, broadside: 0.5, spinAir: 0.03, nodeDrag: 2, nodeAir: 0.2,
      twist: 30, twistDamping: 3, grip: 40, gripDamping: 6,
      breeze: reducedMotion ? 0 : Math.max(0.18, clampVal(cfg.breeze, 0, 1)),
    };
  }

  // ── tick ──────────────────────────────────────────────────────────────────
  private tick = (now: number) => {
    this.rafId = 0;
    if (!this.alive) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - this.lastTime) / 1000));
    this.lastTime = now; this.elapsedTime += dt;
    const physics = this.physicsParams();
    let anyMoving = false;

    for (const slot of this.slots) {
      if (!slot.active) continue;

      stepSimulation(slot.sim, dt, physics, this.elapsedTime);

      const body = slot.sim.body;
      // Guard against NaN
      if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
        slot.sim.grab = null;
        placeHanging(slot.sim, this.layout, false);
      }

      // FIX: world position = physics-local body pos + slot world X offset
      const wx = this.slotWorldX(slot);
      slot.group.position.set(
        body.position.x + wx,
        body.position.y,
        body.position.z,
      );
      slot.group.quaternion.copy(body.quaternion);

      this.updateBand(slot);

      const resting = slot.sim.calm > 1.2 && !slot.sim.grab && physics.breeze === 0;
      if (!resting) anyMoving = true;
    }

    this.renderer.render(this.scene, this.camera);
    if (anyMoving) this.rafId = requestAnimationFrame(this.tick);
  };

  wake() {
    if (this.rafId || !this.alive) return;
    this.slots.forEach(s => { s.sim.calm = 0; });
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  startLoop() { this.wake(); }
  stopLoop()  { cancelAnimationFrame(this.rafId); this.rafId = 0; }

  // ── Pointer handling ──────────────────────────────────────────────────────
  handlePointerDown(event: PointerEvent, canvas: HTMLCanvasElement, _onFlip: (slot: CardSlot) => void) {
    if (event.button > 0) return;
    const rect = canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    for (const slot of this.slots) {
      if (!slot.active) continue;
      slot.group.updateMatrixWorld();
      const hits = this.raycaster.intersectObjects([slot.bodyMesh, slot.frontMesh, slot.backMesh], false);
      if (hits.length > 0) {
        const hit = hits[0];
        // Convert hit point to physics-local space
        const wx = this.slotWorldX(slot);
        const localHit = hit.point.clone(); localHit.x -= wx;
        slot.sim.grab = {
          local: localHit.clone().sub(slot.sim.body.position).applyQuaternion(slot.sim.body.quaternion.clone().invert()),
          rotation: slot.sim.body.quaternion.clone(),
          reach: hit.distance,
          from: localHit.clone(),
          target: localHit.clone(),
        };
        slot.press = {
          x: event.clientX,
          y: event.clientY,
          time: performance.now(),
          point: localHit.clone(),
          hitObject: hit.object,
          uv: hit.uv ? hit.uv.clone() : null,
        };
        this.activeGrab = { slot };
        canvas.setPointerCapture?.(event.pointerId);
        canvas.style.cursor = 'grabbing';
        event.preventDefault();
        this.wake();
        break;
      }
    }
  }

  handlePointerMove(event: PointerEvent, canvas: HTMLCanvasElement) {
    if (!this.activeGrab) {
      const rect = canvas.getBoundingClientRect();
      this.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.raycaster.setFromCamera(this.pointer, this.camera);
      let onCard = false;
      let hoveredBtn = false;
      for (const slot of this.slots) {
        if (!slot.active) continue;
        slot.group.updateMatrixWorld();
        const cardHits = this.raycaster.intersectObjects([slot.bodyMesh, slot.frontMesh, slot.backMesh], false);
        if (cardHits.length > 0) {
          onCard = true;
          const hit = cardHits[0];
          const btnHit = this.hitTestSocialButton(slot, hit?.object, hit?.uv);
          if (btnHit) {
            hoveredBtn = true;
            this.setSlotHoveredButton(slot, { face: btnHit.face, platform: btnHit.platform });
          } else {
            this.setSlotHoveredButton(slot, null);
          }
          break;
        } else {
          this.setSlotHoveredButton(slot, null);
        }
      }
      canvas.style.cursor = hoveredBtn ? 'pointer' : onCard ? 'grab' : 'default';
      return;
    }

    const { slot } = this.activeGrab;
    const rect = canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (slot.sim.grab) {
      if (slot.press && Math.hypot(event.clientX - slot.press.x, event.clientY - slot.press.y) > 6) slot.press = null;
      // Target in physics-local space
      const wx = this.slotWorldX(slot);
      const worldTarget = new THREE.Vector3();
      this.raycaster.ray.at(slot.sim.grab.reach, worldTarget);
      worldTarget.x -= wx;
      slot.sim.grab.target.copy(worldTarget);
      this.wake();
    }
  }

  handlePointerUp(event: PointerEvent, canvas: HTMLCanvasElement, onFlip: (slot: CardSlot) => void) {
    if (!this.activeGrab) return;
    const { slot } = this.activeGrab;
    if (slot.press && event.type === 'pointerup' && performance.now() - slot.press.time <= 250) {
      // Check if tap landed on a social button on either front or back face
      const btnHit = this.hitTestSocialButton(slot, slot.press.hitObject, slot.press.uv);
      if (btnHit) {
        window.open(btnHit.url, '_blank', 'noopener,noreferrer');
        slot.sim.grab = null;
        this.activeGrab = null;
        slot.press = null;
        canvas.releasePointerCapture?.(event.pointerId);
        canvas.style.cursor = 'pointer';
        return;
      }

      // Otherwise flip card
      const body = slot.sim.body;
      const up = _a.set(0, 1, 0).applyQuaternion(body.quaternion);
      let direction = slot.sim.turn > 0 ? -1 : 1;
      if (slot.sim.turn === 0) {
        const away = _c.subVectors(slot.press.point, this.camera.position).normalize();
        direction = _b.subVectors(slot.press.point, body.position).cross(away).dot(up) < 0 ? -1 : 1;
      }
      slot.sim.turn = slot.sim.turn === 0 ? Math.PI * direction : 0;
      body.angular.addScaledVector(up, FLIP_SPIN * direction);
      slot.flipped = slot.sim.turn !== 0;
      this.onFlipChange?.(slot.flipped);
      onFlip(slot);
    }
    slot.sim.grab = null; slot.press = null;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = 'grab';
    this.activeGrab = null;
    this.wake();
  }

  // ── removeCard ────────────────────────────────────────────────────────────
  removeCard(slot: CardSlot) {
    this.slots = this.slots.filter(s => s !== slot);
    this.scene.remove(slot.group, slot.bandMesh, slot.clampGroup);
    slot.bodyMesh.geometry.dispose();
    slot.frontMesh.geometry.dispose();
    slot.backMesh.geometry.dispose();
    (slot.clampGroup.children[1] as THREE.Mesh)?.geometry?.dispose();
    slot.clampMesh.geometry.dispose();
    slot.bandMesh.geometry.dispose();
    slot.ring.geometry.dispose();
    slot.frontMaterial.dispose(); slot.backMaterial.dispose();
    slot.edgeMaterial.dispose(); slot.bandMaterial.dispose(); slot.metalMaterial.dispose();
    slot.frontTexture.dispose(); slot.backTexture.dispose(); slot.strapTexture.dispose();
    this.bandWork.delete(slot);
  }

  clearCards() {
    [...this.slots].forEach(s => this.removeCard(s));
    this.activeGrab = null;
  }

  setActiveSlots(indices: number[]) {
    const set = new Set(indices);
    this.slots.forEach(s => {
      const wasActive = s.active;
      s.active = set.has(s.slotIndex);

      // Show/hide Three.js objects so inactive cards don't bleed into view
      s.group.visible     = s.active;
      s.bandMesh.visible  = s.active;
      s.clampGroup.visible = s.active;

      // When a card becomes active for the first time (or re-enters after being hidden),
      // reset its physics to the natural hanging position so it doesn't glitch in
      if (s.active && !wasActive) {
        s.sim.grab = null;
        s.sim.turn = 0;
        s.flipped  = false;
        placeHanging(s.sim, this.layout, false);
      }
    });
    this.wake();
  }

  // ── dispose ───────────────────────────────────────────────────────────────
  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.rafId);
    [...this.slots].forEach(s => this.removeCard(s));
    this.grain.dispose(); this.weave.dispose();
    this.environment.dispose();
    this.renderer.dispose();
  }
}
