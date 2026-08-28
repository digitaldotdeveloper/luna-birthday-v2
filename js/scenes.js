/* =========================================================================
   The DOM acts: the colour gate, the photo coming back, the room she has
   to look around, the quiz, the four doors, twenty-three candles, and the
   two endings.

   Each one is an async function that owns the screen while it runs and
   resolves when it is finished, so main.js reads as the story does.
   ========================================================================= */
import { CONFIG } from './config.js';
import { ART, load, warm, src, cellBg } from './art.js';
import { V, runner, firass, POSE, POSE2, burst } from './world.js';
import { $, toast, note, wait, ui, term } from './fx.js';
import { sfx, tone, noise, buzz, music, startMusic, muted } from './audio.js';

/* ---------------------------------------------------------- plumbing -- */
function show(id){
  document.querySelectorAll('.scene').forEach(s => { if (s.id !== id) s.classList.remove('on'); });
  $(id).classList.add('on');
  document.body.classList.add('paneled');
}
function hide(id){
  $(id).classList.remove('on');
  if (!document.querySelector('.scene.on')) document.body.classList.remove('paneled');
}
const pick = a => a[Math.floor(Math.random() * a.length)];

/* =======================================================================
   THE GATE — the world stays drained until she says her own colour
   ===================================================================== */
