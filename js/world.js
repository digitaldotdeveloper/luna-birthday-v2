/* =========================================================================
   The poolside. Everything here is V1's renderer, kept because it works:
   parallax bands, a photograph of stone laid in perspective, a reflection
   that is guaranteed to line up with the building making it, and a colour
   drain that lifts on one number.

   What is new in V2 is only that it is a module with a single state object
   instead of forty globals, so the acts can share it without stepping on
   each other.
   ========================================================================= */
import { ART, cellFrame } from './art.js';

/* one object, so every module sees the same numbers */
export const V = {
  W:0, H:0, DPR:1, SC:1,
  horizonY:0, poolFar:0, deckFar:0, groundY:0, deckNear:0,
  scroll:0, speed:0, t:0,
  colour:0,          /* 0 = drained of everything, 1 = her colour, everywhere */
  unlocking:false,
  inRoom:false,      /* the building behind swaps for the last scene */
  glow:0,            /* how far into the night we are */
  shake:0,
  camY:0,          /* the camera rides her stride, and kicks on a landing */
  flash:0,
  fireworks:false,
  key:null,        /* which key light the cast is standing in */
  grain:0.030,     /* how much film is on the picture */
  bloom:0.60
};

const cv  = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha:false });
export { ctx };

let stars = [], lights = [], hills = [];
export let parts = [], floats = [];
const sparks = [];
let sparkT = 0;

/* who is standing where */
export const runner = { x:0, y:0, vy:0, ground:true, ft:0, hurt:0, held:false, in:0, pose:-1 };
export const firass = { in:0, want:0, x:0, pose:-1 };
export const outroRef = { v:0, x:0 };

export const POSE  = { IDLE:0, LAND:1, CHEER:2, KISS:3 };
export const POSE2 = { WONDER:0, SIT:1, REACH:2, FLAME:3 };
const RUN_CELLS = 5, POSE_CELLS = 4;
/* the two sheets were drawn at different scales: she fills more of a pose
   cell than of a run cell, so pose cells draw taller to keep her one size */
const POSE_SCALE = 1.10;

/** The cheap path: the address bar slid, nothing about the scene changed.
 *  Only the backing store is resized — the band positions deliberately stay
 *  put, so the horizon does not jump every time she scrolls a thumb. */
export function softResize(){
  V.H = window.innerHeight;
  cv.width = Math.round(V.W * V.DPR); cv.height = Math.round(V.H * V.DPR);
  ctx.setTransform(V.DPR, 0, 0, V.DPR, 0, 0);
}

export function resize(){
  V.DPR = Math.min(window.devicePixelRatio || 1, 2);
  V.W = window.innerWidth; V.H = window.innerHeight;
  cv.width = Math.round(V.W * V.DPR); cv.height = Math.round(V.H * V.DPR);
  ctx.setTransform(V.DPR, 0, 0, V.DPR, 0, 0);
  V.SC = Math.max(0.72, Math.min(1.12, V.H / 780));

  V.horizonY = V.H * 0.41;
  V.poolFar  = V.H * 0.47;
  V.deckFar  = V.H * 0.62;
  V.groundY  = V.H * 0.785;
  V.deckNear = V.H * 0.96;

  buildStars(); buildLights(); buildHills();
  skyKey = poolKey = deckKey = '';
  runner.x = V.W * 0.27;
  if (runner.ground) runner.y = V.groundY;
}

function buildStars(){
  stars = [];
  const n = Math.round((V.W * V.horizonY) / 4200);
  for (let i = 0; i < n; i++)
    stars.push({ x:Math.random()*V.W, y:Math.random()*V.horizonY*0.98,
                 r:Math.random()*1.2+0.3, a:Math.random()*0.5+0.2,
                 tw:Math.random()*6.28, sp:Math.random()*1.7+0.4 });
}
function buildLights(){
  lights = [];
  const n = Math.round(V.W / 30) + 8;
  for (let i = 0; i <= n; i++) lights.push({ i, ph: Math.random() * 6.28 });
}
function buildHills(){
  hills = [];
  for (let i = 0; i < 26; i++)
    hills.push({ x: i * 150, w: 150 + Math.random() * 130, h: 26 + Math.random() * 46 });
}

/* ------------------------------------------------------------ particles */
export function burst(x, y, col, n, big){
  for (let i = 0; i < n; i++){
    const a = Math.random() * 6.2832, s = (34 + Math.random() * 130) * (big || 1);
    parts.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 26,
                 life:0.5 + Math.random()*0.55, r:1.4 + Math.random()*2.8, c:col });
  }
}
export function float(x, y, txt, big){ floats.push({ x, y, life:0.9, txt, big }); }

export function stepParticles(dt){
  for (const p of parts){
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.vy += (p.grav == null ? 230 : p.grav) * dt;
    if (p.grav != null){ p.vx *= 0.94; p.vy *= 0.94; }   /* dust hangs, then settles */
    p.life -= dt*1.2;
  }
  parts = parts.filter(p => p.life > 0);
  for (const f of floats){ f.y -= 44*dt; f.life -= dt*1.25; }
  floats = floats.filter(f => f.life > 0);
}

