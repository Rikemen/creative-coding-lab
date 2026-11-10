# 10分インクリメンタル実装計画書：`01-starry-sky-crud`

ご自身の手でコードを書きながら、**1ステップ（5〜10分以内）ごとにブラウザで動く変化を確認できる**ように分解した全13ステップの実装ガイドです。

> [!IMPORTANT]
> **進め方のコツ（`end` → `start` 逆算フロー）**
> まずは **`works/01-starry-sky-crud/end/` 側だけ**を触って作品を完成させ（Task 1〜11）、最後に `start/` を切り出します（Task 12）。ローカルサーバー（`python3 -m http.server 8000`）を起動した状態で進めてください。

---

## Phase 1: 器の準備とカード図鑑への登録（計 13分）

### - [x] Task 1: テンプレートから作品フォルダを複製する（目安: 5分）
- **対象パス**: `works/01-starry-sky-crud/`
- **やること**:
  - [`works/_template`](../../_template) フォルダごとコピーし、`works/01-starry-sky-crud` を作成する。
  - `end/index.html` と `start/index.html` の `<title>` を `星空の創造と編集 (End)` / `(Start)` に書き換える。
- **動作確認（完了条件）**:
  - `http://localhost:8000/works/01-starry-sky-crud/end/index.html` を直接開き、エラーなくテンプレートのキャンバスが表示されること。

### - [x] Task 2: ギャラリー図鑑に `001 / LAB` カードを登録する（目安: 8分）
- **対象ファイル**: `assets/js/artworks/01-starry-sky-crud.js`, [`assets/js/catalog.js`](../../../assets/js/catalog.js)
- **やること**:
  - `assets/js/artworks/01-starry-sky-crud.js` にカード定義（`cardNumber: "001 / LAB"`, `characterId: "newt"` 等）を作成し、`catalog.js` の `ARTWORK_CATALOG` 配列に追加する。
- **動作確認（完了条件）**:
  - `http://localhost:8000` にニュートの新しい作品カードが表示され、クリックで [`detail.html`](../../../detail.html)（作品概要）→「作品を見る」で [`exhibition.html`](../../../exhibition.html) まで遷移できること。

---

## Phase 2: データ型と p5.js 星空アートの構築（計 38分）

### - [x] Task 3: p5型補完の追加と `Star` データ型の定義（目安: 6分）
- **対象ファイル**: [`shared/vendor-types.d.ts`](../../../shared/vendor-types.d.ts), `works/01-starry-sky-crud/end/types.js`
- **やること**:
  - `vendor-types.d.ts` の `P5Instance` に長押し判定・描画で使う `readonly mouseIsPressed: boolean;`, `readonly TWO_PI: number;`, `readonly HALF_PI: number;`, `mouseReleased?: (event?: MouseEvent | TouchEvent) => void | boolean;`, `millis(): number;`, `arc(x: number, y: number, w: number, h: number, start: number, stop: number): void;` を追記する。
  - `end/types.js` に `Star`（`id`, `normalizedX`, `normalizedY`, `colorIndex`, `magnitude`）、`StarDraft`、`StarPatch`、`SystemConnectionStatus` の JSDoc `@typedef` を定義する。
- **動作確認（完了条件）**:
  - VS Code 上で `end/types.js` に型エラー（赤波線）が1つも出ないこと。

### - [x] Task 4: ローカル配列で動く CRUD 4関数のモックを作る（目安: 8分）
- **対象ファイル**: `works/01-starry-sky-crud/end/repository.js`
- **やること**:
  - Firebase 通信を書く前に、まずはメモリ配列 `fallbackStars`（初期シード星3〜4個）を読み書きする以下の5関数を export する（この後の Task 12 で `start/repository.js` の元にもなります）。
    - `initializeSession()` / `fetchStars()` / `createStar(draft)` / `updateStar(starId, patch)` / `deleteStar(starId)`
