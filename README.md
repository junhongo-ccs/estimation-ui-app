# estimation-ui-app

UI for the AI estimation POC. Renders raw HTML returned by Agent Core. See /docs.

## リリースノート

### v2.0.0 (2025-12-21) - **Agent中心設計への完全移行**

**破壊的変更**: Azure AI Agent 中心設計への完全な整合化  
**削除**: ENHANCE_BASE、callAIEnhance、AI補正の直接呼び出し  
**変更**: UIは `/estimate` エンドポイントに **1回だけ** リクエスト  
**整合**: `docs/00_system_specification.md` および `docs/00_design_principles.md` との完全な整合

**詳細:**

- ✅ **設計原則チェックリスト完全合格**
  - Agent がツール選択・呼び出し順序を決定
  - UI は Agent に 1 回だけリクエスト
  - Tool 同士は通信しない
  - エラー時の判断も Agent が実行

- 🗑️ **削除された機能**
  - `window.ENHANCE_BASE` 設定
  - `callAIEnhance()` 関数
  - `renderAIHtml()` 関数
  - `setAIState()` 関数
  - AI補正セクションのHTML要素
  - DEBUG モード設定

- 📝 **ドキュメント更新**
  - Gemini API 関連の記述を完全削除
  - Azure OpenAI 一本化を明記
  - Agent中心設計の原則を追加
  - サンプルデータを Agent API 形式に更新

- ⚠️ **移行ガイド**
  - Agent側で AI補正を含む統合レスポンスを返す必要があります
  - `window.AGENT_BASE` を本番エンドポイントに設定してください
  - レスポンス形式: `{ status, estimated_amount, currency, message, warnings, assumptions, config_version }`

### v1.3.0 (2025-12-14) - **[非推奨]**

> ⚠️ **このバージョンは v2.0.0 で廃止されました。**  
> Azure Functions への直接呼び出しは Agent 中心設計に反するため削除されました。

**追加（AI補正）**: Azure Functions連携による補正案の表示  
**互換性**: 既存機能に影響なし（AI補正は失敗時も概算見積は表示）  
**運用**: ~~`window.ENHANCE_BASE` で本番URL上書き可能~~ （v2.0.0で削除）  
**品質**: エラーハンドリング強化（詳細ログ出力 + ユーザー通知）

**詳細:**

- ~~`ENHANCE_BASE` 設定を追加（Azure Functions URL上書き対応）~~ （v2.0.0で削除）
- ~~`callAIEnhance()` で `/api/enhance_estimate` を呼び出し~~ （v2.0.0で削除）
- エラー時は詳細ログ（status/url/body）をコンソール出力
- AI補正失敗時は「取得失敗」と表示し、概算見積は正常表示を維持
- ヘルパー関数（`escapeHtml`, `formatJPY`）を追加し、XSS対策と通貨表示を統一
- `renderAI()` の日本語辞書を最小化（サーバー側の日本語出力を信頼）

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

## 起動方法（UI）

本 UI（estimation-ui-app）は ビルド不要の静的 HTML です。
ローカル検証・本番配信の両方に対応しています。

### 1. ローカル起動（最も簡単 / Python）

Python が入っていれば 即起動できます。

```bash
cd estimation-ui-app
python -m http.server 8000
```

ブラウザでアクセス：

```
http://localhost:8000
```

- `index.html` が自動的に表示されます
- API 呼び出しは `index.html` 内の `AGENT_BASE` 設定に従います

### 2. ローカル起動（Node.js 環境がある場合・任意）

```bash
cd estimation-ui-app
npx serve .
```

### 3. 静的ホストでの配信（本番 / 検証）

この UI は 純粋な静的ファイルのため、以下にそのまま配置できます。

**対応例**

- GitHub Pages
- Azure Static Web Apps
- Azure Blob Storage（Static website 有効化）
- 任意の Web サーバー（Nginx / Apache）

**必要なファイル**

