/* =========================================================================
   Sound.

   ONE song, and it is "telepatía". It starts when the colour does and it
   never stops again — every scene change is a volume ramp, never a
   pause/play, so the track keeps running underneath the whole night.
   Everything else in here is a few oscillators; there is no second song
   and there never should be.
   ========================================================================= */
import { CONFIG } from './config.js';

let AC = null;
export let muted = false;

export function ac(){
  if (!AC){
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}

/* one cheap voice. `bad` adds the detuned second oscillator that gives the
   2005 card its square-wave MIDI stink. */
export function tone(freq, when, dur, opt){
  if (muted) return;
  const a = ac(); if (!a) return;
  const o = opt || {};
  const t0 = a.currentTime + when;
  const g = a.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(o.gain || 0.13, t0 + 0.014);
  g.gain.setValueAtTime(o.gain || 0.13, t0 + dur * 0.72);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(a.destination);
  const mk = det => {
    const osc = a.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(24, o.slide), t0 + dur);
    osc.detune.value = det;
    osc.connect(g); osc.start(t0); osc.stop(t0 + dur + 0.02);
  };
  mk(0);
  if (o.bad) mk(11);
}

export function noise(when, dur, gain, hp){
  if (muted) return;
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + when;
  const n = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 700;
  const g = a.createGain(); g.gain.value = gain || 0.2;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start(t0);
}

const N = { G4:392, A4:440, B4:493.88, C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99 };
/* The card's own music. Deliberately four bars of nothing. */
const MELODY = [[N.G4,.75],[N.G4,.25],[N.A4,1],[N.G4,1],[N.C5,1],[N.B4,1.6]];
const BEAT = 0.30;

export function playCheesy(){
  let t = 0.25;
  for (const [f, b] of MELODY){
    tone(f, t, b * BEAT * 0.92, { type:'square', gain:0.1, bad:true });
    t += b * BEAT;
  }
  for (let b = 0; b < Math.ceil(t / BEAT); b++)      // the drum machine from hell
    noise(0.25 + b * BEAT, 0.05, b % 2 ? 0.05 : 0.09, b % 2 ? 3800 : 900);
  return t + 0.4;
}
export function warpDown(){                          // the tape dying
  tone(N.C5, 0, 1.9, { type:'square', gain:0.13, bad:true, slide:38 });
  tone(N.G4, 0.05, 1.9, { type:'sawtooth', gain:0.07, slide:26 });
}

export const sfx = {
  jump(){ tone(430, 0, 0.13, { type:'triangle', gain:0.1, slide:760 }); },
  land(){ noise(0, 0.07, 0.07, 400); },
  candle(i){ tone(560 + (i % 8) * 46, 0, 0.16, { type:'triangle', gain:0.12 }); },
  hurt(){ noise(0, 0.26, 0.22, 240); tone(130, 0, 0.3, { type:'sawtooth', gain:0.14, slide:52 }); },
  near(){ tone(1180, 0, 0.16, { type:'sine', gain:0.09, slide:1760 }); },
  pop(){ tone(760 + Math.random() * 260, 0, 0.11, { type:'triangle', gain:0.13 }); },
  shatter(){ noise(0, 0.6, 0.34, 1800); noise(0.08, 0.4, 0.2, 900); },
  thud(){ tone(74, 0, 0.42, { type:'sine', gain:0.3, slide:36 }); noise(0, 0.18, 0.18, 200); },
  win(){ [0,130,260,430].forEach((d,i) =>
           tone([523.25,659.25,783.99,1046.5][i], d/1000, 0.6, { type:'triangle', gain:0.14 })); },
  click(){ tone(880, 0, 0.05, { type:'square', gain:0.06 }); },
  clunk(){ tone(180, 0, 0.09, { type:'square', gain:0.08, slide:120 }); noise(0, 0.04, 0.05, 1200); },
  pick(){  tone(700 + Math.random() * 200, 0, 0.11, { type:'triangle', gain:0.1 }); },
  good(){  [0,110,220].forEach((d,i) =>
             tone([659.25,783.99,1046.5][i], d/1000, 0.42, { type:'triangle', gain:0.1 })); },
  bad(){   tone(180, 0, 0.2, { type:'sawtooth', gain:0.09, slide:110 }); },
  key(){   [0,90,180,300].forEach((d,i) =>
             tone([523.25,659.25,783.99,1318.5][i], d/1000, 0.5, { type:'triangle', gain:0.1 })); },
  whoosh(){ noise(0, 0.55, 0.11, 260); },
  alarm(){ for (let i = 0; i < 5; i++)
             tone(i % 2 ? 740 : 560, i * 0.16, 0.15, { type:'square', gain:0.08 }); },
  /* the new vocabulary V2 needs */
  type(){  tone(1500 + Math.random()*300, 0, 0.02, { type:'square', gain:0.022 }); },
  door(){  noise(0, 0.22, 0.10, 180); tone(96, 0, 0.5, { type:'sine', gain:0.16, slide:58 }); },
  glitch(){ noise(0, 0.14, 0.24, 2400); tone(70 + Math.random()*90, 0, 0.16,
              { type:'sawtooth', gain:0.13, bad:true, slide:1500 }); },
  boot(){  tone(392, 0, 0.5, { type:'sine', gain:0.09 });
           tone(587.33, 0.18, 0.6, { type:'sine', gain:0.07 }); },
  wick(){  noise(0, 0.11, 0.045, 2600); tone(880 + Math.random()*200, 0, 0.09,
              { type:'sine', gain:0.05, slide:1500 }); },
  blow(){  noise(0, 0.8, 0.16, 300); }
};

