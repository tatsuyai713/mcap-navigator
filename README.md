# MCAP Navigator + Lichtblick (統合版 / Integrated)

## 日本語

左側のフォルダツリーから ROS2 の `.mcap` を選択し、右側の Lichtblick（Web）へ読み込ませるブラウザ UI です。ファイル選択は左ペインのみで行い、Lichtblick 側のトップメニューと起動時の案内画面は表示しない構成にしています。

### 構成

- `./lichtblick` が本体（Lichtblick のサブモジュール）
- `./lichtblick/packages/mcap-portal` が UI と起動制御
- `./lichtblick/packages/mcap-file-server` が MCAP ツリー取得と配信 API
- `./mcap-data` が既定の MCAP ルート（存在すればこちらを優先）
- ルート直下の `./apps` は旧プロトタイプで、現行フローでは使いません

### 前提

- Node.js 20 以上
- Yarn（corepack 経由で OK）

### クイックスタート

1. サブモジュールを含めて取得

```bash
git submodule update --init --recursive
```

2. 依存関係のインストール

```bash
cd lichtblick
corepack enable
yarn install
```

3. MCAP を配置

```text
./mcap-data/
```

`.mcap` を置いてください。`.mcap.*` のメタファイルも表示できます。

4. 開発サーバ起動（安定版）

```bash
cd lichtblick
./scripts/dev-start.sh
```

5. ブラウザを開く

- UI: `http://127.0.0.1:8080/`
- API: `http://127.0.0.1:3100/api/health`

停止は次で行います。

```bash
cd lichtblick
./scripts/dev-stop.sh
```

### 画面仕様

- 左ペインは MCAP ツリー
- `.mcap` と `.mcap.*`（メタファイル）を表示
- `.mcap.*` を選ぶと対応する `.mcap` に自動解決
- 右ペインは Lichtblick 本体
- トップメニュー非表示
- Open Data Source / New to Lichtblick の案内画面は抑止
- 追加アイコンは Extensions / Layout / Topics / Alerts / Variables / Logs / App Settings など

### MCAP ルートの解決

- 既定で `./mcap-data` を優先
- `./mcap-data` が無い場合は `./lichtblick/mcap-data` を参照
- 明示指定したい場合は `MCAP_ROOT` を使用

```bash
MCAP_ROOT=/path/to/mcap-data ./scripts/dev-start.sh
```

### API（mcap-file-server）

- `GET /api/tree` … MCAP ツリー取得
- `GET /api/file/<path>` … ファイル配信
- `GET /api/health` … ヘルスチェック

### よくあるトラブル

#### `Failed to fetch: /api/tree` が出る

```bash
curl -I http://127.0.0.1:3100/api/health
lsof -n -iTCP:3100 -sTCP:LISTEN
lsof -n -iTCP:8080 -sTCP:LISTEN
```

問題があれば再起動してください。

```bash
cd lichtblick
./scripts/dev-stop.sh
./scripts/dev-start.sh
```

#### 画面が古い／メニューが消えない

- ハードリロード（キャッシュ削除）を実行
- `http://127.0.0.1:8080/` を開いているか確認

### 更新を取り込みやすくする方針

Lichtblick 本体の改変は最小限にしています。差分は以下に集約されています。

- `packages/mcap-portal`（UI と起動制御）
- `packages/mcap-file-server`（API）
- `web/src/entrypoint.tsx`（エントリの差し替え）
- `packages/suite-web/src/CompatibilityBanner.tsx`（互換性バナー抑止）

上流更新時は `./lichtblick` を更新し、上記の差分だけを維持する運用です。

### ログ

`./lichtblick/.dev-logs/` に保存されます。

- `web-dev-server.log`
- `mcap-file-server.log`

---

## English

This is a browser UI that lets you pick a ROS2 `.mcap` from a left-side tree and load it into Lichtblick (Web) on the right. File selection is only done from the left pane, and the Lichtblick top menu plus first-run prompts are suppressed.

### Layout

- `./lichtblick` is the main codebase (Lichtblick submodule)
- `./lichtblick/packages/mcap-portal` provides the UI and boot control
- `./lichtblick/packages/mcap-file-server` provides the MCAP tree and file API
- `./mcap-data` is the default MCAP root when present
- `./apps` at the repo root is a legacy prototype and is not used

### Prerequisites

- Node.js 20+
- Yarn (via corepack is fine)

### Quick start

1. Initialize the submodule

```bash
git submodule update --init --recursive
```

2. Install dependencies

```bash
cd lichtblick
corepack enable
yarn install
```

3. Place MCAP files

```text
./mcap-data/
```

Place `.mcap` files here. `.mcap.*` meta files are also shown.

4. Start the dev servers (stable script)

```bash
cd lichtblick
./scripts/dev-start.sh
```

5. Open the UI

- UI: `http://127.0.0.1:8080/`
- API: `http://127.0.0.1:3100/api/health`

Stop servers with:

```bash
cd lichtblick
./scripts/dev-stop.sh
```

### UI behavior

- Left pane shows the MCAP tree
- `.mcap` and `.mcap.*` meta files are listed
- Selecting `.mcap.*` resolves to the matching `.mcap`
- Right pane hosts Lichtblick
- Top menu is hidden
- Open Data Source / New to Lichtblick prompts are suppressed
- Extra icons include Extensions / Layout / Topics / Alerts / Variables / Logs / App Settings

### MCAP root resolution

- Prefer `./mcap-data`
- If missing, use `./lichtblick/mcap-data`
- Override with `MCAP_ROOT`

```bash
MCAP_ROOT=/path/to/mcap-data ./scripts/dev-start.sh
```

### API (mcap-file-server)

- `GET /api/tree` — MCAP tree
- `GET /api/file/<path>` — file streaming
- `GET /api/health` — health check

### Troubleshooting

#### `Failed to fetch: /api/tree`

```bash
curl -I http://127.0.0.1:3100/api/health
lsof -n -iTCP:3100 -sTCP:LISTEN
lsof -n -iTCP:8080 -sTCP:LISTEN
```

Restart if needed:

```bash
cd lichtblick
./scripts/dev-stop.sh
./scripts/dev-start.sh
```

#### UI looks old / menu is still visible

- Hard reload to clear cache
- Ensure you are using `http://127.0.0.1:8080/`

### Update strategy

We keep upstream changes easy by minimizing modifications. The main diffs live here:

- `packages/mcap-portal` (UI and boot control)
- `packages/mcap-file-server` (API)
- `web/src/entrypoint.tsx` (entry swap)
- `packages/suite-web/src/CompatibilityBanner.tsx` (banner suppression)

Update `./lichtblick` and re-apply only those diffs.

### Logs

Logs are stored in `./lichtblick/.dev-logs/`.

- `web-dev-server.log`
- `mcap-file-server.log`

