/* =========================================================================
   BEHIND THE ??? DOOR — the fall. Kept from V1 almost untouched, because
   it was the best thing in it.

   The camera rides BEHIND her shoulders, not above her face: the sprite is
   her back with her hair blown straight up, and the canopy is drawn from
   underneath so its lines converge onto her shoulders. Everything else
   streams out of one vanishing point.

   Two things that cost real time and must not be undone:
   - do NOT setPointerCapture on the canvas; it swallows the PULL button.
   - her hair waves from one still picture, cut into strips (`drawWavy`).
   ========================================================================= */
import { CONFIG } from './config.js';
import { ART, cellDraw } from './art.js';
import { V, ctx, burst, parts } from './world.js';
import { $, toast, wait } from './fx.js';
import { sfx, buzz } from './audio.js';

export const dive = {
  on:false, t:0, x:0, tx:0, vx:0, roll:0, chute:0, pulled:false,
  hazards:[], streaks:[], fields:[], stars:null, next:0, hit:0, done:false,
  vpx:0, vpy:0, hair:0, fieldT:0, streakT:0,
  onDone:null
};

/* where she sits in frame, and how far ahead of her the ground is */
const HER_Y = 0.50, HER_Z = 0.30, Z_NEAR = 0.09;
const MAXV = 640, KEY_V = 620;
const DRAG_GAIN = 1.35;
const HAIR_TO = 0.44, STRIPS = 22;

let drag = null;
const keyHeld = new Set();

function seedSky(){
  dive.stars = [];
  for (let i = 0; i < 46; i++)
    dive.stars.push({ x: Math.random(), y: Math.random(),
                      r: 0.6 + Math.random() * 1.1, tw: Math.random() * 6.283 });
}
/* one point of the world, at distance z, as a place on the screen */
function proj(ox, oy, z){
  const sc = 0.45 / Math.max(Z_NEAR, z);
  return [dive.vpx + ox * sc, dive.vpy + oy * sc, sc];
}

export function startDive(){
  /* forcing this from anywhere leaves whatever panel was up sitting on top
     of it — clear them before taking the screen over */
  document.querySelectorAll('.scene.on').forEach(s => s.classList.remove('on'));
  document.body.classList.remove('paneled');

  dive.on = true; dive.t = 0; dive.chute = 0; dive.pulled = false; dive.done = false;
  dive.x = dive.tx = V.W / 2; dive.vx = 0; dive.roll = 0; dive.hit = 0;
  dive.hazards = []; dive.streaks = []; dive.fields = []; dive.next = 0.9;
  dive.hair = 0; dive.fieldT = 0; dive.streakT = 0;
  drag = null; keyHeld.clear();
  seedSky();
  sfx.whoosh(); buzz([20, 60, 20]);
  toast(CONFIG.DIVE.intro[0], 1300);
  setTimeout(() => { if (dive.on) toast(CONFIG.DIVE.intro[1], 1400); }, 1500);
  setTimeout(() => { if (dive.on) toast(CONFIG.DIVE.hint, 2000); }, 3100);
  $('diveUI').classList.add('on');
  document.body.classList.add('diving');
}

function diveBy(dx){
  const edge = 104 * V.SC;            // her arm span, not her hips
  dive.tx = Math.max(edge, Math.min(V.W - edge, dive.tx + dx));
}

export function divePointerDown(e){ if (dive.on) drag = { id:e.pointerId, lastX:e.clientX }; }
export function divePointerMove(e){
  if (!dive.on || !drag || drag.id !== e.pointerId) return;
  diveBy((e.clientX - drag.lastX) * DRAG_GAIN);
  drag.lastX = e.clientX;
}
export function divePointerUp(e){ if (drag && drag.id === e.pointerId) drag = null; }
export function diveKeyDown(code){
  if (!dive.on) return;
  if (code === 'ArrowLeft'  || code === 'KeyA') keyHeld.add('L');
  if (code === 'ArrowRight' || code === 'KeyD') keyHeld.add('R');
  if (code === 'Enter' && dive.t / CONFIG.DIVE.seconds >= CONFIG.DIVE.pullAt) pullChute();
}
export function diveKeyUp(code){
  if (code === 'ArrowLeft'  || code === 'KeyA') keyHeld.delete('L');
  if (code === 'ArrowRight' || code === 'KeyD') keyHeld.delete('R');
}

export function pullChute(){
  if (!dive.on || dive.pulled) return;
  dive.pulled = true;
  sfx.whoosh(); sfx.good(); buzz([16, 60, 16, 60, 120]);
  burst(dive.x, V.H * HER_Y, '236,214,255', 30, 1.4);
  toast(CONFIG.DIVE.pulled, 2000);
  $('divePull').classList.remove('on');
  setTimeout(endDive, 3400);
}
async function endDive(){
  if (dive.done) return;
  dive.done = true;
  $('diveUI').classList.remove('on');
  $('divePull').classList.remove('on');
  document.body.classList.remove('diving');
  dive.on = false;
  await wait(200);
  if (dive.onDone) dive.onDone();
}