export function askColour(){
  return new Promise(res => {
    $('askTitle').textContent = CONFIG.ASK_TITLE;
    $('askBody').innerHTML    = CONFIG.ASK_BODY;
    const box = $('swatches');
    box.innerHTML = '';
    const opts = [
      { c:'rose', hex:'#ff7aa8' }, { c:'teal', hex:'#3ec9c0' },
      { c:'purple', hex:'#8b5cf6' }, { c:'gold', hex:'#ffcf6a' }
    ];
    for (let i = opts.length - 1; i > 0; i--){        // never muscle memory
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    let wrongs = 0;
    for (const o of opts){
      const b = document.createElement('button');
      b.className = 'sw';
      b.style.setProperty('--sw', o.hex);
      b.setAttribute('aria-label', o.c);
      b.onclick = () => {
        if (o.c === CONFIG.ASK_ANSWER){
          startMusic();                 // inside the tap, or Safari refuses
          b.classList.add('right');
          $('askReply').textContent = CONFIG.ASK_RIGHT;
          tone(523.25, 0, 0.5, { type:'triangle', gain:0.13 });
          tone(783.99, 0.09, 0.6, { type:'triangle', gain:0.11 });
          buzz([14, 50, 14]);
          box.querySelectorAll('.sw').forEach(s => s.onclick = null);
          setTimeout(() => { hide('s-ask'); res(); }, 900);
        } else {
          b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
          $('askReply').textContent = CONFIG.ASK_WRONG[wrongs++ % CONFIG.ASK_WRONG.length];
          tone(180, 0, 0.2, { type:'sawtooth', gain:0.1, slide:110 });
          buzz(40);
        }
      };
      box.appendChild(b);
    }
    $('askReply').innerHTML = '&nbsp;';
    show('s-ask');
  });
}

/* =======================================================================
   ACT 6 — the photo, coming off a card that nearly lost it.
   The picture is never covered with text: the interface is a thin frame
   around it and then it gets out of the way.
   ===================================================================== */
export function photoRecovery(){
  return new Promise(res => {
    show('s-photo');
    $('recName').textContent = CONFIG.PHOTO_FILE;
    $('recCap').textContent  = CONFIG.PHOTO_CAPTION;
    $('recCap').classList.remove('on');
    $('recImg').classList.remove('on');
    $('recCv').classList.remove('off');
    $('recScan').classList.remove('off');
    $('recMiss').classList.remove('on');

    const cv = $('recCv'), c = cv.getContext('2d');
    const frame = $('recFrame');
    const w = cv.width  = Math.max(160, Math.round(frame.clientWidth));
    const h = cv.height = Math.max(120, Math.round(frame.clientHeight));

    const im = new Image();
    let ok = false, done = false;
    im.onload  = () => { ok = true; };
    im.onerror = () => { ok = false; };
    im.src = CONFIG.PHOTO;

    let p = 0, stall = 0;
    const bar = $('recBar').firstElementChild;

    const noiseRow = (y, hh) => {
      const d = c.createImageData(w, hh);
      for (let i = 0; i < d.data.length; i += 4){
        const v = 20 + Math.random() * 90;
        d.data[i] = v * 0.7; d.data[i+1] = v * 0.6; d.data[i+2] = v;
        d.data[i+3] = 255;
      }
      c.putImageData(d, 0, y);
    };

    const step = () => {
      if (done) return;
      if (stall > 0){ stall--; }
      else { p = Math.min(1, p + 0.012 + Math.random() * 0.03);
             if (Math.random() < 0.06) stall = 8 + Math.floor(Math.random() * 14); }

      const cut = Math.round(h * p);
      /* what has arrived, drawn like a picture coming down a slow line */
      if (ok && cut > 0){
        const sr = im.naturalWidth / im.naturalHeight, dr = w / h;
        let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
        if (sr > dr){ sw = im.naturalHeight * dr; sx = (im.naturalWidth - sw) / 2; }
        else { sh = im.naturalWidth / dr; sy = (im.naturalHeight - sh) / 2; }
        c.drawImage(im, sx, sy, sw, sh * p, 0, 0, w, cut);
      } else if (cut > 0){
        c.fillStyle = '#2a1940'; c.fillRect(0, 0, w, cut);
      }
      if (cut < h) noiseRow(cut, Math.min(h - cut, h));
      /* the block that is arriving right now */
      c.fillStyle = 'rgba(255,217,138,.35)';
      c.fillRect(0, cut, w, 2);

      bar.style.width = Math.round(p * 100) + '%';
      $('recPct').textContent = Math.round(p * 100) + '%';
      if (Math.random() < 0.25) sfx.type();

      if (p >= 1){ finish(); return; }
      requestAnimationFrame(step);
    };

    const finish = async () => {
      done = true;
      sfx.good(); buzz([10, 40, 10]);
      if (ok){
        $('recImg').src = CONFIG.PHOTO;
        $('recImg').classList.add('on');
      } else {
        $('recMiss').classList.add('on');
      }
      $('recCv').classList.add('off');
      $('recScan').classList.add('off');
      await wait(700);
      $('recCap').classList.add('on');
      await wait(3600);
      hide('s-photo');
      await wait(600);
      toast(CONFIG.PHOTO_AFTER, 2600);
      await wait(2000);
      res();
    };
    requestAnimationFrame(step);
  });
}

/* =======================================================================
   ACT 5 — the room. Three of the six things in here are theirs.
   Every position is a percentage of the picture, so the objects stay on
   the furniture whatever the crop does on a given phone.
   ===================================================================== */
const SPOTS = [
  { x:31, y:77, s:19 },   // 0 bracelet — on the coffee table
  { x:20, y:59, s:17 },   // 1 camera    — on the sideboard
  { x:68, y:60, s:16 },   // 2 car       — out past the glass, on the terrace
  { x:87, y:34, s:15 },   // 3 moon      — beside the real one
  { x:76, y:73, s:16 },   // 4 sunglasses— on the arm of the sofa
  { x:47, y:81, s:17 }    // 5 pizza     — on the table, obviously
];

export function memoryHunt(){
  return new Promise(res => {
    show('s-hunt');
    $('huntTitle').textContent = CONFIG.HUNT_TITLE;
    $('huntSub').textContent   = CONFIG.HUNT_SUB;
    $('huntBg').src = src('sceneHunt');
    const need = CONFIG.OBJECTS.filter(o => o.key).length;
    let got = 0;
    $('huntCount').textContent = '0 / ' + need;
    note('huntNote', '');

    const wrap = $('huntSpots');
    wrap.innerHTML = '';
    CONFIG.OBJECTS.forEach((o, n) => {
      const s = SPOTS[n] || { x:50, y:50, s:18 };
      const b = document.createElement('button');
      b.className = 'spot';
      b.setAttribute('aria-label', o.name);
      b.style.left = s.x + '%';
      b.style.top  = s.y + '%';
      b.style.width = s.s + '%';
      b.style.animationDelay = (n * 0.42) + 's';
      b.setAttribute('style', b.getAttribute('style') + ';' + cellBg('objects', 6, o.i));
      b.onclick = async () => {
        if (b.dataset.done) return;
        b.dataset.done = '1';
        if (o.key){
          b.classList.add('hit');
          got++;
          sfx.good(); buzz([10, 40, 10]);
          $('huntStage').classList.add('zoom');
          setTimeout(() => $('huntStage').classList.remove('zoom'), 900);
          $('huntCount').textContent = got + ' / ' + need;
          note('huntNote', o.line + ' &nbsp;<b>' + (CONFIG.HUNT_PIECE[got - 1] || '') + '</b>');
          if (got >= need){
            await wait(2300);
            hide('s-hunt');
            await wait(600);
            toast(CONFIG.HUNT_AFTER, 2400);
            await wait(2100);
            res();
          }
        } else {
          b.classList.add('dud');
          b.dataset.done = '';          // she can poke it again if she likes
          sfx.pick();
          note('huntNote', o.line);
        }
      };
      wrap.appendChild(b);
    });
  });
}

/* =======================================================================
   ACT 7 — how well has he been paying attention
   ===================================================================== */
export function quiz(){
  return new Promise(res => {
    let qi = 0, rightIdx = 0, wrongIdx = 0;
    $('quizTitle').textContent = CONFIG.QUIZ_TITLE;
    $('quizWho').setAttribute('style', cellBg('himposes', 4, 0));
    setTimeout(() => $('quizWho').classList.add('on'), 350);

    const face = i => $('quizWho').setAttribute('style', cellBg('himposes', 4, i));

    const paint = () => {
      const q = CONFIG.QUESTIONS[qi];
      $('quizDots').innerHTML = CONFIG.QUESTIONS
        .map((_, n) => `<i class="${n <= qi ? 'on' : ''}"></i>`).join('');
      $('quizQ').textContent = q.q;
      const box = $('quizOpts');
      box.innerHTML = '';
      box.dataset.locked = '';
      q.o.forEach((text, n) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.textContent = text;
        b.onclick = async () => {
          if (box.dataset.locked) return;
          if (n === q.a){
            box.dataset.locked = '1';
            b.classList.add('right');
            sfx.good();
            face(1);                                   // he points
            note('quizNote', '<b>' + CONFIG.QUIZ_RIGHT[rightIdx++ % CONFIG.QUIZ_RIGHT.length] +
                             '</b> &nbsp;' + (q.after || ''));
            await wait(1900);
            qi++;
            if (qi < CONFIG.QUESTIONS.length){ note('quizNote', ''); face(0); paint(); }
            else {
              face(2);                                 // hands behind his head
              hide('s-quiz');
              $('quizWho').classList.remove('on');
              await wait(500);
              toast(CONFIG.QUIZ_RESULT[0], 1600);
              await wait(1700);
              toast(CONFIG.QUIZ_RESULT[1], 2600);
              await wait(2400);
              res();
            }
          } else {
            b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
            sfx.bad(); buzz(35);
            face(0);                                   // he shrugs
            note('quizNote', '<b>' + CONFIG.QUIZ_WRONG[wrongIdx++ % CONFIG.QUIZ_WRONG.length] + '</b>');
          }
        };
        box.appendChild(b);
      });
    };
    note('quizNote', '');
    paint();
    show('s-quiz');
  });
}

