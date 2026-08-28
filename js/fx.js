/* =========================================================================
   The bits of stagecraft every act shares: the two kinds of caption, the
   machine's typing, the sparkle trail, and one overlay canvas for anything
   that has to be drawn on top of everything else.
   ========================================================================= */
import { sfx, tone, buzz, muted } from './audio.js';

export const $ = id => document.getElementById(id);

/* ------------------------------------------------------------ captions */
let toastT = null;
export function toast(txt, ms){
  const el = $('toast');
  if (!txt){ el.classList.remove('on'); return; }
  el.innerHTML = txt;
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), ms || 1900);
}

let tauntT = null;
export function taunt(txt, shakeIt){
  const el = $('taunt');
  el.textContent = txt;
  el.classList.add('on');
  buzz([20, 40, 20]);
  tone(150, 0, 0.5, { type:'square', gain:0.1, bad:true, slide:80 });
  if (shakeIt) shakeIt(12);
  clearTimeout(tauntT);
  tauntT = setTimeout(() => el.classList.remove('on'), 1500);
}

export function note(id, html){ $(id).innerHTML = html || '&nbsp;'; }

/* How much interface is left. The night turns this down to nothing. */
export function ui(level){
  document.documentElement.style.setProperty('--ui', String(level));
}

/* ==========================================================  terminal ===
   The machine talks in a monospace font on a black screen. Used three
   times: when the card dies, when the world boots, and at the very end.
   ===================================================================== */
export const term = {
  el(){ return $('termInner'); },
  open(plain){
    $('term').classList.add('on');
    $('term').classList.toggle('plain', !!plain);
  },
  close(){ $('term').classList.remove('on'); },
  clear(){ this.el().innerHTML = ''; },
  html(h){ this.el().innerHTML = h; },

  /** Type one line, character by character. */
  type(text, opt){
    const o = opt || {};
    const el = this.el();
    const row = document.createElement('div');
    if (o.cls) row.className = o.cls;
    el.appendChild(row);
    return new Promise(res => {
      if (!text){ res(row); return; }
      let i = 0;
      const speed = o.speed || 34;
      row.classList.add('caret');
      const step = () => {
        row.textContent = text.slice(0, ++i);
        if (i % 2 === 0) sfx.type();
        if (i < text.length) setTimeout(step, speed);
        else { row.classList.remove('caret'); res(row); }
      };
      setTimeout(step, o.delay || 0);
    });
  },

  /** Type a whole script. Each entry is a string, or [text, options]. */
  async script(lines, gap){
    for (const l of lines){
      const [text, opt] = Array.isArray(l) ? l : [l, null];
      await this.type(text, opt);
      await wait((opt && opt.after) != null ? opt.after : (gap == null ? 620 : gap));
    }
  }
};

export function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

/* ------------------------------------------------------ sparkle trail --
   2005 websites did this to your cursor and it was unforgivable, which is
   exactly why it is here. It is removed the moment the card dies.        */
const SPARKS = ['✨','⭐','💫','🌟'];
let sparkOn = false, lastSpark = 0;
function sparkAt(x, y){
  const now = performance.now();
  if (now - lastSpark < 55) return;
  lastSpark = now;
  const s = document.createElement('i');
  s.className = 'sparkle';
  s.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
  s.style.left = x + 'px';
  s.style.top  = y + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 760);
}
function sparkMove(e){ if (sparkOn) sparkAt(e.clientX, e.clientY); }
export function sparkles(on){
  sparkOn = on;
  if (on){
    window.addEventListener('pointermove', sparkMove, { passive:true });
    window.addEventListener('pointerdown', sparkMove, { passive:true });
  } else {
    window.removeEventListener('pointermove', sparkMove);
    window.removeEventListener('pointerdown', sparkMove);
    document.querySelectorAll('.sparkle').forEach(s => s.remove());
  }
}

/* ==================================================  the overlay canvas ==
   #fx sits above everything. Two things live on it: the cracks that split
   the card open, and the field of pixels that rushes past on the way in.
   ===================================================================== */
