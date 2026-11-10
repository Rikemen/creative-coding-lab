/**
 * 作品鑑賞・体験ステージ（`exhibition.html`）の制御スクリプト。
 *
 * 作品概要ページ（`detail.html`）で「作品を見る」を押した先のステージであり、
 * 作品本体のHTML（`works/<id>/start|end/index.html`）を `iframe` 内に隔離表示することで、
 * 教材コードの中にギャラリー用のUIノイズが混入するのを防いでいる。
 */

import { findArtworkById, isLocalEnvironment } from "./catalog.js";

/** @typedef {"start" | "end"} WorkStageMode */

/**
 * URLクエリから表示モードを決定する。
 * 本番環境では `start/` フォルダをホスティング対象外としているため、常に `"end"` に固定する。
 *
 * @param {URLSearchParams} params
 * @returns {WorkStageMode}
 */
function resolveStageMode(params) {
  if (!isLocalEnvironment()) {
    return "end";
  }
  return params.get("mode") === "start" ? "start" : "end";
}

function initializeExhibitionStage() {
  const params = new URLSearchParams(window.location.search);
  const workId = params.get("work") ?? "";
  const artwork = findArtworkById(workId);

  // 未登録IDや本番環境でのテンプレート直接指定時はカード一覧へ戻す（早期リターン）
  if (artwork === undefined || (artwork.isTemplate && !isLocalEnvironment())) {
    window.location.replace("./index.html");
    return;
  }

  const backDetailLink = document.getElementById("back-to-detail-link");
  const backIndexLink = document.getElementById("back-to-index-link");
  const numberEl = document.getElementById("exhibition-number");
  const titleEl = document.getElementById("exhibition-title");
  const iframeEl = document.getElementById("artwork-iframe");
  const modeSwitchEl = document.getElementById("mode-switch");
  const btnStart = document.getElementById("btn-mode-start");
  const btnEnd = document.getElementById("btn-mode-end");

  if (
    !(backDetailLink instanceof HTMLAnchorElement) ||
    !(backIndexLink instanceof HTMLAnchorElement) ||
    !(numberEl instanceof HTMLElement) ||
    !(titleEl instanceof HTMLElement) ||
    !(iframeEl instanceof HTMLIFrameElement) ||
    !(modeSwitchEl instanceof HTMLElement) ||
    !(btnStart instanceof HTMLButtonElement) ||
    !(btnEnd instanceof HTMLButtonElement)
  ) {
    throw new Error("作品ステージページの必須DOM要素が不足しています。");
  }

  const isEmulatorParam = params.get("emulator") === "1";
  const emulatorAppend = isEmulatorParam ? "&emulator=1" : "";
  const iframeEmulatorQuery = isEmulatorParam ? "?emulator=1" : "";

  document.title = `${artwork.title} | 作品ステージ | Rikemen Creative Coding Lab`;
  backDetailLink.href = `./detail.html?work=${encodeURIComponent(artwork.id)}${emulatorAppend}`;
  backIndexLink.href = isEmulatorParam ? "./index.html?emulator=1" : "./index.html";
  numberEl.textContent = artwork.cardNumber;
  titleEl.textContent = artwork.title;

  /**
   * 選択されたモード（`start` または `end`）に応じて iframe の読み込み先とURL履歴を更新する
   * @param {WorkStageMode} nextMode
   */
  const applyStageMode = (nextMode) => {
    iframeEl.src = `./works/${encodeURIComponent(artwork.id)}/${nextMode}/index.html${iframeEmulatorQuery}`;
    btnStart.setAttribute("aria-pressed", String(nextMode === "start"));
    btnEnd.setAttribute("aria-pressed", String(nextMode === "end"));

    if (isLocalEnvironment()) {
      const updatedUrl = new URL(window.location.href);
      updatedUrl.searchParams.set("mode", nextMode);
      window.history.replaceState(null, "", updatedUrl.toString());
    }
  };

  if (isLocalEnvironment()) {
    modeSwitchEl.hidden = false;
    btnStart.addEventListener("click", () => applyStageMode("start"));
    btnEnd.addEventListener("click", () => applyStageMode("end"));
  }

  applyStageMode(resolveStageMode(params));
}

initializeExhibitionStage();
