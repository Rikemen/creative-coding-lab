/**
 * 【ハンズオン開始用（Start）】データ保存・認証を担当するリポジトリ層。
 *
 * 開始時点ではブラウザ内の配列（揮発メモリ）だけにデータを保持しているため、
 * ページを再読み込みすると光が消え、別タブの鑑賞者とも空間が共有されない。
 *
 * 【この教材で実装するゴール】
 * 以下の4つの関数を Firebase Authentication / Cloud Firestore に置き換え、
 * `sketch.js`（描画コード）を1行も変更せずにリアルタイム共有アートへと進化させる。
 */

/** @typedef {import("./types.js").LightParticle} LightParticle */
/** @typedef {import("./types.js").LightParticleDraft} LightParticleDraft */
/** @typedef {import("./types.js").SystemConnectionStatus} SystemConnectionStatus */

const LOCAL_MEMORY_UID = "local-memory-user";

/** @type {LightParticle[]} */
let inMemoryParticles = [
  { id: "initial-1", normalizedX: 0.5, normalizedY: 0.5, hue: 205, ownerUid: LOCAL_MEMORY_UID },
];

/** @type {((particles: LightParticle[]) => void) | null} */
let activeListener = null;

/**
 * TODO(Step 1): `signInAnonymously` を用いて匿名認証セッションを確立し、発行された `uid` を返すように変更する
 *
 * @returns {Promise<SystemConnectionStatus>}
 */
export async function initializeSession() {
  return {
    mode: "local-fallback",
    currentUid: LOCAL_MEMORY_UID,
    label: "START MODE (ブラウザ内メモリ動作・リロードで消失) | Click: 生成 / 光をクリック: 削除",
  };
}

/**
 * TODO(Step 2): `onSnapshot` を用いて Firestore コレクションのリアルタイム購読に置き換える
 *
 * @param {(particles: LightParticle[]) => void} onParticlesChanged
 * @param {(errorMessage: string) => void} _onSubscriptionError
 * @returns {() => void} 購読解除関数
 */
export function subscribeParticles(onParticlesChanged, _onSubscriptionError) {
  activeListener = onParticlesChanged;
  onParticlesChanged([...inMemoryParticles]);

  return () => {
    activeListener = null;
  };
}

/**
 * TODO(Step 3): `addDoc` と `serverTimestamp()` を用いて Firestore にドキュメントを追加する
 *
 * @param {LightParticleDraft} draft
 * @returns {Promise<void>}
 */
export async function createParticle(draft) {
  const newParticle = {
    id: `mem-${Date.now()}`,
    normalizedX: Math.min(1, Math.max(0, draft.normalizedX)),
    normalizedY: Math.min(1, Math.max(0, draft.normalizedY)),
    hue: ((draft.hue % 360) + 360) % 360,
    ownerUid: LOCAL_MEMORY_UID,
  };

  inMemoryParticles = [...inMemoryParticles, newParticle];
  if (activeListener !== null) {
    activeListener([...inMemoryParticles]);
  }
}

/**
 * TODO(Step 4): `deleteDoc` を用いて自分の粒子ドキュメントを Firestore から削除する
 *
 * @param {string} particleId
 * @returns {Promise<void>}
 */
export async function removeParticle(particleId) {
  inMemoryParticles = inMemoryParticles.filter((item) => item.id !== particleId);
  if (activeListener !== null) {
    activeListener([...inMemoryParticles]);
  }
}

