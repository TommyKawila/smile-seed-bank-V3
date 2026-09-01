export type LabelPosition = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type LabelSizeCm = {
  width: number;
  height: number;
};

export type SeedLabelData = {
  id: string;
  species: string;
  strainName: string;
  lotNo: string;
  trademark: string;
  quantity: number;
  purity: number;
  germination: number;
  collectedDate: string;
  testedDate: string;
  expiryDate: string;
  collectionSource: string;
  producerName: string;
  producerLicensePP: string;
  distributorName: string;
  distributorLicensePP4: string;
  address: string;
  storageInstructions: string;
  bgImageUrl?: string;
  labelPosition: LabelPosition;
  labelSizeCm: LabelSizeCm;
  /** Multiplier for label text (0.5–3, default 1) */
  fontScale: number;
};

export const DEFAULT_SPECIES = "Cannabis sativa L.";
export const DEFAULT_STRAIN_NAME = "AF99 – Bubba Kush Auto";
export const DEFAULT_LOT_NO = "GF-AF99-2606-B01";
export const DEFAULT_TRADEMARK = "SMILE";
export const DEFAULT_COLLECTION_SOURCE = "ประเทศไทย / Thailand";
export const DEFAULT_PRODUCER_NAME = "GF (Global) Co., Ltd.";
export const DEFAULT_PRODUCER_LICENSE_PP = "102001102568";
export const DEFAULT_PRODUCER_ADDRESS =
  "49/1 Moo 4, King Kaew 30, Racha Thewa, Bang Phli, Samut Prakan 10540, Thailand";
export const DEFAULT_STORAGE_TH =
  "เก็บในที่เย็น แห้ง และมีอากาศถ่ายเทสะดวก หลีกเลี่ยงแสงแดดโดยตรง";
export const DEFAULT_STORAGE_EN =
  "Keep in a cool, dry, well-ventilated place, away from direct sunlight.";

export const DEFAULT_LABEL_POSITION: LabelPosition = {
  x: 40,
  y: 40,
  scale: 1,
  rotation: 0,
};

export const DEFAULT_LABEL_SIZE_CM: LabelSizeCm = {
  width: 5.5,
  height: 5.5,
};

/** SSB temporary GF pack — rear sticker area calibration */
export const DEFAULT_PACKAGE_SIZE_CM: LabelSizeCm = {
  width: 7,
  height: 10,
};

export const DEFAULT_FONT_SCALE = 1;
export const MIN_FONT_SCALE = 0.5;
export const MAX_FONT_SCALE = 3;

export const DEFAULT_DISTRIBUTOR_NAME = "หจก. ทีเอ็มวาย อะโกร เทรด";
export const DEFAULT_DISTRIBUTOR_LICENSE_PP4 = "1011043900042568";

export function createEmptySeedLabelData(id?: string): SeedLabelData {
  return {
    id: id ?? crypto.randomUUID(),
    species: DEFAULT_SPECIES,
    strainName: DEFAULT_STRAIN_NAME,
    lotNo: DEFAULT_LOT_NO,
    trademark: DEFAULT_TRADEMARK,
    quantity: 50,
    purity: 99,
    germination: 80,
    collectedDate: "06/2026",
    testedDate: "",
    expiryDate: "",
    collectionSource: DEFAULT_COLLECTION_SOURCE,
    producerName: DEFAULT_PRODUCER_NAME,
    producerLicensePP: DEFAULT_PRODUCER_LICENSE_PP,
    distributorName: DEFAULT_DISTRIBUTOR_NAME,
    distributorLicensePP4: DEFAULT_DISTRIBUTOR_LICENSE_PP4,
    address: DEFAULT_PRODUCER_ADDRESS,
    storageInstructions: `${DEFAULT_STORAGE_TH}\n${DEFAULT_STORAGE_EN}`,
    bgImageUrl: undefined,
    labelPosition: { ...DEFAULT_LABEL_POSITION },
    labelSizeCm: { ...DEFAULT_LABEL_SIZE_CM },
    fontScale: DEFAULT_FONT_SCALE,
  };
}
