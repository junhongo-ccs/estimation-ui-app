# Copilot Instructions for estimation-ui-app

Purpose: Enable AI coding agents to be immediately productive in this repository by documenting actual architecture, workflows, conventions, and integration points.

## Big Picture
- Component: `estimation-ui-app` is a minimal UI that posts user inputs to Agent Core and renders raw HTML returned.
- Data flow: UI → POST `http://127.0.0.1:8001/estimate` (Agent Core) → returns HTML rationale → UI injects into result container.
- Boundary: UI never calls calculation service directly; Agent Core orchestrates RAG + Functions + LLM.
- Demo scope: POC only; use public/fictional data. No sensitive data.
- Language: Japanese-first UI text; UTF-8.

## Key Files
- Root UI page: [index.html](../index.html)
  - Form fields: `project_name`, `summary`, `scope`, `screen_count:number`, `complexity:low|medium|high`.
  - Endpoint base: `AGENT_BASE = "http://127.0.0.1:8001"`; posts to `/estimate`.
  - Rendering: parses JSON and updates three areas: `#status` (status text), `#summary` (amount + currency), `#out` (HTML message).
- Context docs:
  - [docs/00_system_prompt.md](../docs/00_system_prompt.md): system architecture, roles, rules.
  - [docs/01_estimation-ui-app.md](../docs/01_estimation-ui-app.md): UI design and behavior, 8px grid CSS guidance.
- Repo meta: [README.md](../README.md): brief project summary.

## Developer Workflows
- Local run: open [index.html](../index.html) in a browser (no build tooling). Ensure Agent Core is reachable.
- Endpoint override (official rule): inject a single inline script to set `window.AGENT_BASE` per environment; JS uses `window.AGENT_BASE ?? "http://localhost:8001"`. No build differences required.

  Example override:

  ```html
  <script>
    window.AGENT_BASE = "https://api.example.com";
  </script>
  ```
- Testing UI behavior: use browser devtools console to observe logs: `[estimate] url/payload/status/html length` and errors.
- Error handling: non-`2xx` → text content shows `Error <status>: <body>`; exceptions → `Fetch failed: <err>`.

## Conventions & Patterns
- 8px grid: follow spacing utilities and structure described in [docs/01_estimation-ui-app.md](../docs/01_estimation-ui-app.md). Margin, padding, line-height must be multiples of 8px.
- HTML output policy: Agent Core returns HTML in `message`; UI should render without escaping in `#out`. Keep a dedicated container and avoid mixing with form DOM.
- API contract (fixed):
  - Request body (example): `{ project_name, summary, scope, screen_count:number, complexity }`.
  - Response (fixed): `{ status: "ok"|"error", estimated_amount:number, currency:"JPY", message:string|null }`.
- Security/data scope: do not introduce real customer data; stick to demo/sample inputs.
- Logs: use concise `[estimate]`-prefixed `console.log`/`console.error` for traceability.

### 8px Grid Class Naming (standard set)
- Spacing: `.u-mt-8`, `.u-mb-8`, `.u-pt-16`, `.u-gap-24`
- Layout: `.l-stack-8` (vertical stack gap:8), `.l-stack-16`, `.l-inline-8` (inline row gap:8)
- Document: `.doc--8px` (global 8px formatting), `.doc__section--16`, `.doc__block--24`
- Rules: `u-` utilities, `l-` layout, `doc-` document-only; numeric suffix is px in multiples of 8.

### CSS Utilities Location
- See [static/css/style.css](../static/css/style.css) for the minimal 8px utilities and `.doc--8px` base rules applied to Agent Core HTML.

### Responsibility Split (Core vs UI)
- Core: returns HTML with structural semantics and attaches `.doc--8px` only; avoids fine-grained spacing classes for now.
- UI: applies visual spacing and layout utilities; margins/padding use 8px multiples only.
- Immediate UI application: `#status` uses `.u-mb-8`, `#summary` uses `.u-mb-16`, and `#out` uses `.doc--8px .u-mt-8`.

## Integration Points
- Agent Core: HTTP `POST /estimate` at `AGENT_BASE`. All business logic lives there; UI is transport + render. `AGENT_BASE` is provided via `window.AGENT_BASE` override when needed.
- Calculation service: indirect via Agent Core; UI should not call it.
- Future extensions (P2): RAG via Azure AI Search, Azure Functions, Azure OpenAI. Keep UI decoupled; only the endpoint base should vary.

## Examples From This Repo
- Posting to Agent Core (from [index.html](../index.html)):
  - Builds payload via `FormData` → converts `screen_count` to number → `fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`.
  - Parses JSON and, if `status === "ok"`, sets `#summary` to `estimated_amount currency` and renders `message` as HTML into `#out`.
- Status UX: sets `#status` to progress texts: 「見積もり生成中…」→「完了」。On error, shows error reason.
 - Amount formatting: `#summary` shows heading "概算見積" and amount as `¥1,234,567` using `Intl.NumberFormat('ja-JP')`, truncates decimals (yen is integer). Shows a small note: "※あくまで目安です". Agent Core returns numeric `estimated_amount` only.
 - Error handling: when `status !== "ok"`, `#summary` is hidden and `#status` shows "現在、概算を算出できません". `.doc--8px` is not applied to `#out`.

## When Implementing Changes
- Preserve the minimal structure in [index.html](../index.html); add CSS/JS files only when necessary and keep 8px grid.
- If adding CSS utilities, use names like `.mt-8`, `.p-16`, `.gap-8` and apply to the result container and form layout.
- If adding a configurable `AGENT_BASE`, document the default and provide a single override mechanism.
- Do not bypass or duplicate business logic in UI; keep orchestration in Agent Core.

## Unknowns / Assumptions
- Agent Core schema beyond `rationale` is not enforced here; use defensive checks on `res.ok` and handle plain-text bodies.
- Deployment targets (Flask/App Service) are described in docs but not present in this UI repo; keep UI static and portable.

Feedback wanted: Confirm endpoint naming and any additional response fields required by Agent Core so we can codify them here (e.g., `estimated_amount`, `status`).