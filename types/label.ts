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
  quantity: number;
  purity: number;
  germination: number;
  collectedDate: string;
  testedDate: string;
  expiryDate: string;
  producerName: string;
  producerLicenseRP2: string;
  distributorName: string;
  distributorLicensePP4: string;
  address: string;
  storageInstructions: string;
  bgImageUrl?: string;
  labelPosition: LabelPosition;
  labelSizeCm: LabelSizeCm;
  /** Multiplier for label text (0.5–1.5, default 1) */
  fontScale: number;
};

export const DEFAULT_SPECIES = "กัญชา (Cannabis)";
export const DEFAULT_STORAGE =
  "ควรเก็บในภาชนะปิดสนิททึบแสง อุณหภูมิ 5-10°C และกันความชื้น ก่อนเพาะควรพักในอุณหภูมิห้อง 2-3 ชม.";

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

export const DEFAULT_DISTRIBUTOR_NAME = "หจก. ทีเอ็มวาย อะโกร เทรด";
export const DEFAULT_DISTRIBUTOR_LICENSE_PP4 = "1011043900042568";

export function createEmptySeedLabelData(id?: string): SeedLabelData {
  return {
    id: id ?? crypto.randomUUID(),
    species: DEFAULT_SPECIES,
    strainName: "",
    quantity: 1,
    purity: 99,
    germination: 90,
    collectedDate: "",
    testedDate: "",
    expiryDate: "",
    producerName: "",
    producerLicenseRP2: "",
    distributorName: DEFAULT_DISTRIBUTOR_NAME,
    distributorLicensePP4: DEFAULT_DISTRIBUTOR_LICENSE_PP4,
    address: "",
    storageInstructions: DEFAULT_STORAGE,
    bgImageUrl: undefined,
    labelPosition: { ...DEFAULT_LABEL_POSITION },
    labelSizeCm: { ...DEFAULT_LABEL_SIZE_CM },
    fontScale: DEFAULT_FONT_SCALE,
  };
}
