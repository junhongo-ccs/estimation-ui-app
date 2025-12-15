# estimation-ui-app

UI for the AI estimation POC. Renders raw HTML returned by Agent Core. See /docs.

## リリースノート

### v1.3.0 (2025-12-14)

**追加（AI補正）**: Azure Functions連携による補正案の表示  
**互換性**: 既存機能に影響なし（AI補正は失敗時も概算見積は表示）  
**運用**: `window.ENHANCE_BASE` で本番URL上書き可能  
**品質**: エラーハンドリング強化（詳細ログ出力 + ユーザー通知）

**詳細:**

- `ENHANCE_BASE` 設定を追加（Azure Functions URL上書き対応）
- `callAIEnhance()` で `/api/enhance_estimate` を呼び出し
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

## 環境設定

### Azure Functions（AI補正）のURL設定

本番環境では、HTMLの `<head>` または `<body>` の先頭に以下のスクリプトを追加してください：

```html
<script>
  // Azure Functions (estimate-agent-backend)
  window.ENHANCE_BASE = 'https://estimate-api-cli.azurewebsites.net';
</script>
```

ローカル開発時は自動的に `http://127.0.0.1:7071` を使用します。Codespaces環境では自動的にHTTPSエンドポイントを検出します。

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
- API 呼び出しは `index.html` 内の `ENHANCE_BASE` 設定に従います

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

### 4. Azure Functions（AI補正）との接続設定

本番では Azure Functions を直接指定します。

[index.html](index.html) 冒頭で設定：

```html
<script>
  window.ENHANCE_BASE = "https://estimate-api-cli.azurewebsites.net";
</script>
```

- `/api/enhance_estimate` が自動的に呼ばれます
- AI補正が失敗しても、概算見積（Core結果）は必ず表示されます

### 5. 動作確認用サンプル入力

Azure Functions `/api/enhance_estimate` は
`core_result.estimated_amount` が必須です。

```json
{
  "project_name": "テスト案件",
  "summary": "UI改善",
  "scope": "要件〜実装",
  "core_result": {
    "estimated_amount": 1584000,
    "currency": "JPY"
  }
}
```

### 補足

- `node_modules/` は Git管理対象外です
- PoC用途のため、環境変数の自動切替やビルド工程は入れていません
- 本番配信時は「静的ファイルとして置くだけ」で動作します

## テストデータ

### AI補正用 JSON サンプル（500k）

```json
{
  "project_name": "Webアプリケーション",
  "summary": "Webアプリケーション構築",
  "scope": "フロントエンド＋バックエンド＋DB",
  "core_result": {
    "estimated_amount": 500000,
    "currency": "JPY"
  }
}
```

### AI補正用 JSON サンプル（1,584,000）

```json
{
  "project_name": "テスト案件",
  "summary": "UI改善",
  "scope": "要件〜実装",
  "core_result": {
    "estimated_amount": 1584000,
    "currency": "JPY"
  }
}
```

**注:** `breakdown`・`warnings`・`assumptions`・`config_version` は任意フィールドです。存在しなくても AI補正は動作します。

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
- Azure Functions（estimate-api-cli）が本番で起動済み
- HTTPS での配信（ブラウザ制限対策）

### 1. GEMINI_API_KEY の管理

**設定場所：** Azure Function App の Application Settings（一元管理）

```bash
RG="rg-jhongo0067-1948"
APP="estimate-api-cli"

# 現在の設定を確認
az functionapp config appsettings list -g "$RG" -n "$APP" \
  --query "[?name=='GEMINI_API_KEY'].name" -o tsv
```

**管理者：** Azure 権限を持つ運用者（GitHub Secrets は不要）

**UI 側：** GEMINI_API_KEY を持たない（静的公開のため漏洩リスク）

### 2. UI のデプロイ先（推奨）

**方法：** Azure Storage Static Website

1. ストレージアカウントの「静的Webサイト」を有効化
2. `index.html` と `static/` をアップロード
3. CDN または Application Gateway で HTTPS 化

**代替案：**
- Azure Static Web Apps（後で自動デプロイに移行可能）
- GitHub Pages（社外公開が問題なければ）
- 社内 Web サーバー（Nginx / Apache）

### 3. DEBUG 設定

**本番環境：** `window.DEBUG = false`（[index.html](index.html#L11)）

- ユーザーには簡潔なエラーメッセージのみ
- コンソール出力は最小化

**PoC調査時：** `window.DEBUG = true`（一時的）

- コンソールに詳細ログを出力
- Network タブで API リクエスト/レスポンスを追跡可能

### 4. 本番チェックリスト

```
□ GEMINI_API_KEY が Function App に設定されている
□ Functions エンドポイント (https://estimate-api-cli.azurewebsites.net) が応答
□ UI が HTTPS で配信されている（http NG）
□ CORS が機能している（Functions の Access-Control-Allow-Origin）
□ index.html の DEBUG = false に設定
□ index.html の ENHANCE_BASE = 'https://estimate-api-cli.azurewebsites.net'
□ ブラウザで UI にアクセスし、フォーム送信が完了
□ Network タブで POST /api/enhance_estimate が 200 応答
□ Application Insights で Functions のログが記録される
```

### 5. 疎通確認（CLI）

```bash
# Functions が生きているか確認
curl -i -X POST "https://estimate-api-cli.azurewebsites.net/api/enhance_estimate" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name":"本番疎通",
    "summary":"ping",
    "scope":"test",
    "core_result":{"estimated_amount":500000,"currency":"JPY"}
  }'
```

**期待される応答:** `HTTP 200 OK`

**502 Bad Gateway の場合：** GEMINI_API_KEY が未設定


