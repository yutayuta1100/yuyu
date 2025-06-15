# ICF自動分類システム

患者情報を入力して、ICF（国際生活機能分類）に基づく自動分類を行うWebアプリケーションです。

## デモサイト
https://your-app-name.vercel.app （デプロイ後にURLが決まります）

## セキュリティ対策済み

- APIキーはサーバー側で管理（クライアントサイドには露出しない）
- レート制限実装（1時間あたり100リクエスト）
- CORS設定によるアクセス制限
- Helmetによるセキュリティヘッダー設定

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、OpenAI APIキーを設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. サーバーの起動

開発環境：
```bash
npm run dev
```

本番環境：
```bash
npm start
```

### 4. アクセス

ブラウザで http://localhost:3000 にアクセスしてください。

## デプロイ方法

### Vercel

1. Vercelアカウントを作成
2. プロジェクトをGitHubにプッシュ
3. Vercelでプロジェクトをインポート
4. 環境変数を設定（OPENAI_API_KEY）

### Heroku

1. Herokuアカウントを作成
2. Heroku CLIをインストール
3. 以下のコマンドを実行：

```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_api_key
git push heroku main
```

## 注意事項

- `.env`ファイルは絶対にGitにコミットしないでください
- 本番環境では必ず`ALLOWED_ORIGIN`を適切に設定してください
- Google AdSenseのコードは実際のものに置き換えてください