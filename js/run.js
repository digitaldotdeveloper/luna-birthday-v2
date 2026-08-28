/* =========================================================================
   ACT THREE — the run.

   She runs the poolside. The card is not dead and it throws the one thing
   she will not drink at her. What she is picking up is not points: it is a
   photograph, coming back off a corrupted card one block at a time, which
   is what Act Six then opens.

   One thumb. Tap to jump, hold for height. A stumble costs a life, never
   her progress — starting the whole run again is the one thing this was
   never supposed to ask of her.
   ========================================================================= */
import { CONFIG } from './config.js';
import { ART } from './art.js';
import { V, ctx, runner, firass, parts, burst, float, dust, drawWorld, drawNear,
         drawRunner, drawFirass, POSE } from './world.js';
import { $, toast, taunt, wait } from './fx.js';
import { sfx, buzz } from './audio.js';

const BITS_PER_BLOCK = 3;
const JUMP_V = -830, GRAV = 2600, GRAV_HELD = 1700;

export const run = {
  on:false, over:false,
  bits:0, blocks:0, lives:3,
  obstacles:[], pickups:[],
  nextSpawn:0, lineIdx:0, tauntIdx:0, shakeIdx:0, hitIdx:0, comboIdx:0,
  combo:0, slow:0, land:0, outro:0,
  onDone:null, onLose:null
};

export function resetRun(keepProgress){
  run.obstacles = []; run.pickups = [];
  if (!keepProgress){ run.bits = 0; run.blocks = 0; run.lineIdx = 0; run.tauntIdx = 0; }
  run.lives = 3; run.combo = 0; run.slow = 0; run.land = 0; run.outro = 0;
  run.shakeIdx = run.shakeIdx || 0; run.hitIdx = 0; run.comboIdx = 0;
  run.over = false;
  V.scroll = 0; V.speed = 300 * V.SC; V.shake = 0;
  run.nextSpawn = V.W * 0.9;
  runner.y = V.groundY; runner.vy = 0; runner.ground = true;
  runner.ft = 0; runner.hurt = 0; runner.pose = -1;
  paintHUD();
}

export function paintHUD(){
  const blocks = Array.from({ length: CONFIG.SHARDS },
    (_, i) => `<i class="blk${i < run.blocks ? ' on' : ''}"></i>`).join('');
  $('hudLeft').innerHTML  = CONFIG.PHOTO_FILE + ' <b>' + run.blocks + '/' + CONFIG.SHARDS + '</b>';
  $('hudRight').innerHTML = blocks +
    '<span style="width:9px"></span>' +
    Array.from({ length:3 }, (_, i) =>
      `<i class="pip${i >= run.lives ? ' gone' : ''}"></i>`).join('');
}

export function startRun(){
  run.on = true;
  resetRun(false);
  $('hud').classList.add('on');
  toast(CONFIG.RUN_HINT, 1700);
}

export function jump(){
  if (!run.on || run.over || !runner.ground) return;
  runner.vy = JUMP_V * V.SC;
  runner.ground = false;
  runner.held = true;
  sfx.jump(); buzz(9);
}
export function release(){ runner.held = false; }

function spawnAhead(){
  const prog = run.blocks / CONFIG.SHARDS;
  const x = V.scroll + V.W + 60;
  const tall = Math.random() < 0.3 + prog * 0.2;
  run.obstacles.push({
    x, kind: Math.floor(Math.random() * 4), r: (tall ? 25 : 20) * V.SC, tall,
    spin: Math.random() * 6.28, ds: (Math.random() - 0.5) * 2.2
  });
  const rare = run.bits > 4 && Math.random() < 0.15;
  const n = rare ? 1 : 1 + (Math.random() < 0.45 ? 1 : 0);
  for (let i = 0; i < n; i++){
    const u = (i - (n - 1) / 2) / Math.max(1, n);
    run.pickups.push({ x: x + u * 108 * V.SC,
                       y: V.groundY - (168 + Math.cos(u * 2.6) * 22) * V.SC,
                       ph: Math.random() * 6.28, rare });
  }
  run.nextSpawn = x + (450 + Math.random() * 330) * V.SC * (1.22 - prog * 0.34);
}

