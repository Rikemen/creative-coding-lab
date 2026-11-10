/**
 * 作品概要ページ（`detail.html`）の描画スクリプト。
 *
 * カード一覧（`index.html`）と実際の作品キャンバス（`exhibition.html`）の間に概要ページを挟むことで、
 * 鑑賞・実装に入る前に「どんなアート体験で、裏側で何のシステム概念が動いているか」を直感的に把握できるようにする。
 */

import { createTradingCardElement } from "./card-renderer.js";
import {
  findArtworkById,
  isLocalEnvironment,
  RIKEMEN_CHARACTERS,
  SYSTEM_CATEGORIES,
} from "./catalog.js";

function initializeArtworkDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const workId = params.get("work") ?? "";
  const artwork = findArtworkById(workId);

  // 未登録IDや本番環境でのテンプレート直接アクセス時は一覧へ安全にリダイレクトする（早期リターン）
  if (artwork === undefined || (artwork.isTemplate && !isLocalEnvironment())) {
    window.location.replace("./index.html");
    return;
  }

  const emulatorQuerySuffix = params.get("emulator") === "1" ? "&emulator=1" : "";
  const homeUrl =
    params.get("emulator") === "1" ? "./index.html?emulator=1" : "./index.html";

  const cardSlotEl = document.getElementById("detail-card-slot");
  const breadcrumbHomeLink = document.getElementById("breadcrumb-home-link");
  const navCardListLink = document.getElementById("nav-card-list-link");
  const breadcrumbCurrentEl = document.getElementById("breadcrumb-current-title");
  const cardNoEl = document.getElementById("detail-card-no");
  const categoryLabelEl = document.getElementById("detail-category-label");
  const titleEl = document.getElementById("detail-title");
  const subtitleEl = document.getElementById("detail-subtitle");
  const launchArtworkBtn = document.getElementById("btn-launch-artwork");
  const launchStartBtn = document.getElementById("btn-launch-start");
  const youtubeLinkBtn = document.getElementById("btn-youtube-link");
  const navAvatarEl = document.getElementById("navigator-avatar");
  const navNameEl = document.getElementById("navigator-name");
  const navCommentEl = document.getElementById("navigator-comment");
  const artConceptEl = document.getElementById("detail-art-concept");
  const systemArchEl = document.getElementById("detail-system-arch");
  const keywordsListEl = document.getElementById("detail-keywords");
  const localGuideEl = document.getElementById("detail-local-guide");
  const codePathEl = document.getElementById("detail-code-path");

  if (
    !(cardSlotEl instanceof HTMLElement) ||
    !(cardNoEl instanceof HTMLElement) ||
    !(categoryLabelEl instanceof HTMLElement) ||
    !(titleEl instanceof HTMLElement) ||
    !(subtitleEl instanceof HTMLElement) ||
    !(launchArtworkBtn instanceof HTMLAnchorElement)
  ) {
    throw new Error("作品概要ページの必須DOM要素が見つかりません。");
  }

  document.title = `${artwork.title} | 作品概要 | Rikemen Creative Coding Lab`;

  if (breadcrumbHomeLink instanceof HTMLAnchorElement) {
    breadcrumbHomeLink.href = homeUrl;
  }
  if (navCardListLink instanceof HTMLAnchorElement) {
    navCardListLink.href = homeUrl;
  }
  if (breadcrumbCurrentEl instanceof HTMLElement) {
    breadcrumbCurrentEl.textContent = artwork.title;
  }

  // 左カラムに拡大版トレーディングカードを描画
  cardSlotEl.appendChild(
    createTradingCardElement(artwork, {
      variant: "showcase",
    })
  );

  const categoryInfo = SYSTEM_CATEGORIES[artwork.category];
  const character = RIKEMEN_CHARACTERS[artwork.characterId];

  cardNoEl.textContent = artwork.cardNumber;
  categoryLabelEl.textContent = categoryInfo.label;
  titleEl.textContent = artwork.title;
  subtitleEl.textContent = artwork.subtitle;

  // メイン導線：「作品を見る」→ exhibition.html（完成版ステージ）へ遷移
  const encodedId = encodeURIComponent(artwork.id);
  launchArtworkBtn.href = `./exhibition.html?work=${encodedId}${emulatorQuerySuffix}`;

  if (launchStartBtn instanceof HTMLAnchorElement && isLocalEnvironment()) {
    launchStartBtn.hidden = false;
    launchStartBtn.href = `./exhibition.html?work=${encodedId}&mode=start${emulatorQuerySuffix}`;
  }

  if (youtubeLinkBtn instanceof HTMLAnchorElement && artwork.youtubeUrl !== null) {
    youtubeLinkBtn.hidden = false;
    youtubeLinkBtn.href = artwork.youtubeUrl;
  }

  if (navAvatarEl instanceof HTMLImageElement) {
    navAvatarEl.src = character.imagePath;
    navAvatarEl.alt = character.japaneseName;
  }
  if (navNameEl instanceof HTMLElement) {
    navNameEl.textContent = `${character.japaneseName}（${character.name}）のナビゲート`;
  }
  if (navCommentEl instanceof HTMLElement) {
    navCommentEl.textContent = artwork.characterComment;
  }

  if (artConceptEl instanceof HTMLElement) {
    artConceptEl.textContent = artwork.artisticConcept;
  }
  if (systemArchEl instanceof HTMLElement) {
    systemArchEl.textContent = artwork.systemArchitecture;
  }
  if (keywordsListEl instanceof HTMLElement) {
    for (const kw of artwork.systemKeywords) {
      const li = document.createElement("li");
      li.className = "keyword-pill";
      li.textContent = kw;
      keywordsListEl.appendChild(li);
    }
  }

  if (localGuideEl instanceof HTMLElement && isLocalEnvironment()) {
    localGuideEl.hidden = false;
    if (codePathEl instanceof HTMLElement) {
      codePathEl.textContent = `works/${artwork.id}/start/repository.js`;
    }
  }
}

initializeArtworkDetailPage();

