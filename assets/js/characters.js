/**
 * Rikemen キャラクターマスター定義。
 *
 * 全10キャラクターの英語名・日本語名・透過イラスト画像の正確な相対パスを管理する。
 */

/**
 * @typedef {"feru" | "aru" | "freed" | "lily" | "bell" | "fara" | "jean" | "win" | "richard" | "newt"} CharacterId
 */

/**
 * @typedef {Object} RikemenCharacter
 * @property {CharacterId} id キャラクター識別子
 * @property {string} name 英語表記名
 * @property {string} japaneseName 日本語表記名
 * @property {string} imagePath 透過PNGファイルの正確な相対パス（拡張子の大文字・小文字を厳密に保持）
 */

/**
 * Linux / Firebase Hosting 環境での大文字・小文字不一致による404エラーを防ぐため、
 * 全キャラクター画像の正確なファイルパスを単一ソースとして管理する。
 *
 * @type {Readonly<Record<CharacterId, RikemenCharacter>>}
 */
export const RIKEMEN_CHARACTERS = {
  feru: {
    id: "feru",
    name: "Feru",
    japaneseName: "フェル",
    imagePath: "./assets/images/rikemen-rikejo/01_Feru.png",
  },
  aru: {
    id: "aru",
    name: "Aru",
    japaneseName: "アル",
    imagePath: "./assets/images/rikemen-rikejo/02_Aru.png",
  },
  freed: {
    id: "freed",
    name: "Freed",
    japaneseName: "フリード",
    imagePath: "./assets/images/rikemen-rikejo/03_Freed.png",
  },
  lily: {
    id: "lily",
    name: "Lily",
    japaneseName: "リリィ",
    imagePath: "./assets/images/rikemen-rikejo/04_Lily.PNG",
  },
  bell: {
    id: "bell",
    name: "Bell",
    japaneseName: "ベル",
    imagePath: "./assets/images/rikemen-rikejo/05_Bell.PNG",
  },
  fara: {
    id: "fara",
    name: "Fara",
    japaneseName: "ファラ",
    imagePath: "./assets/images/rikemen-rikejo/06_Fara.PNG",
  },
  jean: {
    id: "jean",
    name: "Jean",
    japaneseName: "ジャン",
    imagePath: "./assets/images/rikemen-rikejo/07_Jean.PNG",
  },
  win: {
    id: "win",
    name: "Win",
    japaneseName: "ウィン",
    imagePath: "./assets/images/rikemen-rikejo/08_Win.png",
  },
  richard: {
    id: "richard",
    name: "Richard",
    japaneseName: "リチャード",
    imagePath: "./assets/images/rikemen-rikejo/09_Richard.png",
  },
  newt: {
    id: "newt",
    name: "Newt",
    japaneseName: "ニュート",
    imagePath: "./assets/images/rikemen-rikejo/10_Newt.png",
  },
};