- `index.html`
- `static/`
- `docs/`（任意）

### 4. Agent エンドポイントとの接続設定

本番では Azure AI Agent のエンドポイントを指定します。

[index.html](index.html) 冒頭で設定：

```html
<script>
  window.AGENT_BASE = "https://your-agent-endpoint.azure.com";
</script>
```

- UIは `/estimate` エンドポイントに **1回だけ** リクエストします
- Agent が計算・推論・統合をすべて実行し、統合されたレスポンスを返します

### 5. 動作確認用サンプル入力

Agent `/estimate` エンドポイントへのリクエスト例：

```json
{
  "project_name": "テスト案件",
  "summary": "UI改善",
  "scope": "要件〜実装",
  "screen_count": 12,
  "complexity": "medium"
}
```

**Agent レスポンス例：**

```json
{
  "status": "ok",
  "estimated_amount": 1584000,
  "currency": "JPY",
  "message": "<div>...根拠HTML...</div>",
  "warnings": ["..."],
  "assumptions": ["..."],
  "config_version": "1.0.0"
}
```

### 補足

- `node_modules/` は Git管理対象外です
- PoC用途のため、環境変数の自動切替やビルド工程は入れていません
- 本番配信時は「静的ファイルとして置くだけ」で動作します

## 8px Grid Class Naming (Standard)

- Utilities: `u-mt-8`, `u-mb-8`, `u-pt-16`, `u-gap-24`
- Layout: `l-stack-8` (vertical stack gap:8), `l-stack-16`, `l-inline-8` (inline row gap:8)
- Document: `doc--8px` (global 8px formatting), `doc__section--16`, `doc__block--24`
- Rules: `u-` = utilities, `l-` = layout, `doc-` = document; numeric suffix denotes px (multiples of 8 only).

## CSS Utilities

- Minimal 8px utilities and `.doc--8px` base rules live in [static/css/style.css](static/css/style.css).

## 本番接続ガイド

### 前提条件

- UI は **静的ファイル**（HTML/JS/CSS）として配信
- Azure AI Agent が本番で起動済み
- HTTPS での配信（ブラウザ制限対策）

### 1. アーキテクチャ概要

**Agent中心設計：**
- UI は Azure AI Agent に **1回だけ** リクエスト
- Agent が計算API・Azure OpenAI・その他ツールをオーケストレーション
- UI は統合されたレスポンスを表示するのみ

**設定場所：** Azure AI Agent の環境変数（Azure AI Foundry）

**UI 側：** API キーを持たない（静的公開のため漏洩リスク）

### 2. UI のデプロイ先（推奨）

**方法：** Azure Storage Static Website

1. ストレージアカウントの「静的Webサイト」を有効化
2. `index.html` と `static/` をアップロード
3. CDN または Application Gateway で HTTPS 化

**代替案：**
- Azure Static Web Apps（後で自動デプロイに移行可能）
- GitHub Pages（社外公開が問題なければ）
- 社内 Web サーバー（Nginx / Apache）

### 3. 本番チェックリスト

```
□ Azure AI Agent エンドポイントが応答している
□ UI が HTTPS で配信されている（http NG）
□ CORS が機能している（Agent の Access-Control-Allow-Origin）
□ index.html の AGENT_BASE が正しく設定されている
□ ブラウザで UI にアクセスし、フォーム送信が完了
□ Network タブで POST /estimate が 200 応答（1回のみ）
□ Application Insights で Agent のログが記録される
```

### 4. 疎通確認（CLI）

```bash
# Agent が生きているか確認
curl -i -X POST "https://your-agent-endpoint.azure.com/estimate" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name":"本番疎通",
    "summary":"ping",
    "scope":"test",
    "screen_count":5,
    "complexity":"low"
  }'
```

**期待される応答:** `HTTP 200 OK` + JSON レスポンス

**エラーの場合:** Agent のログを確認（Azure AI Foundry / Application Insights）



