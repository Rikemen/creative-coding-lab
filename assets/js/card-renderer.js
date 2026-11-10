/**
 * ポケモンカード風の「作品トレーディングカード」DOM生成モジュール。
 *
 * ギャラリー検索一覧（`index.html`）と作品概要ページ（`detail.html`）の双方で
 * 同一のカード構造を描画するため、共通コンポーネントとして切り出している（DRY原則）。
 */

import { RIKEMEN_CHARACTERS, SYSTEM_CATEGORIES } from "./catalog.js";

/** @typedef {import("./catalog.js").ArtworkMetadata} ArtworkMetadata */

/**
 * @typedef {Object} TradingCardRenderOptions
 * @property {string | null} [href] 指定時はクリック可能な `<a>` 要素として生成し、未指定時は観賞用の `<article>` として生成する
 * @property {"grid" | "showcase"} [variant="grid"] 一覧グリッド用（ホバー拡大あり）か、詳細ページ展示用（大型サイズ）か
 */

/**
 * 作品メタデータからトレーディングカード要素を生成する。
 * XSS防止のため `innerHTML` を一切使わず DOM API で安全に組み立てる。
 *
 * @param {ArtworkMetadata} artwork
 * @param {TradingCardRenderOptions} [options]
 * @returns {HTMLElement}
 */
export function createTradingCardElement(artwork, options = {}) {
  const { href = null, variant = "grid" } = options;
  const character = RIKEMEN_CHARACTERS[artwork.characterId];
  const categoryInfo = SYSTEM_CATEGORIES[artwork.category];

  const root =
    href !== null ? document.createElement("a") : document.createElement("article");

  root.className = `tcg-card tcg-card--${variant}`;
  root.dataset.category = artwork.category;
  root.style.setProperty("--card-theme", artwork.accentColor);

  if (root instanceof HTMLAnchorElement && href !== null) {
    root.href = href;
    root.classList.add("tcg-card--interactive");
    root.setAttribute("aria-label", `${artwork.title} の作品概要ページを開く`);
  }

  const sheet = document.createElement("div");
  sheet.className = "tcg-card__sheet";

  // 1. カード上部ヘッダー（進化ステージ・作品名・スコア・属性バッジ）
  const header = document.createElement("header");
  header.className = "tcg-card__header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "tcg-card__title-group";

  const stagePill = document.createElement("span");
  stagePill.className = "tcg-card__stage";
  stagePill.textContent = artwork.stageLabel;

  const titleEl = document.createElement("h2");
  titleEl.className = "tcg-card__title";
  titleEl.textContent = artwork.title;

  titleGroup.append(stagePill, titleEl);

  const statGroup = document.createElement("div");
  statGroup.className = "tcg-card__stat";

  const spUnit = document.createElement("span");
  spUnit.className = "tcg-card__sp-unit";
  spUnit.textContent = "SP";

  const spValue = document.createElement("span");
  spValue.className = "tcg-card__sp-value";
  spValue.textContent = String(artwork.syncPoint);

  const typeOrb = document.createElement("span");
  typeOrb.className = "tcg-card__orb";
  typeOrb.textContent = categoryInfo.shortCode;
  typeOrb.title = categoryInfo.label;

  statGroup.append(spUnit, spValue, typeOrb);
  header.append(titleGroup, statGroup);

  // 2. イラストウィンドウ（サムネイルまたはRikemenキャラクター＋記念スタンプ風バッジ）
  const artFrame = document.createElement("div");
  artFrame.className = "tcg-card__art-frame";

  if (artwork.thumbnailUrl !== null) {
    const thumbImg = document.createElement("img");
    thumbImg.className = "tcg-card__thumbnail";
    thumbImg.src = artwork.thumbnailUrl;
    thumbImg.alt = `${artwork.title} のプレビュー`;
    thumbImg.loading = "lazy";
    artFrame.appendChild(thumbImg);

    const charStamp = document.createElement("div");
    charStamp.className = "tcg-card__char-stamp";
    const stampImg = document.createElement("img");
    stampImg.src = character.imagePath;
    stampImg.alt = character.japaneseName;
    stampImg.loading = "lazy";
    charStamp.appendChild(stampImg);
    artFrame.appendChild(charStamp);
  } else {
    const stageBackdrop = document.createElement("div");
    stageBackdrop.className = "tcg-card__char-stage";

    const charImg = document.createElement("img");
    charImg.className = "tcg-card__char-hero";
    charImg.src = character.imagePath;
    charImg.alt = `${character.japaneseName} (${character.name})`;
    charImg.loading = variant === "showcase" ? "eager" : "lazy";

    stageBackdrop.appendChild(charImg);
    artFrame.appendChild(stageBackdrop);
  }

  if (artwork.isTemplate) {
    const templateFlag = document.createElement("span");
    templateFlag.className = "tcg-card__template-chip";
    templateFlag.textContent = "TEMPLATE";
    artFrame.appendChild(templateFlag);
  }

  // 3. 図鑑スペックバー（コレクション名・担当ナビゲーター）
  const specBar = document.createElement("div");
  specBar.className = "tcg-card__spec-bar";
  specBar.textContent = `PATH: works/${artwork.id}  ｜  NAV: ${character.japaneseName}`;

  // 4. ワザ欄（この作品で身につくシステムスキル）
  const skillsBox = document.createElement("div");
  skillsBox.className = "tcg-card__skills";

  for (const skill of artwork.cardSkills) {
    const skillItem = document.createElement("div");
    skillItem.className = "tcg-skill";

    const skillHead = document.createElement("div");
    skillHead.className = "tcg-skill__head";

    const badge = document.createElement("span");
    badge.className = "tcg-skill__badge";
    badge.textContent = skill.badge;

    const name = document.createElement("span");
    name.className = "tcg-skill__name";
    name.textContent = skill.name;

    const apiHint = document.createElement("span");
    apiHint.className = "tcg-skill__api";
    apiHint.textContent = skill.apiHint;

    skillHead.append(badge, name, apiHint);

    const desc = document.createElement("p");
    desc.className = "tcg-skill__desc";
    desc.textContent = skill.description;

    skillItem.append(skillHead, desc);
    skillsBox.appendChild(skillItem);
  }

  // 5. カード下部フッター（分野・カード番号）
  const footer = document.createElement("footer");
  footer.className = "tcg-card__footer";

  const categoryTag = document.createElement("span");
  categoryTag.className = "tcg-card__category-text";
  categoryTag.textContent = `分野：${categoryInfo.label}`;

  const numberBox = document.createElement("span");
  numberBox.className = "tcg-card__number";
  numberBox.textContent = artwork.cardNumber;

  footer.append(categoryTag, numberBox);

  sheet.append(header, artFrame, specBar, skillsBox, footer);
  root.appendChild(sheet);

  return root;
}

