# estimation-ui-app
UI for the AI estimation POC. Renders raw HTML returned by Agent Core. See /docs.

## 8px Grid Class Naming (Standard)
- Utilities: `u-mt-8`, `u-mb-8`, `u-pt-16`, `u-gap-24`
- Layout: `l-stack-8` (vertical stack gap:8), `l-stack-16`, `l-inline-8` (inline row gap:8)
- Document: `doc--8px` (global 8px formatting), `doc__section--16`, `doc__block--24`
- Rules: `u-` = utilities, `l-` = layout, `doc-` = document; numeric suffix denotes px (multiples of 8 only).

## CSS Utilities
- Minimal 8px utilities and `.doc--8px` base rules live in [static/css/style.css](static/css/style.css).
