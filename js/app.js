// UI wiring: start -> question -> timer -> feedback -> next -> results -> restart.
import { createGame, nextQuestion, answer } from "./game.js";

const $ = (id) => document.getElementById(id);
let game = null;
let timerId = null;
let remaining = 0;
let locked = false;

function show(name) {
  for (const s of ["start", "quiz", "results"]) $(s).hidden = s !== name;
}

function start() {
  game = createGame($("difficulty").value);
  show("quiz");
  renderQuestion();
}

function renderQuestion() {
  const q = nextQuestion(game);
  locked = false;
  renderStatus();
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

  remaining = game.timeLimit;
  renderTimer();
  timerId = setInterval(() => {
    remaining -= 1;
    renderTimer();
    if (remaining <= 0) choose(null); // timeout
  }, 1000);
}

// de: the chosen option, or null for a timeout.
function choose(de) {
  if (locked) return; // ignore clicks after answering or after timeout
  locked = true;
  clearInterval(timerId);

  const result = answer(game, de, remaining);
  if (!result) return;

  if (result.correct) {
    $("feedback").textContent = `Correct! +${result.points} points.`;
  } else if (de === null) {
    $("feedback").textContent = `Time's up — the answer is “${game.question.word.de}”.`;
  } else {
    $("feedback").textContent = `Wrong — the answer is “${game.question.word.de}”.`;
  }
  for (const b of $("choices").children) b.disabled = true;
  renderStatus();

  setTimeout(() => {
    if (game.finished) showResults();
    else renderQuestion();
  }, 900);
}

function renderTimer() {
  const el = $("timer");
  el.textContent = `Time left: ${remaining}s`;
  el.classList.toggle("low", remaining <= 3);
}

function renderStatus() {
  const qn = locked ? game.answered : game.answered + 1;
  $("progress").textContent = `Question ${qn} of ${game.questionCount} · Score ${game.score}`;
  $("streak").textContent = `Streak: ${game.streak}`;
}

function showResults() {
  $("score").textContent = `Final score: ${game.score} / ${game.questionCount}`;
  $("best-streak").textContent = `Best streak: ${game.bestStreak} · Correct: ${game.correctCount}`;
  remaining = game.timeLimit; // reset timer display and clear the low highlight
  renderTimer();
  show("results");
}

$("start-btn").addEventListener("click", start);
$("restart-btn").addEventListener("click", start);
