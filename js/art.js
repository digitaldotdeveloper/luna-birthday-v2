/* =========================================================================
   Pictures.

   Nothing loads until the act that needs it is about to start. The world
   itself is drawn from code, so every single one of these is optional —
   if a file 404s the game keeps running and draws the fallback instead.
   That is deliberate: a missing asset must never be able to end the night.
   ========================================================================= */

export const ART = {};

const SRC = {
  /* --- the two of them. These sheets are V1's, unchanged. --- */
  run:      'assets/luna-run.webp',    // 5 cells: 4 running + 1 jump
  poses:    'assets/luna-poses.webp',  // 4 cells: idle, land, cheer, kiss
  poses2:   'assets/luna-poses2.webp', // 4 cells: wonder, sitting, reaching, flame
  himstand: 'assets/him-stand.webp',
  himcake:  'assets/him-cake.webp',
  himwalk:  'assets/him-walk.webp',
  himposes: 'assets/him-poses.webp',   // 4 cells: shrug, point, hands-up, gift

  /* --- the poolside --- */
  chalet:   'assets/chalet.webp',
  room:     'assets/room.webp',
  floor:    'assets/floor.webp',
  water:    'assets/water.webp',
  mountains:'assets/mountains.webp',
  bunting:  'assets/bunting.webp',
  lounger:  'assets/lounger.webp',
  cabana:   'assets/cabana.webp',
  firebowl: 'assets/firebowl.webp',
  champagne:'assets/champagne.webp',
  gifts:    'assets/gifts.webp',
  floaties: 'assets/floaties.webp',
  planter:  'assets/palm.webp',

  /* --- props --- */
  shakes:   'assets/shakes.webp',      // 4 cells, the things she jumps over
  objects:  'assets/objects.webp',     // 6 cells, the memory hunt
  doors:    'assets/doors4.webp',      // 4 cells, three of V1's plus one new
  hazards:  'assets/hazards.webp',     // 3 cells, in the fall
  diver:    'assets/diver.webp',
  chute:    'assets/chute.webp',
  cake:     'assets/cake.webp',

  /* --- the places behind the doors --- */
  sceneChaos:   'assets/scene-chaos.webp',
  sceneMemory:  'assets/scene-memory.webp',
  sceneWeird:   'assets/scene-weird.webp',
  sceneSecret:  'assets/scene-secret.webp',
  sceneCake:    'assets/scene-cakeroom.webp',
  sceneHunt:    'assets/scene-huntroom.webp'
};

export function src(key){ return SRC[key]; }

/* Which act needs what. Loaded on approach, never all at once. */
const GROUPS = {
  world: ['mountains','chalet','floor','water','bunting','lounger','cabana',
          'firebowl','champagne','gifts','floaties','planter','run','poses','himstand'],
  run:   ['shakes','himcake'],
  hunt:  ['sceneHunt','objects','poses2'],
  quiz:  ['himposes'],
  doors: ['doors','sceneChaos','sceneMemory','sceneWeird','sceneSecret'],
  dive:  ['diver','chute','hazards'],
  cake:  ['sceneCake','cake','poses2','himposes'],
  room:  ['room']
};

const pending = new Map();

function one(key){
  if (ART[key]) return Promise.resolve(ART[key]);
  if (pending.has(key)) return pending.get(key);
  const path = SRC[key];
  if (!path) return Promise.resolve(null);
  const p = new Promise(res => {
    const im = new Image();
    im.decoding = 'async';
    im.onload  = () => { if (im.naturalWidth){ ART[key] = im; } res(ART[key] || null); };
    im.onerror = () => res(null);           // a missing file is survivable
    im.src = path;
  });
  pending.set(key, p);
  return p;
}

/** Load one group (or an array of keys). Resolves when they are all in or
 *  have all failed — it never rejects. */
export function load(what){
  const keys = Array.isArray(what) ? what : (GROUPS[what] || []);
  return Promise.all(keys.map(one));
}

/** Start a group in the background and do not wait for it. */
export function warm(what){ load(what); }

export function ready(key){ return !!ART[key]; }

/* --------------------------------------------------------- drawing ---- */

/** One cell of a horizontal strip, sized by HEIGHT and standing on (x,y).
 *  Characters must be sized by height — sizing them by width makes a tall
 *  sprite tower over the scene the moment the sheet's aspect changes. */
export function cellFrame(ctx, im, cells, i, x, y, h){
  if (!im) return false;
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  const w = h * (cw / ch);
  ctx.drawImage(im, i * cw, 0, cw, ch, x - w / 2, y - h, w, h);
  return true;
}

/** One cell centred on (x,y) and sized by WIDTH — for things in mid-air. */
export function cellDraw(ctx, im, cells, i, x, y, w){
  if (!im) return false;
  const cw = im.naturalWidth / cells, ch = im.naturalHeight;
  const h = w * (ch / cw);
  ctx.drawImage(im, i * cw, 0, cw, ch, x - w / 2, y - h / 2, w, h);
  return true;
}

/** The same slice as a CSS background, for the DOM scenes. */
export function cellBg(key, cells, i){
  const path = SRC[key] || key;
  return `background-image:url(${path});background-size:${cells * 100}% 100%;` +
         `background-position:${(i / (cells - 1)) * 100}% 50%;`;
}
