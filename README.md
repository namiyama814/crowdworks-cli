# @namiyama/crowdworks-cli

クラウドワークスの固定報酬プロジェクトをHTTPで検索・比較し、提案文を作成する TypeScript 製CLIとローカルMCPサーバーです。非公式ツールです。

## インストール

```sh
npm install -g @namiyama/crowdworks-cli
cw init
```

## CLI

```sh
# 保存検索を作成する
cw saved-search add typescript "TypeScript" --min-budget 50000 --verified --min-rating 4.0

# 検索・比較する
cw saved-search run typescript --sort competition
cw job show https://crowdworks.jp/public/jobs/123456

# 完成尺・作業内容・報酬条件を含む本文も確認する
cw job show https://crowdworks.jp/public/jobs/123456 --detail

# 提案文を作る
cw proposal create https://crowdworks.jp/public/jobs/123456

```

検索結果と詳細には、応募人数・契約人数・募集人数・気になる数、および算出可能な競争率を表示します。

## MCP

CodexなどのMCPクライアントから、以下のローカルツールを利用できます。

- `list_saved_searches`
- `search_jobs`
- `run_saved_search`
- `get_job`
- `create_proposal`

```sh
codex mcp add crowdworks -- cw-mcp
```

応募・ログイン機能は提供しません。作成した提案文を確認し、応募はクラウドワークスの通常画面から行ってください。

## 開発

Node.js 24 LTS と Docker を使います。

```sh
npm install
npm run check
docker compose run --rm app
npm run pack:check
```

Docker Composeは、依存関係とnpmキャッシュをソースツリー外の名前付きボリュームに保存します。

## 注意

サイトの画面構造が変更された場合、取得が失敗することがあります。本ツールはログイン、応募、CAPTCHA回避、制限回避を行いません。クラウドワークスの利用規約とガイドラインを確認して利用してください。