export function buzz(p){ if (navigator.vibrate) try { navigator.vibrate(p); } catch(e){} }

/* ---------------------------------------------------------- the song ---
   Safari will not play an <audio> that was not started from a tap, and it
   will not start one that has downloaded nothing. So her very first tap on
   the 2005 button primes it, and the real play() happens inside the tap
   that picks purple.                                                     */
const bgm = document.getElementById('bgm');
let fadeTimer = null;
let started = false;

export function primeMusic(){
  if (!bgm) return;
  bgm.preload = 'auto';
  bgm.volume = 0;
  try { bgm.load(); } catch(e){}
  const pr = bgm.play();
  if (pr && pr.then) pr.then(() => bgm.pause()).catch(() => {});
  else { try { bgm.pause(); } catch(e){} }
}

/* ramp to a level over `ms`. Never pauses, never restarts, never reloads. */
export function music(level, ms){
  if (!bgm) return;
  clearInterval(fadeTimer);
  if (muted) return;
  const target = Math.max(0, Math.min(1, level));
  const steps = Math.max(1, Math.round((ms || 1200) / 50));
  const from = bgm.volume;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    const k = i / steps;
    bgm.volume = Math.max(0, Math.min(1, from + (target - from) * k));
    if (i >= steps) clearInterval(fadeTimer);
  }, 50);
}

/* the one and only start. Must be called from inside a real tap. */
export function startMusic(){
  if (!bgm || muted || started) return;
  started = true;
  bgm.volume = 0;
  const pr = bgm.play();
  if (pr && pr.catch) pr.catch(() => { started = false; });
  music(CONFIG.MUSIC_VOL, 2600);
}
export function musicStarted(){ return started; }

/* ------------------------------------------------------------- mute --- */
const muteBtn = document.getElementById('mute');
if (muteBtn){
  muteBtn.onclick = e => {
    e.stopPropagation();
    muted = !muted;
    muteBtn.textContent = muted ? '♩' : '♪';
    muteBtn.style.color = muted ? '#6a5f80' : '';
    if (!bgm) return;
    clearInterval(fadeTimer);
    if (muted){ bgm.pause(); }
    else if (started){ bgm.play().catch(() => {}); music(CONFIG.MUSIC_VOL, 700); }
  };
}

/* a phone that locks its screen should not come back to silence */
document.addEventListener('visibilitychange', () => {
  if (!bgm || muted || !started) return;
  if (document.hidden) bgm.pause();
  else bgm.play().catch(() => {});
});
