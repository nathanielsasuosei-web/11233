/**
 * Generates royalty-free demo media so a fresh checkout has playable previews.
 * Run:  node scripts/make-demo-media.mjs
 *
 * Everything is synthesised in pure JS (no samples, no licences).
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'uploads');
const SR = 22050;

const BEATS = [
  { file: 'midnight-in-accra', title: 'Midnight In Accra', genre: 'Afrobeats', bpm: 112, root: 53, mood: 'Smooth' },
  { file: 'concrete-roses', title: 'Concrete Roses', genre: 'Drill', bpm: 142, root: 45, mood: 'Dark' },
  { file: 'sunlight-driver', title: 'Sunlight Driver', genre: 'Amapiano', bpm: 113, root: 58, mood: 'Warm' },
  { file: 'neon-testament', title: 'Neon Testament', genre: 'Trap', bpm: 140, root: 51, mood: 'Moody' },
  { file: 'war-drum', title: 'War Drum', genre: 'Afro Drill', bpm: 146, root: 48, mood: 'Aggressive' },
  { file: 'slow-burn', title: 'Slow Burn', genre: 'R&B', bpm: 92, root: 55, mood: 'Soulful' },
  { file: 'glass-highway', title: 'Glass Highway', genre: 'Highlife', bpm: 118, root: 60, mood: 'Bright' },
  { file: 'nocturne-77', title: 'Nocturne 77', genre: 'Amapiano', bpm: 112, root: 50, mood: 'Hypnotic' },
];

// ---------------------------------------------------------------- helpers
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function writeWav(file, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32000) | 0, 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

// ---------------------------------------------------------------- voices
function kick(samples, at, dur = 0.42) {
  const start = Math.floor(at * SR);
  const len = Math.floor(dur * SR);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const f = 42 + 110 * Math.exp(-t * 26);
    phase += (2 * Math.PI * f) / SR;
    const env = Math.exp(-t * 5.2) * (1 - t * 0.25);
    const click = Math.exp(-t * 220) * 0.5;
    const v = (Math.sin(phase) * 0.9 + click * Math.sign(Math.sin(phase))) * env;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += v * 1.05;
  }
}

function snare(samples, at, gain = 0.5, seed = 7) {
  const start = Math.floor(at * SR);
  const len = Math.floor(0.24 * SR);
  const noise = rnd(seed);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const n = noise() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const env = Math.exp(-t * 13);
    const body = Math.sin((2 * Math.PI * 185 * i) / SR) * Math.exp(-t * 26) * 0.35;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += (hp * 0.75 + body) * env * gain;
  }
}

function hat(samples, at, open = false, gain = 0.24, seed = 31) {
  const start = Math.floor(at * SR);
  const len = Math.floor((open ? 0.18 : 0.055) * SR);
  const noise = rnd(seed);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const n = noise() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += hp * Math.exp(-t * (open ? 20 : 60)) * gain;
  }
}

function bass(samples, at, midi, dur, gain = 0.5) {
  const start = Math.floor(at * SR);
  const len = Math.floor(dur * SR);
  const f = mtof(midi - 12);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const u = i / SR;
    const env = Math.min(1, u * 60) * Math.exp(-t * 2.4) * (1 - Math.max(0, t - 0.88) / 0.12);
    phase += (2 * Math.PI * f) / SR;
    let v = Math.sin(phase) * 0.72 + Math.sin(phase * 2) * 0.14;
    v = Math.tanh(v * 1.7) * 0.8;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += v * env * gain;
  }
}

function pad(samples, at, midis, dur, gain = 0.13) {
  const start = Math.floor(at * SR);
  const len = Math.floor(dur * SR);
  for (let v = 0; v < midis.length; v++) {
    const f = mtof(midis[v]);
    const detune = 1 + (v - 1) * 0.0016;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const u = i / SR;
      const env = Math.min(1, u * 3.2) * (1 - Math.max(0, t - 0.8) / 0.2);
      const trem = 0.82 + 0.18 * Math.sin(2 * Math.PI * 4.7 * u);
      phase += (2 * Math.PI * f * detune) / SR;
      const idx = start + i;
      if (idx < samples.length)
        samples[idx] += Math.sin(phase) * env * trem * gain * (1 / midis.length);
    }
  }
}

function pluck(samples, at, midi, dur, gain = 0.22) {
  const start = Math.floor(at * SR);
  const len = Math.floor(dur * SR);
  const f = mtof(midi + 12);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.exp(-t * 7.5);
    phase += (2 * Math.PI * f) / SR;
    const v =
      Math.sin(phase) * 0.6 + Math.sin(phase * 2) * 0.22 + Math.sin(phase * 3) * 0.08;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += v * env * gain;
  }
}

function shaker(samples, at, gain = 0.1, seed = 91) {
  const start = Math.floor(at * SR);
  const len = Math.floor(0.07 * SR);
  const noise = rnd(seed);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const n = noise() * 2 - 1;
    const hp = n - prev;
    prev = n;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += hp * Math.exp(-t * 42) * gain;
  }
}

// ---------------------------------------------------------------- arrange
function renderBeat(b) {
  const spb = 60 / b.bpm;
  const bars = 8;
  const total = bars * 4 * spb + 1.2;
  const samples = new Float32Array(Math.ceil(total * SR));

  const minor = [0, 3, 5, 7, 10, 12];
  const progressions = [
    [0, 5, 3, 4],
    [0, 3, 5, 4],
    [5, 3, 0, 4],
    [0, 4, 5, 3],
  ];
  const prog = progressions[Math.abs(b.root) % progressions.length];

  for (let bar = 0; bar < bars; bar++) {
    const barAt = bar * 4 * spb;
    const degree = prog[bar % prog.length];
    const chordRoot = b.root + minor[degree % minor.length];

    // drums
    const kickPattern =
      b.genre === 'Amapiano'
        ? [0, 2.5]
        : b.genre === 'Drill' || b.genre === 'Afro Drill'
          ? [0, 1.5, 2.5]
          : [0, 1.5, 2];
    for (const k of kickPattern) kick(samples, barAt + k * spb);

    if (b.genre === 'Amapiano') {
      // log-drum style bass line
      const logs = [0, 0.75, 1.5, 2, 2.75, 3.5];
      for (const l of logs) bass(samples, barAt + l * spb, chordRoot - 12, spb * 0.55, 0.62);
      for (let s16 = 0; s16 < 16; s16++) shaker(samples, barAt + (s16 * spb) / 4, 0.075, 91 + s16);
    } else {
      snare(samples, barAt + 1 * spb, 0.42, 7 + bar);
      snare(samples, barAt + 3 * spb, 0.46, 13 + bar);
      const hatDiv = b.bpm > 130 ? 4 : 2;
      for (let h = 0; h < hatDiv; h++) {
        hat(samples, barAt + (h * spb) / hatDiv, h === hatDiv - 1, 0.2, 31 + h + bar * 4);
      }
      if (b.bpm > 130) {
        for (let r = 8; r < 16; r += 2) hat(samples, barAt + (r * spb) / 4, false, 0.08, 77 + r);
      }
      bass(samples, barAt, chordRoot, spb * 1.6, 0.46);
      bass(samples, barAt + 2 * spb, chordRoot, spb * 1.6, 0.46);
    }

    // harmony
    pad(samples, barAt, [chordRoot + 12, chordRoot + 15, chordRoot + 19], spb * 4, 0.15);

    // melody — only on the back half so the loop breathes
    if (bar % 2 === 1) {
      const notes = [degree, degree + 2, degree + 4, degree + 2];
      notes.forEach((n, i) => {
        pluck(
          samples,
          barAt + (i * spb) / 2 + spb * 0.5,
          b.root + minor[n % minor.length] + 12,
          spb * 0.8,
          0.19,
        );
      });
    }
  }

  // soft fade in/out for looping
  const fade = Math.floor(0.08 * SR);
  const tail = Math.floor(0.6 * SR);
  for (let i = 0; i < fade; i++) samples[i] *= i / fade;
  for (let i = 0; i < tail; i++) samples[samples.length - 1 - i] *= i / tail;

  // gentle master bus
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const norm = peak > 0.9 ? 0.9 / peak : 1;
  for (let i = 0; i < samples.length; i++) samples[i] = Math.tanh(samples[i] * norm * 1.15);

  return samples;
}

function coverSvg(b) {
  const hue = 348 + ((b.title.length * 7) % 24) - 12;
  const words = b.title.toUpperCase().split(' ');
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 92% 42%)"/>
      <stop offset="45%" stop-color="hsl(${hue - 6} 78% 16%)"/>
      <stop offset="100%" stop-color="#08080a"/>
    </linearGradient>
    <radialGradient id="r" cx="22%" cy="14%" r="80%">
      <stop offset="0%" stop-color="hsl(${hue + 8} 96% 62%)" stop-opacity=".55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/></filter>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect width="800" height="800" fill="url(#r)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity=".07">
    ${Array.from({ length: 26 }, (_, i) => `<circle cx="620" cy="180" r="${i * 16}" />`).join('')}
  </g>
  <g stroke="#ffffff" stroke-opacity=".16" stroke-width="2">
    ${Array.from(
      { length: 40 },
      (_, i) =>
        `<line x1="${i * 20 + 40}" y1="${Math.round(560 + Math.sin(i * 0.7) * 40)}" x2="${i * 20 + 40}" y2="${Math.round(660 + Math.cos(i * 0.5) * 50)}"/>`,
    ).join('')}
  </g>
  <rect width="800" height="800" filter="url(#n)" opacity=".07"/>
  <text x="56" y="${line2 ? 660 : 700}" font-family="Arial Black, Arial, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-2">${line1}</text>
  ${line2 ? `<text x="56" y="742" font-family="Arial Black, Arial, sans-serif" font-size="76" font-weight="900" fill="#ff2d3a" letter-spacing="-2">${line2}</text>` : ''}
  <text x="60" y="88" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" fill-opacity=".75" letter-spacing="8">${b.genre.toUpperCase()}</text>
  <text x="60" y="126" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" fill-opacity=".45" letter-spacing="4">${b.bpm} BPM · ${b.mood.toUpperCase()}</text>
</svg>`;
}

// ---------------------------------------------------------------- main
fs.mkdirSync(path.join(OUT, 'beats'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'covers'), { recursive: true });

for (const b of BEATS) {
  const samples = renderBeat(b);
  writeWav(path.join(OUT, 'beats', `${b.file}.wav`), samples);
  fs.writeFileSync(path.join(OUT, 'covers', `${b.file}.svg`), coverSvg(b));
  console.log(`✓ ${b.file}.wav  (${(samples.length / SR).toFixed(1)}s)  + cover`);
}
console.log('\nDemo media written to public/uploads');
