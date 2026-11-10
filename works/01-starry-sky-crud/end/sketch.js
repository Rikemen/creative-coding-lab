/**
 * p5.js による星空の描画・インタラクション層。
 *
 * 画面サイズが変わっても（PC・スマホ）破綻しないよう、
 * 位置は正規化座標（0.0〜1.0）、サイズは画面の短辺（Math.min）基準で計算する。
 */

import {
  createStar,
  deleteStar,
  fetchStars,
  initializeSession,
  updateStar,
} from "./repository.js";

/** @typedef {import("./types.js").Star} Star */

/**
 * 流れ星（削除時のアニメーション演出オブジェクト）
 * @typedef {Object} ShootingStar
 * @property {number} x
 * @property {number} y
 * @property {number} vx 速度X
 * @property {number} vy 速度Y
 * @property {number} hue 色相
 * @property {number} life 残り寿命（1.0〜0.0）
 */

/**
 * 星の色温度パレット（HSB色空間）
 * 0: 青白（シリウス風） / 1: 琥珀金（ベテルギウス風） / 2: 桜桃（星雲風） / 3: 氷青（巨星風）
 */
const STAR_PALETTES = [
  { hue: 205, sat: 25, bri: 100 },
  { hue: 42, sat: 85, bri: 100 },
  { hue: 340, sat: 65, bri: 100 },
  { hue: 175, sat: 70, bri: 100 },
];

const containerElement = document.getElementById("canvas-container");
const hudElement = document.getElementById("system-hud");

if (!(containerElement instanceof HTMLElement) || !(hudElement instanceof HTMLElement)) {
  throw new Error("必要なDOM要素が見つかりません。");
}

function updateHudMessage(message, state = "normal") {
  if (hudElement instanceof HTMLElement) {
    hudElement.textContent = message;
    hudElement.dataset.state = state;
  }
}

/** @type {Star[]} 現在夜空に存在する星の一覧 */
let stars = [];

/** @type {ShootingStar[]} 流れ星アニメーション中の一時演出配列 */
let shootingStars = [];

/** @type {string | null} タップ開始時に触れた星のID（空の場所なら null） */
let activeStarId = null;
/** @type {number} ポインタを押した時刻（ミリ秒） */
let pointerDownTime = 0;

/**
 * 初期化：セッションを準備し、初期シード星を取得する（Read）
 */
async function bootstrapSystem() {
  try {
    const status = await initializeSession();
    updateHudMessage(status.label);

    // repository.js から星データを一括取得（Read）
    stars = await fetchStars();
  } catch (error) {
    console.error("[Sketch] 初期化エラー:", error);
    const reason = error instanceof Error ? error.message : String(error);
    updateHudMessage(`初期化エラー: ${reason}`, "error");
  }
}