export function updateRun(dt){
  const shakeIt = n => { V.shake = n; };

  if (run.over){
    run.outro = Math.min(1, run.outro + dt * 0.5);
    V.speed *= Math.pow(0.02, dt);
  } else {
    const prog = run.blocks / CONFIG.SHARDS;
    V.speed += ((300 + prog * 300) * V.SC - V.speed) * Math.min(1, dt * 0.7);
  }
  V.scroll += V.speed * dt;

  if (!runner.ground){
    runner.vy += (runner.held && runner.vy < 0 ? GRAV_HELD : GRAV) * V.SC * dt;
    runner.y += runner.vy * dt;
    if (runner.y >= V.groundY){
      runner.y = V.groundY; runner.vy = 0; runner.ground = true; runner.held = false;
      run.land = 0.20;
      sfx.land();
      V.shake = Math.max(V.shake, 3.5);        // it landed on something solid
      dust(runner.x, V.groundY, 10, 1);
    }
  }
  runner.ft += dt * (runner.ground ? V.speed / (52 * V.SC) : 0);
  if (runner.hurt > 0) runner.hurt -= dt;
  if (run.land > 0) run.land -= dt;

  if (!run.over && V.scroll + V.W > run.nextSpawn) spawnAhead();

  for (const o of run.obstacles){
    o.spin += o.ds * dt;
    if (o.dead || run.over) continue;
    const sx = o.x - V.scroll;
    /* cleared it by a hair — hang on the moment for a third of a second */
    if (!o.buzzed && !runner.ground && sx < runner.x && sx > runner.x - 30 * V.SC){
      const clear = (V.groundY - o.r * 2.0) - runner.y;
      o.buzzed = true;
      if (clear > 0 && clear < 26 * V.SC){
        run.slow = 0.34; sfx.near();
        burst(sx, V.groundY - o.r * 2, '255,240,205', 8, 0.6);
      }
    }
    if (runner.hurt > 0) continue;
    if (Math.abs(sx - runner.x) < o.r + 15 * V.SC && runner.y > V.groundY - o.r * 2.0){
      o.dead = true;
      run.lives--; V.shake = 18; runner.hurt = 1.15; run.combo = 0;
      sfx.hurt(); buzz([12, 40, 12]);
      if (run.shakeIdx < CONFIG.SHAKE_LINES.length)
        toast(CONFIG.SHAKE_LINES[run.shakeIdx++], 1600);
      burst(sx, V.groundY - o.r, '255,120,190', 20, 1.2);
      paintHUD();
      if (run.lives <= 0){ lose(); return; }
      toast(CONFIG.HIT_LINES[run.hitIdx++ % CONFIG.HIT_LINES.length], 1300);
    }
  }

  for (const p of run.pickups){
    if (p.dead) continue;
    p.ph += dt * 3;
    if (run.over) continue;
    const sx = p.x - V.scroll;
    if (Math.abs(sx - runner.x) < 36 * V.SC &&
        p.y > runner.y - 168 * V.SC && p.y < runner.y + 22 * V.SC){
      p.dead = true;
      const gain = p.rare ? 3 : 1;
      run.bits += gain;
      run.combo++;
      sfx.pop(); buzz(p.rare ? [8,30,8] : 7);
      burst(sx, p.y, p.rare ? '255,150,200' : '255,226,170', p.rare ? 26 : 12, p.rare ? 1.5 : 0.9);
      float(sx, p.y, '+' + gain, p.rare);

      const want = Math.min(CONFIG.SHARDS, Math.floor(run.bits / BITS_PER_BLOCK));
      if (want > run.blocks){
        run.blocks = want;
        sfx.key();
        V.flash = 0.5;
        toast('block ' + run.blocks + ' of ' + CONFIG.SHARDS, 1200);
      } else if (run.combo > 0 && run.combo % 7 === 0){
        toast(CONFIG.COMBO_LINES[run.comboIdx++ % CONFIG.COMBO_LINES.length], 1500);
      } else {
        const step = Math.floor(run.blocks * CONFIG.LINES.length / CONFIG.SHARDS);
        if (step > run.lineIdx && run.lineIdx < CONFIG.LINES.length){
          toast(CONFIG.LINES[run.lineIdx]); run.lineIdx = step;
        }
      }
      /* the card interrupts on the way, and gets nastier each time */
      if (run.tauntIdx < CONFIG.TAUNTS.length &&
          run.blocks >= Math.round(CONFIG.SHARDS * (run.tauntIdx + 1) / 4))
        taunt(CONFIG.TAUNTS[run.tauntIdx++], shakeIt);

      paintHUD();
      if (run.blocks >= CONFIG.SHARDS){ win(); return; }
    }
  }
  run.obstacles = run.obstacles.filter(o => !o.dead && o.x - V.scroll > -140);
  run.pickups   = run.pickups.filter(p => !p.dead && p.x - V.scroll > -140);
}