- **動作確認（完了条件）**:
  - `node --check works/01-starry-sky-crud/end/repository.js` がエラーなく通ること。

### - [ ] Task 5: 星空と4色パレット・十字フレアの描画を作る（目安: 9分）
- **対象ファイル**: `works/01-starry-sky-crud/end/sketch.js`
- **やること**:
  - `bootstrapSystem()` で `await initializeSession()` と `stars = await fetchStars()` を呼び出すように変更する。
  - 4種類の色温度パレット配列（HSB値：青白・琥珀・桜・氷青）を用意する。
  - `p.draw` で深い夜空の背景を描き、`p.blendMode(p.ADD)` で各 `Star` の光輪・星核・`magnitude`（`1〜3`）に応じた長さの十字光線（縦横の細い `line`）と瞬き（`p.sin`）を描画する（サイズは `Math.min(p.width, p.height)` 基準でスケーリング）。
- **動作確認（完了条件）**:
  - ブラウザをリロードすると、シードデータの星々が異なる色と大きさの十字フレアを放ちながら瞬いて見えること（スマホ幅へのリサイズ追従も確認）。

### - [ ] Task 6: タップで「星の創造（Create）」と「進化（Update）」を動かす（目安: 8分）
- **対象ファイル**: `works/01-starry-sky-crud/end/sketch.js`
- **やること**:
  - ポインタ押下時（`p.mousePressed`）に対象の星（ヒット半径 `Math.max(28, shortSide * 0.045)` 以内）を探し、押下開始時刻（`p.millis()`）と対象の星IDを記録する。
  - ポインタを離した時（`p.mouseReleased`）に：
    - 何もない場所だった場合：`createStar` を呼んで返ってきた新しい `Star` を `stars` 配列に追加する。
    - 既存の星の上で `500ms` 未満の短タップだった場合：`colorIndex` を `(colorIndex + 1) % 4`、`magnitude` を `(magnitude % 3) + 1` に進めてローカル配列と `updateStar(id, patch)` を呼ぶ。
- **動作確認（完了条件）**:
  - 夜空タップで新しい星が生まれ、生まれた星をタップするたびに色と輝き（十字フレアの大きさ）が4色×3段階で気持ちよく変化すること。

### - [ ] Task 7: 長押しチャージと「流れ星削除（Delete）」演出を作る（目安: 7分）
- **対象ファイル**: `works/01-starry-sky-crud/end/sketch.js`
- **やること**:
  - 星を押下中（`p.mouseIsPressed`）の経過時間を `p.draw` 内で監視し、星の周りに `p.arc` で円形チャージゲージを描画する。
  - 押下から `500ms` に達した瞬間に、その星を `stars` から取り除いて `shootingStars`（斜め下へ尾を引いてフェードアウトする一時演出配列）へ移し、`deleteStar(id)` を呼び出す。
- **動作確認（完了条件）**:
  - 星を0.5秒長押しするとリングが満ち、シューッと流れ星になって夜空から消えること（Chrome DevTools のスマホタッチ検証でも指長押しで消えること）。

---

## Phase 3: Cloud Firestore との接続と認可ルール（計 31分）

### - [ ] Task 8: `initializeSession` に匿名認証を接続する（目安: 7分）
- **対象ファイル**: `works/01-starry-sky-crud/end/repository.js`
- **やること**:
  - `isFirebaseConfigured()` が `false` のときはこれまでの `fallbackStars` を使うプレビューモードを維持する。
  - `true` のときは `getFirebaseClients()` から `auth` を取得し、`signInAnonymously(auth)` で認証して `#system-hud` 用のラベルを返す。
- **動作確認（完了条件）**:
  - Firebase（または `?emulator=1`）接続時に、左下の HUD が `CONNECTED (UID: ...)` に切り替わること。

