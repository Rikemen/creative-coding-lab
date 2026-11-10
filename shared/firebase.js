/**
 * Firebase 初期化・クライアント提供モジュール。
 *
 * 各作品コード（`works/<work-id>/...`）からは、初期化手順やエミュレータ分岐の煩雑さを意識せず
 * 認証（`auth`）とデータベース（`db`）の仕組みそのものの学習に集中できるよう、接続確立の責務をここに隔離している。
 */

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { firebaseConfig, firebaseEnvironment } from "./firebase-config.js";

const PLACEHOLDER_API_KEY = "YOUR_API_KEY";

/**
 * URLクエリ（`?emulator=1`）または設定ファイルからエミュレータ利用有無を判定する。
 * 本番ドメイン公開時に誤ってローカルエミュレータへ向き先が変わる事故を防ぐため、
 * ホスト名が `localhost` のときのみエミュレータ接続を許可する。
 *
 * @returns {boolean}
 */
function shouldConnectEmulator() {
  if (window.location.hostname !== "localhost") {
    return false;
  }
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("emulator") === "1") {
    return true;
  }
  return firebaseEnvironment.useEmulator;
}

/**
 * Firebase が利用可能な状態（本番設定済み、またはエミュレータ利用モード）かを判定する。
 * 未設定のまま起動された際に謎の通信エラーでクラッシュさせず、学習者に設定手順を案内するために用いる。
 *
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  if (shouldConnectEmulator()) {
    return true;
  }
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== PLACEHOLDER_API_KEY
  );
}

/**
 * @typedef {Object} FirebaseClients
 * @property {import("firebase/app").FirebaseApp} app
 * @property {import("firebase/auth").Auth} auth
 * @property {import("firebase/firestore").Firestore} db
 * @property {boolean} isUsingEmulator
 */

/** @type {FirebaseClients | null} */
let cachedClients = null;

/**
 * 初期化済みの Firebase クライアント一式を取得する。
 *
 * @returns {FirebaseClients}
 * @throws {Error} Firebase未設定かつエミュレータ無効の場合に、解決方法を含むエラーを送出する
 */
export function getFirebaseClients() {
  if (cachedClients !== null) {
    return cachedClients;
  }

  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebaseが未設定です。shared/firebase-config.js にFirebaseコンソール（プロジェクトの設定 > 全般 > マイアプリ）の値を設定するか、useEmulator: true にしてエミュレータを起動してください。"
    );
  }

  const useEmulator = shouldConnectEmulator();
  const effectiveConfig = useEmulator
    ? {
        ...firebaseConfig,
        // エミュレータ接続時はダミーのAPIキーでもSDKバリデーションを通過させる
        apiKey:
          firebaseConfig.apiKey === PLACEHOLDER_API_KEY
            ? "demo-emulator-api-key"
            : firebaseConfig.apiKey,
      }
    : firebaseConfig;

  const isFirstInit = getApps().length === 0;
  const app = isFirstInit ? initializeApp(effectiveConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  // エミュレータへの二重接続は Firebase SDK 側で例外となるため、初回初期化時のみバインドする
  if (useEmulator && isFirstInit) {
    const { emulatorHost, authEmulatorPort, firestoreEmulatorPort } =
      firebaseEnvironment;
    connectAuthEmulator(auth, `http://${emulatorHost}:${authEmulatorPort}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, emulatorHost, firestoreEmulatorPort);
  }

  cachedClients = {
    app,
    auth,
    db,
    isUsingEmulator: useEmulator,
  };

  return cachedClients;
}

/**
 * 複数作品が1つの Firestore インスタンスを共有してもデータが混線しないよう、
 * 作品ごとの名前空間（`works/{workId}/{collectionName}`）のパスを生成するヘルパー。
 *
 * @param {string} workId 作品の一意識別子（例: "_template", "01-starry-sky"）
 * @param {string} resourceName 作品内で扱うコレクション名（例: "particles", "stars"）
 * @returns {[string, string, string]} `collection(db, ...pathSegments)` にそのまま渡せるパス配列
 */
export function buildWorkCollectionPath(workId, resourceName) {
  if (!workId.trim() || !resourceName.trim()) {
    throw new Error("workId と resourceName は空文字にできません。");
  }
  return ["works", workId, resourceName];
}

