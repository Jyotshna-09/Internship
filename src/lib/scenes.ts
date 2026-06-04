import type { SceneId } from "./game-state";

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface SceneMeta {
  id: SceneId;
  number: number;
  title: string;
  subtitle: string;
  objective: string;
  points: number;
  badge?: string;
  outcome: string;
  quiz: QuizQuestion[];
}

export const SCENES: SceneMeta[] = [
  {
    id: "dark-garden",
    number: 1,
    title: "The Dark Garden",
    subtitle: "Find the hidden lantern",
    objective: "Discover why we cannot see in the dark.",
    points: 100,
    outcome: "Objects cannot be seen without light.",
    quiz: [
      {
        q: "Why couldn't you see the flowers at the start?",
        options: ["They were missing", "There was no light", "They were too small", "They were sleeping"],
        correct: 1,
        explain: "Without a source of light, our eyes have nothing to detect — so objects stay invisible.",
      },
      {
        q: "Which of these helps us see things?",
        options: ["Closed eyes", "Darkness", "Light", "Silence"],
        correct: 2,
        explain: "Light bouncing off objects into our eyes is what lets us see them.",
      },
    ],
  },
  {
    id: "light-sources",
    number: 2,
    title: "Light Source Discovery",
    subtitle: "Catch real light sources",
    objective: "Tell light sources apart from ordinary objects.",
    points: 100,
    badge: "Light Explorer",
    outcome: "The Sun, lamps, bulbs and torches give out their own light.",
    quiz: [
      {
        q: "Which of these is a natural light source?",
        options: ["Bulb", "Sun", "Torch", "Candle"],
        correct: 1,
        explain: "The Sun makes its own light naturally. Bulbs and torches are artificial sources.",
      },
      {
        q: "Which object is NOT a light source?",
        options: ["Moon", "Stone", "Firefly", "Lantern"],
        correct: 1,
        explain: "A stone does not produce light. The Moon only reflects sunlight, but fireflies and lanterns do produce light.",
      },
    ],
  },
  {
    id: "light-travels",
    number: 3,
    title: "Light Travels",
    subtitle: "Aim the lantern at the flower",
    objective: "Show that light travels in straight lines from a source.",
    points: 150,
    outcome: "Light moves from a source, in straight lines, to objects we see.",
    quiz: [
      {
        q: "How does light travel from a lantern to a flower?",
        options: ["In curves", "In zig-zags", "In straight lines", "It teleports"],
        correct: 2,
        explain: "Light travels in straight lines until it hits an object that blocks or reflects it.",
      },
      {
        q: "If you block the light path with your hand, what happens to the flower?",
        options: ["It glows brighter", "It disappears from view", "It changes colour", "Nothing"],
        correct: 1,
        explain: "Blocking the path means no light reaches the flower — and a shadow appears too!",
      },
    ],
  },
  {
    id: "reflection-mystery",
    number: 4,
    title: "The Reflection Mystery",
    subtitle: "Bounce moonlight with a mirror",
    objective: "Use a mirror to reflect light onto the sleeping rose.",
    points: 150,
    badge: "Reflection Expert",
    outcome: "Smooth surfaces like mirrors bounce light at equal angles.",
    quiz: [
      {
        q: "When light hits a mirror, what happens?",
        options: ["It disappears", "It bends inside the mirror", "It bounces off (reflects)", "It turns into heat"],
        correct: 2,
        explain: "Mirrors have very smooth surfaces — they reflect almost all the light that hits them.",
      },
      {
        q: "The angle the light comes in equals…",
        options: ["The angle it bounces out", "Always 90°", "Always 0°", "Half the angle out"],
        correct: 0,
        explain: "Law of reflection: the angle of incidence equals the angle of reflection.",
      },
      {
        q: "Why can we see the Moon at night?",
        options: ["It produces its own light", "It reflects sunlight", "It is on fire", "It is a star"],
        correct: 1,
        explain: "The Moon is not a light source — it reflects light from the Sun towards us.",
      },
    ],
  },
  {
    id: "shadow-challenge",
    number: 5,
    title: "The Shadow Challenge",
    subtitle: "Make the right shadow shape",
    objective: "Discover how opaque objects form shadows when they block light.",
    points: 150,
    badge: "Shadow Master",
    outcome: "Shadows form when opaque objects block light travelling in straight lines.",
    quiz: [
      {
        q: "A shadow forms when an object…",
        options: ["Glows", "Reflects light", "Blocks light", "Lets all light pass through"],
        correct: 2,
        explain: "Opaque objects block light. The dark area behind them is the shadow.",
      },
      {
        q: "Move the lamp CLOSER to the object. The shadow becomes…",
        options: ["Smaller", "Bigger", "Disappears", "Brighter"],
        correct: 1,
        explain: "A closer light source spreads more widely past the object, so the shadow grows larger.",
      },
      {
        q: "Which material would NOT form a clear shadow?",
        options: ["Wooden block", "Metal plate", "Clear glass", "Cardboard"],
        correct: 2,
        explain: "Clear glass is transparent — light passes through, so there's barely any shadow.",
      },
    ],
  },
  {
    id: "garden-restoration",
    number: 6,
    title: "Garden Restoration",
    subtitle: "Bring the Moonlight Garden back to life",
    objective: "Place light, mirrors, and remove blockers to light up the whole garden.",
    points: 200,
    badge: "Garden Savior",
    outcome: "You combined light sources, reflection and shadows to restore the garden!",
    quiz: [
      {
        q: "Which combo lets us SEE a flower clearly?",
        options: [
          "Light source + straight path + reflection into the eye",
          "Only a shadow",
          "A closed box",
          "Only sound",
        ],
        correct: 0,
        explain: "Light leaves a source, travels in straight lines, reflects off the flower into our eyes.",
      },
      {
        q: "An opaque object in front of a lamp will create…",
        options: ["A rainbow", "A reflection only", "A shadow", "Nothing at all"],
        correct: 2,
        explain: "Opaque objects block light, casting a shadow behind them.",
      },
      {
        q: "To redirect light around a corner you can use a…",
        options: ["Sponge", "Mirror", "Black cloth", "Brick"],
        correct: 1,
        explain: "Mirrors reflect light, letting you send a beam around corners.",
      },
    ],
  },
];

export const ALL_BADGES = [
  { name: "Light Explorer", desc: "Identified real light sources." },
  { name: "Reflection Expert", desc: "Bounced light with mirrors." },
  { name: "Shadow Master", desc: "Solved every shadow puzzle." },
  { name: "Garden Savior", desc: "Restored the Moonlight Garden." },
  { name: "Light Detective Master", desc: "Mastered all chapters of light." },
];