export function updateDive(dt){
  const D = CONFIG.DIVE;
  dive.t += dt;
  const k = Math.min(1, dive.t / D.seconds);
  dive.hair += dt;

  if (keyHeld.size) diveBy((keyHeld.has('R') - keyHeld.has('L')) * KEY_V * V.SC * dt);

  /* she does not snap to the finger, she swings under it */
  const nx = dive.x + (dive.tx - dive.x) * Math.min(1, dt * 9);
  const v  = (nx - dive.x) / Math.max(dt, 0.0001);
  dive.x = nx;
  dive.vx += (v - dive.vx) * Math.min(1, dt * 10);
  dive.roll += ((dive.vx / (MAXV * V.SC)) * 0.34 - dive.roll) * Math.min(1, dt * 7);
  if (dive.hit > 0) dive.hit -= dt;

  /* the camera hangs behind her, so the world slides the other way */
  dive.vpx = V.W / 2 - (dive.x - V.W / 2) * 0.42;
  dive.vpy = V.H * 0.30;

  const rush = dive.pulled ? 0.16 : 0.52 + k * 0.34;

  dive.next -= dt;
  if (!dive.pulled && dive.next <= 0){
    dive.next = 0.30 + Math.random() * 0.34;
    const a = Math.random() * 6.283, rr = 70 + Math.random() * 130;
    dive.hazards.push({
      ox: Math.cos(a) * rr * V.SC,
      oy: Math.sin(a) * rr * 0.7 * V.SC - 20 * V.SC,
      z: 1, base: (118 + Math.random() * 52) * V.SC,
      kind: Math.floor(Math.random() * 3),
      sp: 0.85 + Math.random() * 0.35
    });
  }
  for (const h of dive.hazards){
    const was = h.z;
    h.z -= rush * h.sp * dt;
    /* it counts the moment it reaches her, not before and not after */
    if (was > HER_Z && h.z <= HER_Z && dive.hit <= 0 && !dive.pulled){
      const pt = proj(h.ox, h.oy, HER_Z), r = h.base * pt[2] * 0.34;
      if (Math.abs(pt[0] - dive.x) < r + 44 * V.SC &&
          Math.abs(pt[1] - V.H * HER_Y) < r + 62 * V.SC){
        dive.hit = 0.8; V.shake = 14; buzz(40);
        sfx.clunk();
        burst(pt[0], pt[1], '236,214,255', 14, 0.9);
        h.dead = true;
      }
    }
  }
  dive.hazards = dive.hazards.filter(h => !h.dead && h.z > 0.15);

  if ((dive.fieldT -= dt) <= 0){
    dive.fieldT = 0.16;
    dive.fields.push({ ox:(Math.random() - 0.5) * 560 * V.SC,
                       oy:(70 + Math.random() * 190) * V.SC,
                       w:(110 + Math.random() * 180) * V.SC,
                       h:(14 + Math.random() * 22) * V.SC,
                       z:1, tone:Math.random() });
  }
  for (const f of dive.fields) f.z -= rush * 0.9 * dt;
  dive.fields = dive.fields.filter(f => f.z > Z_NEAR);

  if ((dive.streakT -= dt) <= 0){
    dive.streakT = 0.014;
    const a = Math.random() * 6.283;
    dive.streaks.push({ ox: Math.cos(a) * (40 + Math.random() * 90) * V.SC,
                        oy: Math.sin(a) * (40 + Math.random() * 90) * V.SC,
                        z:1, a: 0.10 + Math.random() * 0.22 });
  }
  for (const q of dive.streaks) q.z -= rush * 1.45 * dt;
  dive.streaks = dive.streaks.filter(q => q.z > Z_NEAR);

  if (dive.pulled) dive.chute = Math.min(1, dive.chute + dt * 2.2);

  if (!dive.pulled){
    $('divePull').classList.toggle('on', k >= D.pullAt);
    /* the safety net, if she is enjoying herself too much to pull it */
    if (dive.t > D.seconds + 3.5) pullChute();
  }
  $('diveBar').firstElementChild.style.height = (100 - k * 100) + '%';
}

/* Her hair is one still picture cut into strips and pushed about: the
   crown moves, the shoulders do not. */
function drawWavy(im, cx, cy, w, h, amp){
  const sw = im.naturalWidth, sh = im.naturalHeight, bh = sh / STRIPS;
  const tt = dive.hair;
  for (let i = 0; i < STRIPS; i++){
    const v = (i + 0.5) / STRIPS;
    const wgt = Math.max(0, 1 - v / HAIR_TO);
    const dx = Math.sin(tt * 3.4 + i * 0.62) * amp * wgt * wgt;
    ctx.drawImage(im, 0, i * bh, sw, bh + 1,
                  cx - w / 2 + dx, cy - h / 2 + i * (h / STRIPS), w, h / STRIPS + 1);
  }
}
function mixc(a, b, k){
  return 'rgb(' + Math.round(a[0]+(b[0]-a[0])*k) + ',' +
                  Math.round(a[1]+(b[1]-a[1])*k) + ',' +
                  Math.round(a[2]+(b[2]-a[2])*k) + ')';
}