/* =======================================================================
   ACT 8 — four doors. She has to open all of them; that is the point.
   ===================================================================== */
export function doors(onDive){
  return new Promise(res => {
    $('doorsTitle').textContent = CONFIG.DOORS_TITLE;
    $('doorsSub').textContent   = CONFIG.DOORS_SUB;
    const row = $('doorRow');
    const opened = new Set();

    const build = () => {
      row.innerHTML = '';
      CONFIG.DOORS.forEach((d, n) => {
        const b = document.createElement('button');
        b.className = 'door' + (opened.has(d.id) ? ' used' : '');
        b.innerHTML = `<span class="pic" style="${cellBg('doors', 4, n)}"></span>` +
                      `<span class="lb">${d.lb}</span><span class="tg">${d.tg}</span>`;
        b.onclick = async () => {
          if (opened.has(d.id)) return;
          opened.add(d.id);
          b.classList.add('open');
          sfx.door(); buzz(24);
          await wait(520);
          hide('s-doors');
          await wait(420);
          await openDoor(d, onDive);
          if (opened.size >= CONFIG.DOORS.length){
            await wait(300);
            res();
            return;
          }
          note('doorNote', CONFIG.DOORS_NOTE);
          build();
          show('s-doors');
        };
        row.appendChild(b);
      });
    };
    note('doorNote', '');
    build();
    show('s-doors');
  });
}

