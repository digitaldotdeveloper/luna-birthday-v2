/* =========================================================================
   LUNA.EXE — the spine.

   One requestAnimationFrame loop, one `mode`, and one async function that
   reads top to bottom in the order she experiences it. Every act loads its
   own pictures a beat before it needs them, so nothing but the first
   screen is ever waiting on the network.
   ========================================================================= */
import { CONFIG } from './config.js';
import { load, warm, src } from './art.js';
import { V, resize as worldResize, softResize, ctx, runner, firass, invalidate,
         drawWorld, drawNear, drawRunner, drawFirass, stepParticles,
         stepSparks, drain, POSE } from './world.js';
import { $, toast, wait, term, fxResize, fxFrame, ui } from './fx.js';
import { tone, sfx, music, muted } from './audio.js';
import { runAct1, runBoot } from './act1.js';
import { run, startRun, updateRun, drawRun, jump, release, retry } from './run.js';
import { dive, startDive, updateDive, drawDive, pullChute,
         divePointerDown, divePointerMove, divePointerUp,
         diveKeyDown, diveKeyUp } from './dive.js';
import { askColour, photoRecovery, memoryHunt, quiz, doors,
         candles, tickCake, finale, secretEnding } from './scenes.js';

/* act1 | world | run | dive — what the canvas and the thumb are doing */
let mode = 'act1';

/* ------------------------------------------------------------- layout */
function resizeAll(){
  worldResize();
  fxResize();
}
let reflow = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(reflow);
  reflow = requestAnimationFrame(() => {
    if (window.innerWidth === V.W && Math.abs(window.innerHeight - V.H) < 90){
      softResize(); fxResize(); return;
    }
    resizeAll();
  });
});
window.addEventListener('orientationchange', () => setTimeout(resizeAll, 250));

/* -------------------------------------------------------------- input */
const cv = $('c');
cv.addEventListener('pointerdown', e => {
  if (mode === 'run')  jump();
  if (mode === 'dive') divePointerDown(e);
}, { passive:true });
cv.addEventListener('pointermove', divePointerMove, { passive:true });
cv.addEventListener('pointerup',   e => { release(); divePointerUp(e); }, { passive:true });
cv.addEventListener('pointercancel', e => { release(); divePointerUp(e); }, { passive:true });
window.addEventListener('pointerup', divePointerUp, { passive:true });
/* the ripcord is its own button — do NOT capture the pointer on the canvas
   or this tap never arrives */
$('divePull').addEventListener('click', () => pullChute());

window.addEventListener('keydown', e => {
  if (e.code === 'Space'){ e.preventDefault(); if (mode === 'run') jump(); }
  diveKeyDown(e.code);
});
window.addEventListener('keyup', e => {
  if (e.code === 'Space') release();
  diveKeyUp(e.code);
});
$('retryBtn').onclick = () => retry();

/* --------------------------------------------------------- the loop -- */
let last = performance.now();
function frame(now){
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (run.slow > 0){ run.slow -= dt; dt *= 0.34; }      /* the near-miss hang */

  V.t += dt;
  V.shake *= Math.pow(0.0016, dt);
  if (V.unlocking) V.colour = Math.min(1, V.colour + dt * 1.15);
  if (V.flash > 0) V.flash -= dt * 2.2;
  if (mode !== 'act1') runner.in += (1 - runner.in) * Math.min(1, dt * 2.4);
  firass.in += ((firass.want || 0) - firass.in) * Math.min(1, dt * 3.2);

  if (mode === 'dive'){
    updateDive(dt);
  } else if (mode === 'run'){
    updateRun(dt);
  } else if (mode !== 'act1'){
    V.scroll += 55 * V.SC * dt;                          // the night keeps moving
  }
  stepParticles(dt);                                     // one owner, every frame
  stepSparks(dt, tone);
  tickCake(dt);

  /* -------- draw -------- */
  if (mode !== 'act1'){
    ctx.save();
    if (V.shake > 0.4)
      ctx.translate((Math.random() - 0.5) * V.shake, (Math.random() - 0.5) * V.shake);
    if (mode === 'dive'){
      drawDive();
    } else if (mode === 'run'){
      drawRun();
    } else {
      drawWorld();
      drawFirass();
      drawRunner(0);
      drawNear();
    }
    ctx.restore();
    if (mode !== 'dive') drain();
  }
  fxFrame(dt);
  requestAnimationFrame(frame);
}
/* ================================================================ story
   Read this function to know what the night is.

   Every act is named, and `?act=<name>` starts at that one — which is how
   any single scene gets tested without playing the twelve minutes in front
   of it. The names are: card world run photo hunt quiz doors cake finale
   secret.
   ==================================================================== */
