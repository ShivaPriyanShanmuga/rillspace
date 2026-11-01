export const SIZE = 42;
export const DT = 0.125;
export const DURATION = 90;
export const DEFAULT = Object.freeze({ seed: 731, cover: 'meadow', dam: false, intensity: 1 });
export const COVER = Object.freeze({ meadow: { rate: 0.004, capacity: 0.25, drag: 1 }, forest: { rate: 0.019, capacity: 1.2, drag: 0.68 }, paved: { rate: 0.0001, capacity: 0.008, drag: 1.2 } });

export function normalize(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  return { seed: Number.isSafeInteger(input.seed) ? Math.abs(input.seed) % 100000 : DEFAULT.seed,
    cover: Object.hasOwn(COVER, input.cover) ? input.cover : 'meadow', dam: input.dam === true,
    intensity: [0.5, 1, 2].includes(input.intensity) ? input.intensity : 1 };
}
export function random(seed) { let a = seed | 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function channel(z, seed = 731) { return 2.3 * Math.sin(z * 0.17 + seed * 0.001); }
export function elevation(x, z, seed = 731) {
  const river = channel(z, seed);
  const valley = Math.pow(Math.min(Math.abs(x - river) / 12, 1.8), 1.45) * 3.4;
  const upstream = (20 - z) * 0.075;
  const hills = 1.4 * Math.exp(-((x + 11) ** 2 + (z + 8) ** 2) / 85) + 1.8 * Math.exp(-((x - 13) ** 2 + (z + 12) ** 2) / 100);
  return 0.4 + valley + upstream + hills + 0.16 * Math.sin(x * 0.55 + seed) * Math.sin(z * 0.4);
}
export const interventionCell = (x, z, seed = 731) => z < 4 && Math.abs(x) < 18 && Math.abs(x - channel(z, seed)) > 2.2;
export const damCell = (x, z, seed = 731) => Math.abs(z - 2) < 0.7 && Math.abs(x - channel(z, seed)) < 4.5;
export const storm = (t, intensity = 1) => t >= 0 && t < 60 ? Math.sin(Math.PI * t / 60) * 0.042 * intensity : 0;

export function makeWorld(config = DEFAULT, size = SIZE) {
  config = normalize(config);
  if (!Number.isInteger(size) || size < 8 || size > 80) throw new Error('Grid size must be 8–80.');
  const cells = size * size, h = new Float64Array(cells), soil = new Float64Array(cells), water = new Float64Array(cells), region = new Uint8Array(cells), barrier = new Uint8Array(cells), xz = new Float32Array(cells * 2);
  const spacing = 42 / size;
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const i = z * size + x, wx = (x + 0.5) * spacing - 21, wz = (z + 0.5) * spacing - 21;
    xz[i * 2] = wx; xz[i * 2 + 1] = wz;
    region[i] = +interventionCell(wx, wz, config.seed);
    barrier[i] = +(config.dam && damCell(wx, wz, config.seed));
    h[i] = elevation(wx, wz, config.seed) + barrier[i] * 1.55;
  }
  return { config, size, spacing, h, soil, water, region, barrier, xz, time: 0, rain: 0, absorbed: 0, outflow: 0, peakDepth: 0,
    lastFlow: 0, samples: [{ time: 0, flow: 0, held: 0 }], outgoing: new Float64Array(cells), delta: new Float64Array(cells) };
}

export function step(world, dt = DT) {
  if (!(dt > 0 && dt <= 0.25)) throw new Error('Step must be positive and at most 0.25.');
  if (world.time >= DURATION) return world;
  dt = Math.min(dt, DURATION - world.time);
  const { water, soil, h, region, barrier, size, spacing, outgoing, delta } = world;
  const area = spacing * spacing, input = storm(world.time + dt / 2, world.config.intensity) * dt;
  const cover = COVER[world.config.cover];
  outgoing.fill(0); delta.fill(0);
  for (let i = 0; i < water.length; i++) {
    water[i] += input; world.rain += input * area;
    const surface = barrier[i] ? COVER.paved : region[i] ? cover : COVER.meadow;
    const soak = Math.min(water[i], surface.rate * dt * Math.max(0, 1 - soil[i] / surface.capacity));
    water[i] -= soak; soil[i] += soak; world.absorbed += soak * area;
  }
  // Two-pass finite-volume exchange. Limit aggregate outgoing flux by available
  // water, then apply the exact same transfer to its source and destination.
  const edges = callback => {
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
      const i = z * size + x;
      if (x + 1 < size) callback(i, i + 1);
      if (z + 1 < size) callback(i, i + size);
    }
  };
  const flux = (a, b) => {
    const diff = h[a] + water[a] - h[b] - water[b];
    const source = diff >= 0 ? a : b;
    const drag = region[source] ? cover.drag : 1;
    return [source, source === a ? b : a, Math.abs(diff) * 0.42 * drag * dt / spacing];
  };
  edges((a, b) => { const [source, , amount] = flux(a, b); outgoing[source] += amount; });
  edges((a, b) => {
    const [source, dest, amount] = flux(a, b), scale = outgoing[source] > water[source] * 0.95 ? water[source] * 0.95 / outgoing[source] : 1;
    const transfer = amount * scale;
    delta[source] -= transfer; delta[dest] += transfer;
  });
  let flow = 0;
  for (let i = 0; i < water.length; i++) {
    water[i] = Math.max(0, water[i] + delta[i]);
    const x = i % size, z = Math.floor(i / size);
    if (x === 0 || z === 0 || x === size - 1 || z === size - 1) {
      const exit = water[i] * Math.min(0.75, dt * 0.55);
      water[i] -= exit; world.outflow += exit * area; flow += exit * area;
    }
    world.peakDepth = Math.max(world.peakDepth, water[i]);
  }
  world.time += dt; world.lastFlow = flow / dt;
  if (Math.floor(world.time) > Math.floor(world.time - dt)) world.samples.push({ time: world.time, flow: world.lastFlow, held: world.absorbed });
  return world;
}