/* -------------------------------------------------- one door at a time */
async function openDoor(d, onDive){
  const bg = $('roomBg');
  bg.classList.remove('on');
  bg.src = src(d.scene) || '';
  $('roomTitle').textContent = d.title || '';
  $('roomBody').textContent  = d.body  || '';
  note('roomNote', '');
  $('roomPlay').innerHTML = '';
  $('roomBack').style.display = 'none';
  show('s-room');
  await wait(60);
  bg.classList.add('on');
  await wait(1200);

  if (d.id === 'chaos')  await chaosBeat(d);
  if (d.id === 'memory') await memoryBeat(d);
  if (d.id === 'weird')  { await weirdBeat(d, onDive); return; }
  if (d.id === 'secret') await secretBeat(d);

  hide('s-room');
  await wait(500);
  if (d.after) { toast(d.after, 2400); await wait(2200); }
}

/* CHAOS — an entire building for the one thing she will not drink */
function chaosBeat(d){
  return new Promise(res => {
    note('roomNote', d.beat);
    const play = $('roomPlay');
    let popped = 0, spawner = null, hitIdx = 0;
    const TARGET = CONFIG.AGE;

    const spawn = () => {
      if (popped >= TARGET) return;
      const s = document.createElement('button');
      s.className = 'shake';
      s.style.left = (12 + Math.random() * 76) + '%';
      /* they stay in the middle band, clear of the line of text below */
      s.style.top  = (28 + Math.random() * 38) + '%';
      s.setAttribute('style', s.getAttribute('style') + ';' +
        cellBg('shakes', 4, Math.floor(Math.random() * 4)));
      s.onclick = () => {
        if (s.dataset.dead) return;
        s.dataset.dead = '1';
        s.classList.add('pop');
        sfx.pop(); buzz(7);
        popped++;
        $('roomTitle').textContent = popped + ' / ' + TARGET;
        if (popped % 6 === 0) note('roomNote', pick(CONFIG.CHAOS_HITS));
        setTimeout(() => s.remove(), 360);
        if (popped >= TARGET) finish();
      };
      play.appendChild(s);
      setTimeout(() => { if (!s.dataset.dead) s.remove(); }, 2600);
    };
    const finish = async () => {
      clearInterval(spawner);
      play.innerHTML = '';
      $('roomTitle').textContent = '';
      note('roomNote', CONFIG.CHAOS_WIN);
      sfx.good();
      await wait(2100);
      res();
    };
    spawner = setInterval(spawn, 480);
    for (let i = 0; i < 3; i++) setTimeout(spawn, i * 160);
    /* nobody is getting stuck in a milkshake factory on their birthday */
    setTimeout(() => { if (popped < TARGET) finish(); }, 26000);
  });
}

