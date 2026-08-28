/* =========================================================================
   ACT ONE — 2005, and the moment it stops being 2005.

   The whole point of this act is that it is bad on purpose and then dies
   in a way that is not. Everything up to `malfunction()` is a gag; from
   `malfunction()` on it has to feel like real hardware giving up.
   ========================================================================= */
import { CONFIG } from './config.js';
import { $, term, wait, sparkles, crack, clearCracks, startRush, stopRush } from './fx.js';
import { sfx, tone, noise, playCheesy, warpDown, primeMusic, ac, buzz } from './audio.js';

const A = CONFIG.ACT1;

function paint(){
  $('a1marq').textContent   = A.MARQUEE;
  $('a1title').innerHTML    = A.TITLE;
  $('a1sub').textContent    = A.SUB;
  $('a1body').innerHTML     = A.BODY;
  $('bigbtn').textContent   = A.BUTTON;
  $('a1end').textContent    = A.END;
  $('a1endsub').textContent = A.END_SUB;
  $('a1vis').textContent    = A.VISITORS;
  $('a1foot').textContent   = A.FOOTER;
  $('a1ie').textContent     = A.IE;
  $('ieUrl').textContent    = A.ADDRESS;
}

/* the progress bar that lies. It sticks at 69% because of course it does. */
function fakeLoad(){
  return new Promise(res => {
    const bar = $('ieLoadBar').firstElementChild;
    const txt = $('ieLoadTxt'), pct = $('ieLoadPct');
    let step = 0;
    const run = () => {
      if (step >= A.LOADING.length){
        setTimeout(() => { $('ieLoad').classList.add('gone'); res(); }, 380);
        return;
      }
      const [p, label] = A.LOADING[step++];
      bar.style.width = p + '%';
      pct.textContent = p + '%';
      txt.textContent = label;
      if (step % 2) sfx.type();
      setTimeout(run, 260 + Math.random() * 420);
    };
    run();
  });
}

/* the visitor counter, going up by one every few seconds, only ever by one */
function counter(){
  let n = parseInt(A.VISITORS, 10) || 23;
  return setInterval(() => {
    n++;
    $('a1vis').textContent = String(n).padStart(A.VISITORS.length, '0');
  }, 5200);
}

function dialog(text, i){
  const box = $('dialogs');
  const d = document.createElement('div');
  d.className = 'dlg';
  /* stacked slightly off each other, the way they used to pile up */
  d.style.left = `calc(50% - min(136px,42vw) + ${(i % 3) * 13 - 13}px)`;
  d.style.top  = `calc(${26 + (i % 4) * 9}% + ${i * 6}px)`;
  d.innerHTML =
    `<div class="tb"><span>Error</span><i>✕</i></div>` +
    `<div class="bd"><b>⛔</b><span>${text}</span></div>` +
    `<div class="ft"><u>OK</u></div>`;
  box.appendChild(d);
  sfx.clunk();
  return d;
}

async function malfunction(){
  const el = $('act1');

  /* one dialog at a time, faster each time, until they are stacked up */
  for (let i = 0; i < A.ERRORS.length; i++){
    dialog(A.ERRORS[i], i);
    buzz(18);
    await wait(620 - i * 120);
  }
  await wait(300);

  el.classList.add('glitch');
  sfx.glitch();
  $('ieStatusTxt').textContent = 'Not responding…';
  $('ieTitle').textContent = 'Ha̷p̶p̷y̸ B̷i̶r̴t̷h̶d̸a̶y̷ ̴L̸u̷n̶a̸!̷!̷!̶';

  for (let i = 0; i < 5; i++){
    await wait(150 + Math.random() * 200);
    sfx.glitch();
    el.classList.add('invert');
    await wait(60 + Math.random() * 70);
    el.classList.remove('invert');
  }

  /* the screen splits, and then the tube goes */
  warpDown();
  crack(window.innerWidth * 0.6, window.innerHeight * 0.42);
  buzz([30, 60, 30, 60, 90]);
  await wait(420);
  sfx.shatter();
  await wait(300);

  el.classList.add('crt');
  sfx.thud();
  buzz(140);
  await wait(640);
  el.classList.add('dead');
  clearCracks();
  $('dialogs').innerHTML = '';
  sparkles(false);
}

/* ---------------------------------------------------------------------- */
export async function runAct1(){
  paint();
  await fakeLoad();
  $('ieBody').classList.add('on');
  sparkles(true);
  const tick = counter();

  /* she has to actually click it. That is the entire premise. */
  await new Promise(res => {
    $('bigbtn').addEventListener('click', () => {
      ac();
      primeMusic();               // one tap has to buy both of these
      res();
    }, { once:true });
  });

  $('bigbtn').style.display = 'none';
  const dur = playCheesy();
  await wait(dur * 1000 + 420);

  $('act1').classList.add('over');       // everything on the page stops moving
  clearInterval(tick);
  await wait(1150);                      // the dead beat. Let it be awkward.

  await malfunction();

  /* black screen. It talks. */
  term.open(true);
  term.clear();
  await wait(700);
  await term.script([
    [A.APOLOGY[0], { speed:52, after:760 }],
    [A.APOLOGY[1], { speed:40, after:900 }],
    [A.APOLOGY[2], { speed:34, after:1500 }],
    ['',           { after:1200 }],
    [A.APOLOGY[4], { speed:60, after:1100 }]
  ]);
  await wait(500);
}

/* ============================================================== the boot
   It reboots as something that was clearly built on purpose. This is also
   where LUNA.EXE gets its name, so the secret ending has something to
   come back to.                                                          */
export async function runBoot(){
  term.clear();
  sfx.boot();
  await term.type('LUNA.EXE', { speed:70, cls:'cap' });
  await wait(560);
  for (const [what, how] of CONFIG.BOOT){
    const dots = '.'.repeat(Math.max(2, 26 - what.length));
    const row = await term.type(what + ' ' + dots + ' ', { speed:12 });
    await wait(180 + Math.random() * 260);
    const s = document.createElement('span');
    s.className = how === 'ok' ? 'ok' : 'warn';
    s.textContent = how;
    row.appendChild(s);
    sfx.type();
    await wait(150);
  }
  await wait(800);
  term.clear();
  await wait(300);

  /* and then it stops being a terminal */
  startRush();
  sfx.whoosh();
  $('term').classList.remove('plain');
  await wait(2600);
  stopRush();
}
