/**
 * 第1作：星の創造と進化（001 / LAB）のカードメタデータ定義。
 */

/** @type {import("../catalog.js").ArtworkMetadata} */
export const starrySkyCard = {
  id: "01-starry-sky-crud",
  cardNumber: "001 / LAB",
  stageLabel: "BASIC",
  syncPoint: 70,
  category: "crud",
  title: "星の創造と進化",
  subtitle: "夜空の星を生み・育て・流れ星に還して学ぶ CRUD とドキュメントID",
  characterId: "newt",
  characterComment:
    "夜空の星ひとつひとつが、データベースの中の1つの『ドキュメント』なんだ。星の色を変えてもIDが変わらない仕組みを観察してみよう！",
  cardSkills: [
    {
      badge: "CREATE",
      name: "星の創造と進化",
      apiHint: "addDoc / updateDoc",
      description:
        "夜空をタップして新しい星ドキュメントを追加し、星をタップするたびに色温度と輝きの等級を更新する。",
    },
    {
      badge: "READ",
      name: "夜空の記憶と流れ星",
      apiHint: "getDocs / deleteDoc",
      description:
        "保存された星空を起動時に一括取得して再現し、長押しされた星を流れ星としてデータベースから削除する。",
    },
  ],
  artisticConcept:
    "何もない夜空をタップすると新しい星が灯り、星に触れるたびに色温度と十字フレアの輝きが進化します。星を少し長押しするとチャージリングが満ち、流れ星の軌跡を描いて夜空から消えていきます。",
  systemArchitecture:
    "Webアプリの基本である CRUD（Create: addDoc / Read: getDocs / Update: updateDoc / Delete: deleteDoc）を1対1で視覚化した作品です。作成時に自動採番されるドキュメントID（docRef.id）を手元に保持することで、特定の星だけを狙って更新・削除できる仕組みを学びます。",
  systemKeywords: [
    "CRUD",
    "addDoc",
    "getDocs",
    "updateDoc",
    "deleteDoc",
    "ドキュメントID",
  ],
  accentColor: "#0077da",
  thumbnailUrl: null,
  youtubeUrl: null,
  isTemplate: false,
};