const fx = $('fx');
const fxc = fx.getContext('2d');
let FW = 0, FH = 0, FDPR = 1;
let cracks = [], rush = [], rushOn = false;

export function fxResize(){
  FDPR = Math.min(window.devicePixelRatio || 1, 2);
  FW = window.innerWidth; FH = window.innerHeight;
  fx.width = Math.round(FW * FDPR); fx.height = Math.round(FH * FDPR);
  fxc.setTransform(FDPR, 0, 0, FDPR, 0, 0);
}

export function crack(ox, oy){
  cracks = [];
  for (let i = 0; i < 13; i++){
    const pts = [{ x:ox, y:oy }];
    let a = (i / 13) * 6.2832 + Math.random() * 0.5, r = 0;
    for (let s = 0; s < 7; s++){
      r += Math.max(FW, FH) * (0.055 + Math.random() * 0.07);
      a += (Math.random() - 0.5) * 0.75;
      pts.push({ x: ox + Math.cos(a) * r, y: oy + Math.sin(a) * r });
    }
    cracks.push({ pts, grow:0, sp: 2.4 + Math.random() * 1.6 });
  }
}
export function clearCracks(){ cracks = []; }

/** The pixels of the dead website, blowing past the camera. */
export function startRush(){
  rush = [];
  for (let i = 0; i < 340; i++)
    rush.push({ a: Math.random() * 6.2832, r: 0.04 + Math.random() * 0.55,
                z: Math.random(), sp: 0.35 + Math.random() * 0.85,
                s: 3 + Math.random() * 7,
                c: Math.random() < 0.35 ? '255,225,160' : '196,150,255' });
  rushOn = true;
}
export function stopRush(){ rushOn = false; rush = []; }

export function fxFrame(dt){
  fxc.clearRect(0, 0, FW, FH);

  if (rushOn){
    const cx = FW / 2, cy = FH * 0.46;
    for (const p of rush){
      p.z += dt * p.sp;
      if (p.z > 1){ p.z = 0; p.a = Math.random() * 6.2832; p.r = 0.04 + Math.random() * 0.55; }
      const k = p.z * p.z;
      const d = k * Math.max(FW, FH) * 0.95;
      const x = cx + Math.cos(p.a) * d * p.r * 2.4;
      const y = cy + Math.sin(p.a) * d * p.r * 2.4;
      if (x < -40 || x > FW + 40 || y < -40 || y > FH + 40) continue;
      const s = p.s * (0.3 + k * 2.6);
      fxc.globalAlpha = Math.min(1, k * 1.9) * 0.9;
      fxc.fillStyle = 'rgb(' + p.c + ')';
      fxc.fillRect(x - s / 2, y - s / 2, s, s);
    }
    fxc.globalAlpha = 1;
  }

  if (cracks.length){
    fxc.save(); fxc.lineCap = 'round';
    for (const c of cracks){
      c.grow = Math.min(1, c.grow + dt * c.sp);
      const n = c.pts.length - 1, upto = c.grow * n;
      fxc.beginPath(); fxc.moveTo(c.pts[0].x, c.pts[0].y);
      for (let i = 1; i <= n; i++){
        if (i <= upto) fxc.lineTo(c.pts[i].x, c.pts[i].y);
        else {
          const f = upto - (i - 1);
          if (f <= 0) break;
          fxc.lineTo(c.pts[i-1].x + (c.pts[i].x - c.pts[i-1].x) * f,
                     c.pts[i-1].y + (c.pts[i].y - c.pts[i-1].y) * f);
          break;
        }
      }
      fxc.strokeStyle = 'rgba(255,255,255,.92)'; fxc.lineWidth = 3.4; fxc.stroke();
      fxc.strokeStyle = 'rgba(190,150,255,.55)'; fxc.lineWidth = 8;   fxc.stroke();
    }
    fxc.restore();
  }
}
