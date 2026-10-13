// Core game logic — pure, DOM-free, testable.
import { WORDS } from "./words.js";

export const CONFIG = {
  easy: { questions: 10, timeLimit: 15 },
  medium: { questions: 10, timeLimit: 12 },
  hard: { questions: 10, timeLimit: 10 },
};

// Deterministic PRNG (mulberry32) so tests are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(difficulty, { seed = Date.now() } = {}) {
  const cfg = CONFIG[difficulty];
  if (!cfg) throw new Error(`Unknown difficulty: ${difficulty}`);
  return {
    difficulty,
    pool: WORDS[difficulty],
    rng: mulberry32(seed),
    questionCount: cfg.questions,
    timeLimit: cfg.timeLimit,
    asked: [],
    question: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    answered: 0,
    finished: false,
  };
}

export function nextQuestion(game) {
  const remaining = game.pool.filter((w) => !game.asked.includes(w.en));
  const word = pick(remaining, game.rng);
  const distractors = pickN(game.pool.filter((w) => w.en !== word.en), 3, game.rng);
  const options = shuffle([word, ...distractors], game.rng);
  game.asked.push(word.en);
  game.question = { word, options };
  return game.question;
}

// pickedDe: the chosen option, or null for a timeout.
// remainingSeconds: time left on the clock, used for the time bonus.
export function answer(game, pickedDe, remainingSeconds = 0) {
  if (!game.question || game.finished) return null;

  const correct = pickedDe === game.question.word.de;
  let points = 0;
  if (correct) {
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    points = 10 + timeBonus(remainingSeconds, game.timeLimit) + streakBonus(game.streak);
    game.score += points;
    game.correctCount += 1;
  } else {
    game.streak = 0;
  }

  game.answered += 1;
  if (game.answered >= game.questionCount) game.finished = true;
  return { correct, points };
}

export function timeBonus(remainingSeconds, timeLimit) {
  if (remainingSeconds <= 0) return 0;
  return Math.round(10 * (remainingSeconds / timeLimit));
}

// +2 points per consecutive correct answer, capped at +10.
export function streakBonus(streak) {
  return Math.min(streak - 1, 5) * 2;
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n, rng) {
  return shuffle(arr, rng).slice(0, n);
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