new window.p5((p) => {
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent(containerElement);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    void bootstrapSystem();
  };

  // スマホの回転や画面サイズ変更に追従
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    // 1. 深い夜空の背景を描く
    p.blendMode(p.BLEND);
    p.background(225, 45, 6, 100); // 濃紺の夜空

    // 2. 光が重なると白く発光する「加算合成」に切り替え
    p.blendMode(p.ADD);
    const time = p.frameCount * 0.04;
    const shortSide = Math.min(p.width, p.height);

    // 3. すべての星を描画
    for (let index = 0; index < stars.length; index++) {
      const star = stars[index];
      const palette = STAR_PALETTES[star.colorIndex] ?? STAR_PALETTES[0];

      // 正規化座標（0.0〜1.0）を画面のピクセル座標へ変換
      const x = star.normalizedX * p.width;
      const y = star.normalizedY * p.height;

      // 等級（1〜3）に応じた基準サイズ
      const baseRadius = shortSide * (0.015 + star.magnitude * 0.008);
      // サイン波による自然な瞬き
      const twinkle = p.sin(time + index * 1.7) * 0.25 + 1.0;
      const currentRadius = baseRadius * twinkle;

      p.noStroke();

      // ① 淡い外側の光輪（ハロー）
      p.fill(palette.hue, palette.sat * 0.8, palette.bri, 14);
      p.circle(x, y, currentRadius * 3.6);

      // ② 中間の輝き
      p.fill(palette.hue, palette.sat, palette.bri, 45);
      p.circle(x, y, currentRadius * 1.6);

      // ③ 十字光線（フレア）：等級が高いほど鋭く伸びる
      const flareLength = currentRadius * (1.8 + star.magnitude * 1.2);
      p.stroke(palette.hue, palette.sat * 0.6, palette.bri, 60);
      p.strokeWeight(1.2);
      p.line(x - flareLength, y, x + flareLength, y);
      p.line(x, y - flareLength, x, y + flareLength);

      // ④ 星核（中心の純白な芯）
      p.noStroke();
      p.fill(0, 0, 100, 95);
      p.circle(x, y, Math.max(3, currentRadius * 0.4));

      // ⑤ 長押しチャージゲージ（押下中の星の周りに円形リングを描く）
      if (activeStarId === star.id && pointerDownTime > 0) {
        const holdTime = p.millis() - pointerDownTime;
        const progress = Math.min(1.0, holdTime / 500); // 0.0〜1.0

        p.noFill();
        p.stroke(palette.hue, 20, 100, 80);
        p.strokeWeight(2);
        // 上（-HALF_PI）から時計回りにリングが伸びる
        p.arc(x, y, currentRadius * 4.2, currentRadius * 4.2, -p.HALF_PI, -p.HALF_PI + p.TWO_PI * progress);

        // 0.5秒（500ms）長押し達成 ➔ 流れ星にして削除！【Delete】
        if (progress >= 1.0) {
          triggerShootingStar(star, x, y, palette.hue);
        }
      }
    }

    // 4. 流れ星アニメーションの描画と更新
    drawShootingStars(p);
  };

  /**
   * 星を流れ星へと変化させて削除（Delete）を発火する
   */
  function triggerShootingStar(star, x, y, hue) {
    // 画面の一覧から星を取り除く
    stars = stars.filter((s) => s.id !== star.id);

    // 斜め下へ流れるエフェクト配列へ追加
    shootingStars.push({
      x,
      y,
      vx: p.random(6, 10),
      vy: p.random(4, 7),
      hue,
      life: 1.0,
    });

    // リポジトリ側のデータも削除
    void deleteStar(star.id);

    // タップ状態を解除
    activeStarId = null;
    pointerDownTime = 0;
  }

  /**
   * 流れ星を描画し、光をフェードアウトさせる
   */
  function drawShootingStars(p) {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.04; // 寿命を減らす

      if (s.life <= 0) {
        shootingStars.splice(i, 1);
        continue;
      }

      // 尾を引く光のライン
      p.stroke(s.hue, 40, 100, s.life * 90);
      p.strokeWeight(2.5 * s.life);
      p.line(s.x, s.y, s.x - s.vx * 3.5, s.y - s.vy * 3.5);

      // 先端の強い光
      p.noStroke();
      p.fill(0, 0, 100, s.life * 100);
      p.circle(s.x, s.y, 4 * s.life);
    }
  }

  /**
   * マウスまたは画面を押した瞬間
   */
  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
      return;
    }

    pointerDownTime = p.millis();
    const shortSide = Math.min(p.width, p.height);
    const hitRadius = Math.max(28, shortSide * 0.045);

    const clicked = stars.find((star) => {
      const sx = star.normalizedX * p.width;
      const sy = star.normalizedY * p.height;
      return p.dist(p.mouseX, p.mouseY, sx, sy) <= hitRadius;
    });

    activeStarId = clicked ? clicked.id : null;
  };

  /**
   * 指やマウスを離した瞬間
   */
  p.mouseReleased = () => {
    if (pointerDownTime === 0) {
      return;
    }

    const duration = p.millis() - pointerDownTime;
    pointerDownTime = 0;

    // A. 何もない空をタップした場合 ➔ 新しい星を生み出す【Create】
    if (activeStarId === null) {
      const newDraft = {
        normalizedX: p.constrain(p.mouseX / p.width, 0, 1),
        normalizedY: p.constrain(p.mouseY / p.height, 0, 1),
        colorIndex: Math.floor(p.random(0, 4)),
        magnitude: Math.floor(p.random(1, 4)),
      };

      void createStar(newDraft).then((created) => {
        stars = [...stars, created];
      });
      return;
    }

    // B. 既存の星を短くタップした場合（0.5秒未満） ➔ 星を進化【Update】
    if (duration < 500) {
      const targetStar = stars.find((s) => s.id === activeStarId);
      if (!targetStar) return;

      const nextColor = (targetStar.colorIndex + 1) % 4;
      const nextMag = (targetStar.magnitude % 3) + 1;

      stars = stars.map((s) =>
        s.id === targetStar.id ? { ...s, colorIndex: nextColor, magnitude: nextMag } : s
      );

      void updateStar(targetStar.id, { colorIndex: nextColor, magnitude: nextMag });
    }

    activeStarId = null;
  };
}, containerElement);