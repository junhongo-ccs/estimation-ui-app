# estimation-ui-app
UI for the AI estimation POC. Renders raw HTML returned by Agent Core. See /docs.

## Release Notes

### v1.2.0 (2025-12-14)
**追加（非破壊）**: `config_version`, `warnings`, `assumptions`  
**互換性**: 既存UI/契約に影響なし  
**運用**: 設定版数の可視化、注意喚起・前提条件の明示  
**品質**: 全18テスト合格

**詳細:**
- Agent Coreレスポンスに `warnings` 配列、`assumptions` 配列、`config_version` 文字列を追加
- UIに折りたたみ可能な注意事項・前提条件セクションを追加
- フッターにconfig_versionを表示
- Codespaces環境でのHTTPS通信対応

## 8px Grid Class Naming (Standard)
- Utilities: `u-mt-8`, `u-mb-8`, `u-pt-16`, `u-gap-24`
- Layout: `l-stack-8` (vertical stack gap:8), `l-stack-16`, `l-inline-8` (inline row gap:8)
- Document: `doc--8px` (global 8px formatting), `doc__section--16`, `doc__block--24`
- Rules: `u-` = utilities, `l-` = layout, `doc-` = document; numeric suffix denotes px (multiples of 8 only).

## CSS Utilities
- Minimal 8px utilities and `.doc--8px` base rules live in [static/css/style.css](static/css/style.css).
