// Core game logic — pure, DOM-free, testable.
import { WORDS } from "./words.js";

export const QUESTION_COUNT = 10;

export function createGame() {
  return {
    asked: [],
    question: null,
    score: 0,
    answered: 0,
    questionCount: QUESTION_COUNT,
    finished: false,
  };
}

export function nextQuestion(game) {
  const remaining = WORDS.filter((w) => !game.asked.includes(w.en));
  const word = pick(remaining);
  const distractors = pickN(WORDS.filter((w) => w.en !== word.en), 3);
  const options = shuffle([word, ...distractors]);
  game.asked.push(word.en);
  game.question = { word, options };
  return game.question;
}

export function answer(game, pickedDe) {
  if (!game.question || game.finished) return null;
  const correct = pickedDe === game.question.word.de;
  if (correct) game.score += 1;
  game.answered += 1;
  if (game.answered >= game.questionCount) game.finished = true;
  return correct;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  return shuffle(arr).slice(0, n);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