export function stepSparks(dt, tone){
  if (V.fireworks){
    sparkT -= dt;
    if (sparkT <= 0){
      sparkT = 0.6 + Math.random() * 0.9;
      const x = V.W * (0.15 + Math.random() * 0.7);
      const y = V.H * (0.10 + Math.random() * 0.20);
      const hue = [280, 316, 262, 334][Math.floor(Math.random() * 4)];
      if (tone) tone(1200 + Math.random() * 500, 0, 0.28, { type:'sine', gain:0.05, slide:2400 });
      for (let i = 0; i < 44; i++){
        const a = (i / 44) * 6.2832, sp = 70 + Math.random() * 140;
        sparks.push({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1 + Math.random()*0.6, hue });
      }
    }
  }
  for (const q of sparks){
    q.x += q.vx*dt; q.y += q.vy*dt; q.vy += 44*dt;
    q.vx *= 0.985; q.vy *= 0.985; q.life -= dt * 0.75;
  }
  while (sparks.length && sparks[0].life <= 0) sparks.shift();
}

/* ------------------------------------------------------------- layers */
function mix(a, b, k){
  return 'rgb(' + Math.round(a[0]+(b[0]-a[0])*k) + ',' +
                  Math.round(a[1]+(b[1]-a[1])*k) + ',' +
                  Math.round(a[2]+(b[2]-a[2])*k) + ')';
}
let skyG = null, skyKey = '';
function drawSky(){
  const k = V.W + 'x' + V.H + ':' + Math.round(V.glow * 26);
  if (k !== skyKey){
    skyKey = k;
    skyG = ctx.createLinearGradient(0, 0, 0, V.horizonY);
    skyG.addColorStop(0,   mix([16,7,30],  [28,13,52], V.glow));
    skyG.addColorStop(0.6, mix([30,12,58], [50,22,90], V.glow));
    skyG.addColorStop(1,   mix([58,26,98], [92,46,146], V.glow));
  }
  ctx.fillStyle = skyG;
  ctx.fillRect(-30, -30, V.W + 60, V.horizonY + 40);
  for (const s of stars){
    ctx.globalAlpha = s.a * (0.5 + 0.5 * Math.sin(V.t * s.sp + s.tw));
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/* the thing she is named after, sitting where it has been all along */
function drawMoon(){
  const mx = V.W * 0.78, my = V.horizonY * 0.30, mr = 26 * V.SC;
  const halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 7);
  halo.addColorStop(0, 'rgba(226,214,255,.16)');
  halo.addColorStop(1, 'rgba(226,214,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(mx, my, mr * 7, 0, 6.2832); ctx.fill();
  /* the crescent is cut on a transparent surface of its own: the world
     canvas has no alpha channel, so cutting into it paints black. */
  const pad = 3, d = Math.ceil(mr * 2) + pad * 2;
  const m = surface(1, d, d);
  m.fillStyle = 'rgba(244,238,255,.94)';
  m.beginPath(); m.arc(pad + mr + 4, pad + mr + 4, mr, 0, 6.2832); m.fill();
  m.globalCompositeOperation = 'destination-out';
  m.beginPath();
  m.arc(pad + mr + 4 + mr * 0.52, pad + mr + 4 - mr * 0.30, mr * 0.94, 0, 6.2832);
  m.fill();
  ctx.drawImage(rmCv, 0, 0, d + 8, d + 8, mx - mr - pad - 4, my - mr - pad - 4, d + 8, d + 8);
}

function drawHills(){
  const off = (V.scroll * 0.06) % (26 * 150);
  ctx.fillStyle = 'rgba(38,20,66,1)';
  ctx.beginPath(); ctx.moveTo(-40, V.horizonY);
  for (let pass = 0; pass < 2; pass++){
    for (const h of hills){
      const x = h.x - off + pass * 26 * 150;
      if (x > V.W + 200 || x < -260) continue;
      ctx.lineTo(x, V.horizonY - h.h * V.SC);
      ctx.lineTo(x + h.w * 0.5, V.horizonY - h.h * V.SC * 1.25);
      ctx.lineTo(x + h.w, V.horizonY - h.h * V.SC * 0.6);
    }
  }
  ctx.lineTo(V.W + 40, V.horizonY); ctx.lineTo(V.W + 40, V.horizonY + 30);
  ctx.lineTo(-40, V.horizonY + 30); ctx.closePath(); ctx.fill();
}
function drawMountains(){
  const im = ART.mountains;
  if (!im){ drawHills(); return; }
  const w = V.W * 1.9, h = w * (im.naturalHeight / im.naturalWidth);
  const off = ((-V.scroll * 0.05) % w + w) % w;
  for (let i = -1; i <= 1; i++)
    ctx.drawImage(im, i * w + off - w, V.horizonY - h * 0.94, w, h);
}
/* The pines in chalet.webp run right off the top of the asset, so tiling it
   draws a hard horizontal cut across the sky. Fade the top few percent of
   the picture out once, into a cached canvas, and the cut disappears. */
const softened = new Map();
function softTop(im, frac){
  if (!im) return im;
  let c = softened.get(im);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'destination-out';

  /* the pines run off the top of the asset */
  let g = x.createLinearGradient(0, 0, 0, c.height * frac);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height * frac);

  /* and the picture itself is cut at both sides, so a repeat shows two hard
     vertical lines down the valley unless the edges are dissolved too */
  const side = c.width * 0.16;
  g = x.createLinearGradient(0, 0, side, 0);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, side, c.height);
  g = x.createLinearGradient(c.width, 0, c.width - side, 0);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(c.width - side, 0, side, c.height);

  softened.set(im, c);
  return c;
}

