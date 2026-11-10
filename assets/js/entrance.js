/**
 * カード検索・一覧ギャラリー（`index.html`）の描画・フィルタリング制御スクリプト。
 *
 * ポケモンカード検索サイトのようにキーワードやシステム分野でカードをリアルタイムに絞り込み、
 * カードをクリックすると作品概要ページ（`detail.html`）へ遷移させる。
 */

import { createTradingCardElement } from "./card-renderer.js";
import {
  getVisibleArtworks,
  isLocalEnvironment,
  RIKEMEN_CHARACTERS,
  SYSTEM_CATEGORIES,
} from "./catalog.js";

/** @typedef {import("./catalog.js").ArtworkMetadata} ArtworkMetadata */

/**
 * 作品メタデータが検索キーワードおよびカテゴリ条件に一致するか判定する。
 *
 * @param {ArtworkMetadata} artwork
 * @param {string} normalizedKeyword 小文字化・前後空白除去済みの検索語
 * @param {string} selectedCategory カテゴリID（空文字の場合は全件一致）
 * @returns {boolean}
 */
function matchesFilter(artwork, normalizedKeyword, selectedCategory) {
  if (selectedCategory !== "" && artwork.category !== selectedCategory) {
    return false;
  }

  if (normalizedKeyword === "") {
    return true;
  }

  const character = RIKEMEN_CHARACTERS[artwork.characterId];
  const searchableFields = [
    artwork.title,
    artwork.subtitle,
    artwork.artisticConcept,
    artwork.systemArchitecture,
    character.name,
    character.japaneseName,
    ...artwork.systemKeywords,
    ...artwork.cardSkills.flatMap((skill) => [
      skill.name,
      skill.apiHint,
      skill.description,
    ]),
  ];

  return searchableFields.some((field) =>
    field.toLowerCase().includes(normalizedKeyword)
  );
}

function initializeCardSearchGallery() {
  const countNumEl = document.getElementById("hit-count-num");
  const keywordInput = document.getElementById("filter-keyword");
  const categorySelect = document.getElementById("filter-category");
  const clearBtn = document.getElementById("btn-clear-filter");
  const resultsContainer = document.getElementById("card-results-container");
  const envSlot = document.getElementById("env-notice-slot");

  if (
    !(countNumEl instanceof HTMLElement) ||
    !(keywordInput instanceof HTMLInputElement) ||
    !(categorySelect instanceof HTMLSelectElement) ||
    !(clearBtn instanceof HTMLButtonElement) ||
    !(resultsContainer instanceof HTMLElement)
  ) {
    throw new Error("カード検索ページの必須DOM要素が見つかりません。");
  }

  // カテゴリ選択肢をマスタ定義から動的に構築し二重管理を防ぐ
  for (const [categoryId, info] of Object.entries(SYSTEM_CATEGORIES)) {
    const option = document.createElement("option");
    option.value = categoryId;
    option.textContent = info.label;
    categorySelect.appendChild(option);
  }

  if (envSlot instanceof HTMLElement && isLocalEnvironment()) {
    const pill = document.createElement("div");
    pill.className = "env-notice-pill";
    const dot = document.createElement("span");
    dot.className = "env-notice-pill__dot";
    const text = document.createElement("span");
    text.textContent = "ローカル学習モード稼働中（テンプレートカード表示・Start/End切替有効）";
    pill.append(dot, text);
    envSlot.appendChild(pill);
  }

  const searchParams = new URLSearchParams(window.location.search);
  const emulatorSuffix = searchParams.get("emulator") === "1" ? "&emulator=1" : "";
  const allVisibleArtworks = getVisibleArtworks();

  const renderFilteredCards = () => {
    const keyword = keywordInput.value.trim().toLowerCase();
    const category = categorySelect.value;

    const filtered = allVisibleArtworks.filter((work) =>
      matchesFilter(work, keyword, category)
    );

    countNumEl.textContent = String(filtered.length);
    resultsContainer.replaceChildren();

    if (filtered.length === 0) {
      const emptyBox = document.createElement("section");
      emptyBox.className = "empty-state";

      const charImg = document.createElement("img");
      charImg.className = "empty-state__char";
      charImg.src = RIKEMEN_CHARACTERS.freed.imagePath;
      charImg.alt = RIKEMEN_CHARACTERS.freed.japaneseName;

      const title = document.createElement("h2");
      title.className = "empty-state__title";
      title.textContent =
        allVisibleArtworks.length === 0
          ? "展示カードを準備中です"
          : "条件に一致する作品カードが見つかりませんでした";

      const desc = document.createElement("p");
      desc.className = "empty-state__desc";
      desc.textContent =
        allVisibleArtworks.length === 0
          ? "最初のメディアアート作品が公開されるまで、もうしばらくお待ちください。"
          : "検索キーワードや分野の条件を変えてもう一度お試しください。";

      emptyBox.append(charImg, title, desc);
      resultsContainer.appendChild(emptyBox);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "card-grid";

    for (const artwork of filtered) {
      const detailHref = `./detail.html?work=${encodeURIComponent(artwork.id)}${emulatorSuffix}`;
      grid.appendChild(
        createTradingCardElement(artwork, {
          href: detailHref,
          variant: "grid",
        })
      );
    }

    resultsContainer.appendChild(grid);
  };

  keywordInput.addEventListener("input", renderFilteredCards);
  categorySelect.addEventListener("change", renderFilteredCards);
  clearBtn.addEventListener("click", () => {
    keywordInput.value = "";
    categorySelect.value = "";
    renderFilteredCards();
  });

  renderFilteredCards();
}

initializeCardSearchGallery();
