/**
 * ビルドレス構成（CDN + Import Maps）において、`npm install` を行わずに
 * エディタ上の型安全性（JSDoc + checkJs）を維持するための最小型宣言。
 */

declare module "firebase/app" {
  export interface FirebaseOptions {
    readonly apiKey: string;
    readonly authDomain?: string;
    readonly projectId: string;
    readonly storageBucket?: string;
    readonly messagingSenderId?: string;
    readonly appId?: string;
  }

  export interface FirebaseApp {
    readonly name: string;
    readonly options: FirebaseOptions;
  }

  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module "firebase/auth" {
  import type { FirebaseApp } from "firebase/app";

  export interface User {
    readonly uid: string;
    readonly isAnonymous: boolean;
    readonly displayName: string | null;
    readonly email: string | null;
    readonly photoURL: string | null;
    getIdToken(forceRefresh?: boolean): Promise<string>;
  }

  export interface UserCredential {
    readonly user: User;
  }

  export interface Auth {
    readonly app: FirebaseApp;
    readonly currentUser: User | null;
  }

  export class GoogleAuthProvider { }

  export type Unsubscribe = () => void;

  export function getAuth(app?: FirebaseApp): Auth;
  export function connectAuthEmulator(
    auth: Auth,
    url: string,
    options?: { readonly disableWarnings?: boolean }
  ): void;
  export function signInAnonymously(auth: Auth): Promise<UserCredential>;
  export function signInWithPopup(auth: Auth, provider: GoogleAuthProvider): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(
    auth: Auth,
    nextOrObserver: (user: User | null) => void,
    error?: (error: Error) => void
  ): Unsubscribe;
}

declare module "firebase/firestore" {
  import type { FirebaseApp } from "firebase/app";

  export type DocumentData = Record<string, unknown>;

  export interface Firestore {
    readonly app: FirebaseApp;
  }

  export interface CollectionReference<T = DocumentData> {
    readonly id: string;
    readonly path: string;
    readonly __type?: T;
  }

  export interface DocumentReference<T = DocumentData> {
    readonly id: string;
    readonly path: string;
    readonly __type?: T;
  }

  export interface Query<T = DocumentData> {
    readonly __type?: T;
  }

  export interface QueryConstraint {
    readonly type: string;
  }

  export interface FieldValue {
    readonly _methodName?: string;
  }

  export interface Timestamp {
    toMillis(): number;
    toDate(): Date;
  }

  export interface QueryDocumentSnapshot<T = DocumentData> {
    readonly id: string;
    exists(): true;
    data(): T;
  }

  export interface DocumentSnapshot<T = DocumentData> {
    readonly id: string;
    exists(): boolean;
    data(): T | undefined;
  }

  export interface QuerySnapshot<T = DocumentData> {
    readonly empty: boolean;
    readonly size: number;
    readonly docs: ReadonlyArray<QueryDocumentSnapshot<T>>;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
  }

  export type Unsubscribe = () => void;

  export function getFirestore(app?: FirebaseApp): Firestore;
  export function connectFirestoreEmulator(
    firestore: Firestore,
    host: string,
    port: number
  ): void;

  export function collection(
    firestore: Firestore,
    path: string,
    ...pathSegments: string[]
  ): CollectionReference<DocumentData>;

  export function doc(
    firestore: Firestore,
    path: string,
    ...pathSegments: string[]
  ): DocumentReference<DocumentData>;

  export function addDoc<T extends DocumentData>(
    reference: CollectionReference<T>,
    data: T
  ): Promise<DocumentReference<T>>;

  export function setDoc<T extends DocumentData>(
    reference: DocumentReference<T>,
    data: T,
    options?: { readonly merge?: boolean }
  ): Promise<void>;

  export function updateDoc(
    reference: DocumentReference<DocumentData>,
    data: DocumentData
  ): Promise<void>;

  export function deleteDoc(
    reference: DocumentReference<DocumentData>
  ): Promise<void>;

  export function getDoc<T = DocumentData>(
    reference: DocumentReference<T>
  ): Promise<DocumentSnapshot<T>>;

  export function getDocs<T = DocumentData>(
    query: Query<T> | CollectionReference<T>
  ): Promise<QuerySnapshot<T>>;

  export function onSnapshot<T = DocumentData>(
    reference: Query<T> | CollectionReference<T>,
    onNext: (snapshot: QuerySnapshot<T>) => void,
    onError?: (error: Error) => void
  ): Unsubscribe;

  export function query<T = DocumentData>(
    queryRef: Query<T> | CollectionReference<T>,
    ...queryConstraints: QueryConstraint[]
  ): Query<T>;

  export function where(
    fieldPath: string,
    opStr: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in",
    value: unknown
  ): QueryConstraint;

  export function orderBy(
    fieldPath: string,
    directionStr?: "asc" | "desc"
  ): QueryConstraint;

  export function limit(limitCount: number): QueryConstraint;

  export function serverTimestamp(): FieldValue;
  export function increment(n: number): FieldValue;
}

/**
 * CDN経由で読み込まれる p5.js（インスタンスモード利用を強制しグローバル汚染を防止）の型定義
 */
interface P5Instance {
  readonly width: number;
  readonly height: number;
  readonly windowWidth: number;
  readonly windowHeight: number;
  readonly mouseX: number;
  readonly mouseY: number;
  readonly mouseIsPressed: boolean;
  readonly TWO_PI: number;
  readonly HALF_PI: number;
  readonly frameCount: number;
  readonly HSB: string;
  readonly RGB: string;
  readonly CENTER: string;
  readonly LEFT: string;
  readonly RIGHT: string;
  readonly ADD: string;
  readonly BLEND: string;

  setup: () => void;
  draw: () => void;
  mousePressed?: (event?: MouseEvent | TouchEvent) => void | boolean;
  touchStarted?: (event?: TouchEvent) => void | boolean;
  windowResized?: () => void;
  mouseReleased?: (event?: MouseEvent | TouchEvent) => void | boolean;

  createCanvas(width: number, height: number): { parent(container: HTMLElement | string): void };
  resizeCanvas(width: number, height: number): void;
  colorMode(mode: string, max1?: number, max2?: number, max3?: number, maxA?: number): void;
  blendMode(mode: string): void;
  background(v1: number, v2?: number, v3?: number, alpha?: number): void;
  noStroke(): void;
  stroke(v1: number, v2?: number, v3?: number, alpha?: number): void;
  strokeWeight(weight: number): void;
  noFill(): void;
  fill(v1: number, v2?: number, v3?: number, alpha?: number): void;
  circle(x: number, y: number, diameter: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  push(): void;
  pop(): void;
  sin(angle: number): number;
  cos(angle: number): number;
  dist(x1: number, y1: number, x2: number, y2: number): number;
  random(min?: number, max?: number): number;
  constrain(value: number, low: number, high: number): number;
  millis(): number;
  arc(x: number, y: number, w: number, h: number, start: number, stop: number): void;
}

interface Window {
  p5: new (sketch: (p: P5Instance) => void, node?: HTMLElement) => P5Instance;
}

