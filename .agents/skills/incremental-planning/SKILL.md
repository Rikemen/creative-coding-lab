---
name: incremental-planning
description: >-
  Creates a dual development plan for human-led coding: (1) a standard architectural implementation
  plan and (2) an incremental micro-task plan broken down into <=10-minute verifiable steps.
  Activate this skill whenever the user asks to plan, design, or break down tasks for a new artwork,
  feature, or refactoring in this repository.
---

# 人間主導コーディング向け 2段階開発計画スキル (`incremental-planning`)

このプロジェクトでは原則として**人間が自分の手でコードを書く**ため、開発計画を立てる際は勝手に実装コードを書き始めず、必ず以下の**2つの計画書ファイル**をセットで作成すること。

- **保存先ルール**:
  - 作品別の計画（例: `01-starry-sky-crud`）の場合: `works/<work-id>/plans/implementation_plan.md` と `works/<work-id>/plans/incremental_tasks.md` に保存する。
  - ギャラリー全体など特定作品に属さない計画の場合: `plans/` または会話アーティファクトに保存する。

---

## 作成すべき2つの計画書

### 1. 通常の開発計画書（`implementation_plan.md`）
全体像と設計判断を合意するためのドキュメント。以下の項目を簡潔にまとめる。
- **ゴールと体験概要**: アートとしての見た目・操作感と、それを通じて学ぶシステム概念（CRUD / Realtime / Auth / Rules 等）。
- **データモデル設計**: Firestore のコレクションパス（`/works/<work-id>/<resource>`）、フィールド型・制約、および `types.js` に定義する JSDoc 型構造。
- **ファイル別責務とインターフェース**: `repository.js` が公開する関数シグネチャ（引数・戻り値）と、`sketch.js` 側の状態・イベント設計（PC/スマホ両対応の座標・スケーリング方針含む）。
- **セキュリティルール方針**: `firestore.rules` で検証すべき認可条件・スキーマ制約。

### 2. 10分インクリメンタル実装計画書（`incremental_tasks.md`）
人間が迷わずリズムよく手を動かし、**1ステップごとにブラウザで動く手応えを得られる（インクリメンタル開発）**ための実行チェックリスト。

#### タスク分解の絶対ルール（厳守）
1. **1タスク＝10分以内（目安 5〜10分）**:
   - 1回のタスクで触るファイルは原則 **1〜2ファイル**、記述・変更量の目安は **10〜40行以内** に抑える。
   - 10分を超えそうな処理（例：「描画もクリック判定もアニメーションも全部書く」「CRUDの4操作を一度に書く」）は、必ず複数のタスクに分割する。
2. **水平分割ではなく「垂直・視覚インクリメント分割」にする**:
   - ❌ 悪い例（最後まで画面が動かない）: 「Task 1: `types.js` を全部書く → Task 2: `repository.js` を全部書く → Task 3: `sketch.js` を全部書く」
   - ⭕ 良い例（毎回ブラウザで変化が見える）:
     - Task 1 (`5分`): 雛形コピー＆カタログ仮登録 → ギャラリーから空キャンバスが開くことを確認
     - Task 2 (`7分`): 固定ダミーデータ1件で星を描画 → 画面とスマホ幅での見た目を確認
     - Task 3 (`8分`): タップ位置にローカル配列で星を追加 → インタラクションを確認
     - Task 4 (`8分`): `repository.js` に `addDoc`（Create）だけ繋ぐ → Firestore に1件保存されることを確認
     - Task 5 (`8分`): `onSnapshot`（Read/Sync）を繋ぐ → リロードしても星が残ることを確認
     - …のように、**すべてのタスク完了時点でエラーなく画面が動く状態**を保つこと。
3. **完成コードの丸写しを押し付けない**:
   - 人間が思考しながら書けるよう、各タスクには「実装する関数名・使うAPI・ロジックの要点・注意点」を簡潔に記す（長い完成コード全文は書かず、ユーザーがヒントや見本を求めた際に提示する）。
4. **各タスクの必須フォーマット**:

```markdown
### - [ ] Task N: <タスクの短いタイトル>（目安: X分）
- **対象ファイル**: `works/<id>/end/...`
- **やること**:
  - 実装する内容の要点（使う関数・計算式・境界条件など）
- **動作確認（完了条件）**:
  - `http://localhost:8000/...` で何をして、どうなればクリアか
```

5. **最終フェーズの定型タスクを忘れない**:
   - 作品制作の場合は、終盤に必ず以下のタスクを含めること：
     - 完成した `end/` から `start/` へファイルをコピーし、`start/repository.js` をインメモリ実装＋TODOコメントに切り出すタスク（5〜8分）
     - `firestore.rules` の実装・確認タスク
     - `python3 .agents/skills/create-artwork/scripts/verify-project.py` を実行して全チェックを通すタスク（3分）