export function drawDive(){
  const D = CONFIG.DIVE;
  const k = Math.min(1, dive.t / D.seconds);
  const hy = V.H * 0.16 + dive.roll * V.H * 0.05;

  const g = ctx.createLinearGradient(0, 0, 0, hy + 2);
  g.addColorStop(0, mixc([8,4,20],   [16,9,36],    k));
  g.addColorStop(1, mixc([64,32,92], [168,96,116], k));
  ctx.fillStyle = g; ctx.fillRect(0, 0, V.W, hy + 2);

  if (dive.stars){
    ctx.fillStyle = '#fff';
    for (const st of dive.stars){
      ctx.globalAlpha = (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(dive.hair * 2 + st.tw))) * (1 - k * 0.7);
      ctx.beginPath(); ctx.arc(st.x * V.W, st.y * hy, st.r * V.SC, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const gg = ctx.createLinearGradient(0, hy, 0, V.H);
  gg.addColorStop(0,    mixc([58,32,80], [150,92,110], k));
  gg.addColorStop(0.42, mixc([34,17,54], [104,62,94],  k));
  gg.addColorStop(1,    mixc([18,9,32],  [64,36,66],   k));
  ctx.fillStyle = gg; ctx.fillRect(0, hy, V.W, V.H - hy);

  for (const f of dive.fields){
    const pt = proj(f.ox, f.oy, f.z);
    if (pt[1] < hy) continue;
    ctx.globalAlpha = Math.min(0.45, (1 - f.z) * 0.5) * (0.3 + f.tone * 0.45) * (0.35 + k * 0.65);
    ctx.fillStyle = f.tone > 0.6 ? '#1d1130' : '#2a1940';
    ctx.beginPath();
    ctx.ellipse(pt[0], pt[1], f.w * pt[2] * 0.5, f.h * pt[2] * 0.5, 0, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(232,220,255,.75)';
  ctx.lineWidth = 1.5 * V.SC;
  for (const q of dive.streaks){
    const a1 = proj(q.ox, q.oy, q.z), a2 = proj(q.ox, q.oy, q.z * 1.30);
    ctx.globalAlpha = q.a * Math.min(1, (1 - q.z) * 2.2);
    ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const paint = h => {
    const pt = proj(h.ox, h.oy, h.z);
    ctx.globalAlpha = Math.min(1, (1 - h.z) * 3) * Math.max(0, Math.min(1, (h.z - 0.15) / 0.11));
    if (ART.hazards) cellDraw(ctx, ART.hazards, 3, h.kind, pt[0], pt[1], h.base * pt[2]);
    else { ctx.fillStyle = 'rgba(226,214,255,.5)';
           ctx.beginPath(); ctx.arc(pt[0], pt[1], h.base * pt[2] * 0.3, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  for (const h of dive.hazards) if (h.z >= HER_Z) paint(h);

  ctx.save();
  ctx.translate(dive.x, V.H * HER_Y);
  ctx.rotate(dive.roll * 0.55);
  if (dive.hit > 0 && Math.floor(dive.hit * 18) % 2) ctx.globalAlpha = 0.4;
  if (ART.diver){
    const w = 190 * V.SC * (1 - dive.chute * 0.30);
    const h2 = w * (ART.diver.naturalHeight / ART.diver.naturalWidth);
    if (dive.chute > 0.01 && ART.chute){
      const cw = 360 * V.SC * dive.chute;
      const chh = cw * (ART.chute.naturalHeight / ART.chute.naturalWidth);
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * Math.min(1, dive.chute * 1.6);
      ctx.drawImage(ART.chute, -cw / 2, -h2 * 0.02 - chh, cw, chh);
      ctx.globalAlpha = a0;
    }
    drawWavy(ART.diver, 0, 0, w, h2,
             (7 + Math.abs(dive.vx) / V.SC * 0.012) * V.SC * (1 - dive.chute * 0.7));
  } else {
    ctx.fillStyle = '#f3ecff';
    ctx.beginPath(); ctx.arc(0, 0, 26 * V.SC, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  for (const h of dive.hazards) if (h.z < HER_Z) paint(h);   // what she just missed

  if (!dive.pulled) drawSteerHint();

  for (const p of parts){
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = 'rgb(' + p.c + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* which way she is leaning, so a first-time thumb knows it worked */
function drawSteerHint(){
  const y = V.H * 0.74;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3 * V.SC; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const lean = Math.max(-1, Math.min(1, dive.vx / (MAXV * V.SC * 0.55)));
  for (const dir of [-1, 1]){
    const on = lean * dir > 0.08 ? Math.min(1, Math.abs(lean)) : 0;
    const x = dir < 0 ? 40 * V.SC : V.W - 40 * V.SC;
    ctx.globalAlpha = 0.18 + on * 0.7;
    for (let i = 0; i < 2; i++){
      const o = (i * 13 + on * 4) * V.SC * dir;
      ctx.beginPath();
      ctx.moveTo(x - 8 * V.SC * dir + o, y - 13 * V.SC);
      ctx.lineTo(x + 8 * V.SC * dir + o, y);
      ctx.lineTo(x - 8 * V.SC * dir + o, y + 13 * V.SC);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}
