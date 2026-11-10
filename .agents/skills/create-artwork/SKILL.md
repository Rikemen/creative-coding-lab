---
name: create-artwork
description: >-
  Guides the planning, structure, and verification of a p5.js + Firebase media art lesson work under
  works/<work-id>/ (both start/ and end/ directories), catalog registration, and Firestore Security
  Rules. Activate this skill whenever the user asks to plan, design, add, or review an artwork or
  hands-on lesson in works/.
---

# 新規作品・ハンズオン教材 設計＆制作ガイド (`create-artwork`)

> **最重要前提（Human-First Coding）**
> 本リポジトリでは原則として**ユーザー（人間）自身が手でコードを書く**。
> ユーザーから「AI側でコードを作成して」と明示的に指示されない限り、勝手にファイルを生成せず、[incremental-planning](../incremental-planning/SKILL.md) スキルを併用して **① 通常の開発計画書** と **② 1タスク10分以内のインクリメンタル実装計画書** を提示し、人間の実装を伴走支援すること。

---

## 作品の構造基準（人間実装・AI実装 共通のゴール仕様）

1. [DESIGN.md](../../../DESIGN.md) と標準雛形である [works/_template](../../../works/_template) の4ファイル構成を基準とする。
2. 作品ID（ケバブケース、例: `01-starry-sky-crud`）と、Firestore 上のコレクション名（例: `works/01-starry-sky-crud/stars`）を決定する。

## 標準制作フロー（必ず `end` → `start` の順に進める）

### Phase 1: 雛形準備とカード図鑑への登録
1. `works/_template` をベースに `works/<work-id>/end/`（および `start/`）を用意する。
2. `assets/js/artworks/<work-id>.js` に作品カードメタデータを定義し、[assets/js/catalog.js](../../../assets/js/catalog.js) の `ARTWORK_CATALOG` 配列へ追加する（本番公開対象の作品は `isTemplate: false` とし、案内役の `characterId`・`characterComment`・`cardSkills` を設定する）。

### Phase 2: 完成版（`works/<work-id>/end/`）のインクリメンタル構築
先に `end/` を100%完成させることで、後からデザイン変更が生じた際の二重修正を防ぐ。

1. `types.js`: 保存・描画するデータ構造を JSDoc `@typedef` で厳密に定義する（`any` 禁止）。新しい Firebase SDK 関数や p5.js API を使う場合は [shared/vendor-types.d.ts](../../../shared/vendor-types.d.ts) に型宣言が揃っているか確認する。
2. `sketch.js` ＆ `index.html`（スマートフォン・レスポンシブ必須）:
   - [DESIGN.md](../../../DESIGN.md) に従い、p5.js インスタンスモード・`p.createCanvas(p.windowWidth, p.windowHeight)`・`p.windowResized` を必ず実装する。
   - 保存座標は正規化値（`0.0`〜`1.0`）とし、結線距離やサイズ・タップ判定半径（最低 `26px` 以上）は `Math.min(p.width, p.height)` 基準でレスポンシブに算出する。
   - `index.html` には `100dvh`・`touch-action: none`・`env(safe-area-inset-*)` を維持する。
   - `sketch.js` からは Firebase SDK を直接 import せず、必ず `./repository.js` の関数越しにデータ操作を行う。
3. `repository.js`:
   - `shared/firebase.js` の `isFirebaseConfigured()`, `getFirebaseClients()`, `buildWorkCollectionPath(WORK_ID, RESOURCE_NAME)` を使用する。
   - `isFirebaseConfigured() === false` の場合でもギャラリー展示プレビューが破綻しないよう、初期シードデータを用いたローカルフォールバック動作と `console.warn` 通知を実装する。

### Phase 3: ハンズオン開始版（`works/<work-id>/start/`）の切り出し
1. 完成した `end/` の `index.html`, `types.js`, `sketch.js` をそのまま `start/` へコピーする（`index.html` の `<title>` 内の `(End)` 表記のみ `(Start)` に変更してよい）。
2. **`start/sketch.js` と `start/types.js` は `end/` と完全一致させたまま一切編集しない。**
3. `start/repository.js` を作成し、`end/repository.js` と同じ関数シグネチャを維持したまま、中身を「ブラウザ内配列（インメモリ）動作 ＋ 学習者向けの `TODO(Step N)` 日本語コメント」に置き換える。

### Phase 4: Firestore セキュリティルールの追加
[firestore.rules](../../../firestore.rules) に `/works/<work-id>/<resourceName>/{docId}` 専用の `match` ブロックとスキーマ検証関数を追加する（※AI側で `firestore.rules` を編集する場合は、メインエージェントで直接編集せず必ず `firestore-rules-author` サブエージェントへ委譲すること）。

### Phase 5: 自動検証（必須）
すべての作業が完了したら、同梱の検証スクリプトを実行して構文・大小文字を含むパス整合性・レスポンシブ必須設定・`start/end` 完全一致を確認する。

```bash
python3 .agents/skills/create-artwork/scripts/verify-project.py
```