/* MEMORY — the passenger seat is empty, because she was not five minutes away */
function memoryBeat(d){
  return new Promise(res => {
    note('roomNote', d.beat);
    const play = $('roomPlay');
    const go = document.createElement('button');
    go.className = 'btn';
    go.textContent = 'drive';
    go.style.cssText = 'position:absolute;left:50%;bottom:22%;transform:translateX(-50%);';
    go.onclick = async () => {
      go.remove();
      sfx.whoosh();
      $('roomBg').style.transition = 'transform 6s ease-in, opacity 1.1s ease';
      $('roomBg').style.transform = 'translate(-50%,-50%) scale(1.3)';
      note('roomNote', '');
      await wait(1400);
      $('roomTitle').textContent = '';
      $('roomBody').textContent  = 'Forty minutes. Every time.';
      await wait(2600);
      $('roomBg').style.transition = '';
      res();
    };
    play.appendChild(go);
    setTimeout(() => { if (go.isConnected){ go.click(); } }, 12000);
  });
}

/* ??? — there is barely a room behind this one, and then there is no floor */
async function weirdBeat(d, onDive){
  note('roomNote', '');
  await wait(1500);
  $('roomBody').textContent = 'It just keeps going.';
  await wait(1800);
  sfx.alarm();
  V.shake = 18; buzz([40, 60, 40, 60, 120]);
  $('roomTitle').textContent = '';
  $('roomBody').textContent  = d.title;
  await wait(1500);
  hide('s-room');
  await wait(400);
  await onDive();
  if (d.after){ toast(d.after, 2600); await wait(2400); }
}

/* SECRET — the quiet one. She sits down, and nothing is asked of her. */
async function secretBeat(d){
  music(CONFIG.MUSIC_SOFT, 2200);
  $('s-room').classList.add('quiet');
  /* she takes one of the two chairs */
  const her = document.createElement('div');
  her.style.cssText = 'position:absolute;left:27%;bottom:10%;width:25%;max-width:142px;' +
                      'aspect-ratio:272/520;background-repeat:no-repeat;' +
                      'background-position:bottom center;opacity:0;' +
                      'transition:opacity 1.4s ease;pointer-events:none;' +
                      'filter:drop-shadow(0 10px 26px rgba(0,0,0,.7));';
  her.setAttribute('style', her.getAttribute('style') + cellBg('poses2', 4, POSE2.SIT) +
                            'background-size:400% 100%;background-position:33.33% 100%;');
  $('roomPlay').appendChild(her);
  await wait(500);
  her.style.opacity = '.96';
  await wait(1200);

  for (const line of CONFIG.SECRET_LINES){
    $('roomTitle').textContent = '';
    $('roomBody').textContent  = line;
    await wait(2700);
  }
  $('roomBody').textContent = '';
  await wait(800);
  $('s-room').classList.remove('quiet');
  music(CONFIG.MUSIC_VOL, 2000);
}

/* =======================================================================
   ACT 11 — twenty-three candles.

   Tapping is forgiving on purpose: a tap lights the nearest unlit candle
   rather than demanding a hit on a 20px wick. As they go up the interface
   goes down, the room gets darker and the song gets quieter, so the last
   few happen in something close to silence.
   ===================================================================== */
const cake = {
  on:false, cv:null, c:null, W:0, H:0, lit:0, cs:[], t:0, out:0, blown:false
};