const ACTS = ['card','world','run','photo','hunt','quiz','doors','cake','finale','secret'];

async function openWorld(){
  /* the doorway of light, and then the place behind it */
  await load('portal');
  const portal = document.createElement('img');
  portal.src = src('scenePortal');
  portal.alt = '';
  portal.decoding = 'async';
  portal.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:43;' +
    'opacity:0;transform:scale(1.02);transition:opacity 1s ease,transform 4.4s ease-in;';
  document.body.appendChild(portal);
  await wait(40);
  portal.style.opacity = '1';
  portal.style.transform = 'scale(1.9)';
  sfx.boot();
  await wait(2600);

  await load('world');
  mode = 'world';
  V.colour = 0;
  /* she is standing in it looking up, not frozen halfway through a stride */
  runner.pose = POSE.IDLE;
  invalidate();
  portal.style.transition = 'opacity 1.4s ease, transform 4.4s ease-in';
  portal.style.opacity = '0';
  term.close();
  await wait(1500);
  portal.remove();

  /* "WELCOME, LUNA." over a world with every colour taken out of it */
  term.el().innerHTML = '';
  $('term').classList.add('clear');
  term.open(false);
  await term.type(CONFIG.WELCOME, { speed:90, cls:'cap' });
  await wait(1500);
  await term.type(CONFIG.WELCOME2, { speed:44, cls:'big' });
  await wait(2000);
  term.close();
  $('term').classList.remove('clear');
  await wait(900);

  /* the gate. He is standing right there while she answers it. */
  firass.want = 1;
  firass.x = V.W * 0.66;
  runner.pose = POSE.IDLE;
  await askColour();
  firass.want = 0;
  V.unlocking = true;                 // her colour floods everything
  sfx.win();
  await wait(1400);
}

/** Drop straight into the world with the colour already on, for ?act=. */
async function skipToWorld(){
  $('act1').classList.add('dead');
  term.close();
  await load('world');
  mode = 'world';
  V.colour = 1; V.unlocking = true;
  invalidate();
  runner.pose = -1;
}

async function story(from){
  const at = Math.max(0, ACTS.indexOf(from));
  const doIt = name => ACTS.indexOf(name) >= at;

  if (doIt('card')){
    warm('portal');
    await runAct1();
    warm('world');
    await runBoot();
  }

  if (doIt('world') && at <= ACTS.indexOf('world')) await openWorld();
  else if (at > ACTS.indexOf('world')) await skipToWorld();

  if (doIt('run')){
    warm('run');
    await load('run');
    runner.pose = -1;
    mode = 'run';
    await new Promise(done => { run.onDone = done; startRun(); });
    mode = 'world';
    V.speed = 0;
  }

  if (doIt('photo')){
    warm('hunt');
    await photoRecovery();
  }

  if (doIt('hunt')){
    await load('hunt');
    warm('quiz');
    await memoryHunt();
  }

  if (doIt('quiz')){
    await load('quiz');
    warm('doors');
    await quiz();
  }

  if (doIt('doors')){
    await load('doors');
    warm('dive');
    await doors(async () => {
      await load('dive');
      mode = 'dive';
      await new Promise(done => { dive.onDone = done; startDive(); });
      mode = 'world';
    });
  }

  if (doIt('cake')){
    warm('cake');
    music(CONFIG.MUSIC_VOL * 0.85, 4000);
    await wait(600);
    await load('cake');
    await candles();
  }

  if (doIt('finale')){
    music(CONFIG.MUSIC_SOFT, 3000);
    await finale();
  }

  if (doIt('secret')) await secretEnding();
}

/* ----------------------------------------------------------------- boot */
resizeAll();
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { last = performance.now(); });
const startAt = new URLSearchParams(location.search).get('act') || 'card';
window.LUNA = { V, run, dive, runner, ACTS, mode: () => mode };
story(startAt).catch(err => {
  console.error('LUNA.EXE', err);
  /* if anything at all falls over, she still gets the last page */
  term.open(true);
  term.el().innerHTML =
    '<div class="cap">LUNA.EXE</div><div class="big">' + CONFIG.BYE + '</div>';
});