function paintRoom(){
  const im = ART.room;
  const h = (V.poolFar - V.horizonY) + V.H * 0.20;
  const w = h * (im.naturalWidth / im.naturalHeight);
  const off = (V.scroll * 0.17) % w;
  for (let i = -1; i <= 2; i++) ctx.drawImage(im, i * w - off, V.poolFar - h, w, h);
}
function paintChalet(baseY){
  const im = ART.chalet;
  const h = (V.poolFar - V.horizonY) + V.H * 0.20;
  const w = h * (im.naturalWidth / im.naturalHeight);
  const off = (V.scroll * 0.17) % w;
  const pic = softTop(im, 0.14);
  /* overlapped by a fifth of a tile, so the dissolved edges cross-fade into
     each other instead of leaving a gap where the picture used to end */
  const step = w * 0.80;
  const o2 = (V.scroll * 0.17) % step;
  for (let i = -1; i <= 3; i++) ctx.drawImage(pic, i * step - o2, baseY - h, w, h);
}
function drawChalet(){
  if (V.inRoom && ART.room){ paintRoom(); return; }
  if (!ART.chalet) return;
  paintChalet(V.poolFar);
  const bank = ctx.createLinearGradient(0, V.horizonY, 0, V.poolFar);
  bank.addColorStop(0,   'rgba(74,44,124,0)');
  bank.addColorStop(0.7, 'rgba(74,44,124,.20)');
  bank.addColorStop(1,   'rgba(112,70,178,.38)');
  ctx.fillStyle = bank;
  ctx.fillRect(-10, V.horizonY, V.W + 20, V.poolFar - V.horizonY + 2);
  const spill = ctx.createLinearGradient(0, V.poolFar - 46 * V.SC, 0, V.poolFar);
  spill.addColorStop(0, 'rgba(255,206,130,0)');
  spill.addColorStop(1, 'rgba(255,206,130,.10)');
  ctx.fillStyle = spill;
  ctx.fillRect(-10, V.poolFar - 46 * V.SC, V.W + 20, 46 * V.SC);
}
function drawLights(){
  const span = 30 * V.SC, sag = V.H * 0.055, off = (V.scroll * 0.42) % (span * 8);
  ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const l of lights){
    const x = l.i * span - off;
    const y = V.H * 0.10 + Math.sin((l.i * span - off) / (span * 8) * Math.PI * 2) * sag;
    l.sx = x; l.sy = y;
    l.i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  for (const l of lights){
    if (l.sx < -30 || l.sx > V.W + 30) continue;
    const f = (0.62 + 0.38 * Math.sin(V.t * 1.5 + l.ph)) * (0.16 + V.colour * 0.84);
    const g = ctx.createRadialGradient(l.sx, l.sy, 0, l.sx, l.sy, 13);
    g.addColorStop(0, 'rgba(255,222,150,' + (0.72 * f) + ')');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(l.sx, l.sy, 13, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,205,' + (0.85 * f) + ')';
    ctx.beginPath(); ctx.arc(l.sx, l.sy, 2.1, 0, 6.2832); ctx.fill();
  }
}
function drawBunting(){
  const im = ART.bunting;
  if (!im) return;
  const w = V.W * 1.1, h = w * (im.naturalHeight / im.naturalWidth);
  const off = ((-V.scroll * 0.5) % w + w) % w;
  for (let i = -1; i <= 1; i++) ctx.drawImage(im, i * w + off - w, V.H * 0.30, w, h);
}

/* A photograph of stone laid in perspective. Each band takes its own slice
   and measures from the same world line, so the joints converge; alternate
   tiles are mirrored AND take a different slice, otherwise the water shows
   an obvious butterfly. */
