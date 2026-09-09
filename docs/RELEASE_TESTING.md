# Browser Release Testing

The Playwright suite runs against the local Node server in both desktop and
mobile projects. Root paths validate ordinary local hosting; the
`/candy_quest/` checks emulate the GitHub Pages project-site prefix and verify
the HTML, module, stylesheet, and representative runtime asset paths used by
the deployed application.

Release screenshots are intentionally produced once per matching project:

- `test-output/desktop/candy-quest-desktop.png`
- `test-output/mobile/candy-quest-mobile.png`

Reduced-motion coverage treats particles and screen shake as non-essential
effects. They are disabled while player physics and input continue unchanged.

Run `npm run test:release` to validate assets, unit/server smoke tests, and the
full browser suite. Use `npx playwright test --list` to verify collection
before investigating individual browser failures.
