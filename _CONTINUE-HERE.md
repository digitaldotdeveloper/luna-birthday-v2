# LUNA.EXE — where this stands

Built 2026-08-28. Luna's birthday is **29 Aug 2026** and she turns **23**.

**Live:** https://digitaldotdeveloper.github.io/luna-birthday-v2/
**Repo:** `digitaldotdeveloper/luna-birthday-v2` (public, Pages from `main` / root)

---

## V1 is a different project. Leave it alone.

V1 lives at `C:\Users\it\Desktop\luna-birthday`, has its own repo
(`digitaldotdeveloper/luna-birthday`) and its own live URL
(https://digitaldotdeveloper.github.io/luna-birthday/). V2 was **copied out of
it**; the two share no files, no repo and no deployment.

Nothing in this folder should ever write to that one. The only traffic between
them so far went one way: V1's on-device phone fixes (`touch-action:none`, the
address-bar-aware resize, `audioSession`, the drag gain) were carried **into**
V2. Everything else V1 has gained since — the IE window, the crash — V2 already
had first.

---

## Running it

It is ES modules, so **it will not work from `file://`**. Serve it:

```bash
cd "C:/Users/it/Desktop/luna-birthday-v2"
python -m http.server 8099 --bind 127.0.0.1
# http://127.0.0.1:8099/
```

### `?act=` — the only sane way to test this

The whole thing is about twelve minutes long. Every act is named and
`?act=<name>` starts there:

```
?act=card     the 2005 site (the default)
?act=world    the colour gate
?act=run      the poolside run
?act=photo    the photo recovery
?act=hunt     the memory hunt
?act=quiz     the quiz
?act=doors    the four doors
?act=cake     the 23 candles
?act=finale   the closing lines
?act=secret   the LUNA.EXE ending
```

Anything past `world` drops straight into the world with the colour already on.
`window.LUNA` exposes `{ V, run, dive, runner, ACTS, mode() }` for poking at it
from the console.

## Deploying

```bash
git push          # Pages rebuilds from main/root, live in ~40s
```

Pages was turned on through the API (`POST /repos/.../pages`,
`{"source":{"branch":"main","path":"/"}}`). There is no build step and no CI.
`gh` is not installed on this machine; git pushes fine through the Windows
credential manager, and the GitHub API can be driven with the token that
`git credential fill` returns.

---

## What happens, in order

1. **The 2005 site.** A full Internet Explorer 6 window — title bar, menu,
   address bar (`C:\My Documents\luna\birthday_FINAL_final2.html`), status bar.
   A progress bar lies to her for two seconds and sticks at 69%. WordArt, Comic
   Sans, marquee, glitter bars, spinning clip art, a visitor counter that ticks
   up by one, a sparkle trail on her finger, "BEST VIEWED IN INTERNET EXPLORER
   6 at 800×600 · © 2005".
2. **She clicks.** Square-wave MIDI, then `the end 🙂`.
3. **It dies.** Two Win95 error dialogs stack up (*illegal operation*, *Cannot
   find file: EFFORT.DLL*), the page tears and RGB-splits, the screen cracks,
   the tube collapses to a line and a dot.
4. **Behind the dead screen is the world** — the poolside, already there, with
   every colour taken out of it. One line types over it: *"Lol the look on your
   face."*
5. **He asks her colour.** Purple floods the world and brings *telepatía* in.
   Click → colour question is about 11 seconds.
6. **The run.** She runs the poolside collecting the blocks of a corrupted
   photo, `IMG_0829.JPG`, while the dead card throws milkshakes at her. Three
   lives; a stumble costs a life, never her progress.
7. **The photo comes back** on a recovery screen — scanlines, a progress bar
   that stalls, the picture arriving in bands.
8. **The memory hunt.** A villa room at night; six objects, three of them
   theirs.
9. **The quiz** — *HOW WELL HAVE I BEEN PAYING ATTENTION?* — with him standing
   in the corner reacting.
10. **Four doors.** CHAOS (a milkshake factory), MEMORY (the car she wasn't
    five minutes away from), ??? (the floor gives way → the freefall), SECRET
    (a rooftop under a huge moon where she sits down and nothing is asked of
    her). All four must be opened.
11. **Twenty-three candles.** One tap each, one short line each. The interface,
    the room light and the song all recede together.
