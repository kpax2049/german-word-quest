// UI wiring for the playable loop: start -> question -> feedback -> next -> results -> restart.
import { createGame, nextQuestion, answer } from "./game.js";

const $ = (id) => document.getElementById(id);
let game = null;

function show(name) {
  for (const s of ["start", "quiz", "results"]) $(s).hidden = s !== name;
}

function start() {
  game = createGame();
  show("quiz");
  renderQuestion();
}

function renderQuestion() {
  const q = nextQuestion(game);
  $("progress").textContent = `Question ${game.answered + 1} of ${game.questionCount} · Score ${game.score}`;
  $("prompt").textContent = q.word.en;
  $("feedback").textContent = "";

  const box = $("choices");
  box.innerHTML = "";
  for (const opt of q.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn choice";
    btn.textContent = opt.de;
    btn.addEventListener("click", () => choose(opt.de));
    box.appendChild(btn);
  }
}

function choose(de) {
  const correct = answer(game, de);
  $("feedback").textContent = correct
    ? "Correct!"
    : `Wrong — the answer is “${game.question.word.de}”.`;
  for (const b of $("choices").children) b.disabled = true;

  setTimeout(() => {
    if (game.finished) showResults();
    else renderQuestion();
  }, 900);
}

function showResults() {
  $("score").textContent = `Final score: ${game.score} / ${game.questionCount}`;
  show("results");
}

$("start-btn").addEventListener("click", start);
$("restart-btn").addEventListener("click", start);
