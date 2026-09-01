"use client";

import type { GfClaimStepId, GfSeedClaimFormData } from "@/lib/gf-seed-claim-form";
import {
  GF_ADDITIVES,
  GF_DECAY_SIGNS,
  GF_EXPERIENCE,
  GF_GROWING_MEDIUM,
  GF_LOCATION,
  GF_METHOD_USED,
  GF_MOISTENED_OFTEN,
  GF_MOISTURE_COVER,
  GF_MOISTURE_TRANSFER,
  GF_PLANTING_DEPTH,
  GF_RADICLE_DAMAGED,
  GF_RADICLE_POSITION,
  GF_RESULT,
  GF_ROOT_LENGTH,
  GF_TIME_TO_ROOT,
  GF_TRANSFER_METHOD,
  GF_WATER_TYPE,
  GF_YES_NO,
  GF_YES_NO_UNSURE,
} from "@/lib/gf-seed-claim-form";
import { ClaimEvidenceUpload } from "./ClaimEvidenceUpload";
import {
  ClaimCheckboxGroup,
  ClaimConfirmCheckbox,
  ClaimField,
  ClaimRadioGroup,
  ClaimTextarea,
  ClaimTextInput,
} from "./ClaimFormPrimitives";

type Props = {
  step: GfClaimStepId;
  data: GfSeedClaimFormData;
  set: <K extends keyof GfSeedClaimFormData>(key: K, value: GfSeedClaimFormData[K]) => void;
  t: (th: string, en: string) => string;
  fieldError: string | null;
};

