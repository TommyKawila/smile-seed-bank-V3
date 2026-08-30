import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { getWatermarkLogoBuffer, WATERMARK_OPACITY } from "@/lib/watermark";

const SAMPLE_TEXT = "Smile Seed Bank · SAMPLE";

export async function applyPdfWatermark(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoBuf = await getWatermarkLogoBuffer();
  const embeddedLogo = logoBuf
    ? await pdfDoc.embedPng(
        await sharp(logoBuf)
          .resize({ width: 220, fit: "inside", withoutEnlargement: true })
          .ensureAlpha()
          .png()
          .toBuffer()
      )
    : null;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    if (embeddedLogo) {
      const maxW = width * 0.28;
      const maxH = height * 0.2;
      const scale = Math.min(maxW / embeddedLogo.width, maxH / embeddedLogo.height);
      const logoW = embeddedLogo.width * scale;
      const logoH = embeddedLogo.height * scale;
      page.drawImage(embeddedLogo, {
        x: (width - logoW) / 2,
        y: height / 2 - logoH / 2 + height * 0.06,
        width: logoW,
        height: logoH,
        opacity: WATERMARK_OPACITY * 0.45,
      });
    }

    const fontSize = Math.max(14, Math.min(width, height) * 0.038);
    const textWidth = font.widthOfTextAtSize(SAMPLE_TEXT, fontSize);
    page.drawText(SAMPLE_TEXT, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0.15, 0.15, 0.15),
      opacity: 0.32,
      rotate: degrees(-35),
    });
  }

  return Buffer.from(await pdfDoc.save());
}