function tiledBands(im, yTop, yBot, bands, sc0, sc1, speed, curve, slice){
  if (!im) return false;
  const tw = im.naturalWidth, th = im.naturalHeight;
  ctx.save();
  ctx.beginPath(); ctx.rect(-10, yTop, V.W + 20, yBot - yTop + 2); ctx.clip();
  const vx = V.W * 0.5;
  /* Every boundary is worked out once and rounded, so band i ends exactly
     where band i+1 begins. Drawing each band a pixel tall than it needs
     (the old `+1`) double-painted the joint, and at less than full alpha
     that reads as a dark stripe across the water every few rows. */
  const ys = new Array(bands + 1);
  for (let i = 0; i <= bands; i++){
    const v = i / bands;
    ys[i] = Math.round(yTop + (yBot - yTop) * (v * v * curve + v * (1 - curve)));
  }
  for (let i = 0; i < bands; i++){
    const v0 = i / bands, v1 = (i + 1) / bands;
    const y0 = ys[i];
    const y1 = ys[i + 1];
    if (y1 <= y0) continue;
    const sy = v0 * th, sh = Math.max(1, (v1 - v0) * th);
    const sc = sc0 + (sc1 - sc0) * v0;
    const dw = tw * sc;
    const world = V.scroll * speed * sc;
    const n0 = Math.floor((world - vx) / dw) - 1;
    const n1 = Math.ceil((world + vx) / dw) + 1;
    for (let n = n0; n <= n1; n++){
      const x = vx + n * dw - world;
      if (x > V.W + dw || x + dw < -dw) continue;
      const flip = ((n % 2) + 2) % 2 === 1;
      const sy2 = flip ? (sy + th * (slice == null ? 0.37 : slice)) % (th - sh) : sy;
      ctx.save();
      if (flip){ ctx.translate(2 * x + dw, 0); ctx.scale(-1, 1); }
      ctx.drawImage(im, 0, sy2, tw, sh, x, y0, dw, y1 - y0);
      ctx.restore();
    }
  }
  ctx.restore();
  return true;
}