function layoutCandles(){
  /* three rows across the top of the cake, which sits a little below the
     middle of that photograph */
  cake.cs = [];
  const cx = cake.W * 0.5, cy = cake.H * 0.665;
  const spanX = Math.min(cake.W * 0.30, 170);
  const rows = [8, 8, 7];
  let n = 0;
  rows.forEach((count, r) => {
    for (let i = 0; i < count; i++){
      const u = count === 1 ? 0 : (i / (count - 1)) - 0.5;
      cake.cs.push({
        x: cx + u * spanX * (1 - r * 0.08),
        y: cy - r * cake.H * 0.019,
        lit:false, ph: Math.random() * 6.28, born:0, i:n++
      });
    }
  });
  cake.cs = cake.cs.slice(0, CONFIG.AGE);
}

function sizeCake(){
  const cv = $('cakeCv');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cake.W = window.innerWidth; cake.H = window.innerHeight;
  cv.width = Math.round(cake.W * dpr); cv.height = Math.round(cake.H * dpr);
  cake.c = cv.getContext('2d');
  cake.c.setTransform(dpr, 0, 0, dpr, 0, 0);
  layoutCandles();
  /* re-light the ones she already did */
  for (let i = 0; i < cake.lit; i++) cake.cs[i].lit = true;
}

