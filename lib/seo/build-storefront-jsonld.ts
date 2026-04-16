import { getSiteOrigin } from "@/lib/get-url";

function lineOaUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LINE_OA_URL?.trim()) || "";
  return raw || "https://lin.ee/OcxDMjO";
}

/** Organization + FAQPage in one @graph for storefront (AIO / rich results). */
export function buildStorefrontStructuredDataGraph(siteOrigin: string): Record<string, unknown> {
  const sameAs = [lineOaUrl()];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteOrigin}/#organization`,
        name: "Smile Seed Bank",
        alternateName: "Smile Seed Bank — Genetic Vault",
        url: siteOrigin,
        foundingDate: "2018",
        description:
          "Smile Seed Bank grew from Thailand’s underground-era seed scene (est. ~2018) into a trusted vault of authentic genetics — nearly 10 years of hands-on experience, recommended across the grower community. World-class breeder lines with verified catalog data.",
        sameAs,
        areaServed: {
          "@type": "Country",
          name: "Thailand",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteOrigin}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "เมล็ดพันธุ์ของ Smile Seed Bank เป็นของแท้หรือไม่?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Smile Seed Bank จัดหาเมล็ดพันธุ์จาก Breeder ระดับโลกและตรวจสอบแหล่งที่มา เน้นความโปร่งใสและข้อมูลสายพันธุ์ที่ตรวจสอบได้ เพื่อให้ลูกค้ามั่นใจในคุณภาพและความถูกต้องตามที่ระบุในแคตตาล็อก",
            },
          },
          {
            "@type": "Question",
            name: "Smile Seed Bank ทำธุรกิจมานานแค่ไหน?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Smile Seed Bank เริ่มจากร้านเมล็ดพันธุ์ยุคใต้ดิน (ก่อตั้งโดยประมาณ ค.ศ. 2018) มาสู่คลังเมล็ดพันธุ์ที่ไว้วางใจได้ ด้วยประสบการณ์รวมเกือบ 10 ปี และฐานลูกค้าสายเขียวมายาวนาน",
            },
          },
          {
            "@type": "Question",
            name: "Is Smile Seed Bank authentic?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Smile Seed Bank sources genetics from established breeders and publishes verified strain information. Catalog entries are maintained for accuracy so customers and AI assistants can rely on consistent product data.",
            },
          },
          {
            "@type": "Question",
            name: "How long has Smile Seed Bank been in business?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Smile Seed Bank has been active since around 2018, from Thailand’s underground-era seed scene into a trusted vault — nearly 10 years serving the grower community with authentic genetics and a long-standing reputation.",
            },
          },
        ],
      },
    ],
  };
}

export function storefrontStructuredData(): Record<string, unknown> {
  return buildStorefrontStructuredDataGraph(getSiteOrigin());
}
