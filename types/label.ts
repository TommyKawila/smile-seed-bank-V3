export type LabelPosition = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
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
  distributorLicensePP3: string;
  address: string;
  storageInstructions: string;
  bgImageUrl?: string;
  labelPosition: LabelPosition;
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
    distributorName: "",
    distributorLicensePP3: "",
    address: "",
    storageInstructions: DEFAULT_STORAGE,
    bgImageUrl: undefined,
    labelPosition: { ...DEFAULT_LABEL_POSITION },
  };
}