export function advance(world, target) {
  target = Math.max(0, Math.min(DURATION, target));
  while (world.time + 1e-8 < target) step(world, Math.min(DT, target - world.time));
  return world;
}
export function stats(world) {
  const stored = world.water.reduce((sum, v) => sum + v * world.spacing ** 2, 0);
  const flooded = world.water.reduce((sum, v) => sum + +(v > 0.18), 0) / world.water.length * 100;
  return { rain: world.rain, stored, absorbed: world.absorbed, outflow: world.outflow, flooded, peakDepth: world.peakDepth,
    heldPercent: world.rain ? (stored + world.absorbed) / world.rain * 100 : 0,
    absorbedPercent: world.rain ? world.absorbed / world.rain * 100 : 0,
    outflowPercent: world.rain ? world.outflow / world.rain * 100 : 0,
    balanceError: world.rain - stored - world.absorbed - world.outflow };
}
export function replay(config, time) { return advance(makeWorld(config), Math.round(Math.max(0, Math.min(DURATION, time)) / DT) * DT); }
export function comparison(config, time) {
  config = normalize(config);
  return { baseline: replay({ ...config, cover: 'meadow', dam: false }, time), future: replay(config, time) };
}

export function command(text) {
  const t = String(text).toLowerCase().trim().replace(/[.!?]+$/g, '');
  if (!t || t.length > 300) return null;
  if (/\b(reset|start over|original world|restore everything)\b/.test(t)) return { type: 'reset', label: 'Return to the original' };
  if (/\b(undo|go back|previous decision)\b/.test(t)) return { type: 'undo', label: 'Undo the last decision' };
  if (/\b(rewind|replay|restart storm)\b/.test(t)) return { type: 'rewind', label: 'Replay the same storm' };
  if (/\b(pause|stop)\b/.test(t)) return { type: 'pause', label: 'Pause time' };
  if (/\b(compare|split|two worlds|side by side)\b/.test(t)) return { type: 'compare', label: 'Compare both worlds' };
  if (/\b(double|twice|heavier|stronger)\b.*\b(rain|storm)\b|\b(rain|storm)\b.*\b(double|twice|heavier|stronger)\b/.test(t)) return { type: 'intensity', value: 2, label: 'Double the rain' };
  if (/\b(half|lighter|gentler)\b.*\b(rain|storm)\b|\b(rain|storm)\b.*\b(half|lighter|gentler)\b/.test(t)) return { type: 'intensity', value: 0.5, label: 'A gentler storm' };
  if (/\b(remove|demolish|take away)\b.*\bdam\b/.test(t)) return { type: 'dam', value: false, label: 'Remove the dam' };
  if (/\b(build|add|place|create|make)\b.*\bdam\b/.test(t) && !/\b(don't|do not|never)\b/.test(t)) return { type: 'dam', value: true, label: 'Build a dam' };
  if (/\b(pave|concrete|asphalt|parking lot|paving)\b/.test(t) && !/\b(don't|do not|never)\b/.test(t)) return { type: 'cover', value: 'paved', label: 'Pave the hillside' };
  if (/\b(plant|reforest|forest|more trees)\b/.test(t) && !/\b(remove|clear|don't|do not|never)\b/.test(t)) return { type: 'cover', value: 'forest', label: 'Plant a forest' };
  if (/\b(meadow|grassland|remove the trees|clear the forest|remove the concrete|un-pave|unpave)\b/.test(t)) return { type: 'cover', value: 'meadow', label: 'Restore the meadow' };
  if (/\b(rain|storm|run|play|resume|continue)\b/.test(t) && !/\b(don't|do not|never|no)\b/.test(t)) return { type: 'play', label: 'Start the storm' };
  return null;
}

export function encodeScenario(config) { return new URLSearchParams(Object.entries(normalize(config)).map(([k,v]) => [k, String(v)])).toString(); }
export function decodeScenario(hash) { const p = Object.fromEntries(new URLSearchParams(String(hash).replace(/^#/, ''))); return normalize({ seed: Number(p.seed), cover: p.cover, dam: p.dam === 'true', intensity: Number(p.intensity) }); }
