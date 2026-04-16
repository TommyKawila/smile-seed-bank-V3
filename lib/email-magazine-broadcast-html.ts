import { resolvePublicAssetUrl } from "@/lib/public-storage-url";

export type MagazineEmailTemplateId = "research" | "field_notes";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmail(inner: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 2px 20px rgba(0,0,0,0.06)">
${inner}
<tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:16px 24px;text-align:center">
<p style="margin:0;color:#71717a;font-size:11px;line-height:1.5">Smile Seed Bank · Precision cultivation guides</p>
<p style="margin:6px 0 0;color:#a1a1aa;font-size:10px">© ${year}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildMagazineResearchEmailHtml(opts: {
  title: string;
  excerpt: string | null;
  articleUrl: string;
  imageUrl: string | null;
}): string {
  const badge = "Research Paper";
  const lead =
    opts.excerpt?.trim() ||
    "A new article is available on Smile Seed Blog.";
  const img =
    opts.imageUrl != null
      ? `<tr><td style="padding:0 0 20px"><img src="${esc(opts.imageUrl)}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:0" /></td></tr>`
      : "";
  const inner = `
<tr><td style="background:linear-gradient(135deg,#14532d 0%,#166534 55%,#15803d 100%);padding:28px 24px 22px;text-align:center">
<p style="margin:0 0 10px;color:#bbf7d0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${esc(badge)}</p>
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.35;letter-spacing:-0.3px">${esc(opts.title)}</h1>
</td></tr>
${img}
<tr><td style="padding:28px 24px 8px">
<p style="margin:0 0 22px;color:#3f3f46;font-size:15px;line-height:1.65">${esc(lead)}</p>
<div style="text-align:center;margin-bottom:8px">
<a href="${esc(opts.articleUrl)}" style="display:inline-block;background:#15803d;color:#ffffff;padding:13px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none">Read article</a>
</div>
<p style="margin:16px 0 0;text-align:center;color:#a1a1aa;font-size:12px">Editorial · evidence-led growing</p>
</td></tr>`;
  return wrapEmail(inner);
}

export function buildMagazineFieldNotesEmailHtml(opts: {
  title: string;
  excerpt: string | null;
  articleUrl: string;
  imageUrl: string | null;
  creatorUrl: string;
  highlights: [string, string, string];
}): string {
  const badge = "Field Notes";
  const intro =
    opts.excerpt?.trim() ||
    "Curated takeaways from a creator source — distilled for growers.";
  const img =
    opts.imageUrl != null
      ? `<tr><td style="padding:0 0 18px"><img src="${esc(opts.imageUrl)}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:0" /></td></tr>`
      : "";
  const bullets = opts.highlights
    .map(
      (b) =>
        `<tr><td style="padding:6px 0 6px 0;color:#3f3f46;font-size:14px;line-height:1.55"><span style="color:#15803d;font-weight:700;margin-right:8px">·</span>${esc(b)}</td></tr>`
    )
    .join("");
  const inner = `
<tr><td style="background:linear-gradient(135deg,#1c1917 0%,#292524 100%);padding:26px 24px 20px;text-align:center">
<p style="margin:0 0 10px;color:#a8a29e;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${esc(badge)}</p>
<h1 style="margin:0;color:#fafaf9;font-size:21px;font-weight:700;line-height:1.35;letter-spacing:-0.3px">${esc(opts.title)}</h1>
<p style="margin:12px 0 0;color:#a8a29e;font-size:12px">YouTube / story summary</p>
</td></tr>
${img}
<tr><td style="padding:26px 24px 6px">
<p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.65">${esc(intro)}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
${bullets}
</table>
<div style="margin-bottom:20px;text-align:center">
<a href="${esc(opts.creatorUrl)}" style="color:#15803d;font-size:13px;font-weight:600;text-decoration:underline">Original creator link</a>
</div>
<div style="text-align:center">
<a href="${esc(opts.articleUrl)}" style="display:inline-block;background:#15803d;color:#ffffff;padding:12px 26px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none">Read full summary</a>
</div>
<p style="margin:18px 0 0;text-align:center;color:#a1a1aa;font-size:11px;line-height:1.5">Summary for education. Source attribution above.</p>
</td></tr>`;
  return wrapEmail(inner);
}

export function resolveMagazineEmailImageUrl(
  featuredImage: string | null | undefined
): string | null {
  return resolvePublicAssetUrl(featuredImage);
}
