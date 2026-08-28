/* =========================================================================
   LUNA.EXE — everything personal lives in this file and nowhere else.
   Edit freely. The code only ever reads these, it never assumes them.

   RULE FOLLOWED THROUGHOUT: nothing in here was invented. Every memory,
   joke and fact comes from the V1 game. Anything that still needs a real
   detail is marked PLACEHOLDER and is safe to leave as-is.
   ========================================================================= */
export const CONFIG = {

  NAME: "Luna",
  AGE:  23,               // candles in the finale, and the number everywhere
  SHARDS: 6,              // pieces of the photo she collects during the run

  /* ---- the colour that unlocks the world ---- */
  ASK_TITLE:  "prove it's you.",
  ASK_BODY:   "I'm not letting just anyone in here.<br>What's your colour, birthday girl?",
  ASK_ANSWER: "purple",
  ASK_WRONG: [ "…no. cute, but no.",
               "wrong. and you're doing that face again.",
               "nope. I know you better than that.",
               "try again, gorgeous." ],
  ASK_RIGHT:  "obviously. it's you.",

  /* =======================================================================
     ACT 1 — the terrible 2005 website
     ===================================================================== */
  ACT1: {
    TITLE:   "HAPPY<br>BIRTHDAY<br>LUNA!!!",
    SUB:     "~*~ 23 today ~*~",
    MARQUEE: "*** HAPPY BIRTHDAY LUNA *** BEST WISHES ON UR SPECIAL DAY *** " +
             "MANY HAPPY RETURNS *** PLZ ENJOY THE MUSIC *** SIGN MY GUESTBOOK ***",
    BODY:    'Dear <b>Luna</b>,<br>Wishing u a very happy birthday.<br>' +
             'May all ur dreams come true.<br>' +
             '<span class="blink">~*~ HAVE A NICE DAY ~*~</span>',
    BUTTON:  "►  CLICK HERE 4 UR SURPRISE!!!",
    END:     "the end 🙂",
    END_SUB: "thank u for viewing my card",
    VISITORS: "000023",
    ADDRESS: "C:\\My Documents\\luna\\birthday_FINAL_final2.html",
    FOOTER:  "🚧 this site is under construction 🚧",
    IE:      "Best viewed in Internet Explorer 6 at 800×600 · © 2005",

    /* the fake progress bar that lies to her before the page even loads */
    LOADING: [
      [ 4,  "loading birthday…"],
      [31, "loading birthday…"],
      [33, "loading balloons…"],
      [67, "loading balloons…"],
      [69, "almost there…"],
      [70, "almost there…"],
      [71, "almost there…"],
      [99, "almost there…"],
      [100,"done!!!"]
    ],

    /* what the machine says as it falls over */
    ERRORS: [
      "birthday.html has performed an illegal operation.",
      "Cannot find file: EFFORT.DLL",
      "Not enough memory to display this much love.",
      "birthday.html is not responding."
    ],

    /* the beat after everything dies. One line at a time, in the dark. */
    APOLOGY: [
      "Okay.",
      "You actually clicked it.",
      "I spent approximately 0 seconds making that.",
      "",                       // the pause is a line of its own
      "Let's try again."
    ]
  },

  /* =======================================================================
     ACT 2 — the boot, and the world opening
     ===================================================================== */
  BOOT: [
    ["loading world",         "ok"],
    ["loading her",           "ok"],
    ["loading him",           "barely"],
    ["loading 23 candles",    "ok"],
    ["loading actual effort", "ok"]
  ],
  WELCOME:  "WELCOME, LUNA.",
  WELCOME2: "Your birthday starts here.",

  /* =======================================================================
     ACT 3 — the run. She is recovering a corrupted photo, one block at a time
     ===================================================================== */
  PHOTO:         "assets/memory-photo.jpg",
  PHOTO_FILE:    "IMG_0829.JPG",
  PHOTO_CAPTION: "us. no notes.",

  RUN_HINT:  "tap to jump",
  /* he says one of these as she passes each quarter */
  LINES: [ "there she goes.",
           "showing off already.",
           "halfway. and yes, I'm watching.",
           "almost, beautiful." ],
  COMBO_LINES: [ "look at you.", "okay, that was hot.", "unreal." ],
  HIT_LINES:   [ "careful, gorgeous.", "I've got you.", "shake it off." ],
  /* the card is not dead, and it throws the one thing she will not drink */
  TAUNTS:      [ "U CANT DELETE ME", "IM STILL HERE!!!", "ok well FINE" ],
  SHAKE_LINES: [ "it's throwing milkshakes.",
                 "it knows. of course it knows.",
                 "not the milk." ],
  RUN_DONE: "that's all of it.",

  /* =======================================================================
     ACT 6 — the photo comes back
     ===================================================================== */
  PHOTO_AFTER: "Yeah… I remember this one.",

  /* =======================================================================
     ACT 5 — the memory hunt, in a room she has to look around
     ===================================================================== */
  HUNT_TITLE: "Something in here is ours.",
  HUNT_SUB:   "Three of them, actually.",
  /* the six objects are the six cells of assets/objects.webp, in order */
  OBJECTS: [
    { i:0, key:true, name:"bracelet",   line:"The purple one. You had it on all night." },
    { i:1, key:true, name:"camera",     line:"You took about forty of these. I'm in two of them." },
    { i:2,           name:"car",        line:"\"Five minutes away.\" You were not five minutes away." },
    { i:3, key:true, name:"moon",       line:"Somebody named you after this. Good call." },
    { i:4,           name:"sunglasses", line:"Indoors. At night. Iconic." },
    { i:5,           name:"pizza",      line:"You said you weren't hungry." }
  ],
  HUNT_PIECE: [ "one.", "two.", "…there it is." ],
  HUNT_AFTER: "Three out of six. The other three are just objects.",

  /* =======================================================================
     ACT 7 — the quiz
     ===================================================================== */
  QUIZ_TITLE: "HOW WELL HAVE I BEEN PAYING ATTENTION?",
  QUESTIONS: [
    { q:"Someone hands Luna a glass of milk. She:",
      o:["Drinks it","Politely declines","Leaves the country","Calls the police"], a:2,
      after:"Correct. Which is why the last few minutes happened." },
    { q:"Luna says she'll be ready in five minutes. Realistically?",
      o:["Five minutes","Fifteen","Forty","She's already asleep"], a:2,
      after:"Forty. Worth it every time." },
    { q:"Correct response to \"I'm not hungry\"?",
      o:["Believe her","Order anyway","Argue","Eat alone, bravely"], a:1,
      after:"Order anyway. You always finish half of mine." },
    { q:"Offer Luna something completely reckless. She says:",
      o:["No","Let me think about it","Already in the car","Send me the details"], a:2,
      after:"Never once had to ask you twice." }
  ],
  QUIZ_RIGHT: [ "Obviously.", "Muy bien. 😌", "Correct. Annoyingly.", "Yeah, you know." ],
  QUIZ_WRONG: [ "Wow.", "That actually hurt.", "Intenta otra vez.", "…really?" ],
  QUIZ_RESULT: [ "You passed.",
                 "I'd already decided you were getting a present." ],

  /* =======================================================================
     ACT 8 — four doors, four places
     `scene` names the backdrop in js/art.js. `key` is what it gives back.
     ===================================================================== */
  DOORS: [
    { id:"chaos",  lb:"CHAOS",  tg:"probably fine",
      scene:"sceneChaos",
      title:"…he built a factory.",
      body:"An entire building dedicated to the one thing you won't drink.",
      beat:"tap them before they reach you",
      after:"I probably shouldn't have put this here." },

    { id:"memory", lb:"MEMORY", tg:"the safe one",
      scene:"sceneMemory",
      title:"Five minutes away.",
      body:"You were not five minutes away.",
      beat:"tap to drive",
      after:"I'd wait the forty again. Obviously." },

    { id:"weird",  lb:"???",    tg:"do not",
      scene:"sceneWeird",
      title:"There's no floor behind this one.",
      body:"There's barely a room.",
      beat:"",
      after:"You didn't hesitate. Not even slightly." },

    { id:"secret", lb:"SECRET", tg:"quiet",
      scene:"sceneSecret",
      title:"",
      body:"",
      beat:"",
      after:"Okay. That's enough of that." }
  ],
  DOORS_TITLE: "Four doors.",
  DOORS_SUB:   "None of them are a good idea.",
  DOORS_NOTE:  "all four. I'm not sorry.",

  /* the quiet one behind the last door — the only slow moment before the end */
  SECRET_LINES: [
    "Somebody named you after that thing.",
    "It's been up there the whole time.",
    "Doing the same job every night, whether anyone looks up or not.",
    "Anyway.",
    "Happy birthday."
  ],

  /* the chaos beat: what the factory throws, and what he says about it */
  CHAOS_HITS: [ "no.", "absolutely not.", "not the milk.", "get it away from me." ],
  CHAOS_WIN:  "Twenty-three of them. Gone. Iconic.",

  /* =======================================================================
     BEHIND ??? — the fall (kept from V1, it was the best thing in it)
     ===================================================================== */
  DIVE: {
    intro:   ["no floor.", "…okay then."],
    hint:    "drag your finger to steer",
    pulled:  "¡Buen viaje!",
    seconds: 15,
    pullAt:  0.72
  },

  /* =======================================================================
     ACT 11 — twenty-three candles, one line each.
     1–5 funny · 6–10 observations · 11–15 memories · 16–20 wishes
     21–22 personal · 23 the last one
     ===================================================================== */
  CANDLES: [
    /* 1–5 — funny */
    "Candle one. Twenty-two to go. Pace yourself.",
    "I checked. There's no milk in this cake.",
    "This took slightly longer than the 2005 version.",
    "You're 23 and still can't be ready in five minutes.",
    "There's a bug somewhere in here. Don't look for it.",
    /* 6–10 — small things I've noticed */
    "You laugh before the funny part.",
    "You wear sunglasses indoors and somehow it works.",
    "You say you're not hungry. Then you eat half of mine.",
    "You take forty photos and keep the blurry one.",
    "You've never once had to be asked twice.",
    /* 11–15 — memories */
    "The purple bracelet. You had it on all night.",
    "Forty photos. I'm in two of them.",
    "\"Five minutes away.\" You were not five minutes away.",
    "Somebody named you after the moon. Good call.",
    "You said you weren't hungry. The pizza disagreed.",
    /* 16–20 — wishes */
    "I hope 23 is loud.",
    "I hope you keep saying yes to the reckless stuff.",
    "I hope nobody ever hands you milk again.",
    "I hope you always get the window seat.",
    "I hope 23 is kind to you. It should be.",
    /* 21–22 — personal */
    "You make ordinary days feel like somebody planned them.",
    "I built a whole website instead of saying that out loud. Noted.",
    /* 23 */
    "Feliz cumpleaños, Luna."
  ],
  CANDLE_TITLE: "Twenty-three.",
  CANDLE_SUB:   "Light them.",
  WISH_TITLE:   "Haz un deseo.",
  WISH_SUB:     "blow at your phone — or just tap",

  /* =======================================================================
     ACT 12 — the last thing it says
     ===================================================================== */
  FINAL_LINES: [
    "I could've just sent you a message.",
    "This was funnier.",
    "I hope 23 gives you a lot to smile about.",
    "And a few things worth turning into websites."
  ],
  SIGNED: "— Firass",

  /* =======================================================================
     ACT 13 — the secret ending. It boots the old machine back up.
     ===================================================================== */
  WAIT:  "WAIT.",
  EXE: [
    ["STATUS",           "23"],
    ["MOOD",             "probably judging this website"],
    ["FAVOURITE COLOUR", "PURPLE"],
    ["DANGER LEVEL",     "HIGH"],
    ["READY IN",         "\"five minutes\""],
    ["MILK TOLERANCE",   "0.00%"],
    ["PHOTOS TAKEN",     "40 (I'm in two)"],
    ["KNOWN WEAKNESS",   "???"]
  ],
  EXE_LAST:  "KNOWN WEAKNESS",
  EXE_GUESS: "this, probably",
  BYE:       "Happy birthday, trouble. 💜",

  /* ---- your number, country code first, digits only, no "+" ---- */
  WHATSAPP: "96179193912",
  WHATSAPP_TEXT: "🌙",

  /* ---- how loud telepatía sits under everything ---- */
  MUSIC_VOL: 0.5,
  /* it drops to this under the quiet scenes, and never stops */
  MUSIC_SOFT: 0.22
};