### - [ ] Task 9: Firestore の `addDoc`（Create）と `getDocs`（Read）を繋ぐ（目安: 8分）
- **対象ファイル**: `works/01-starry-sky-crud/end/repository.js`
- **やること**:
  - `buildWorkCollectionPath("01-starry-sky-crud", "stars")` でコレクション参照を作る。
  - `createStar`: `addDoc` で6フィールド（`normalizedX`, `normalizedY`, `colorIndex`, `magnitude`, `createdAt: serverTimestamp()`, `updatedAt: serverTimestamp()`）を書き込み、`docRef.id` 付きの `Star` を返す。
  - `fetchStars`: `getDocs(query(collectionRef, orderBy("createdAt", "asc"), limit(120)))` で取得し、型検証関数 `parseStarDocument` を通して配列を返す。
- **動作確認（完了条件）**:
  - 夜空に星をいくつか作ってから **ブラウザをリロード（F5）しても、作った星がそのままの位置・色で再現される** こと！

### - [ ] Task 10: Firestore の `updateDoc`（Update）と `deleteDoc`（Delete）を繋ぐ（目安: 8分）
- **対象ファイル**: `works/01-starry-sky-crud/end/repository.js`
- **やること**:
  - `doc(db, ...buildWorkCollectionPath(...), starId)` でドキュメント参照を作る。
  - `updateStar`: `updateDoc` で `{ colorIndex, magnitude, updatedAt: serverTimestamp() }` を更新する。
  - `deleteStar`: `deleteDoc` で対象ドキュメントを削除する。
- **動作確認（完了条件）**:
  - 星をタップして色を変え、別の星を長押しで流れ星にして消したあと、**リロードしても変更後の色と削除結果が維持されている** こと（Firestore 管理画面でもドキュメントの増減・値変化を確認）。

### - [ ] Task 11: `firestore.rules` に第1作のスキーマ認可ルールを追加する（目安: 8分）
- **対象ファイル**: [`firestore.rules`](../../../firestore.rules)
- **やること**:
  - `/works/01-starry-sky-crud/stars/{starId}` の `match` ブロックとバリデータ関数 `isValidStarCreate` / `isValidStarUpdate` を追加する（`colorIndex` が整数 `0..3`、`magnitude` が整数 `1..3`、更新時の座標・`createdAt` 不変保証など）。
  - ※ご自身で記述後のセキュリティ監査や、`firestore-rules-author` サブエージェントへの作成依頼もいつでも可能です。
- **動作確認（完了条件）**:
  - ルール適用後も通常の Create / Read / Update / Delete が権限エラーなく動作すること。

---

## Phase 4: ハンズオン用 `start/` の切り出しと整合性検証（計 11分）

### - [ ] Task 12: 完成した `end/` から視聴者用の `start/` を切り出す（目安: 8分）
- **対象ディレクトリ**: `works/01-starry-sky-crud/start/`
- **やること**:
  - 完成した `end/types.js` と `end/sketch.js` をそのまま `start/` に上書きコピーする（1バイトの差分も作らない）。
  - `end/index.html` を `start/index.html` にコピーし、`<title>` 内の `(End)` のみ `(Start)` に変える。
  - `start/repository.js` を開き、Task 4 で作ったインメモリ配列動作＋各関数に `TODO(Step 1〜4): getDocs / addDoc / updateDoc / deleteDoc に置き換えよう` のガイドコメントを整える。
- **動作確認（完了条件）**:
  - `exhibition.html?work=01-starry-sky-crud` 上部のボタンで `Start` と `End` を切り替え、`Start` はリロードで初期状態に戻り、`End` はリロードしてもクラウドの星空が残る対比を確認できること。

### - [ ] Task 13: 自動検証スクリプトで全チェックを通す（目安: 3分）
- **実行コマンド**:
  ```bash
  python3 .agents/skills/create-artwork/scripts/verify-project.py
  ```
- **動作確認（完了条件）**:
  - 構文・リンクパス・スマホ必須設定（`100dvh` / `touch-action: none` / `windowResized`）・`start` と `end` の `sketch.js` / `types.js` 完全一致チェックがすべて `✅ 検証完了` となること。