12. **She blows them out** (mic, or the button) and the closing lines happen
    **in that same dark room**.
13. **WAIT.** → the LUNA.EXE readout → *Happy birthday, trouble. 💜* → WhatsApp.

---

## Where things are

```
index.html          the shell: meta, the IE markup, every scene panel, 2 canvases
css/act1.css        2005. Deliberately terrible. Do not tidy it.
css/game.css        everything after
js/config.js        ALL the words. The only file to edit for wording.
js/main.js          the loop, the state machine, and story() — read this first
js/act1.js          the 2005 site and the crash
js/world.js         the canvas world: parallax, perspective bands, the cast,
                    the lighting rig and the picture pass
js/run.js           the run
js/dive.js          the freefall behind the ??? door
js/scenes.js        gate, photo, hunt, quiz, doors, candles, finale, ending
js/art.js           lazy image loading, per-act groups, sprite-cell drawing
js/fx.js            captions, the terminal, the sparkle trail, the overlay canvas
js/audio.js         telepatía + the synth SFX
tools/play.js       the QA harness (see Testing)
tools/strip.py      turns a Gemini green-screen sheet into a sprite strip
```

`js/main.js` → `story()` reads top to bottom in the order she plays it. That is
the map.

---

## The words all live in `js/config.js`

Nothing else contains a line of copy. **Nothing in it was invented** — every
memory, joke and fact traces back to V1:

| in the game | where it comes from |
|---|---|
| milkshakes as the enemy, "not the milk" | she doesn't drink milk |
| "Five minutes away." → forty | the quiz in V1 |
| "You said you weren't hungry" → pizza | V1's object lines |
| the purple bracelet, on all night | V1's object lines |
| forty photos, he's in two | V1's object lines |
| sunglasses indoors at night | V1's object lines |
| named after the moon | V1's object lines |
| "Already in the car" | V1's quiz |
| purple | the colour gate |
| Spanish (*Haz un deseo*, *Feliz cumpleaños*, *¡Buen viaje!*) | V1, and the song |

If a real detail is ever needed that isn't there, add it to `config.js` as a
clearly-marked placeholder rather than making something up.

---

## Assets

**From V1, unchanged** — every character sheet (`luna-run`, `luna-poses`,
`him-stand`, `him-cake`, `him-walk`, `diver`, `chute`), the environment pieces
(`chalet`, `room`, `mountains`, `bunting`, `lounger`, `cabana`, `firebowl`,
`champagne`, `gifts`, `floaties`, `palm`), the props (`shakes`, `objects`,
`hazards`, `cake`, the first three cells of `doors4`), `memory-photo.jpg` and
**`telepatia.mp3`**.

**New, made in Gemini Studio** (see `[[feedback-gemini-sprite-sheets]]` in
memory for the prompting rules):

