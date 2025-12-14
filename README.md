# estimation-ui-app
UI for the AI estimation POC. Renders raw HTML returned by Agent Core. See /docs.

## リリースノート

### v1.2.0 (2025-12-14)
**追加（非破壊）**: `config_version` / `warnings` / `assumptions`  
**互換性**: 既存UI・API契約に影響なし（新フィールドは任意）  
**運用**: 設定版数のフッター表示、注意事項・前提条件の折りたたみ表示を追加  
**品質**: 全18テスト合格（UI表示／CORS／Codespaces対応）

**詳細:**
- Agent Coreレスポンスに `warnings`・`assumptions`・`config_version` を追加
- UIに注意事項／前提条件の折りたたみセクションを追加
- フッターに `config_version` を表示してデプロイ状態の可視化を強化
- Codespaces環境でのHTTPS自動判定（UI: 8002 → Core: 8001）に対応
- `renderAI()` で英語の定型理由文を簡易辞書により日本語へ置換

## 8px Grid Class Naming (Standard)
- Utilities: `u-mt-8`, `u-mb-8`, `u-pt-16`, `u-gap-24`
- Layout: `l-stack-8` (vertical stack gap:8), `l-stack-16`, `l-inline-8` (inline row gap:8)
- Document: `doc--8px` (global 8px formatting), `doc__section--16`, `doc__block--24`
- Rules: `u-` = utilities, `l-` = layout, `doc-` = document; numeric suffix denotes px (multiples of 8 only).

## CSS Utilities
- Minimal 8px utilities and `.doc--8px` base rules live in [static/css/style.css](static/css/style.css).
