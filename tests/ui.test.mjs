// Verification harness: fake DOM + fake clock, drives app.js end-to-end.
// Checks: difficulty wiring, timer countdown/timeout, streak display, results.
import { answer, timeBonus, streakBonus } from "../js/game.js";

// ---- fake clock ----
let now = 0;
const timeouts = [];
let intervalId = 0;
const intervals = new Map();
globalThis.setTimeout = (fn, ms) => { timeouts.push({ fn, at: now + ms }); return timeouts.length; };
globalThis.setInterval = (fn, ms) => { const id = ++intervalId; intervals.set(id, { fn, next: now + ms, ms }); return id; };
globalThis.clearInterval = (id) => intervals.delete(id);

function advance(ms) {
  const target = now + ms;
  while (now < target) {
    const due = timeouts.filter((t) => t.at <= target).sort((a, b) => a.at - b.at);
    const nextInt = Math.min(...[...intervals.values()].map((i) => i.next), Infinity);
    if (!due.length && nextInt === Infinity) { now = target; break; }
    const next = due.length ? due[0].at : nextInt;
    now = Math.min(next, target);
    if (due.length && due[0].at <= now) { const t = due[0]; timeouts.splice(timeouts.indexOf(t), 1); t.fn(); }
    else for (const i of intervals.values()) while (i.next <= now) { i.next += i.ms; i.fn(); }
  }
}

// ---- fake DOM ----
const els = {};
function el(id) {
  if (!els[id]) els[id] = { id, textContent: "", hidden: false, value: "medium", children: [], handlers: {}, classList: { toggled: new Set(), toggle(c, on) { if (on) this.toggled.add(c); else this.toggled.delete(c); } }, addEventListener(ev, fn) { this.handlers[ev] = fn; } };
  return els[id];
}
globalThis.document = {
  getElementById: el,
  createElement: () => {
    const b = { type: "", className: "", textContent: "", disabled: false, handlers: {}, addEventListener(ev, fn) { this.handlers[ev] = fn; } };
    return b;
  },
};
// innerHTML setter clears children
for (const id of ["progress", "timer", "streak", "prompt", "feedback", "score", "best-streak"]) el(id);
const choices = el("choices");
choices.appendChild = (b) => choices.children.push(b);
Object.defineProperty(choices, "innerHTML", { set() { choices.children = []; }, get() { return ""; } });
for (const id of ["start", "quiz", "results", "difficulty", "start-btn", "restart-btn"]) el(id);

await import("../js/app.js");

// ---- run a round on medium (12s limit), seeded for determinism ----
// app.js uses Date.now() default seed; instead drive via UI and answer correctly by reading the prompt.
function currentCorrect() {
  // find the correct option from the rendered choices against the game state is not exposed;
  // instead we cheat: click each choice and check feedback? No — use game via known words.
  return null;
}

// Deterministic path: monkey-patch createGame seed through UI is impossible, so verify
// behaviorally: click the choice whose text matches the known pool answer for the prompt.
import { WORDS } from "../js/words.js";
function clickChoice(text) {
  const btn = els.choices.children.find((b) => b.textContent === text);
  btn.handlers.click();
}

els.difficulty.value = "medium";
els["start-btn"].handlers.click();

let correctClicks = 0, timeoutCount = 0;
for (let q = 0; q < 10; q++) {
  const prompt = els.prompt.textContent;
  const de = WORDS.medium.find((w) => w.en === prompt).de;
  if (q < 2) { clickChoice(de); correctClicks++; }        // answer immediately -> time bonus
  else { advance(12000); timeoutCount++; }                 // let the timer expire
  advance(900); // feedback delay
}

const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } };
assert(els.results.hidden === false, "results section shown");
assert(els.score.textContent === "Final score: 42 / 10", `score text: ${els.score.textContent}`);
assert(els["best-streak"].textContent === "Best streak: 2 · Correct: 2", `streak text: ${els["best-streak"].textContent}`);
assert(els.streak.textContent === "Streak: 0", `streak display: ${els.streak.textContent}`);
assert(els.timer.textContent === "Time left: 12s", `timer display: ${els.timer.textContent}`);
assert(els.timer.classList.toggled.has("low") === false, "low class not stuck");
assert(els.progress.textContent === "Question 10 of 10 · Score 42", `progress: ${els.progress.textContent}`);

// pure-logic spot checks
assert(timeBonus(12, 12) === 10 && timeBonus(0, 12) === 0, "timeBonus");
assert(streakBonus(1) === 0 && streakBonus(6) === 10, "streakBonus");

// timeout feedback path check (last timeout message seen)
console.log("OK: UI wiring verified — difficulty selector, timer (incl. timeout answer), streak display, results.");
console.log("Sample feedback:", els.feedback.textContent);
