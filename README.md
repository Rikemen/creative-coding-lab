# Rikemen Creative Coding Lab

**p5.js × Firebase で「システムの仕組み」をメディアアートを作りながら学ぶギャラリー＆ハンズオン教材リポジトリ**

単なる文字だけのToDoアプリではなく、光や星座など視覚的に美しいインタラクティブアートの実装を通じて、データベース（CRUD）・リアルタイム通信・認証と認可（Security Rules）の裏側を直感的に体験・学習できます。

---

## ディレクトリ構成

ビルドツール（Webpack / Vite 等）を使わない素の HTML + ES Modules 構成のため、フォルダ構造がそのままURL構造と一致します。

```text
rikemen-creative-coding-lab/
├── index.html                      # ① カード検索・一覧ページ（ポケカ検索風の作品図鑑）
├── detail.html                     # ② 作品概要ページ（拡大カード・解説・「作品を見る」導線）
├── exhibition.html                 # ③ 作品ステージ（作品をiframe表示・ローカル時は Start/End 切替）
├── assets/                         # ギャラリーUI用のCSS・キャラクター画像・描画スクリプト
│   ├── css/gallery.css             # Rikemen 青×白ベース＆トレカUIのスタイル定義
│   ├── images/rikemen-rikejo/      # Rikemen & Rikejo キャラクター透過PNG素材
│   └── js/
│       ├── characters.js           # Rikemen 10人のキャラクターマスター定義
│       ├── categories.js           # システム分野マスター定義
│       ├── artworks/               # 作品ごとのカードメタデータ定義
│       │   └── 01-starry-sky-crud.js
│       ├── catalog.js              # 全作品カードの集約・検索エントリーポイント
│       ├── card-renderer.js        # トレーディングカードDOM共通生成コンポーネント
│       ├── entrance.js             # カード検索・絞り込み制御
│       ├── detail.js               # 作品概要ページの描画制御
│       └── exhibition.js           # 作品ステージのiframe・モード切替制御
├── shared/                         # 全作品で共有する Firebase 初期化基盤
│   ├── firebase-config.example.js  # 設定テンプレート
│   ├── firebase-config.js          # 接続設定ファイル
│   └── firebase.js                 # Auth / Firestore / Emulator 接続クライアント
├── works/                          # 各メディアアート作品（1フォルダ = 1学習テーマ）
│   └── _template/                  # 新規作品制作の標準テンプレート
│       ├── start/                  # ハンズオン開始用（ローカル配列動作・TODO付き）
│       └── end/                    # 完成版（Firestore連携済み・本番ギャラリー展示対象）
├── firebase.json                   # Firebase Hosting / Emulator 設定
├── firestore.rules                 # 作品ごとの名前空間分離・認可を担うセキュリティルール
└── jsconfig.json                   # エディタ上の型チェック設定（JSDoc + checkJs）
```

---

## ローカルでの起動方法（YouTube視聴者・学習者向け）

ES Modules および Firebase Authentication を正しく動作させるため、HTMLファイルを直接ダブルクリック（`file://`）せず、必ずローカルHTTPサーバー経由で **`http://localhost:8000`** を開いてください。

> **重要:** `http://127.0.0.1:8000` ではなく、必ず **`http://localhost:8000`** でアクセスしてください（Firebaseコンソールの「構築 > Authentication > 設定 > 承認済みドメイン」には標準で `localhost` が登録されているため、追加設定なしで認証が動作します）。

### 1. ローカルサーバーを起動する

ターミナルでこのフォルダを開き、以下のコマンドを実行します（Mac / Linux / Python導入済みWindows）。

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開くと美術館ギャラリーが表示され、展示室上部のボタンで **`Start（ハンズオン用）`** と **`End（完成版）`** をワンクリックで切り替えながら学習できます。

---

## Firebase への接続方法（選べる2つのコース）

### コースA：自分の Firebase プロジェクトに接続する（クラウド実践）

1. [Firebase コンソール](https://console.firebase.google.com/) で新規プロジェクトを作成します。
2. 左上の歯車アイコンから **「プロジェクトの設定 > 全般 > マイアプリ」** を開き、ウェブアプリ（`</>`）を追加して表示される `firebaseConfig` の値をコピーします。
3. このリポジトリの `shared/firebase-config.js` を開き、`firebaseConfig` の各項目を貼り付けます（`useEmulator` は `false` のままにします）。
4. Firebaseコンソール左メニューの **「構築 > Authentication > ログイン方法」** を開き、作品で使用する認証プロバイダ（まずは **「匿名」**）を有効にします。
5. Firebaseコンソール左メニューの **「構築 > Firestore Database」** からデータベースを作成し、本リポジトリの `firestore.rules` を適用します。

### コースB：クラウド登録なしで手元のPCだけで動かす（Firebase Emulator）

Google Cloud のプロジェクト作成を行わずにローカル環境だけで試したい場合は、以下の手順でエミュレータを利用できます（Java 21以上と Node.js が必要です）。

1. `shared/firebase-config.js` の `useEmulator` を `true` に変更します（またはブラウザURL末尾に `?emulator=1` を付与します）。
2. 以下のコマンドでエミュレータを起動します。

```bash
npx -y firebase-tools@latest emulators:start
```

- ギャラリーURL: `http://localhost:5000`
- Emulator 管理画面（データのリアルタイム確認）: `http://localhost:4000`

---

## 新しい作品を追加する手順（制作者向けワークフロー）

作品を作る際は **「先に `end/`（完成版）を作り切ってから、学習箇所だけを剥がして `start/` を作る」** ことで、デザインや変数名のズレを防げます。

1. **雛形のコピー**: `works/_template` を複製し、`works/01-your-work-name` のようにリネームします。
2. **完成版（`end/`）の実装**: `works/01-your-work-name/end/` 内の `types.js`・`repository.js`・`sketch.js` を実装します。
3. **開始版（`start/`）の切り出し**: 完成した `end/` のファイルを `start/` にコピーし、`start/repository.js` の Firebase 通信部分だけを学習用のローカル配列・TODOコメントに置き換えます。
4. **カタログとセキュリティルールの登録**:
   - `assets/js/catalog.js` の `ARTWORK_CATALOG` に作品メタデータを1件追加します（`isTemplate: false`）。
   - `firestore.rules` に `/works/01-your-work-name/...` 用の認可ルールを追加します。

---

## 本番環境（Firebase Hosting）へのデプロイ

`firebase.json` の `hosting.ignore` 設定により、デプロイ時は `works/_template/**` や各作品の `start/` フォルダが自動的に除外され、**美術館ギャラリーと完成作品（`end/`）のみ**が公開されます。

```bash
npx -y firebase-tools@latest deploy --only firestore:rules,hosting
```

