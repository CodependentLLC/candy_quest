# Candy Quest art sources

This directory contains editable or superseded source sheets and preparation artifacts. It is not part of the runtime asset bundle.

Production assets belong under `assets/` and must be referenced by `src/assets.js` or `asset-manifest.json`. When preparing a deployable package, include the application files and `assets/`, but exclude `art-source/`, `test/`, `test-output/`, and development metadata.

Runtime assets should be individually cropped or normalized when animation or collision alignment requires stable dimensions. Keep the original source sheets here for future art revisions.