| file | what |
|---|---|
| `scene-chaos.webp` | the milkshake factory |
| `scene-memory.webp` | the convertible on a coast road at night |
| `scene-weird.webp` | the corridor of identical purple doors |
| `scene-secret.webp` | the rooftop under the moon |
| `scene-huntroom.webp` | the villa living room |
| `scene-cakeroom.webp` | the dark room with the cake |
| `water.webp` `floor.webp` | pool caustics and travertine (replaced V1's) |
| `luna-poses2.webp` | 4 new poses of her, from her own sheet as reference |
| `him-poses.webp` | 4 new poses of him, same |
| `doors4.webp` | V1's three doors **untouched** + one new glowing white one |

Every character asset was generated **with the existing sheet attached as a
reference** and the outfit named explicitly, so she and he are still the same
two people. That rule matters more than any visual upgrade.

`assets/scene-portal.webp` was deleted when the intro was cut. It is in the
git history if it is ever wanted.

Loading is per-act (`GROUPS` in `art.js`) and nothing is fetched until the act
before it. Every image is optional — a 404 draws a fallback rather than ending
the night.

---

## Facts that cost real time. Do not re-derive these.

**Layout**
- `#ieWin { margin:auto }` inside a flex parent beats `align-items:stretch` and
  collapses the whole document to zero height. It must be `margin:0 auto`.
- A fixed `height` on a flex child gets crushed to 0 on a short phone. Use
  `flex:0 0 <h>`.
- A `<button>` used as a sprite needs `border:0; background-color:transparent;
  appearance:none` or it sits in a grey box.
- `#fx` must out-rank `#term` (42) and the error dialogs (43) — it is z-index
  44 — or the cracks are drawn behind them.

**Canvas**
- The world canvas is `{ alpha:false }`, so **`destination-out` on it paints
  black, it does not cut a hole**. Anything needing a real hole (the crescent
  moon, the sprite rim light) is built on a transparent offscreen and blitted.
- **No `ctx.filter`, anywhere.** Safari cannot hold 60fps with one at this
  size. The colour drain is a `saturation` blend; the bloom is
  downscale → `multiply` by itself twice → add back scaled up (the upscale is
  the blur).
- Characters are never blitted raw. Offscreen → `source-atop` grade with the
  scene's key light → rim = silhouette minus silhouette-shifted-away. That is
  what stops them reading as stickers on a photograph.
- `tiledBands` must precompute **rounded, shared** band boundaries. Drawing
  each band a pixel taller double-paints the joint, which at <1 alpha reads as
  a dark stripe across the water every few rows.
- The pool read as a flat wall because the texture barely changed scale across
  the band. It needs a wide range (0.05..0.62) **and** a vertically-evened
  texture.

**Phone**
- `touch-action:none` on html/body/canvas, or the browser claims the horizontal
  drag and eats the steering in the freefall.
- The address bar sliding away fires `resize`. Rebuilding the world for it
  makes the horizon jump — `softResize()` handles a <90px height change.
- iOS 16.4+: `navigator.audioSession.type = 'playback'` or the ring/silent
  switch mutes everything.
- Android suspends the AudioContext in the background; a tap anywhere resumes
  it and restarts the song if it was paused.
- 23 candles cannot be 23 small targets. A tap lights the **nearest unlit** one
  within a radius.

**Sound**
- **One song, and it is *telepatía*.** It starts when the colour does and never
  stops. Every scene change is a volume ramp (`music(level, ms)`), never a
  pause/play. Do not add a second song.
- Safari will not play an `<audio>` that was not started from a tap, and will
  not start one that has downloaded nothing. Her tap on the 2005 button primes
  it; the real `play()` happens inside the tap that picks purple.

**Gemini Studio**
- It **will not** give you a usable multi-frame run cycle. Two attempts: the
  first drew panel divider lines that bridged every figure into one blob, the
  second overlapped the figures and varied their height by 7%. Connected
  components cannot separate either. V1's clean 4-frame cycle plus procedural
  weight looks better than a wobbly 8-frame sheet.
- Slice sheets by **connected component**, never by column — the figures
  overlap and column splitting cuts limbs off. `tools/strip.py` does it.

---

## Testing

`tools/play.js` drives the whole thing in a real phone viewport (390×844, dpr
3, touch) and reports console errors and failed requests.

```bash
cd tools
node play.js <act> <plan>            # against http://127.0.0.1:8099/
BASE=https://digitaldotdeveloper.github.io/luna-birthday-v2/ node play.js card full
```

Plans: `card world run runsmart photo hunt quiz doors weirddoor secretdoor
cake finale secret full`. `full` plays the entire thing end to end (~10 min);
`runsmart` actually plays the run properly by reading obstacle positions.

It needs `playwright-core`, which it loads by absolute path from the Gemini
Studio dashboard's `node_modules`. If that folder moves, fix the `require` at
the top. Two things to know: Playwright refuses to click a permanently
animating element, so taps use `force:true`; and `telepatia.mp3 ::
ERR_ABORTED` in the failed-request list is **normal** — it is `primeMusic()`
calling play-then-pause.

Screenshots land in `$SHOTDIR` (default `shots/`).

---

## Known limits / what's left

- The run cycle is four frames. Smoothness comes from code (squash/stretch,
  stride bob, lean, landing dust, camera bob), not from more art.
- `him-walk.webp` is loaded but never drawn — inherited from V1.
- The hunt-room object positions (`SPOTS` in `scenes.js`) are percentages
  tuned against `scene-huntroom.webp`. Changing that backdrop means retuning
  them.
- The 23 candle lines are grounded but generic in places (16–20 are wishes).
  Anything real that could replace one is an improvement.
- No analytics, no error reporting. If it breaks on her phone the only signal
  is her telling you.
