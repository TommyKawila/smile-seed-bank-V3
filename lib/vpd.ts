import type { GrowStage } from "@/lib/grower-tools";

/** Saturation vapour pressure (kPa) from Magnus formula at temp °C. */
export function saturationVapourPressureKpa(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/** VPD in kPa from air temp °C and relative humidity %. */
export function calculateVpdKpa(tempC: number, rhPercent: number): number {
  const rh = Math.min(100, Math.max(0, rhPercent));
  const svp = saturationVapourPressureKpa(tempC);
  return svp * (1 - rh / 100);
}

export type VpdBand = {
  min: number;
  max: number;
  labelTh: string;
  labelEn: string;
};

export const VPD_TARGET_BANDS: Record<GrowStage, VpdBand> = {
  seedling: { min: 0.4, max: 0.8, labelTh: "ต้นกล้า", labelEn: "Seedling" },
  veg: { min: 0.8, max: 1.2, labelTh: "Vegetative", labelEn: "Vegetative" },
  flower: { min: 1.0, max: 1.5, labelTh: "Flower", labelEn: "Flower" },
};

export type VpdAdvice = {
  vpdKpa: number;
  band: VpdBand;
  status: "low" | "optimal" | "high";
  headlineTh: string;
  headlineEn: string;
  tipsTh: string[];
  tipsEn: string[];
};

export function analyzeVpd(
  tempC: number,
  rhPercent: number,
  stage: GrowStage
): VpdAdvice {
  const vpdKpa = calculateVpdKpa(tempC, rhPercent);
  const band = VPD_TARGET_BANDS[stage];
  let status: VpdAdvice["status"] = "optimal";
  if (vpdKpa < band.min) status = "low";
  else if (vpdKpa > band.max) status = "high";

  const tipsTh: string[] = [];
  const tipsEn: string[] = [];

  if (status === "low") {
    tipsTh.push(
      "VPD ต่ำเกิน — ความชื้นสูง · ลด humidifier หรือเพิ่มการระบายอากาศ",
      "ปรับแอร์ให้แห้งขึ้นเล็กน้อย (ลด RH) หรือเพิ่มอุณหภูมิในช่วงไฟเปิด",
      "ใช้ dehumidifier หาก RH ค้างสูงกว่า 65% ในช่วง veg/flower"
    );
    tipsEn.push(
      "VPD is too low — high humidity · reduce humidifier or improve airflow",
      "Dry the room slightly (lower RH) or raise temps during lights-on",
      "Run a dehumidifier if RH stays above ~65% in veg/flower"
    );
  } else if (status === "high") {
    tipsTh.push(
      "VPD สูงเกิน — อากาศแห้ง · เปิด humidifier หรือลดแอร์ที่ทำให้แห้ง",
      "เพิ่ม RH ช่วงไฟเปิด · ตรวจ mister / humidifier ให้ทำงาน",
      "หลีกเลี่ยงลมแรงโดยตรงที่ใบ — อาจทำให้ขอบใบไหม้เมื่อ VPD สูง"
    );
    tipsEn.push(
      "VPD is too high — air is dry · run humidifier or ease AC dehumidifying",
      "Raise RH during lights-on · verify humidifier / mister output",
      "Avoid harsh direct fan on leaves — leaf edge burn risk when VPD is high"
    );
  } else {
    tipsTh.push(
      "VPD อยู่ในช่วงเป้าหมาย — รักษาอุณหภูมิและ RH ใกล้ค่าปัจจุบัน",
      "สลับตรวจวัดช่วงไฟเปิด/ปิด — VPD มักเปลี่ยนตามแสงและแอร์"
    );
    tipsEn.push(
      "VPD is in the target band — keep temp and RH near current readings",
      "Log lights-on vs lights-off — VPD shifts with HVAC and photoperiod"
    );
  }

  const headlineTh =
    status === "low"
      ? "ชื้นเกิน — ควรลด RH"
      : status === "high"
        ? "แห้งเกิน — ควรเพิ่ม RH"
        : "อยู่ในช่วงที่เหมาะสม";
  const headlineEn =
    status === "low"
      ? "Too humid — lower RH"
      : status === "high"
        ? "Too dry — raise RH"
        : "In the sweet spot";

  return { vpdKpa, band, status, headlineTh, headlineEn, tipsTh, tipsEn };
}

export type VpdEquipmentItem = {
  id: string;
  nameTh: string;
  nameEn: string;
  roleTh: string;
  roleEn: string;
  keyword: string;
};

/** Gear commonly used to monitor and tune grow-room VPD. */
export const VPD_EQUIPMENT: VpdEquipmentItem[] = [
  {
    id: "sensor",
    nameTh: "เซ็นเซอร์อุณหภูมิ + ความชื้น",
    nameEn: "Temp + humidity sensor",
    roleTh: "วัด RH / อุณหภูมิในห้องปลูก — ต้องมีก่อนปรับ VPD",
    roleEn: "Monitor room RH and temp — baseline before tuning VPD",
    keyword: "thermometer hygrometer grow tent",
  },
  {
    id: "dehumidifier",
    nameTh: "เครื่องลดความชื้น",
    nameEn: "Dehumidifier",
    roleTh: "ใช้เมื่อ RH สูง / VPD ต่ำเกิน",
    roleEn: "Use when RH is high / VPD too low",
    keyword: "dehumidifier grow room",
  },
  {
    id: "humidifier",
    nameTh: "เครื่องเพิ่มความชื้น",
    nameEn: "Humidifier",
    roleTh: "ใช้เมื่อ RH ต่ำ / VPD สูงเกิน",
    roleEn: "Use when RH is low / VPD too high",
    keyword: "humidifier grow tent",
  },
  {
    id: "fan",
    nameTh: "พัดลมดูด–เป่า (Inline / Exhaust)",
    nameEn: "Inline / exhaust fan",
    roleTh: "ระบายอากาศ · ช่วยลด RH และกระจายความชื้น",
    roleEn: "Air exchange · helps lower RH and even humidity",
    keyword: "inline fan grow tent exhaust",
  },
  {
    id: "controller",
    nameTh: "Controller ความชื้น / อุณหภูมิ",
    nameEn: "Humidity / temp controller",
    roleTh: "เปิด–ปิด humidifier / dehumidifier อัตโนมัติ",
    roleEn: "Auto on/off for humidifier or dehumidifier",
    keyword: "humidity controller thermostat grow",
  },
];
