/**
 * Firebase 接続設定のテンプレートファイル。
 *
 * 【自分のFirebaseプロジェクトに接続する場合】
 * Firebaseコンソールの「プロジェクトの設定 > 全般 > マイアプリ」に表示される
 * `firebaseConfig` の値を `shared/firebase-config.js` に貼り付け、`useEmulator` を `false` にしてください。
 *
 * 【クラウド登録なしで手元だけで試す場合（Firebase Local Emulator Suite）】
 * `useEmulator: true` に設定し、`npx firebase-tools emulators:start` を起動してください。
 */

/**
 * @typedef {Object} LabFirebaseEnvironment
 * @property {boolean} useEmulator ローカルエミュレータへ接続するかどうか
 * @property {string} emulatorHost エミュレータのホスト名（OAuth承認済みドメインと揃えるため localhost を推奨）
 * @property {number} authEmulatorPort Authentication エミュレータのポート番号
 * @property {number} firestoreEmulatorPort Firestore エミュレータのポート番号
 */

/** @type {import("firebase/app").FirebaseOptions} */
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "demo-rikemen-creative-lab",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

/** @type {LabFirebaseEnvironment} */
export const firebaseEnvironment = {
  useEmulator: false,
  emulatorHost: "localhost",
  authEmulatorPort: 9099,
  firestoreEmulatorPort: 8080,
};

