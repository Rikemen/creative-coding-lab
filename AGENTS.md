# Rikemen Creative Coding Lab — プロジェクト固有ルール

p5.js × Firebase で「Webシステムの仕組み」をメディアアート制作を通じて学ぶ、美術館風ギャラリー兼YouTubeハンズオン教材リポジトリ。

## 0. 開発運用と計画策定の絶対原則（最優先）

- **原則は人間がコードを書く（Human-First Coding）**:
  - 本リポジトリでの開発は、原則としてユーザー（人間）自身が手でコードを書いて進める。
  - ユーザーから「コードを書いて」「ファイルを作成・修正して」と**明示的に実装代行を指示された場合を除き、AIが勝手にプロダクションコードを生成・編集してはならない**（設計相談・計画策定・レビュー・デバッグ支援・質問回答に徹すること。なお `firestore.rules` の作成を明示的に依頼された際のみ `firestore-rules-author` サブエージェントへ委譲する）。
- **開発計画は必ず「2種類の計画書」をセットで作成する**:
  - 開発計画を求められた際は、`incremental-planning` スキル（`.agents/skills/incremental-planning/SKILL.md`）に従い、必ず以下の**2つの計画書**を作成すること（作品別の計画書は `works/<work-id>/plans/` 配下に配置する）。
    1. **通常の開発計画書（`implementation_plan.md`）**: 全体アーキテクチャ・完成イメージ・データモデル（Firestoreスキーマ / JSDoc型）・責務分担を俯瞰する設計書。
    2. **10分インクリメンタル実装計画書（`incremental_tasks.md`）**: 人間が自分の手でコードを書き、毎回ブラウザで動作変化を確認しながら進められるよう、**1タスクあたり10分以内（目安5〜10分）で完結する粒度**まで細分化したステップバイステップ計画書。

## 1. 技術スタック・アーキテクチャ制約（厳守）

- **ビルドレス構成の維持**: Webpack / Vite 等のバンドラやビルド工程を導入してはならない。素の HTML5 + CSS3 + Modern JavaScript（ES Modules + `<script type="importmap">`）のみでブラウザ実行可能な状態を保つこと。
- **エディタ型安全の維持**: トランスパイルを行わない代わりに、`jsconfig.json`（`checkJs: true`, `strict: true`）と JSDoc 型注釈を用いる。CDNモジュールの型が不足する場合は `shared/vendor-types.d.ts` に厳密な型宣言を追加すること。
- **インポートバージョンの統一**: 各HTML内の Import Map で指定する Firebase SDK や p5.js のCDNバージョンは `works/_template/` と完全に揃えること（ブラウザ上のESモジュールシングルトン分裂を防ぐため）。
- **スマートフォン・レスポンシブ必須（常時適用）**: ギャラリー画面および全 p5.js 作品は、PCとスマートフォン（`375px` 幅・縦画面・タッチ操作）の双方で快適に閲覧・操作できるレスポンシブ実装を必須とする。
  - p5.js 作品は `p.createCanvas(p.windowWidth, p.windowHeight)` と `p.windowResized` でリサイズ追従させ、保存座標は `0.0〜1.0` の正規化値、描画距離やタップ判定半径は `Math.min(p.width, p.height)` 基準でスケーリングすること。
  - 作品HTMLには必ず `height: 100dvh`・`touch-action: none`・`env(safe-area-inset-*)` を適用し、モバイルブラウザのアドレスバーによる見切れやスワイプ時の意図しない画面スクロールを防ぐこと。

## 2. レイヤー境界と教材コードの純粋性

- **ギャラリーUIの混入禁止**: `works/<work-id>/` 配下のコードは視聴者が直接読む教材であるため、「ギャラリーへ戻るボタン」や装飾HTML/CSSを一切混ぜてはならない（カード検索 `index.html`・作品概要 `detail.html`・鑑賞額縁 `exhibition.html` の3画面側にすべて隔離する）。
- **描画層と通信層の分離**: 各作品は必ず以下の4ファイル構成とし、責務を混ぜないこと。
  - `index.html`: キャンバス器と最小限の接続状態HUD（`#system-hud`）のみ
  - `types.js`: ドメインモデル・DTOのJSDoc型定義
  - `repository.js`: Firebase Auth / Firestore 通信層（および未設定時のローカルフォールバック）
  - `sketch.js`: p5.js インスタンスモードによる描画・入力制御層
- **`end` → `start` 逆算と同一性維持**: 作品制作・修正時は必ず先に `end/` を完成させ、そこから `repository.js` のFirebase処理のみを剥がして `start/` を作ること。**`sketch.js` と `types.js` は `start/` と `end/` の間で1バイトの差分もなく完全一致させること。**

## 3. Firebase・認証・認可の鉄則

- **名前空間の分離**: Firestore のコレクションパスは必ず [`buildWorkCollectionPath`](shared/firebase.js) を通じて `/works/{workId}/{resourceName}` 配下に格納し、作品間のデータ混線を防ぐこと。
- **セキュリティルールの委譲**: `firestore.rules` をAI側で新規作成・変更する際は、メインエージェントで直接書き換えず、必ず `firestore-rules-author` サブエージェントへ委譲すること。またワイルドカード一括許可は行わず、作品ごとに独立した `match` ブロックとスキーマ検証関数を定義すること。
- **`localhost` アクセスの徹底**: OAuth認証の承認済みドメイン制約を避けるため、ローカル確認URLの案内や検証は `127.0.0.1` ではなく `http://localhost:8000`（または Emulator の `http://localhost:5000`）に統一すること。

## 4. デザイン・ワークフロー参照先

- **UI・ビジュアル演出**: ギャラリー画面の変更や新規 p5.js アート作品の視覚設計を行う際は、必ず [DESIGN.md](./DESIGN.md) を参照すること。
- **開発計画・タスク分解**: 機能開発や作品制作の計画を立てる際は、`incremental-planning` スキル（`.agents/skills/incremental-planning/SKILL.md`）を参照すること。
- **新規作品の設計・検証**: `works/` に作品を追加・改修する際は、`create-artwork` スキル（`.agents/skills/create-artwork/SKILL.md`）を参照し、作業完了時に以下の検証スクリプトで整合性を確認すること。

```bash
python3 .agents/skills/create-artwork/scripts/verify-project.py
```
