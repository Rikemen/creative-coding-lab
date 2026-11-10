/**
 * p5.js による視覚表現・インタラクション層。
 *
 * このファイルは `start/` と `end/` で同一の内容を保つ。
 * データの保存先が「配列（ローカルメモリ）」から「Firestore（クラウドDB）」に変わっても、
 * 描画コード側を一切書き換えずに済む（疎結合アーキテクチャの体験）ことを意図している。
 */

import {
  createParticle,
  initializeSession,
  removeParticle,
  subscribeParticles,
} from "./repository.js";

/** @typedef {import("./types.js").LightParticle} LightParticle */

const MIN_TAP_HIT_RADIUS_PX = 26;
const DOUBLE_TRIGGER_GUARD_MS = 160;

const containerElement = document.getElementById("canvas-container");
const hudElement = document.getElementById("system-hud");

if (!(containerElement instanceof HTMLElement) || !(hudElement instanceof HTMLElement)) {
  throw new Error("描画に必要なDOM要素（#canvas-container または #system-hud）が見つかりません。");
}

/**
 * HUDに現在の接続ステータスやエラーを表示する
 *
 * @param {string} message
 * @param {"normal" | "error"} [state="normal"]
 */
function updateHudMessage(message, state = "normal") {
  if (!(hudElement instanceof HTMLElement)) {
    return;
  }
  hudElement.textContent = message;
  hudElement.dataset.state = state;
}

/** @type {LightParticle[]} */
let particles = [];

/** @type {string | null} */
let currentUid = null;

/** @type {(() => void) | null} */
let unsubscribe = null;

let lastPointerHandledAt = 0;

/**
 * 非同期のセッション確立とデータ購読を開始する
 */
async function bootstrapSystem() {
  try {
    const status = await initializeSession();
    currentUid = status.currentUid;
    updateHudMessage(status.label, status.mode === "error" ? "error" : "normal");

    unsubscribe = subscribeParticles(
      (latestParticles) => {
        particles = latestParticles;
      },
      (errorMessage) => {
        updateHudMessage(errorMessage, "error");
      }
    );
  } catch (error) {
    console.error("[Sketch] 初期化に失敗しました:", error);
    const reason = error instanceof Error ? error.message : String(error);
    updateHudMessage(`初期化エラー: ${reason}`, "error");
  }
}

window.addEventListener("beforeunload", () => {
  if (unsubscribe !== null) {
    unsubscribe();
  }
});

// グローバル空間の汚染を防ぐため p5 インスタンスモードで描画する
new window.p5((p) => {
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent(containerElement);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    void bootstrapSystem();
  };

  // スマホの画面回転やブラウザUI伸縮に追従させる
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    p.blendMode(p.BLEND);
    p.background(230, 35, 5, 100);

    // スマホ小画面とPC大画面の双方で密度が破綻しないよう、短辺基準で距離やサイズを算出する
    const shortSide = Math.min(p.width, p.height);
    const harmonicDistance = p.constrain(shortSide * 0.28, 100, 200);

    // 光の重なりが美しく発光するよう加算合成に切り替える
    p.blendMode(p.ADD);
    const timeSeconds = p.frameCount * 0.025;

    // 近接する粒子同士を淡い光線で結ぶ
    for (let i = 0; i < particles.length; i++) {
      const first = particles[i];
      const x1 = first.normalizedX * p.width;
      const y1 = first.normalizedY * p.height;

      for (let j = i + 1; j < particles.length; j++) {
        const second = particles[j];
        const x2 = second.normalizedX * p.width;
        const y2 = second.normalizedY * p.height;
        const distance = p.dist(x1, y1, x2, y2);

        if (distance < harmonicDistance) {
          const alpha = (1 - distance / harmonicDistance) * 24;
          p.stroke(first.hue, 45, 90, alpha);
          p.strokeWeight(1);
          p.line(x1, y1, x2, y2);
        }
      }
    }

    // 各粒子を描画（自分が生成した粒子には認可オーナーを示す二重リングを添える）
    for (let index = 0; index < particles.length; index++) {
      const item = particles[index];
      const x = item.normalizedX * p.width;
      const y = item.normalizedY * p.height;
      const pulse = p.sin(timeSeconds + index * 0.9) * 3;

      p.noStroke();
      p.fill(item.hue, 70, 95, 14);
      p.circle(x, y, 42 + pulse * 2);

      p.fill(item.hue, 55, 100, 36);
      p.circle(x, y, 18 + pulse);

      p.fill(item.hue, 15, 100, 95);
      p.circle(x, y, 6);

      if (currentUid !== null && item.ownerUid === currentUid) {
        p.noFill();
        p.stroke(item.hue, 30, 100, 45);
        p.strokeWeight(1);
        p.circle(x, y, 30 + pulse);
      }
    }
  };

  p.mousePressed = () => {
    // モバイルブラウザでの touch -> mouse 合成イベント二重発火を防止する
    const now = performance.now();
    if (now - lastPointerHandledAt < DOUBLE_TRIGGER_GUARD_MS) {
      return;
    }
    lastPointerHandledAt = now;

    // キャンバス外のクリック・タップは無視する（早期リターン）
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
      return;
    }

    const shortSide = Math.min(p.width, p.height);
    const hitRadius = Math.max(MIN_TAP_HIT_RADIUS_PX, shortSide * 0.045);

    // 自分が所有する既存の粒子をタップした場合は削除を試みる
    const clickedOwnParticle = particles.find((item) => {
      if (currentUid === null || item.ownerUid !== currentUid) {
        return false;
      }
      const px = item.normalizedX * p.width;
      const py = item.normalizedY * p.height;
      return p.dist(p.mouseX, p.mouseY, px, py) <= hitRadius;
    });

    if (clickedOwnParticle !== undefined) {
      void removeParticle(clickedOwnParticle.id).catch((error) => {
        console.error("[Sketch] 粒子の削除に失敗しました:", error);
        const reason = error instanceof Error ? error.message : String(error);
        updateHudMessage(`削除エラー: ${reason}`, "error");
      });
      return;
    }

    // 空いている場所をタップした場合は新しい粒子を生成する
    const draftHue = Math.round((190 + p.random(-35, 95) + 360) % 360);
    void createParticle({
      normalizedX: p.constrain(p.mouseX / p.width, 0, 1),
      normalizedY: p.constrain(p.mouseY / p.height, 0, 1),
      hue: draftHue,
    }).catch((error) => {
      console.error("[Sketch] 粒子の作成に失敗しました:", error);
      const reason = error instanceof Error ? error.message : String(error);
      updateHudMessage(`作成エラー: ${reason}`, "error");
    });
  };
}, containerElement);
