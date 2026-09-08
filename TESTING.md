# Release Testing

## Release-ready definition

A build is release-ready only when the aggregate command completes successfully and its output is stored with the release candidate. A green unit run alone is not sufficient. The release evidence must identify the commit, date, runtime, and results for every gate below.

## Required gates

- No unexpected Chromium console, page, or asset-request errors.
- Browser boot reaches a playable, non-loading state.
- Keyboard/touch movement and jumping work.
- Solid side, underside, and top collisions work.
- One-way upward passage and landing work.
- Death, respawn, checkpoint, goal completion, and restart-race behavior work.
- Desktop and mobile layouts remain inside the viewport.
- Required runtime assets load successfully.
- `art-source/` and unused source sheets are absent from the production package.
- Unit and browser suites pass.

The browser suite in `test/e2e/game.spec.js` is the source of truth for gameplay, console, responsive, screenshot, and asset-boot gates. The asset validator is the source of truth for runtime PNG presence and player normalization.

## Commands

```sh
npm ci
npm run validate:assets
npm test
npm run test:e2e
```

Run the complete release gate with:

```sh
npm run test:release
```

Playwright starts `node server.js` automatically. If port `3000` is occupied, stop the other server before running the browser suite; do not reuse an unrelated process.

## Evidence

Capture the aggregate command output and store it with the release candidate, for example:

```sh
npm run test:release 2>&1 | tee release-evidence/<commit>-<date>.txt
```

Attach the desktop/mobile screenshots and record any environment-specific limitations. A failed or incomplete gate must be labeled not release-ready until rerun successfully.

## Production package check

The deployable package includes the application files and `assets/` only. It must exclude `art-source/`, `test/`, `test-output/`, `test-results/`, and development metadata. Verify the package contents before publishing so editable source art cannot be shipped accidentally.