export function tickCake(dt){
  if (!cake.on || !cake.c) return;
  cake.t += dt;
  const c = cake.c;
  c.clearRect(0, 0, cake.W, cake.H);

  /* the pool of light the candles are actually casting */
  if (cake.lit > 0 && cake.out < 1){
    const k = (cake.lit / CONFIG.AGE) * (1 - cake.out);
    const g = c.createRadialGradient(cake.W * 0.5, cake.H * 0.64, 10,
                                     cake.W * 0.5, cake.H * 0.64, cake.W * 0.85);
    g.addColorStop(0, 'rgba(255,196,110,' + (0.30 * k) + ')');
    g.addColorStop(0.4, 'rgba(255,160,80,' + (0.13 * k) + ')');
    g.addColorStop(1, 'rgba(255,140,60,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, cake.W, cake.H);
  }

  for (const cd of cake.cs){
    const r = 13;
    if (!cd.lit){
      /* an unlit wick: just enough of a mark to aim at */
      c.globalAlpha = 0.30;
      c.fillStyle = '#efe4ff';
      c.fillRect(cd.x - 1.4, cd.y - 9, 2.8, 11);
      c.globalAlpha = 1;
      continue;
    }
    cd.born = Math.min(1, cd.born + dt * 3.2);
    const f = (0.72 + 0.28 * Math.sin(cake.t * 9 + cd.ph)) * cd.born * (1 - cake.out);
    if (f <= 0.001) continue;
    c.fillStyle = 'rgba(240,230,255,' + (0.8 * cd.born * (1 - cake.out)) + ')';
    c.fillRect(cd.x - 1.5, cd.y - 9, 3, 11);
    const g = c.createRadialGradient(cd.x, cd.y - 12, 0, cd.x, cd.y - 12, r * 2.3);
    g.addColorStop(0, 'rgba(255,226,160,' + (0.85 * f) + ')');
    g.addColorStop(1, 'rgba(255,180,90,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(cd.x, cd.y - 12, r * 2.3, 0, 6.2832); c.fill();
    c.fillStyle = 'rgba(255,248,220,' + f + ')';
    c.beginPath(); c.ellipse(cd.x, cd.y - 12, 2.1, 4.6 * (0.7 + 0.3 * f), 0, 0, 6.2832); c.fill();
  }
  if (cake.out > 0 && cake.out < 1) cake.out = Math.min(1, cake.out + dt * 0.9);
}

export function candles(){
  return new Promise(res => {
    show('s-cake');
    $('cakeBg').src = src('sceneCake');
    $('cakeTitle').textContent = CONFIG.CANDLE_TITLE;
    $('cakeSub').textContent   = CONFIG.CANDLE_SUB;
    $('cakeCount').textContent = '0 / ' + CONFIG.AGE;
    $('cakeLine').classList.remove('on');
    $('s-cake').classList.remove('wish', 'close');
    cake.on = true; cake.lit = 0; cake.out = 0; cake.blown = false; cake.t = 0;
    sizeCake();
    window.addEventListener('resize', sizeCake);

    let lineT = null;
    const say = txt => {
      const el = $('cakeLine');
      el.classList.remove('on');
      clearTimeout(lineT);
      lineT = setTimeout(() => { el.textContent = txt; el.classList.add('on'); }, 180);
    };

    const light = (px, py) => {
      if (cake.lit >= CONFIG.AGE) return;
      /* nearest unlit candle to the thumb, so nothing has to be precise */
      let best = null, bd = 1e9;
      for (const cd of cake.cs){
        if (cd.lit) continue;
        const d = Math.hypot(cd.x - px, cd.y - py);
        if (d < bd){ bd = d; best = cd; }
      }
      if (!best) return;
      if (bd > Math.max(120, cake.W * 0.34)) return;   // she tapped nowhere near it
      best.lit = true;
      cake.lit++;
      sfx.wick(); buzz(6);
      $('cakeCount').textContent = cake.lit + ' / ' + CONFIG.AGE;
      say(CONFIG.CANDLES[cake.lit - 1] || '');

      /* the interface, the room and the song all recede together */
      const k = cake.lit / CONFIG.AGE;
      ui(Math.max(0, 1 - k * 1.15));
      if (cake.lit === 8)  $('s-cake').classList.add('close');
      if (cake.lit === 12) music(CONFIG.MUSIC_VOL * 0.7, 4000);
      if (cake.lit === 18) music(CONFIG.MUSIC_SOFT, 5000);

      if (cake.lit >= CONFIG.AGE) allLit();
    };

    const onTap = e => {
      const t = e.touches ? e.touches[0] : e;
      light(t.clientX, t.clientY);
    };
    $('s-cake').addEventListener('pointerdown', onTap);

    const allLit = async () => {
      await wait(2600);
      $('cakeTitle').textContent = CONFIG.WISH_TITLE;
      $('cakeSub').textContent   = '';
      $('cakeCount').textContent = '';
      $('wishHint').textContent  = CONFIG.WISH_SUB;
      ui(0.85);
      $('s-cake').classList.add('wish');
      $('cakeLine').classList.remove('on');
    };

    const blowOut = async () => {
      if (cake.blown) return;
      cake.blown = true;
      $('s-cake').classList.remove('wish');
      $('s-cake').removeEventListener('pointerdown', onTap);
      sfx.blow(); buzz([10, 40, 10]);
      cake.out = 0.001;
      music(CONFIG.MUSIC_SOFT * 0.7, 2600);
      await wait(2200);
      cake.on = false;
      window.removeEventListener('resize', sizeCake);
      if (cake.c) cake.c.clearRect(0, 0, cake.W, cake.H);
      /* the room STAYS. The last words happen in the dark she just made,
         not back out at the bright poolside. #finale sits above it. */
      $('cakeTitle').textContent = '';
      $('cakeSub').textContent   = '';
      $('cakeCount').textContent = '';
      $('cakeLine').classList.remove('on');
      ui(1);
      await wait(700);
      res();
    };

    /* she blows at the phone, and if the mic is refused the button still works */
    $('wishBtn').onclick = () => {
      $('wishBtn').textContent = 'blow…';
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ blowOut(); return; }
      const giveUp = setTimeout(blowOut, 9000);         // never leave her stuck
      navigator.mediaDevices.getUserMedia({ audio:true }).then(stream => {
        let AC2 = null;
        try { AC2 = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
        if (!AC2){ clearTimeout(giveUp); blowOut(); return; }
        const s = AC2.createMediaStreamSource(stream);
        const an = AC2.createAnalyser(); an.fftSize = 512;
        s.connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const tickMic = () => {
          if (cake.blown){ stream.getTracks().forEach(x => x.stop()); return; }
          an.getByteFrequencyData(buf);
          let low = 0;
          for (let i = 1; i < 14; i++) low += buf[i];
          if (low / 13 > 108){
            clearTimeout(giveUp);
            stream.getTracks().forEach(x => x.stop());
            blowOut();
            return;
          }
          requestAnimationFrame(tickMic);
        };
        tickMic();
      }).catch(() => { clearTimeout(giveUp); blowOut(); });
    };
  });
}

/* =======================================================================
   ACT 12 — the last thing it says, one line at a time
   ===================================================================== */
export function finale(){
  return new Promise(res => {
    const wrap = $('finale'), line = $('finaleLine');
    const lines = CONFIG.FINAL_LINES.slice();
    lines.push('<span class="sign">' + CONFIG.SIGNED + '</span>');
    wrap.classList.add('on');
    let i = 0, timer = null;
    const next = () => {
      clearTimeout(timer);
      if (i >= lines.length){ done(); return; }
      line.classList.remove('in');
      setTimeout(() => {
        line.innerHTML = lines[i];
        line.className = 'in' + (lines[i].includes('sign') ? ' sign' : '');
        i++;
        timer = setTimeout(next, 2900);
      }, 320);
    };
    const done = () => {
      wrap.removeEventListener('pointerdown', next);
      hide('s-cake');
      $('waitBtn').textContent = CONFIG.WAIT;
      $('waitBtn').classList.add('on');
      $('waitBtn').onclick = async () => {
        $('waitBtn').classList.remove('on');
        wrap.classList.remove('on');
        await wait(700);
        res();
      };
    };
    wrap.addEventListener('pointerdown', next);
    next();
  });
}

/* =======================================================================
   ACT 13 — it boots the old machine back up, which is where it started
   ===================================================================== */
export async function secretEnding(){
  music(CONFIG.MUSIC_SOFT, 2000);
  term.open(true);
  term.clear();
  await wait(500);
  sfx.boot();
  await term.type('LUNA.EXE', { speed:75, cls:'cap' });
  await wait(700);

  const grid = document.createElement('div');
  grid.className = 'exe';
  term.el().appendChild(grid);

  for (const [k, v] of CONFIG.EXE){
    const kk = document.createElement('div'); kk.className = 'k'; kk.textContent = k;
    const vv = document.createElement('div'); vv.className = 'v';
    grid.appendChild(kk); grid.appendChild(vv);
    sfx.type();
    /* the last row sits on ??? for a beat before it gives itself away */
    if (k === CONFIG.EXE_LAST){
      vv.classList.add('hot');
      vv.textContent = v;
      await wait(2100);
      vv.textContent = CONFIG.EXE_GUESS;
      sfx.good();
    } else {
      vv.textContent = v;
    }
    await wait(k === CONFIG.EXE_LAST ? 900 : 420);
  }

  await wait(1500);
  const bye = document.createElement('div');
  bye.className = 'big';
  bye.style.marginTop = '26px';
  term.el().appendChild(bye);
  bye.textContent = CONFIG.BYE;
  sfx.win();
  buzz([14, 60, 14, 60, 120]);

  await wait(4200);
  /* and it hands the conversation back to her */
  const num = String(CONFIG.WHATSAPP || '').replace(/\D/g, '');
  if (num.length >= 8){
    const a = document.createElement('div');
    a.className = 'dim';
    a.style.cssText = 'text-align:center;margin-top:22px;cursor:pointer';
    a.textContent = 'say something back →';
    term.el().appendChild(a);
    const goWA = () => {
      /* api.whatsapp.com keeps the prefilled text more reliably than wa.me
         does once the phone hands it to the app */
      window.location.href = 'https://api.whatsapp.com/send?phone=' + num +
        '&text=' + encodeURIComponent(CONFIG.WHATSAPP_TEXT);
    };
    a.onclick = goWA;
    setTimeout(goWA, 3200);
  }
}
