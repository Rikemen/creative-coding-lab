/**
 * 【完成版（End）】認証およびデータベース通信を担当するリポジトリ層。
 *
 * 描画ロジック（`sketch.js`）から Firebase SDK の詳細を切り離すことで、
 * 「画面の表現」と「データの永続化・認可」の役割分担を明確にしている。
 */

import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  buildWorkCollectionPath,
  getFirebaseClients,
  isFirebaseConfigured,
} from "../../../shared/firebase.js";

/** @typedef {import("./types.js").LightParticle} LightParticle */
/** @typedef {import("./types.js").LightParticleDraft} LightParticleDraft */
/** @typedef {import("./types.js").SystemConnectionStatus} SystemConnectionStatus */

const WORK_ID = "_template";
const RESOURCE_NAME = "particles";
const MAX_DISPLAY_PARTICLES = 150;
const LOCAL_FALLBACK_UID = "local-preview-user";

/**
 * Firebase未設定時でもギャラリーの額縁プレビューが破綻しないよう用意する初期デモデータ
 * @type {LightParticle[]}
 */
let fallbackParticles = [
  { id: "seed-1", normalizedX: 0.32, normalizedY: 0.44, hue: 205, ownerUid: "gallery-seed" },
  { id: "seed-2", normalizedX: 0.52, normalizedY: 0.36, hue: 42, ownerUid: LOCAL_FALLBACK_UID },
  { id: "seed-3", normalizedX: 0.68, normalizedY: 0.58, hue: 280, ownerUid: "gallery-seed" },
];

/** @type {((particles: LightParticle[]) => void) | null} */
let fallbackSubscriber = null;

/**
 * Firestore から取得した未知のドキュメントデータを検証し、描画層の型へ安全に変換する。
 * 万一不正な形式のデータが存在しても描画ループ全体を止めないための防御境界。
 *
 * @param {string} documentId
 * @param {Record<string, unknown>} rawData
 * @returns {LightParticle | null}
 */
function parseParticleDocument(documentId, rawData) {
  const { normalizedX, normalizedY, hue, ownerUid } = rawData;
  if (
    typeof normalizedX !== "number" ||
    typeof normalizedY !== "number" ||
    typeof hue !== "number" ||
    typeof ownerUid !== "string"
  ) {
    return null;
  }

  return {
    id: documentId,
    normalizedX,
    normalizedY,
    hue,
    ownerUid,
  };
}

/**
 * セッション（匿名認証）を確立し、現在の接続ステータスを返す。
 *
 * @returns {Promise<SystemConnectionStatus>}
 */
export async function initializeSession() {
  if (!isFirebaseConfigured()) {
    console.warn(
      "[Template Repository] Firebase未設定のためローカルプレビューモードで動作しています。クラウド同期を行うには shared/firebase-config.js を設定してください。"
    );
    return {
      mode: "local-fallback",
      currentUid: LOCAL_FALLBACK_UID,
      label: "PREVIEW MODE (Firebase未設定・一時メモリ動作) | Click: 生成 / 自分の光をクリック: 削除",
    };
  }

  const { auth, isUsingEmulator } = getFirebaseClients();
  const credential =
    auth.currentUser !== null
      ? { user: auth.currentUser }
      : await signInAnonymously(auth);

  const shortUid = credential.user.uid.slice(0, 6);
  const mode = isUsingEmulator ? "emulator" : "cloud";
  const endpointName = isUsingEmulator ? "FIRESTORE EMULATOR" : "CLOUD FIRESTORE";

  return {
    mode,
    currentUid: credential.user.uid,
    label: `${endpointName} CONNECTED (UID: ${shortUid}...) | Click: 生成 / 二重輪の光をクリック: 削除`,
  };
}

/**
 * 粒子コレクションの変更をリアルタイム購読する。
 *
 * @param {(particles: LightParticle[]) => void} onParticlesChanged
 * @param {(errorMessage: string) => void} onSubscriptionError
 * @returns {() => void} 購読解除関数
 */
export function subscribeParticles(onParticlesChanged, onSubscriptionError) {
  if (!isFirebaseConfigured()) {
    fallbackSubscriber = onParticlesChanged;
    onParticlesChanged([...fallbackParticles]);
    return () => {
      fallbackSubscriber = null;
    };
  }

  const { db } = getFirebaseClients();
  const collectionRef = collection(
    db,
    ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME)
  );
  const particlesQuery = query(
    collectionRef,
    orderBy("createdAt", "asc"),
    limit(MAX_DISPLAY_PARTICLES)
  );

  return onSnapshot(
    particlesQuery,
    (snapshot) => {
      /** @type {LightParticle[]} */
      const nextParticles = [];
      snapshot.forEach((docSnap) => {
        const parsed = parseParticleDocument(docSnap.id, docSnap.data());
        if (parsed !== null) {
          nextParticles.push(parsed);
        }
      });
      onParticlesChanged(nextParticles);
    },
    (error) => {
      console.error("[Template Repository] Firestore購読エラー:", error);
      onSubscriptionError(`データ購読に失敗しました: ${error.message}`);
    }
  );
}

/**
 * 新しい光の粒子を永続化する。
 * `firestore.rules` のスキーマ検証を通過するよう、正規化座標の範囲制限とサーバー時刻付与を行う。
 *
 * @param {LightParticleDraft} draft
 * @returns {Promise<void>}
 */
export async function createParticle(draft) {
  const clampedX = Math.min(1, Math.max(0, draft.normalizedX));
  const clampedY = Math.min(1, Math.max(0, draft.normalizedY));
  const normalizedHue = ((draft.hue % 360) + 360) % 360;

  if (!isFirebaseConfigured()) {
    fallbackParticles = [
      ...fallbackParticles,
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        normalizedX: clampedX,
        normalizedY: clampedY,
        hue: normalizedHue,
        ownerUid: LOCAL_FALLBACK_UID,
      },
    ];
    if (fallbackSubscriber !== null) {
      fallbackSubscriber([...fallbackParticles]);
    }
    return;
  }

  const { auth, db } = getFirebaseClients();
  if (auth.currentUser === null) {
    throw new Error("未認証状態のため粒子を作成できません。");
  }

  const collectionRef = collection(
    db,
    ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME)
  );

  await addDoc(collectionRef, {
    normalizedX: clampedX,
    normalizedY: clampedY,
    hue: normalizedHue,
    ownerUid: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });
}

/**
 * 指定された粒子を削除する。
 * クライアント側だけでなく `firestore.rules` 側でも `ownerUid == request.auth.uid` が検証される。
 *
 * @param {string} particleId
 * @returns {Promise<void>}
 */
export async function removeParticle(particleId) {
  if (!particleId) {
    return;
  }

  if (!isFirebaseConfigured()) {
    fallbackParticles = fallbackParticles.filter(
      (item) => !(item.id === particleId && item.ownerUid === LOCAL_FALLBACK_UID)
    );
    if (fallbackSubscriber !== null) {
      fallbackSubscriber([...fallbackParticles]);
    }
    return;
  }

  const { db } = getFirebaseClients();
  const targetDocRef = doc(
    db,
    ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME),
    particleId
  );

  await deleteDoc(targetDocRef);
}

