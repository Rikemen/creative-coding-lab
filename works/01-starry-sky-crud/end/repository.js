import { signInAnonymously } from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore"

import {
  buildWorkCollectionPath,
  getFirebaseClients,
  isFirebaseConfigured,
} from "../../../shared/firebase.js";

/**
 * 星空アプリのデータ管理・通信層（リポジトリ）。
 *
 * まずはローカル配列で CRUD（作成・取得・更新・削除）を確実に動かし、
 * 画面側（sketch.js）のアート表現を完成させてから Firestore 接続に切り替える。
 */

/** @typedef {import("./types.js").Star} Star */
/** @typedef {import("./types.js").StarDraft} StarDraft */
/** @typedef {import("./types.js").StarPatch} StarPatch */
/** @typedef {import("./types.js").SystemConnectionStatus} SystemConnectionStatus */

/**
 * 初期表示用のシード星データ（色・等級・配置の異なる4つの星）
 * @type {Star[]}
 */
let fallbackStars = [
  { id: "seed-1", normalizedX: 0.25, normalizedY: 0.35, colorIndex: 0, magnitude: 2 },
  { id: "seed-2", normalizedX: 0.50, normalizedY: 0.28, colorIndex: 1, magnitude: 3 },
  { id: "seed-3", normalizedX: 0.75, normalizedY: 0.42, colorIndex: 2, magnitude: 1 },
  { id: "seed-4", normalizedX: 0.38, normalizedY: 0.65, colorIndex: 3, magnitude: 2 },
];


const WORK_ID = "01-starry-sky-crud";
const RESOURCE_NAME = "stars";
const MAX_STARS_LIMIT = 120;

/**
 * Firestore から取得した未知のデータを検証し、安全なStar型に変換する
 * @param {string} docId
 * @param {Record<string, unknown>} rawData
 * @returns {Star | null}
 */
function parseStarDocument(docId, rawData) {
  const { normalizedX, normalizedY, colorIndex, magnitude } = rawData;
  if (
    typeof normalizedX !== "number" ||
    typeof normalizedY !== "number" ||
    typeof colorIndex !== "number" ||
    typeof magnitude !== "number"
  ) {
    return null;
  }
  return {
    id: docId,
    normalizedX,
    normalizedY,
    colorIndex,
    magnitude,
  };
}


/**
 * 1. セッション初期化（匿名認証でUIDを取得）
 * @returns {Promise<SystemConnectionStatus>}
 */
export async function initializeSession() {
  // Firebase の設定（APIキー等）がない場合は、これまでのローカル配列モードで安全に動かす
  if (!isFirebaseConfigured()) {
    return {
      mode: "local-fallback",
      currentUid: "local-star-gazer",
      label: "STARRY SKY (ローカル動作) | タップ: 星を生む・色を変える / 長押し: 流れ星にして消す",
    };
  }

  // Firebase 設定がある場合は、匿名認証を行う
  const { auth, isUsingEmulator } = getFirebaseClients();
  const credential =
    auth.currentUser !== null
      ? { user: auth.currentUser }
      : await signInAnonymously(auth);

  const shortUid = credential.user.uid.slice(0, 6);
  const mode = isUsingEmulator ? "emulator" : "cloud";
  const labelPrefix = isUsingEmulator ? "EMULATOR" : "FIRESTORE";

  return {
    mode,
    currentUid: credential.user.uid,
    label: `STARRY SKY (${labelPrefix} 接続中 / UID: ${shortUid}) | タップ: 星を生む・色を変える / 長押し: 流れ星にして消す`,
  };
}

/**
 * 2. 星の一括取得（Read）
 * @returns {Promise<Star[]>}
 */
export async function fetchStars() {
  if (!isFirebaseConfigured()) {
    return [...fallbackStars];
  }
  const { db } = getFirebaseClients();
  // 作品専用のコレクションパス: /works/01-starry-sky-crud/stars
  const starsCollection = collection(db, ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME));

  // 作成日時（createdAt）順で最大120個取得するクエリ
  const starsQuery = query(
    starsCollection,
    orderBy("createdAt", "asc"),
    limit(MAX_STARS_LIMIT)
  );
  const snapshot = await getDocs(starsQuery);
  /** @type {Star[]} */
  const loadedStars = [];
  snapshot.forEach((docSnap) => {
    const star = parseStarDocument(docSnap.id, docSnap.data());
    if (star !== null) {
      loadedStars.push(star);
    }
  });
  return loadedStars;

}

/**
 * 3. 新しい星の作成（Create）
 * @param {StarDraft} draft
 * @returns {Promise<Star>}
 */
export async function createStar(draft) {
  if (!isFirebaseConfigured()) {
    const newStar = {
      id: `star-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      normalizedX: Math.min(1, Math.max(0, draft.normalizedX)),
      normalizedY: Math.min(1, Math.max(0, draft.normalizedY)),
      colorIndex: Math.floor(Math.abs(draft.colorIndex)) % 4,
      magnitude: Math.min(3, Math.max(1, Math.round(draft.magnitude))),
    };
    fallbackStars = [...fallbackStars, newStar];
    return newStar;
  }
  const { db } = getFirebaseClients();
  const starsCollection = collection(db, ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME));
  // Firestore に保存するドキュメントデータ（サーバー時刻を付与）
  const payload = {
    normalizedX: Math.min(1, Math.max(0, draft.normalizedX)),
    normalizedY: Math.min(1, Math.max(0, draft.normalizedY)),
    colorIndex: Math.floor(Math.abs(draft.colorIndex)) % 4,
    magnitude: Math.min(3, Math.max(1, Math.round(draft.magnitude))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(starsCollection, payload);
  return {
    id: docRef.id,
    normalizedX: payload.normalizedX,
    normalizedY: payload.normalizedY,
    colorIndex: payload.colorIndex,
    magnitude: payload.magnitude,
  };
}

/**
 * 4. 星の進化・色温度更新（Update）
 * @param {string} starId
 * @param {StarPatch} patch
 * @returns {Promise<void>}
 */
export async function updateStar(starId, patch) {
  if (!isFirebaseConfigured()) {
    fallbackStars = fallbackStars.map((star) => {
      if (star.id !== starId) {
        return star;
      }
      return {
        ...star,
        colorIndex: Math.floor(Math.abs(patch.colorIndex)) % 4,
        magnitude: Math.min(3, Math.max(1, Math.round(patch.magnitude))),
      };
    });
    return;
  }
  const { db } = getFirebaseClients();
  // 更新対象の星ドキュメントの住所: /works/01-starry-sky-crud/stars/{starId}
  const starDocRef = doc(db, ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME), starId);
  // Firestore に上書きする差分データ
  await updateDoc(starDocRef, {
    colorIndex: Math.floor(Math.abs(patch.colorIndex)) % 4,
    magnitude: Math.min(3, Math.max(1, Math.round(patch.magnitude))),
    updatedAt: serverTimestamp(),
  });
}

/**
 * 5. 流れ星にして削除（Delete）
 * @param {string} starId
 * @returns {Promise<void>}
 */
export async function deleteStar(starId) {
  if (!isFirebaseConfigured()) {
    fallbackStars = fallbackStars.filter((star) => star.id !== starId);
    return;
  }
  const { db } = getFirebaseClients();
  // 削除対象の星ドキュメントの住所: /works/01-starry-sky-crud/stars/{starId}
  const starDocRef = doc(db, ...buildWorkCollectionPath(WORK_ID, RESOURCE_NAME), starId);
  // Firestore から該当ドキュメントを完全消去！
  await deleteDoc(starDocRef);
}