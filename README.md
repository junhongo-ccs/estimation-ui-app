# AI見積もりシステム - Frontend UI

## 概要

AI Agent を使用した開発見積もりとデザイン相談のWebアプリケーション

## 特徴

- ✅ **8px グリッドシステム**: 美しく一貫したマージン・パディング
- ✅ **デザインシステム**: CSS Variables による統一されたデザイントークン
- ✅ **レスポンシブ対応**: モバイル・タブレット・デスクトップ
- ✅ **2つの機能**:
  - 開発見積もり
  - デザインフェーズ相談

## 技術スタック

- HTML5
- CSS3 (CSS Variables)
- Vanilla JavaScript (ES6+)

## セットアップ

### 1. APIエンドポイントの設定

`app.js` を開いて、以下を設定:

```javascript
const API_ENDPOINT = 'YOUR_ENDPOINT_URL';
const API_KEY = 'YOUR_API_KEY';
```

### 2. ローカルで実行

```bash
# シンプルなHTTPサーバーを起動
python3 -m http.server 8000

# または
npx serve
```

ブラウザで `http://localhost:8000` を開く

### 3. 開発モード（モック）

APIなしでテストする場合、`app.js` の最後のコメントを解除:

```javascript
// Uncomment this to test without API
/*
async function submitToAgent(data) {
  // ... mock implementation
}
*/
```

## ファイル構成

```
estimation-ui-app/
├── index.html              # メインHTML
├── app.js                  # アプリケーションロジック
├── styles/
│   ├── design-system.css   # デザインシステム（8px grid）
│   └── app.css             # アプリケーションスタイル
└── README.md
```

## デザインシステム

### Spacing (8px grid)

```css
--space-1: 8px
--space-2: 16px
--space-3: 24px
--space-4: 32px
--space-5: 40px
--space-6: 48px
--space-8: 64px
```

### Colors

```css
--primary: hsl(220, 90%, 56%)
--secondary: hsl(280, 70%, 60%)
--success: hsl(142, 71%, 45%)
--background: hsl(220, 20%, 98%)
--surface: hsl(0, 0%, 100%)
```

### Typography

```css
--font-size-sm: 14px
--font-size-base: 16px
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px
```

## 使い方

### 開発見積もり

1. 「開発見積もり」タブを選択
2. プロジェクトタイプ、開発期間、チームサイズを入力
3. 「見積もりを取得」をクリック
4. AI Agent が見積もりを生成

### デザイン相談

1. 「デザイン相談」タブを選択
2. 現在の状況（ワイヤーフレーム有無等）を入力
3. Figma経験、画面数を入力
4. 「相談する」をクリック
5. AI Agent がアドバイスを生成

## デプロイ

### Azure Static Web Apps

```bash
# Azure Static Web Apps にデプロイ
az staticwebapp create \
  --name estimation-ui-app \
  --resource-group rg-estimation-agent \
  --source . \
  --location eastus2 \
  --branch main
```

### GitHub Pages

```bash
# GitHub Pages にデプロイ
git add .
git commit -m "Add frontend UI"
git push origin main

# Settings → Pages → Source: main branch
```

## TODO

- [ ] APIエンドポイントの設定
- [ ] APIキーの設定
- [ ] デプロイ
- [ ] E2Eテスト

## ライセンス

MIT
