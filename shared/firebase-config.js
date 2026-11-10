/**
 * 全作品で共有する Firebase 接続設定。
 *
 * 1つのリポジトリ内に複数の作品（教材）が増えても、接続設定を1箇所に集約することで
 * 作品ごとの設定コピペや修正漏れを防ぐ（DRY原則）。
 *
 * - クラウド実践コース: Firebaseコンソールの「プロジェクトの設定 > 全般 > マイアプリ」の値を設定し、`useEmulator: false` にする。
 * - ローカル完結コース: このファイルのまま `useEmulator: true` に変更し、エミュレータを起動する。
 */

/** @type {import("firebase/app").FirebaseOptions} */
export const firebaseConfig = {
  apiKey: "AIzaSyBqHDjrWUHJgyQnAoklFM7t9xP7I5LCGaQ",
  authDomain: "creative-coding-lab.firebaseapp.com",
  projectId: "creative-coding-lab",
  storageBucket: "creative-coding-lab.firebasestorage.app",
  messagingSenderId: "11462760563",
  appId: "1:11462760563:web:8ba4f0655c7d7ffe7a3206"
};

/** @type {import("./firebase-config.example.js").LabFirebaseEnvironment} */
export const firebaseEnvironment = {
  useEmulator: false,
  emulatorHost: "localhost",
  authEmulatorPort: 9099,
  firestoreEmulatorPort: 8080,
};

