/**
 * 作品カードカタログ登録簿（エントリーポイント）。
 *
 * 各作品のカード定義は `assets/js/artworks/<work-id>.js` に独立して記述し、
 * 本ファイルで `ARTWORK_CATALOG` 配列へ集約する。
 */

import { starrySkyCard } from "./artworks/01-starry-sky-crud.js";

// 他モジュールへの後方互換 re-export
export { RIKEMEN_CHARACTERS } from "./characters.js";
export { SYSTEM_CATEGORIES } from "./categories.js";

/** @typedef {import("./characters.js").CharacterId} CharacterId */
/** @typedef {import("./characters.js").RikemenCharacter} RikemenCharacter */
/** @typedef {import("./categories.js").SystemCategoryId} SystemCategoryId */

/**
 * トレーディングカード下部の「ワザ欄」に表示するシステム学習スキル
 *
 * @typedef {Object} CardSkill
 * @property {string} badge 属性タグ（例: "AUTH", "SYNC", "CREATE"）
 * @property {string} name スキル名（例: "星の創造と進化"）
 * @property {string} apiHint 右端に表示する主要API名や概念記号（例: "addDoc / updateDoc"）
 * @property {string} description 1〜2行の簡潔な仕組み説明
 */

/**
 * @typedef {Object} ArtworkMetadata
 * @property {string} id `works/` 配下のディレクトリ名と一致する作品識別子
 * @property {string} cardNumber カード通し番号（例: "001 / LAB"）
 * @property {string} stageLabel カード左上の進化・難易度ステージ表記（例: "BASIC", "STAGE 1"）
 * @property {number} syncPoint カード右上のHP風スコア表記（学習ボリューム・同期度目安）
 * @property {SystemCategoryId} category システム学習分野カテゴリ
 * @property {string} title 作品タイトル
 * @property {string} subtitle サブタイトル（体験の概要）
 * @property {CharacterId} characterId 案内役となる Rikemen キャラクターID
 * @property {string} characterComment 作品概要ページでキャラクターが語るナビゲートコメント
 * @property {ReadonlyArray<CardSkill>} cardSkills カード面に記載する代表システムスキル（1〜2件）
 * @property {string} artisticConcept アートとしての鑑賞コンセプト解説
 * @property {string} systemArchitecture 裏側で動いているWebシステム・DB・認可の仕組み解説
 * @property {ReadonlyArray<string>} systemKeywords 学べる技術・概念タグ
 * @property {string} accentColor カードイラスト窓の背景テーマカラー（CSSカラー値）
 * @property {string | null} thumbnailUrl 作品サムネイル画像パス（未指定時はキャラクター中心のビジュアルを自動描画）
 * @property {string | null} youtubeUrl 解説動画URL（公開前は null）
 * @property {boolean} isTemplate 制作・学習用の雛形かどうか（true の場合は本番公開ギャラリー一覧から除外）
 */

/**
 * 登録されている作品カード一覧。
 * 新しい作品を追加する際は `artworks/` 配下にカードファイルを作成し、ここへ並べる。
 *
 * @type {ReadonlyArray<ArtworkMetadata>}
 */
export const ARTWORK_CATALOG = [
  starrySkyCard,
];

/**
 * 現在の実行環境がローカル学習・開発環境かどうかを判定する。
 *
 * @returns {boolean}
 */
export function isLocalEnvironment() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/**
 * 現在の環境で表示対象となる作品一覧を返す。
 *
 * @returns {ReadonlyArray<ArtworkMetadata>}
 */
export function getVisibleArtworks() {
  if (isLocalEnvironment()) {
    return ARTWORK_CATALOG;
  }
  return ARTWORK_CATALOG.filter((work) => !work.isTemplate);
}

/**
 * 指定IDの作品メタデータを取得する。
 *
 * @param {string} workId
 * @returns {ArtworkMetadata | undefined}
 */
export function findArtworkById(workId) {
  return ARTWORK_CATALOG.find((work) => work.id === workId);
}