function lose(){
  run.over = true;
  $('hud').classList.remove('on');
  sfx.hurt();
  setTimeout(() => $('s-lost').classList.add('on'), 550);
}
export function retry(){
  $('s-lost').classList.remove('on');
  resetRun(true);              // she keeps every block she found
  run.over = false;
  $('hud').classList.add('on');
  toast('right where you left off.', 1500);
}

async function win(){
  run.over = true;
  sfx.win(); buzz([14, 60, 14, 60, 120]);
  run.obstacles = []; run.pickups = [];
  runner.pose = POSE.CHEER;
  burst(runner.x, V.groundY - 60 * V.SC, '255,226,170', 44, 1.8);
  $('hud').classList.remove('on');
  toast(CONFIG.RUN_DONE, 2200);
  await wait(2400);
  runner.pose = POSE.IDLE;
  await wait(900);
  run.on = false;
  if (run.onDone) run.onDone();
}

/* ------------------------------------------------------------- drawing */
function drawObstacle(o){
  const x = o.x - V.scroll, r = o.r;
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  ctx.beginPath(); ctx.ellipse(x, V.groundY + 3 * V.SC, r * 0.9, 7 * V.SC, 0, 0, 6.2832); ctx.fill();
  if (ART.shakes){
    const h = (o.tall ? 96 : 78) * V.SC;
    const cw = ART.shakes.naturalWidth / 4, ch = ART.shakes.naturalHeight;
    const w = h * (cw / ch);
    ctx.save();
    ctx.translate(x, V.groundY);
    ctx.rotate(Math.sin(o.spin * 2) * 0.07);
    ctx.drawImage(ART.shakes, o.kind * cw, 0, cw, ch, -w / 2, -h, w, h);
    ctx.restore();
    return;
  }
  ctx.fillStyle = '#ffd7e6';
  ctx.beginPath(); ctx.ellipse(x, V.groundY - r, r * 0.8, r, 0, 0, 6.2832); ctx.fill();
}

/* a block of the file, not a coin: a square, scanning */
function drawPickup(p){
  const x = p.x - V.scroll;
  const f = 0.72 + 0.28 * Math.sin(p.ph);
  const s = (p.rare ? 17 : 12) * V.SC;
  const col = p.rare ? '255,150,200' : '255,226,170';
  const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, s * 2.4);
  g.addColorStop(0, 'rgba(' + col + ',' + (0.5 * f) + ')');
  g.addColorStop(1, 'rgba(' + col + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, p.y, s * 2.4, 0, 6.2832); ctx.fill();
  ctx.save();
  ctx.translate(x, p.y);
  ctx.rotate(Math.sin(p.ph * 0.6) * 0.22);
  ctx.fillStyle = 'rgba(' + col + ',' + (0.30 + f * 0.45) + ')';
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * f) + ')';
  ctx.fillRect(-s / 2, -s / 2 + (s * ((p.ph * 0.4) % 1)), s, 1.6 * V.SC);
  ctx.restore();
}

/* he is where the run ends, holding the thing he came to give her */
function drawEnding(){
  if (run.outro <= 0.001) return;
  const e = Math.min(1, run.outro * 1.6);
  const from = V.W + 150 * V.SC, to = V.W * 0.70;
  const x = from - (from - to) * e;
  const y = V.groundY;
  const g = ctx.createRadialGradient(x, y - 90 * V.SC, 4, x, y - 90 * V.SC, 130 * V.SC);
  g.addColorStop(0, 'rgba(255,214,150,.18)');
  g.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y - 90 * V.SC, 130 * V.SC, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(10,4,22,.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 3 * V.SC, 30 * V.SC, 6 * V.SC, 0, 0, 6.2832); ctx.fill();
  if (ART.himcake){
    const h = 205 * V.SC, w = h * (ART.himcake.naturalWidth / ART.himcake.naturalHeight);
    ctx.drawImage(ART.himcake, x - w / 2, y - h, w, h);
  }
}

export function drawRun(){
  drawWorld();
  if (run.over && run.blocks >= CONFIG.SHARDS) drawEnding();
  drawFirass();
  for (const p of run.pickups)   drawPickup(p);
  for (const o of run.obstacles) drawObstacle(o);
  drawRunner(run.land);
  drawNear();
}
