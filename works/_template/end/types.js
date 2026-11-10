/**
 * 作品内で扱うデータのスキーマ（設計図）定義。
 *
 * p5.js の描画ロジックと Firestore のセキュリティルール（`firestore.rules`）の間で
 * データ構造の認識ズレが起きないよう、型定義を単一ファイルに集約している。
 */

/**
 * キャンバス上に浮かぶ光の粒子（クライアント描画用のドメインモデル）
 *
 * @typedef {Object} LightParticle
 * @property {string} id ドキュメントの一意識別子
 * @property {number} normalizedX 画面幅に対する正規化X座標（0.0 〜 1.0）
 * @property {number} normalizedY 画面高さに対する正規化Y座標（0.0 〜 1.0）
 * @property {number} hue HSB色空間における色相（0 〜 360）
 * @property {string} ownerUid 粒子を生成したユーザーのUID（自分の粒子のみ削除可能にする認可判定用）
 */

/**
 * 新規作成時に描画層からリポジトリ層へ渡す入力データ
 *
 * @typedef {Object} LightParticleDraft
 * @property {number} normalizedX 画面幅に対する正規化X座標（0.0 〜 1.0）
 * @property {number} normalizedY 画面高さに対する正規化Y座標（0.0 〜 1.0）
 * @property {number} hue HSB色空間における色相（0 〜 360）
 */

/**
 * システム接続状態の通知ペイロード
 *
 * @typedef {Object} SystemConnectionStatus
 * @property {"cloud" | "emulator" | "local-fallback" | "error"} mode 現在のデータ保存先モード
 * @property {string | null} currentUid 認証済みユーザーのUID
 * @property {string} label 画面左下のHUDに表示する状態説明テキスト
 */

export {};