let poolG = null, poolKey = '';
function drawPool(){
  const k = V.W + 'x' + V.H;
  if (k !== poolKey){
    poolKey = k;
    poolG = ctx.createLinearGradient(0, V.poolFar, 0, V.deckFar);
    poolG.addColorStop(0,   'rgb(58,30,120)');
    poolG.addColorStop(0.45,'rgb(92,50,180)');
    poolG.addColorStop(1,   'rgb(126,74,224)');
  }
  ctx.fillStyle = poolG;
  ctx.fillRect(-10, V.poolFar, V.W + 20, V.deckFar - V.poolFar);

  if (ART.chalet){
    const SQUASH = 0.52;
    ctx.save();
    ctx.beginPath(); ctx.rect(-10, V.poolFar, V.W + 20, V.deckFar - V.poolFar); ctx.clip();
    ctx.globalAlpha = 0.34;
    ctx.translate(0, V.poolFar * (1 + SQUASH));
    ctx.scale(1, -SQUASH);
    if (V.inRoom && ART.room) paintRoom(); else paintChalet(V.poolFar);
    ctx.restore();
    const fade = ctx.createLinearGradient(0, V.poolFar, 0, V.deckFar);
    fade.addColorStop(0, 'rgba(40,20,92,0)');
    fade.addColorStop(1, 'rgba(40,20,92,.55)');
    ctx.fillStyle = fade;
    ctx.fillRect(-10, V.poolFar, V.W + 20, V.deckFar - V.poolFar);
  }

  ctx.save();
  ctx.globalAlpha = 0.52;
  /* a much wider scale range across the band — at 0.07..0.30 the ripples were
     nearly the same size front and back, which is what made the pool read as
     a wall of purple instead of a surface going away from you */
  const realWater = tiledBands(ART.water, V.poolFar, V.deckFar, 26, 0.05, 0.62, 0.62, 0.88, 0.11);
  ctx.restore();
  if (realWater){
    const tint = ctx.createLinearGradient(0, V.poolFar, 0, V.deckFar);
    tint.addColorStop(0,   'rgba(20,9,54,.60)');   // far water is darker
    tint.addColorStop(0.5, 'rgba(38,18,92,.38)');
    tint.addColorStop(1,   'rgba(66,34,138,.16)');
    ctx.fillStyle = tint;
    ctx.fillRect(-10, V.poolFar, V.W + 20, V.deckFar - V.poolFar);
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(-10, V.poolFar, V.W + 20, V.deckFar - V.poolFar); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < (realWater ? 0 : 8); i++){
    const v = (i + 0.5) / 8;
    const yy = V.poolFar + v * (V.deckFar - V.poolFar);
    const per = (120 + v * 130) * V.SC;
    const x = ((-V.scroll * (0.30 + v * 0.5) + i * 61) % per + per) % per - per;
    for (let n = 0; n < Math.ceil(V.W / per) + 2; n++){
      const cx = x + n * per;
      const g = ctx.createRadialGradient(cx, yy, 0, cx, yy, per * 0.30);
      g.addColorStop(0, 'rgba(220,194,255,' + (0.11 + 0.05*Math.sin(V.t*1.4 + i + n)) + ')');
      g.addColorStop(1, 'rgba(200,166,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, yy, per * 0.30, (3 + v * 5) * V.SC, 0, 0, 6.2832); ctx.fill();
    }
  }
  for (const l of lights){
    if (l.sx == null || l.sx < -40 || l.sx > V.W + 40) continue;
    const yy = V.poolFar + (V.deckFar - V.poolFar) * 0.42;
    const g = ctx.createRadialGradient(l.sx, yy, 0, l.sx, yy, 30);
    g.addColorStop(0, 'rgba(255,214,140,.13)');
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(l.sx, yy, 30, 10, 0, 0, 6.2832); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  ctx.fillStyle = 'rgba(214,190,255,.30)';
  ctx.fillRect(-10, V.poolFar, V.W + 20, 2 * V.SC);
  ctx.fillStyle = 'rgba(226,206,255,.30)';
  ctx.fillRect(-10, V.deckFar - 3 * V.SC, V.W + 20, 3 * V.SC);
}

let deckG = null, deckKey = '';
function drawDeck(){
  const k = V.W + 'x' + V.H;
  if (k !== deckKey){
    deckKey = k;
    deckG = ctx.createLinearGradient(0, V.deckFar, 0, V.H);
    deckG.addColorStop(0,    'rgb(126,106,126)');
    deckG.addColorStop(0.22, 'rgb(92,74,98)');
    deckG.addColorStop(0.62, 'rgb(54,40,62)');
    deckG.addColorStop(1,    'rgb(26,17,34)');
  }
  ctx.fillStyle = deckG;
  ctx.fillRect(-10, V.deckFar, V.W + 20, V.H - V.deckFar + 10);

  if (tiledBands(ART.floor, V.deckFar, V.H + 2, 18, 0.10, 0.58, 1.0, 0.84)){
    /* it still has to fall away into the dark so her silhouette reads, but
       .52->.90 was painting the stone out completely */
    const sh = ctx.createLinearGradient(0, V.deckFar, 0, V.H);
    sh.addColorStop(0,    'rgba(58,34,96,.44)');
    sh.addColorStop(0.34, 'rgba(38,21,62,.56)');
    sh.addColorStop(0.74, 'rgba(20,10,34,.74)');
    sh.addColorStop(1,    'rgba(9,4,16,.90)');
    ctx.fillStyle = sh;
    ctx.fillRect(-10, V.deckFar, V.W + 20, V.H - V.deckFar + 10);
  }
  const gl = ctx.createLinearGradient(0, V.groundY - 44 * V.SC, 0, V.groundY + 3);
  gl.addColorStop(0, 'rgba(255,220,170,0)');
  gl.addColorStop(1, 'rgba(255,220,170,.07)');
  ctx.fillStyle = gl;
  ctx.fillRect(-10, V.groundY - 44 * V.SC, V.W + 20, 47 * V.SC);
  ctx.fillStyle = 'rgba(226,206,255,.14)';
  ctx.fillRect(-10, V.deckFar, V.W + 20, 2.5 * V.SC);
}

const PROPS = [
  { k:'floaties', rate:0.70, per:1600, w:96,  y:() => V.poolFar + (V.deckFar - V.poolFar) * 0.86, seed:11 },
  /* all of these live BEHIND the line she runs on. At 0.80-0.90 they were
     level with her feet and she walked straight through the furniture. */
  { k:'lounger',  rate:0.90, per:2100, w:118, y:() => V.deckFar + (V.groundY - V.deckFar) * 0.54, seed:23 },
  { k:'cabana',   rate:0.88, per:3400, w:196, y:() => V.deckFar + (V.groundY - V.deckFar) * 0.44, seed:5  },
  { k:'firebowl', rate:0.90, per:2600, w:68,  y:() => V.deckFar + (V.groundY - V.deckFar) * 0.60, seed:61 },
  { k:'champagne',rate:0.90, per:2900, w:62,  y:() => V.deckFar + (V.groundY - V.deckFar) * 0.56, seed:88 },
  { k:'gifts',    rate:0.90, per:2400, w:56,  y:() => V.deckFar + (V.groundY - V.deckFar) * 0.58, seed:71 }
];
function drawProps(){
  for (const p of PROPS){
    const im = ART[p.k];
    if (!im) continue;
    const per = p.per * V.SC, w = p.w * V.SC;
    const h = w * (im.naturalHeight / im.naturalWidth);
    const base = p.y();
    const off = ((-V.scroll * p.rate + p.seed * 37) % per + per) % per;
    for (let i = -1; i < Math.ceil(V.W / per) + 1; i++){
      const x = i * per + off;
      if (x < -w || x > V.W + w) continue;
      ctx.drawImage(im, x - w / 2, base - h, w, h);
    }
  }
  /* the air between her and the furniture. Without this everything back
     there is as crisp as she is and the depth collapses. */
  const haze = ctx.createLinearGradient(0, V.deckFar, 0, V.groundY);
  haze.addColorStop(0,   'rgba(78,44,126,.30)');
  haze.addColorStop(0.7, 'rgba(52,28,92,.10)');
  haze.addColorStop(1,   'rgba(40,20,72,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(-10, V.deckFar, V.W + 20, V.groundY - V.deckFar);
}
function drawForeground(){
  const per = 620 * V.SC;
  const off = ((-V.scroll * 1.55) % per + per) % per;
  const im = ART.planter;

  if (im){
    /* the real potted palm, close enough to the lens that its pot runs off
       the bottom of the screen and its fronds cut the corner of the frame */
    const h = V.H * 0.52;
    const w = h * (im.naturalWidth / im.naturalHeight);
    for (let i = -1; i < Math.ceil(V.W / per) + 1; i++){
      const x = i * per + off;
      if (x < -w || x > V.W + w) continue;
      /* only the top fronds come into frame, from below. Most of the plant is
         under the bottom edge - that is what says "a foot from the lens", and
         it keeps the thing from ever standing in front of her. */
      ctx.drawImage(im, x - w / 2, V.H - h * 0.30, w, h);
    }
    return;
  }

  for (let i = -1; i < Math.ceil(V.W / per) + 1; i++){
    const x = i * per + off;
    const w = 128 * V.SC, y = V.deckNear - 8 * V.SC;
    ctx.fillStyle = 'rgba(26,13,44,.96)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.10, y);
    ctx.bezierCurveTo(x - w * 0.04, y - 40 * V.SC, x + w * 0.22, y - 74 * V.SC, x + w * 0.50, y - 62 * V.SC);
    ctx.bezierCurveTo(x + w * 0.80, y - 80 * V.SC, x + w * 1.04, y - 34 * V.SC, x + w * 0.90, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(17,8,30,.98)';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 17 * V.SC, V.H + 30); ctx.lineTo(x + 17 * V.SC, V.H + 30);
    ctx.closePath(); ctx.fill();
  }
}

/* ==================================================  lighting the cast ===
   The two of them are flat cartoon cut-outs and everything behind them is a
   photograph. Dropped in raw they read as stickers, so nothing is blitted
   straight to the screen any more: a character goes onto a small offscreen
   first, is graded with the same key light the scene has, and is given a
   bright rim down the side the bulbs are on. Then it is drawn.

   Two reusable canvases, no allocation per frame, and no ctx.filter — that
   is still a frame-killer in Safari at this size.
   ===================================================================== */
let stCv = null, stCx = null, rmCv = null, rmCx = null;
function surface(which, w, h){
  const W2 = Math.ceil(w) + 8, H2 = Math.ceil(h) + 8;
  let cvs = which === 0 ? stCv : rmCv;
  if (!cvs){
    cvs = document.createElement('canvas');
    if (which === 0){ stCv = cvs; stCx = cvs.getContext('2d'); }
    else { rmCv = cvs; rmCx = cvs.getContext('2d'); }
  }
  if (cvs.width < W2 || cvs.height < H2){
    cvs.width  = Math.max(cvs.width,  W2);
    cvs.height = Math.max(cvs.height, H2);
  }
  const c = which === 0 ? stCx : rmCx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  c.clearRect(0, 0, cvs.width, cvs.height);
  return c;
}

/* the poolside: warm bulbs above and behind her, violet bounce off the water */
export const POOL_KEY = {
  top:'rgba(255,216,152,.22)', mid:'rgba(0,0,0,0)', bot:'rgba(44,18,84,.40)',
  rim:'rgba(226,196,255,.55)', rx:-3, ry:1
};
/* the last room: one small warm source, low and in front, and nothing else */
export const CANDLE_KEY = {
  top:'rgba(22,9,38,.38)', mid:'rgba(0,0,0,0)', bot:'rgba(255,182,96,.32)',
  rim:'rgba(255,206,140,.50)', rx:0, ry:-3
};

/** One sprite, or one cell of a strip, lit by the scene it is standing in. */
function litDraw(im, sx, sy, sw, sh, dx, dy, dw, dh, key){
  const k = key || POOL_KEY;
  const c = surface(0, dw, dh);
  c.drawImage(im, sx, sy, sw, sh, 4, 4, dw, dh);

  /* grade — only the pixels the sprite actually owns */
  c.globalCompositeOperation = 'source-atop';
  const g = c.createLinearGradient(0, 4, 0, 4 + dh);
  g.addColorStop(0, k.top);
  g.addColorStop(0.55, k.mid);
  g.addColorStop(1, k.bot);
  c.fillStyle = g;
  c.fillRect(0, 0, dw + 8, dh + 8);

  /* rim — the silhouette, minus the silhouette shifted away from the light,
     leaves exactly the crescent that light would catch */
  const r = surface(1, dw, dh);
  r.drawImage(im, sx, sy, sw, sh, 4, 4, dw, dh);
  r.globalCompositeOperation = 'destination-out';
  r.drawImage(im, sx, sy, sw, sh, 4 + k.rx, 4 + k.ry, dw, dh);
  r.globalCompositeOperation = 'source-atop';
  r.fillStyle = k.rim;
  r.fillRect(0, 0, dw + 8, dh + 8);

  c.globalCompositeOperation = 'lighter';
  c.drawImage(rmCv, 0, 0);

  ctx.drawImage(stCv, 0, 0, dw + 8, dh + 8, dx - 4, dy - 4, dw + 8, dh + 8);
}

/** A strip cell standing on (x,y), sized by height — the lit cellFrame. */
function litCell(im, cells, i, x, y, h, key){
  if (!im) return false;
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  const w = h * (cw / ch);
  litDraw(im, i * cw, 0, cw, ch, x - w / 2, y - h, w, h, key);
  return true;
}

/* a soft contact shadow, squashed the way a low light makes one */
function contact(x, y, w, a){
  if (a <= 0.002) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, w);
  g.addColorStop(0,   'rgba(8,3,18,' + a + ')');
  g.addColorStop(0.6, 'rgba(8,3,18,' + (a * 0.45) + ')');
  g.addColorStop(1,   'rgba(8,3,18,0)');
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, 0.22); ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, w, 0, 6.2832); ctx.fill();
  ctx.restore();
}

/* nobody stands perfectly still. Everyone gets a breath. */
function breath(seed, amt){
  const b = Math.sin(V.t * 1.6 + seed) * (amt == null ? 0.011 : amt);
  return { sx: 1 - b * 0.55, sy: 1 + b };
}

/* -------------------------------------------------------- the two of them */
export function drawFirass(){
  if (firass.in < 0.01) return;
  const sheet = firass.pose >= 0 ? ART.himposes : ART.himstand;
  if (!sheet) return;
  const hx = firass.x || V.W * 0.66;
  const y = V.groundY - (1 - firass.in) * V.H * 0.45;
  const h = 205 * V.SC;

  ctx.save();
  ctx.globalAlpha = Math.min(1, firass.in * 1.3);

  const g = ctx.createRadialGradient(hx, y - 80 * V.SC, 4, hx, y - 80 * V.SC, 120 * V.SC);
  g.addColorStop(0, 'rgba(201,164,255,.14)');
  g.addColorStop(1, 'rgba(201,164,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(hx, y - 80 * V.SC, 120 * V.SC, 0, 6.2832); ctx.fill();
  contact(hx, y + 2 * V.SC, 46 * V.SC, 0.30);

  /* he breathes, and shifts his weight about once every four seconds */
  const b = breath(1.7, 0.009);
  const sway = Math.sin(V.t * 0.45) * 0.9 * V.SC;
  ctx.translate(hx + sway, y);
  ctx.scale(b.sx, b.sy);
  ctx.translate(-hx, -y);

  if (firass.pose >= 0) litCell(ART.himposes, 4, firass.pose, hx, y, h, V.key);
  else {
    const w = h * (sheet.naturalWidth / sheet.naturalHeight);
    litDraw(sheet, 0, 0, sheet.naturalWidth, sheet.naturalHeight,
            hx - w / 2, y - h, w, h, V.key);
  }
  ctx.restore();
}

export function drawRunner(land){
  if (runner.in < 0.01) return;
  const air = V.groundY - runner.y;
  const y = runner.y - (1 - runner.in) * V.H * 0.55;
  const h = 152 * V.SC;
  const moving = V.speed > 60 * V.SC;

  /* the shadow shrinks and tightens as she leaves the stone */
  const k = Math.max(0, 1 - air / (190 * V.SC));
  contact(runner.x, V.groundY + 2 * V.SC, 40 * V.SC * (0.5 + k * 0.5), 0.30 * k);

  ctx.save();
  if (runner.hurt > 0 && Math.floor(runner.hurt * 18) % 2) ctx.globalAlpha = 0.35;

  /* WEIGHT. She stretches on the way up, squashes on the way in, and rides
     a stride bob along the ground. Without this she slides like a decal. */
  let sx = 1, sy = 1, rot = 0, dy = 0;
  if (!runner.ground){
    const rising = runner.vy < 0;
    const f = Math.min(1, Math.abs(runner.vy) / (700 * V.SC));
    sy = 1 + (rising ? 0.10 : 0.05) * f;
    sx = 1 - (rising ? 0.07 : 0.035) * f;
    rot = rising ? -0.05 : 0.035;
  } else if (land > 0){
    const f = land / 0.20;                      // 1 at the moment of impact
    sy = 1 - 0.16 * f;
    sx = 1 + 0.13 * f;
  } else if (moving && runner.pose < 0){
    dy  = -Math.abs(Math.sin(runner.ft * Math.PI)) * 3.2 * V.SC;
    rot = -0.045 * Math.min(1, V.speed / (620 * V.SC));    // leaning into it
  } else {
    const b = breath(0.4);
    sx = b.sx; sy = b.sy;
  }

  ctx.translate(runner.x, y + dy);
  ctx.rotate(rot);
  ctx.scale(sx, sy);
  ctx.translate(-runner.x, -y);

  let drew = false;
  if (runner.pose >= 0)
    drew = litCell(ART.poses, POSE_CELLS, runner.pose, runner.x, y, h * POSE_SCALE, V.key);
  else if (land > 0 && runner.ground)
    drew = litCell(ART.poses, POSE_CELLS, POSE.LAND, runner.x, y, h * POSE_SCALE, V.key);
  if (!drew)
    drew = litCell(ART.run, RUN_CELLS,
                   !runner.ground ? 4 : (Math.floor(runner.ft) % 4), runner.x, y, h, V.key);
  if (!drew){
    ctx.fillStyle = '#1d1030';
    ctx.beginPath(); ctx.arc(runner.x, y - h * 0.84, h * 0.14, 0, 6.2832); ctx.fill();
    ctx.fillRect(runner.x - h * 0.16, y - h * 0.70, h * 0.32, h * 0.44);
  }
  ctx.restore();
}

/** A low wide puff, the way a foot actually kicks dust — not a firework. */
export function dust(x, y, n, power){
  for (let i = 0; i < (n || 9); i++){
    const a = Math.PI + (Math.random() - 0.5) * 2.4;
    const s = (30 + Math.random() * 90) * (power || 1);
    parts.push({ x: x + (Math.random() - 0.5) * 18 * V.SC, y,
                 vx: Math.cos(a) * s * 1.5, vy: -Math.abs(Math.sin(a)) * s * 0.30,
                 life: 0.34 + Math.random() * 0.34, grav: 40,
                 r: (2.2 + Math.random() * 4.5) * V.SC, c:'176,150,206' });
  }
}

/* --------------------------------------------------------- compositing */
export function drawWorld(){
  drawSky();
  drawMoon();
  drawMountains();
  drawChalet();
  drawLights();
  drawBunting();
  drawPool();
  drawDeck();
  drawProps();
}
export function drawNear(){
  drawSparks();
  drawForeground();
  for (const p of parts){
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = 'rgb(' + p.c + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const f of floats){
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = '#ffe3ab';
    ctx.font = "800 19px 'Nunito',sans-serif";
    ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
function drawSparks(){
  for (const q of sparks){
    if (q.life <= 0) continue;
    ctx.globalAlpha = Math.max(0, q.life) * 0.9;
    ctx.fillStyle = `hsl(${q.hue},92%,${60 + q.life*20}%)`;
    ctx.beginPath(); ctx.arc(q.x, q.y, 1.9, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* Everything is painted in full colour and then drained, so the unlock is
   one number moving. Blend mode, not ctx.filter — Safari will not do the
   filter on a canvas this size without dropping frames. */
export function drain(){
  if (V.colour < 0.999){
    const k = 1 - V.colour;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = k;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, V.W, V.H);
    ctx.restore();
    ctx.fillStyle = 'rgba(6,4,12,' + (0.42 * k) + ')';
    ctx.fillRect(0, 0, V.W, V.H);
  }
  if (V.flash > 0.01){
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * V.flash) + ')';
    ctx.fillRect(0, 0, V.W, V.H);
  }
}


/* =====================================================  the picture pass ==
   Three things, in this order, over the finished frame: a cheap bloom that
   only the bright parts survive, a vignette, and a film grain. This is the
   whole difference between "a canvas with sprites on it" and something that
   looks photographed.

   The bloom is done by downscaling the frame to a quarter, multiplying it by
   itself (which squares every channel and so throws away everything that is
   not already bright), then adding it back scaled up — the upscale IS the
   blur. No ctx.filter anywhere: Safari cannot do one at this size and hold
   sixty frames.
   ===================================================================== */
let blCv = null, blCx = null, grCv = null, grKey = '';

function grainTile(){
  if (grCv) return grCv;
  grCv = document.createElement('canvas');
  grCv.width = grCv.height = 128;
  const g = grCv.getContext('2d');
  const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4){
    const v = 118 + (Math.random() * 76 - 38);
    d.data[i] = d.data[i+1] = d.data[i+2] = v;
    d.data[i+3] = 255;
  }
  g.putImageData(d, 0, 0);
  return grCv;
}

let vigG = null, vigKey = '';
export function postFX(){
  const bw = Math.max(2, Math.round(V.W / 4)), bh = Math.max(2, Math.round(V.H / 4));
  if (!blCv){ blCv = document.createElement('canvas'); blCx = blCv.getContext('2d'); }
  if (blCv.width !== bw || blCv.height !== bh){ blCv.width = bw; blCv.height = bh; }

  if (V.bloom > 0.01){
    blCx.setTransform(1, 0, 0, 1, 0, 0);
    blCx.globalCompositeOperation = 'source-over';
    blCx.globalAlpha = 1;
    blCx.clearRect(0, 0, bw, bh);
    blCx.drawImage(cv, 0, 0, bw, bh);
    blCx.globalCompositeOperation = 'multiply';   // square it: only highlights live
    blCx.drawImage(blCv, 0, 0);
    blCx.drawImage(blCv, 0, 0);                   // twice — the pool is bright
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = V.bloom;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(blCv, 0, 0, bw, bh, 0, 0, V.W, V.H);
    ctx.restore();
  }

  const vk = V.W + 'x' + V.H;
  if (vk !== vigKey){
    vigKey = vk;
    const r = Math.max(V.W, V.H) * 0.78;
    vigG = ctx.createRadialGradient(V.W * 0.5, V.H * 0.46, r * 0.28,
                                    V.W * 0.5, V.H * 0.46, r);
    vigG.addColorStop(0,   'rgba(0,0,0,0)');
    vigG.addColorStop(0.62,'rgba(0,0,0,.16)');
    vigG.addColorStop(1,   'rgba(0,0,0,.58)');
  }
  ctx.fillStyle = vigG;
  ctx.fillRect(0, 0, V.W, V.H);

  if (V.grain > 0.002){
    const t = grainTile();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = V.grain;
    /* the tile jumps every frame, or the grain reads as a texture, not film */
    const ox = -Math.floor(Math.random() * 128), oy = -Math.floor(Math.random() * 128);
    const pat = ctx.createPattern(t, 'repeat');
    ctx.translate(ox, oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, V.W + 128, V.H + 128);
    ctx.restore();
  }
}

export function invalidate(){ skyKey = poolKey = deckKey = ''; }

export function wrapped(text, cx, cy, maxW, lh){
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words){
    const t = line ? line + ' ' + w : w;
    if (line && ctx.measureText(t).width > maxW){ lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  const top = cy - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, top + i * lh));
}
