/**
 * システム学習分野カテゴリーマスター定義。
 */

/**
 * @typedef {"crud" | "realtime" | "auth" | "architecture"} SystemCategoryId
 */

/**
 * 検索フィルタおよびカード属性バッジに用いるシステム分野定義
 *
 * @type {Readonly<Record<SystemCategoryId, { readonly label: string; readonly shortCode: string }>>}
 */
export const SYSTEM_CATEGORIES = {
  crud: { label: "CRUD・データ永続化", shortCode: "CRUD" },
  realtime: { label: "リアルタイム同期", shortCode: "SYNC" },
  auth: { label: "認証・認可ルール", shortCode: "AUTH" },
  architecture: { label: "設計・アーキテクチャ", shortCode: "ARCH" },
};

