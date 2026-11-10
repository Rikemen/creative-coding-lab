/**
 * 作品内で扱う星データのスキーマ（設計図）定義。
 *
 * p5.js の描画ロジックと Firestore のセキュリティルールの間で
 * データ構造の認識ズレが起きないよう、型定義を単一ファイルに集約している。
 */

/**
 * 夜空に輝く星（クライアント描画用のドメインモデル）
 *
 * @typedef {Object} Star
 * @property {string} id FirestoreのドキュメントID
 * @property {number} normalizedX 画面幅に対する正規化X座標（0.0 〜 1.0）
 * @property {number} normalizedY 画面高さに対する正規化Y座標（0.0 〜 1.0）
 * @property {number} colorIndex 色温度パレット番号（0: 青白, 1: 琥珀金, 2: 桜桃, 3: 氷青）
 * @property {number} magnitude 星の明るさ・等級（1 〜 3：十字フレアの長さ）
 */

/**
 * 新規作成（Create）時に入力する星のドラフトデータ
 *
 * @typedef {Object} StarDraft
 * @property {number} normalizedX 画面幅に対する正規化X座標（0.0 〜 1.0）
 * @property {number} normalizedY 画面高さに対する正規化Y座標（0.0 〜 1.0）
 * @property {number} colorIndex 色温度パレット番号（0 〜 3）
 * @property {number} magnitude 星の明るさ・等級（1 〜 3）
 */

/**
 * 更新（Update）時に渡す星の部分更新データ
 *
 * @typedef {Object} StarPatch
 * @property {number} colorIndex 変更後の色温度パレット番号（0 〜 3）
 * @property {number} magnitude 変更後の星の明るさ・等級（1 〜 3）
 */

/**
 * システム接続状態の通知ペイロード
 *
 * @typedef {Object} SystemConnectionStatus
 * @property {"cloud" | "emulator" | "local-fallback" | "error"} mode 現在のデータ保存先モード
 * @property {string | null} currentUid 認証済みユーザーのUID
 * @property {string} label 画面左下のHUDに表示する状態説明テキスト
 */

export { };