export function ClaimStepContent({ step, data, set, t, fieldError }: Props) {
  const err = (key: string) => (fieldError === key ? true : undefined);

  switch (step) {
    case "intro":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>{t("เมล็ดเป็นวัสดุชีวภาพ — ผลขึ้นกับล็อต วิธีแช่ น้ำ อุณหภูมิ ระยะงอก และการย้ายวัสดุ", "Seeds are biological material — outcomes depend on lot, soaking method, water, temperature, germination period, and transfer.")}</p>
          <p>{t("ต้องมีรูปยืนยันการซื้อ เลขล็อต และสภาพเมล็ด", "Purchase proof, lot number, and seed condition photos are required.")}</p>
          <p>{t("ส่งฟอร์มไม่เท่ากับอนุมัติอัตโนมัติ", "Submitting this form does not guarantee automatic approval.")}</p>
          <p>{t("ขาดบรรจุภัณฑ์/ล็อต/รูปอาจทำให้ตรวจไม่ได้", "Missing packaging, lot, or photos may prevent review.")}</p>
          <p className="font-medium text-amber-900">{t("ไม่รับเคลมเมล็ดฟรีหรือโบนัส", "Free or bonus seeds are not eligible for claims.")}</p>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-4">
          <ClaimField label={t("ชื่อหรือชื่อเล่น", "How should we address you?")} required error={err("nameOrNickname")}>
            <ClaimTextInput value={data.nameOrNickname} onChange={(v) => set("nameOrNickname", v)} />
          </ClaimField>
          <ClaimField label={t("อีเมล", "Email")} required error={err("email")}>
            <ClaimTextInput type="email" value={data.email} onChange={(v) => set("email", v)} />
          </ClaimField>
          <ClaimField label={t("โทร / WhatsApp / Telegram", "Phone / WhatsApp / Telegram")} required error={err("phoneOrMessenger")}>
            <ClaimTextInput value={data.phoneOrMessenger} onChange={(v) => set("phoneOrMessenger", v)} />
          </ClaimField>
        </div>
      );

    case "purchase":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ClaimField label={t("วันที่ซื้อ", "Purchase date")} required error={err("purchaseDate")}>
              <ClaimTextInput type="date" value={data.purchaseDate} onChange={(v) => set("purchaseDate", v)} />
            </ClaimField>
            <ClaimField label={t("วันที่ส่งเคลม", "Claim submission date")} required error={err("claimSubmissionDate")}>
              <ClaimTextInput type="date" value={data.claimSubmissionDate} onChange={(v) => set("claimSubmissionDate", v)} />
            </ClaimField>
            <ClaimField label={t("Invoice / Receipt", "Invoice / Receipt")}>
              <ClaimTextInput value={data.orderNumber} onChange={(v) => set("orderNumber", v)} />
            </ClaimField>
            <ClaimField label={t("ชื่อพันธุ์", "Strain name")}>
              <ClaimTextInput value={data.strainName} onChange={(v) => set("strainName", v)} placeholder="AF99" />
            </ClaimField>
            <ClaimField label={t("เลขล็อต (ดูหลังซอง)", "Lot number (see back of package)")} required error={err("lotNumber")}>
              <ClaimTextInput value={data.lotNumber} onChange={(v) => set("lotNumber", v)} placeholder="GF-AF99-2606-B01" />
            </ClaimField>
            <ClaimField label={t("วันที่เปิดซอง (Smile)", "Date pouch opened (Smile)")}>
              <ClaimTextInput type="date" value={data.openedDate} onChange={(v) => set("openedDate", v)} />
            </ClaimField>
          </div>
          <ClaimField label={t("บันทึกการเก็บรักษา (Smile)", "Storage log notes (Smile)")}>
            <ClaimTextarea value={data.storageLogNotes} onChange={(v) => set("storageLogNotes", v)} />
          </ClaimField>
        </div>
      );

    case "method":
      return (
        <div className="space-y-5">
          <ClaimField label={t("วิธีเพาะที่ใช้", "Germination method used")} required error={err("methodUsed")}>
            <ClaimCheckboxGroup options={GF_METHOD_USED} values={data.methodUsed} onChange={(v) => set("methodUsed", v)} t={t} otherValue={data.methodUsedOther} onOtherChange={(v) => set("methodUsedOther", v)} />
          </ClaimField>
          <ClaimField label={t("ขั้นตอนโดยละเอียด", "Process step by step")} required error={err("processStepByStep")}>
            <ClaimTextarea rows={4} value={data.processStepByStep} onChange={(v) => set("processStepByStep", v)} placeholder={t("ระยะแช่ ลำดับขั้น วันที่ย้าย ความถี่ที่ทำให้ชื้น", "Soak duration, steps, transfer dates, misting frequency")} />
          </ClaimField>
          <ClaimField label={t("ประเภทน้ำ", "Water type")} required error={err("waterType")}>
            <ClaimCheckboxGroup options={GF_WATER_TYPE} values={data.waterType} onChange={(v) => set("waterType", v)} t={t} otherValue={data.waterTypeOther} onOtherChange={(v) => set("waterTypeOther", v)} />
          </ClaimField>
          <ClaimField label={t("ระยะเวลาแช่", "Soak duration")} required error={err("soakDuration")}>
            <ClaimTextInput value={data.soakDuration} onChange={(v) => set("soakDuration", v)} />
          </ClaimField>
          <ClaimField label={t("สถานที่เพาะ", "Location")} required error={err("location")}>
            <ClaimRadioGroup name="location" options={GF_LOCATION} value={data.location} onChange={(v) => set("location", v)} t={t} otherValue={data.locationOther} onOtherChange={(v) => set("locationOther", v)} />
          </ClaimField>
          <ClaimField label={t("ผู้ดำเนินการ", "Carried out by")} required error={err("carriedOutBy")}>
            <ClaimTextInput value={data.carriedOutBy} onChange={(v) => set("carriedOutBy", v)} />
          </ClaimField>
          <ClaimField label={t("ระดับประสบการณ์", "Experience level")} required error={err("experienceLevel")}>
            <ClaimRadioGroup name="experienceLevel" options={GF_EXPERIENCE} value={data.experienceLevel} onChange={(v) => set("experienceLevel", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("เคยเพาะพันธุ์นี้มาก่อน?", "Previously germinated this strain?")} required error={err("previouslyGerminated")}>
            <ClaimRadioGroup name="previouslyGerminated" options={GF_YES_NO_UNSURE} value={data.previouslyGerminated} onChange={(v) => set("previouslyGerminated", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("ใช้วิธีเดียวกับทุกเมล็ด?", "Same method for all seeds?")} required error={err("sameMethodAllSeeds")}>
            <ClaimRadioGroup name="sameMethodAllSeeds" options={GF_YES_NO_UNSURE} value={data.sameMethodAllSeeds} onChange={(v) => set("sameMethodAllSeeds", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("แยกวิธีและจำนวนเมล็ด (ถ้ามี)", "Methods breakdown (optional)")}>
            <ClaimTextarea value={data.methodsBreakdown} onChange={(v) => set("methodsBreakdown", v)} />
          </ClaimField>
          <ClaimField label={t("สารเติม", "Additives")} required error={err("additives")}>
            <ClaimCheckboxGroup options={GF_ADDITIVES} values={data.additives} onChange={(v) => set("additives", v)} t={t} otherValue={data.additivesOther} onOtherChange={(v) => set("additivesOther", v)} />
          </ClaimField>
          <ClaimField label={t("อุณหภูมิเพาะ (°C)", "Germination temperature (°C)")} required error={err("germinationTempC")}>
            <ClaimTextInput value={data.germinationTempC} onChange={(v) => set("germinationTempC", v)} />
          </ClaimField>
          <ClaimField label={t("มีอย่างน้อยหนึ่งเมล็ดงอกราก?", "At least one seed developed a root?")} required error={err("atLeastOneRoot")}>
            <ClaimRadioGroup name="atLeastOneRoot" options={GF_YES_NO} value={data.atLeastOneRoot} onChange={(v) => set("atLeastOneRoot", v)} t={t} />
          </ClaimField>
        </div>
      );

    case "results":
      return (
        <div className="space-y-4">
          <ClaimField label={t("ผลการงอก", "Germination result")} required error={err("result")}>
            <ClaimCheckboxGroup options={GF_RESULT} values={data.result} onChange={(v) => set("result", v)} t={t} otherValue={data.resultOther} onOtherChange={(v) => set("resultOther", v)} />
          </ClaimField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ClaimField label={t("จำนวนเมล็ดที่ใช้เพาะ", "Seeds used for germination")}>
              <ClaimTextInput value={data.seedsUsedForGermination} onChange={(v) => set("seedsUsedForGermination", v)} />
            </ClaimField>
            <ClaimField label={t("เมล็ดที่งอกราก", "Seeds that developed a root")} required error={err("seedsDevelopedRoot")}>
              <ClaimTextInput value={data.seedsDevelopedRoot} onChange={(v) => set("seedsDevelopedRoot", v)} placeholder="0" />
            </ClaimField>
            <ClaimField label={t("เมล็ดที่ไม่ได้ใช้", "Unused seeds")} required error={err("seedsUnused")}>
              <ClaimTextInput value={data.seedsUnused} onChange={(v) => set("seedsUnused", v)} />
            </ClaimField>
            <ClaimField label={t("เมล็ดที่บวม", "Seeds that swelled")} required error={err("seedsSwelled")}>
              <ClaimTextInput value={data.seedsSwelled} onChange={(v) => set("seedsSwelled", v)} placeholder={t("0 หรือ Unable to determine", "0 or Unable to determine")} />
            </ClaimField>
            <ClaimField label={t("วันที่รากแรกปรากฏ", "First radicle date")} required error={err("firstRadicleDate")}>
              <ClaimTextInput type="date" value={data.firstRadicleDate} onChange={(v) => set("firstRadicleDate", v)} />
            </ClaimField>
            <ClaimField label={t("เวลารากแรกปรากฏ", "First radicle time")} required error={err("firstRadicleTime")}>
              <ClaimTextInput type="time" value={data.firstRadicleTime} onChange={(v) => set("firstRadicleTime", v)} />
            </ClaimField>
            <ClaimField label={t("เมล็ดที่ไม่งอกราก", "Seeds that failed to root")} required error={err("seedsFailedRoot")}>
              <ClaimTextInput value={data.seedsFailedRoot} onChange={(v) => set("seedsFailedRoot", v)} />
            </ClaimField>
          </div>
          <ClaimField label={t("เวลาจนรากแรกปรากฏ", "Time to first root")} required error={err("timeToFirstRoot")}>
            <ClaimRadioGroup name="timeToFirstRoot" options={GF_TIME_TO_ROOT} value={data.timeToFirstRoot} onChange={(v) => set("timeToFirstRoot", v)} t={t} />
          </ClaimField>
        </div>
      );

    case "transfer":
      return (
        <div className="space-y-4">
          <ClaimField label={t("ความยาวรากตอนย้าย", "Root length at transfer")} required error={err("rootLengthAtTransfer")}>
            <ClaimCheckboxGroup options={GF_ROOT_LENGTH} values={data.rootLengthAtTransfer} onChange={(v) => set("rootLengthAtTransfer", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("วิธีย้าย", "Transfer method")}>
            <ClaimRadioGroup name="transferMethod" options={GF_TRANSFER_METHOD} value={data.transferMethod} onChange={(v) => set("transferMethod", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("วัสดุปลูก", "Growing medium")} required error={err("growingMedium")}>
            <ClaimCheckboxGroup options={GF_GROWING_MEDIUM} values={data.growingMedium} onChange={(v) => set("growingMedium", v)} t={t} otherValue={data.growingMediumOther} onOtherChange={(v) => set("growingMediumOther", v)} />
          </ClaimField>
          <ClaimField label={t("เตรียมวัสดุปลูกแล้ว?", "Medium prepared?")} required error={err("mediumPrepared")}>
            <ClaimRadioGroup name="mediumPrepared" options={GF_YES_NO_UNSURE} value={data.mediumPrepared} onChange={(v) => set("mediumPrepared", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("ความชื้นตอนย้าย", "Moisture at transfer")} required error={err("moistureAtTransfer")}>
            <ClaimRadioGroup name="moistureAtTransfer" options={GF_MOISTURE_TRANSFER} value={data.moistureAtTransfer} onChange={(v) => set("moistureAtTransfer", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("pH / EC (ถ้ามี)", "pH / EC (optional)")}>
            <ClaimTextInput value={data.phEc} onChange={(v) => set("phEc", v)} placeholder="pH 5.8; EC 0.4 mS/cm" />
          </ClaimField>
          <ClaimField label={t("ความลึกการปลูก", "Planting depth")} required error={err("plantingDepth")}>
            <ClaimRadioGroup name="plantingDepth" options={GF_PLANTING_DEPTH} value={data.plantingDepth} onChange={(v) => set("plantingDepth", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("ทิศทางราก", "Radicle position")} required error={err("radiclePosition")}>
            <ClaimRadioGroup name="radiclePosition" options={GF_RADICLE_POSITION} value={data.radiclePosition} onChange={(v) => set("radiclePosition", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("รากเสียหาย?", "Radicle damaged?")} required error={err("radicleDamaged")}>
            <ClaimRadioGroup name="radicleDamaged" options={GF_RADICLE_DAMAGED} value={data.radicleDamaged} onChange={(v) => set("radicleDamaged", v)} t={t} />
          </ClaimField>
          <ClaimField label={t("สัญญาณเน่าเสีย", "Signs of decay")} required error={err("decaySigns")}>
            <ClaimCheckboxGroup options={GF_DECAY_SIGNS} values={data.decaySigns} onChange={(v) => set("decaySigns", v)} t={t} otherValue={data.decaySignsOther} onOtherChange={(v) => set("decaySignsOther", v)} />
          </ClaimField>
        </div>
      );

    case "after":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ClaimField label={t("อุณหภูมิอากาศหลังย้าย (°C)", "Air temperature after transfer (°C)")}>
              <ClaimTextInput value={data.airTempAfterC} onChange={(v) => set("airTempAfterC", v)} />
            </ClaimField>
            <ClaimField label={t("ความชื้นสัมพัทธ์ (%)", "Relative humidity (%)")}>
              <ClaimTextInput value={data.rhAfter} onChange={(v) => set("rhAfter", v)} />
            </ClaimField>
          </div>
          <ClaimField label={t("ฝาครอบความชื้น", "Moisture cover")}>
            <ClaimRadioGroup name="moistureCover" options={GF_MOISTURE_COVER} value={data.moistureCover} onChange={(v) => set("moistureCover", v)} t={t} otherValue={data.moistureCoverOther} onOtherChange={(v) => set("moistureCoverOther", v)} />
          </ClaimField>
          <ClaimField label={t("ความถี่ในการชุบน้ำ", "How often moistened")} required error={err("moistenedHowOften")}>
            <ClaimRadioGroup name="moistenedHowOften" options={GF_MOISTENED_OFTEN} value={data.moistenedHowOften} onChange={(v) => set("moistenedHowOften", v)} t={t} otherValue={data.moistenedHowOftenOther} onOtherChange={(v) => set("moistenedHowOftenOther", v)} />
          </ClaimField>
        </div>
      );

    case "evidence":
      return (
        <div className="space-y-5">
          <ClaimEvidenceUpload
            label={t("รูปบรรจุภัณฑ์และเลขล็อต", "Packaging and lot photos")}
            required
            category="packaging"
            claimSessionId={data.claimSessionId}
            files={data.packagingAndLotPhotos}
            onChange={(v) => set("packagingAndLotPhotos", v)}
            t={t}
            error={err("packagingAndLotPhotos")}
          />
          <ClaimField label={t("บันทึกวิดีโอ/รูปรากแรกปรากฏ?", "First radicle emergence recorded?")} required error={err("radicleFirstEmergedRecorded")}>
            <ClaimRadioGroup name="radicleFirstEmergedRecorded" options={GF_YES_NO} value={data.radicleFirstEmergedRecorded} onChange={(v) => set("radicleFirstEmergedRecorded", v)} t={t} />
          </ClaimField>
          <ClaimEvidenceUpload
            label={t("รูปเมล็ดที่เคลม", "Photos of claimed seeds")}
            required
            category="claimedSeeds"
            claimSessionId={data.claimSessionId}
            files={data.claimedSeedsPhotos}
            onChange={(v) => set("claimedSeedsPhotos", v)}
            t={t}
            error={err("claimedSeedsPhotos")}
          />
          <ClaimEvidenceUpload
            label={t("รูป/วิดีโอขั้นตอน", "Process photos / videos")}
            required
            category="process"
            claimSessionId={data.claimSessionId}
            files={data.processPhotosVideos}
            onChange={(v) => set("processPhotosVideos", v)}
            t={t}
            error={err("processPhotosVideos")}
          />
          <ClaimField label={t("ลิงก์ Drive/Dropbox เพิ่มเติม", "Extra media link (optional)")}>
            <ClaimTextInput value={data.extraMediaUrl} onChange={(v) => set("extraMediaUrl", v)} placeholder="https://" />
          </ClaimField>
        </div>
      );

    case "confirm":
      return (
        <div className="space-y-4">
          <ClaimConfirmCheckbox
            checked={data.confirmAccurate}
            onChange={(v) => set("confirmAccurate", v)}
            label={t("ข้อมูลที่ให้ถูกต้องและครบถ้วน", "The information provided is accurate and complete")}
          />
          <ClaimConfirmCheckbox
            checked={data.confirmPhotosMatch}
            onChange={(v) => set("confirmPhotosMatch", v)}
            label={t("รูป/วิดีโอเป็นของออเดอร์และเมล็ดนี้", "Photos/videos belong to this order and these seeds")}
          />
          <ClaimConfirmCheckbox
            checked={data.confirmNoAutoCompensation}
            onChange={(v) => set("confirmNoAutoCompensation", v)}
            label={t("ส่งฟอร์มไม่การันตีชดเชยอัตโนมัติ", "Submitting does not guarantee automatic compensation")}
          />
          <ClaimConfirmCheckbox
            checked={data.confirmDataProcessing}
            onChange={(v) => set("confirmDataProcessing", v)}
            label={t("ยินยอมให้ประมวลผลข้อมูลเพื่อตรวจเคลม", "I consent to processing my data for claim review")}
          />
        </div>
      );

    default:
      return null;
  }
}

const STEP_TITLES: Record<GfClaimStepId, { th: string; en: string }> = {
  intro: { th: "คำแนะนำ", en: "Introduction" },
  contact: { th: "ข้อมูลติดต่อ", en: "Contact details" },
  purchase: { th: "ข้อมูลการซื้อ", en: "Purchase information" },
  method: { th: "วิธีและเงื่อนไขการเพาะ", en: "Germination method & conditions" },
  results: { th: "ผลการงอก", en: "Germination results" },
  transfer: { th: "การย้ายลงวัสดุปลูก", en: "Transfer to growing medium" },
  after: { th: "เงื่อนไขหลังย้าย", en: "Conditions after transfer" },
  evidence: { th: "หลักฐานประกอบ", en: "Supporting materials" },
  confirm: { th: "ยืนยันและส่ง", en: "Confirmation" },
};

export function claimStepTitle(step: GfClaimStepId, t: (th: string, en: string) => string): string {
  const row = STEP_TITLES[step];
  return t(row.th, row.en);
}
