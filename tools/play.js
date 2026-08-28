/* Drive LUNA.EXE in a real phone viewport and report everything that breaks.
   Device emulation via Playwright's context options (CDP under the hood) —
   NOT `chrome --screenshot`, which crops the right-hand side. */
const { chromium } = require('C:/Users/it/Desktop/Gemini Prompt Sender/dashboard/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE || 'http://127.0.0.1:8099/';
const OUT  = process.env.SHOTDIR || 'shots';
const ACT  = process.argv[2] || 'card';
const PLAN = process.argv[3] || 'card';

fs.mkdirSync(OUT, { recursive: true });

const errors = [], failed = [], logs = [];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio',
           '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
               '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page = await ctx.newPage();

  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error') errors.push('CONSOLE ' + t);
    else logs.push(m.type() + ': ' + t);
  });
  page.on('requestfailed', r =>
    failed.push(r.url().replace(BASE, '') + ' :: ' + (r.failure() || {}).errorText));
  page.on('response', r => {
    if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().replace(BASE, ''));
  });

  let n = 0;
  const shot = async name => {
    n++;
    const f = path.join(OUT, String(n).padStart(2, '0') + '-' + name + '.png');
    await page.screenshot({ path: f });
    console.log('   shot', f);
  };
  const tap = async (sel, opt) => {
    try { await page.click(sel, { timeout: 4000, force: true, ...(opt || {}) }); return true; }
    catch (e) { console.log('   ! could not tap', sel); return false; }
  };
  const wait = ms => page.waitForTimeout(ms);

  console.log('== loading ?act=' + ACT);
  await page.goto(BASE + '?act=' + ACT, { waitUntil: 'domcontentloaded' });
  await wait(1200);

  if (PLAN === 'card'){
    const t0 = Date.now();
    const at = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
    await shot('01-loading');
    await page.waitForSelector('#ieBody.on', { timeout: 15000 });
    console.log('   card visible at', at());
    await shot('02-the-2005-site');
    await tap('#bigbtn');
    const clicked = Date.now();
    const since = () => ((Date.now() - clicked) / 1000).toFixed(1) + 's after the click';
    await wait(2600); await shot('03-the-end');
    await wait(1200); await shot('04-errors');
    await wait(1400); await shot('05-crash');
    await page.waitForSelector('#termInner .big', { timeout: 15000 });
    console.log('   crash line at', since());
    await shot('06-line');
    await page.waitForSelector('#s-ask.on', { timeout: 20000 });
    console.log('   COLOUR QUESTION at', since());
    await shot('07-gate');
    await wait(1500);
    await shot('08-gate-settled');
  }

  if (PLAN === 'world'){
    await wait(2500);
    await shot('world');
  }

  if (PLAN === 'run'){
    await wait(3500);
    await shot('run-start');
    /* play it: tap to jump on a rhythm and see how far it gets */
    for (let i = 0; i < 90; i++){
      await page.mouse.click(195, 600);
      await wait(320);
      if (i === 30) await shot('run-mid');
    }
    await shot('run-late');
    console.log('   blocks:', await page.evaluate(() => window.LUNA.run.blocks),
                'lives:',    await page.evaluate(() => window.LUNA.run.lives));
  }

  if (PLAN === 'runsmart'){
    /* play it properly: jump when something is actually coming */
    await wait(3000);
    let shots = 0;
    for (let i = 0; i < 900; i++){
      const st = await page.evaluate(() => {
        const L = window.LUNA; if (!L) return null;
        const r = L.run, V = L.V, me = L.runner;
        let d = 1e9;
        for (const o of r.obstacles){
          const sx = o.x - V.scroll - me.x;
          if (sx > -20 && sx < d) d = sx;
        }
        return { d, ground: me.ground, blocks: r.blocks, lives: r.lives,
                 over: r.over, on: r.on };
      });
      if (!st) break;
      if (!st.on && st.blocks >= 6) break;
      if (st.over && st.lives <= 0){
        await tap('#retryBtn');            // it must give her the run back
        await wait(900);
        continue;
      }
      if (st.ground && st.d < 130 * 1.08) await page.mouse.click(195, 620);
      if (i === 60 && shots++ === 0) await shot('run-playing');
      await wait(55);
    }
    const fin = await page.evaluate(() => ({
      blocks: window.LUNA.run.blocks, lives: window.LUNA.run.lives,
      on: window.LUNA.run.on }));
    console.log('   FINAL', JSON.stringify(fin));
    await shot('run-finished');
    await wait(4000);
    await shot('run-handoff');
  }

  if (PLAN === 'photo'){
    await wait(1500); await shot('photo-decoding');
    await wait(6000); await shot('photo-done');
    await wait(5000); await shot('photo-after');
  }

  if (PLAN === 'hunt'){
    await wait(2500);
    await shot('hunt-room');
    const spots = await page.$$('.spot');
    console.log('   spots:', spots.length);
    for (let i = 0; i < spots.length; i++){
      await spots[i].click({ force: true });
      await wait(900);
      if (i === 0) await shot('hunt-first');
    }
    await wait(2500);
    await shot('hunt-after');
  }

  if (PLAN === 'quiz'){
    await wait(2000);
    await shot('quiz');
    for (let q = 0; q < 4; q++){
      const opts = await page.$$('#quizOpts .opt');
      for (const o of opts){
        await o.click({ force: true });
        await wait(500);
        const right = await page.$('#quizOpts .opt.right');
        if (right) break;
      }
      if (q === 0) await shot('quiz-answered');
      await wait(2200);
    }
    await wait(2500);
    await shot('quiz-after');
  }

  if (PLAN === 'doors'){
    await wait(1800);
    await shot('doors');
    console.log('   doors:', (await page.$$('.door')).length);
    await tap('.door:nth-child(1)');       // CHAOS
    await wait(3000);
    await shot('door-chaos');
    for (let i = 0; i < 60; i++){
      const s = await page.$$('.shake');
      for (const el of s) { try { await el.click({ force:true, timeout:600 }); } catch(e){} }
      await wait(320);
    }
    await wait(3500);
    await shot('door-chaos-done');
  }

  if (PLAN === 'secretdoor'){
    await wait(1800);
    await tap('.door:nth-child(4)');
    await wait(4000);
    await shot('door-secret');
    await wait(6000);
    await shot('door-secret-2');
    await wait(6000);
    await shot('door-secret-3');
  }

  if (PLAN === 'weirddoor'){
    await wait(1800);
    await tap('.door:nth-child(3)');
    await wait(6000);
    await shot('door-weird');
    await wait(4000);
    await shot('dive-start');
    await page.mouse.move(195, 500);
    await page.mouse.down();
    for (let i = 0; i < 20; i++){ await page.mouse.move(120 + i * 8, 500); await wait(120); }
    await page.mouse.up();
    await wait(4000);
    await shot('dive-mid');
    await wait(8000);
    await shot('dive-pull');
    await tap('#divePull');
    await wait(5000);
    await shot('dive-done');
  }

  if (PLAN === 'cake'){
    await wait(3000);
    await shot('cake-dark');
    for (let i = 0; i < 26; i++){
      await page.mouse.click(195, 560 - (i % 3) * 14);
      await wait(420);
      if (i === 4)  await shot('cake-5');
      if (i === 13) await shot('cake-14');
    }
    await wait(3200);
    await shot('cake-lit');
    console.log('   lit:', await page.evaluate(() =>
      document.getElementById('cakeCount').textContent));
    await tap('#wishBtn');
    await wait(6000);
    await shot('cake-blown');
  }

  if (PLAN === 'finale'){
    await wait(2000); await shot('finale-1');
    for (let i = 0; i < 6; i++){ await page.mouse.click(195, 420); await wait(1400); }
    await shot('finale-wait');
    await tap('#waitBtn');
    await wait(3000);
    await shot('secret-exe');
    await wait(6000);
    await shot('secret-exe-2');
  }

  if (PLAN === 'secret'){
    await wait(3000);  await shot('exe-1');
    await wait(6000);  await shot('exe-2');
    await wait(6000);  await shot('exe-3');
  }

  if (PLAN === 'full'){
    const gone = async sel => !(await page.$(sel));
    console.log('  [act1] waiting for the card');
    await wait(4500);
    await tap('#bigbtn');
    await shot('a-card-clicked');
    console.log('  [act1] malfunction + boot + portal');
    await wait(34000);
    await shot('b-gate');

    let picked = false;
    for (let i = 0; i < 8 && !picked; i++){
      for (const sw of await page.$$('#swatches .sw')){
        if (await sw.getAttribute('aria-label') === 'purple'){
          await sw.click({force:true}); picked = true; break;
        }
      }
      if (!picked) await wait(1000);
    }
    console.log('  [gate] purple picked:', picked);
    await wait(6000);
    await shot('c-colour');

    console.log('  [run] playing');
    for (let i = 0; i < 1200; i++){
      const st = await page.evaluate(() => {
        const L = window.LUNA; if (!L) return null;
        const r = L.run, V = L.V, me = L.runner;
        let d = 1e9;
        for (const o of r.obstacles){ const sx = o.x - V.scroll - me.x; if (sx > -20 && sx < d) d = sx; }
        return { d, ground: me.ground, blocks: r.blocks, lives: r.lives, on: r.on, over: r.over };
      });
      if (!st || !st.on) break;
      if (st.over && st.lives <= 0){ await tap('#retryBtn'); await wait(900); continue; }
      if (st.ground && st.d < 140) await page.mouse.click(195, 620);
      await wait(55);
    }
    console.log('  [run] finished');
    await shot('d-photo');
    await wait(16000);
    await shot('e-photo-done');

    console.log('  [hunt]');
    await wait(4000);
    for (let pass = 0; pass < 3; pass++){
      for (const sp of await page.$$('.spot')){
        try { await sp.click({force:true, timeout:800}); await wait(700); } catch(e){}
      }
      if (await gone('#s-hunt.on')) break;
    }
    await shot('f-hunt');
    await wait(6000);

    console.log('  [quiz]');
    for (let q = 0; q < 6; q++){
      if (await gone('#s-quiz.on')) break;
      for (const o of await page.$$('#quizOpts .opt')){
        try { await o.click({force:true, timeout:800}); } catch(e){}
        await wait(450);
        if (await page.$('#quizOpts .opt.right')) break;
      }
      await wait(2400);
    }
    await shot('g-quiz');
    await wait(7000);

    console.log('  [doors]');
    for (let d = 0; d < 4; d++){
      for (let t = 0; t < 45; t++){ if (await page.$('#s-doors.on')) break; await wait(1000); }
      const doors = await page.$$('.door:not(.used)');
      if (!doors.length) break;
      await doors[0].click({force:true});
      console.log('   opened one,', doors.length - 1, 'left');
      for (let t = 0; t < 100; t++){
        await wait(900);
        for (const el of await page.$$('.shake')){
          try { await el.click({force:true, timeout:350}); } catch(e){}
        }
        if (await page.evaluate(() => window.LUNA.mode() === 'dive')){
          await page.mouse.move(195, 500);
          const pull = await page.$('#divePull.on');
          if (pull) await pull.click({force:true});
        }
        if (await page.$('#s-doors.on')) break;
      }
      await shot('h-door-' + d);
    }
    console.log('  [doors] done');

    console.log('  [cake]');
    for (let t = 0; t < 70; t++){ if (await page.$('#s-cake.on')) break; await wait(1000); }
    await wait(3000);
    for (let i = 0; i < 40; i++){
      const c = await page.evaluate(() => document.getElementById('cakeCount').textContent);
      if (!c) break;
      await page.mouse.click(195, 555 - (i % 3) * 16);
      await wait(380);
      if (i === 12) await shot('i-cake-mid');
    }
    await shot('j-cake-lit');
    await wait(3000);
    await tap('#wishBtn');
    await wait(9000);
    await shot('k-finale-in-the-room');

    console.log('  [finale]');
    for (let i = 0; i < 8; i++){ await page.mouse.click(195, 420); await wait(1500); }
    await shot('l-wait');
    await tap('#waitBtn');
    await wait(4000);
    await shot('m-exe');
    await wait(9000);
    await shot('n-bye');
  }

  console.log('\n== console errors (' + errors.length + ')');
  errors.slice(0, 25).forEach(e => console.log('   ' + e));
  console.log('== failed requests (' + failed.length + ')');
  [...new Set(failed)].slice(0, 25).forEach(e => console.log('   ' + e));

  await browser.close();
})().catch(e => { console.error('HARNESS FAIL', e); process.exit(1); });
