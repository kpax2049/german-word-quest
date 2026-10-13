# German Word Quest

A timed multiple-choice German vocabulary game that runs entirely in the browser — no build step, no dependencies.

## Gameplay

- Pick a difficulty (Easy 15 s / Medium 12 s / Hard 10 s per question) and press **Start**.
- Ten questions: you see an English word and choose its German translation from four options.
- Each correct answer scores **10 points + a time bonus** (up to +10, proportional to seconds left) **+ a streak bonus** (+2 per consecutive correct, capped at +10). Wrong answers and timeouts reset the streak.
- After each answer, feedback shows the correct word; the round ends with final score, best streak, and correct count.
- Word pools are built in (`js/words.js`), three difficulty levels of common English→German pairs.

## Run locally

No install needed — serve the folder with any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly in a browser also works (module scripts require the file:// or http origin to allow ES modules; a local server is the safest path).

## Tests

```bash
node tests/ui.test.mjs
```

The harness drives `js/app.js` end-to-end with a fake DOM and fake clock: difficulty wiring, timer countdown and timeout answers, streak display, results screen, plus pure-logic checks (`timeBonus`, `streakBonus`). Game logic uses a deterministic PRNG (mulberry32), so results are reproducible.

## Accessibility

- `lang="en"`, semantic `main`/`h1`/`h2`, and a live region (`role="status" aria-live="polite"`) announces feedback to screen readers.
- Visible keyboard focus ring (`:focus-visible`, 3 px outline) on all controls; everything is reachable and operable by keyboard.
- ≥ 44 px touch targets for answer buttons (48 px on mobile).
- Color contrast tuned to WCAG AA (accent/green pairs verified ≥ 4.5:1 against the background); correct/wrong states are not color-only — feedback text names the answer.
- Honors `prefers-reduced-motion` (transitions/animations disabled).
- Responsive single-column layout with safe-area padding for small screens.

## Deploying to GitHub Pages (future)

The project is static, so Pages needs no build configuration:

1. Create a GitHub repository and push this folder to its default branch.
2. In the repository settings, enable **Pages** with source branch `main` and root directory `/`.
3. The site will serve `index.html` at `https://<user>.github.io/<repo>/`.

No CI, no framework, no base-path rewrites are required because all asset paths (`css/styles.css`, `js/app.js`) are relative.

## Project layout

```
index.html        entry page
css/styles.css    dark theme, focus/contrast/responsive rules
js/game.js        pure, DOM-free game logic (testable)
js/app.js         UI wiring: start → question → timer → feedback → results
js/words.js       built-in word pools per difficulty
tests/ui.test.mjs end-to-end harness with fake DOM/clock
```
