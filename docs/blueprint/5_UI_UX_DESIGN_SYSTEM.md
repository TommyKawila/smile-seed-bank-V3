# UI/UX & Design System (V4 Cyber-Organic)

**Source of truth** for storefront Tailwind semantic tokens and component governance.

| Meta | Value |
|------|-------|
| Version | **V4 Cyber-Organic** |
| Scope | **Storefront only** — `app/(storefront)/*`, `/line/entry` |
| Admin | **Light UI (legacy)** — out of V4 scope; see `1_PRD_PROJECT_OVERVIEW.md` |
| Audience | Home Grown growers · Thailand · TH/EN |

Full A11Y checklist: `7_A11Y_CHECKLIST.md` · Perf locks: `6_PERF_BUDGETS.md`

---

## 1. Global Design Tokens

### 1.1 Core palette (storefront)

Implement via `app/globals.css` `:root` + `tailwind.config.ts` semantic keys — **not** scattered hex in components.

```css
/* Doc lock — implement in globals.css on migration */
--background: 222 47% 4%;           /* slate-950 */
--foreground: 0 0% 98%;
--primary: 160 84% 45%;            /* emerald-500 — CTA fill */
--primary-foreground: 222 47% 4%;
--card: 222 47% 11%;               /* glass surface base */
--card-foreground: 0 0% 98%;
--muted: 217 33% 17%;
--muted-foreground: 215 20% 65%;
--border: 217 33% 17%;              /* ≈ slate-800 — use as border-surface */
--ring: 160 84% 45%;
--radius: 0.75rem;
```

| Role | Token / utility | Notes |
|------|-----------------|-------|
| Page background | `bg-background` / slate-950 | Smart-farm / lab sci-fi dark |
| Primary accent | emerald-400 (highlights) · emerald-500 (CTA) | Organic leaf + cyber feel |
| Glass surfaces | `bg-slate-900/40` + `border-border` + `backdrop-blur-md` | Cards, dock, modals only |
| H1 display | `bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent` | Hero / section titles |
| Typography | **Prompt** + **Noto Sans Thai** | Unchanged from V3 |

**Rules:**
- Use semantic tokens (`primary`, `background`, `card`, `muted-foreground`) — no raw hex in new components.
- **`border-slate-850` does not exist** — use `border-border` or token `--border` (≈ slate-800).
- **`backdrop-blur-md` forbidden on LCP/hero path** — cards + AI dock only (PSI guardrail).

### 1.2 Genetic bars (V4 remap)

| Strain | V3 | V4 |
|--------|----|----|
| Sativa | Electric Mint glow | **Emerald glow** on dark track |
| Indica | Lavender glow | **Violet / slate glow** on dark track |

Reference: `components/storefront/ProductSpecs.tsx` — update on code migration.

---

## 2. Core Layout — Homepage Grid (Home Grown first)

**Order (mandatory):** Hero (SSR LCP) → **AI Quick Tools Dock** → categories → breeders → commerce → content → newsletter/footer.

```
Hero → AI Quick Tools Dock → Find Your Grow Style → Breeder Showcase
     → Clearance / Featured → Blog / Trust → Newsletter → Footer
```

Section key: `ai_quick_tools_dock` — first below-fold block after hero (`home-stream.tsx` / `HomePageBelowFold.tsx`).

### AI Quick Tools Dock

| Tool | TH | EN | Route (placeholder) |
|------|----|----|---------------------|
| Soil Mixer | ผสมดิน | Soil Mixer | `/tools/soil-mixer` |
| VPD Calculator | คำนวณ VPD | VPD Calculator | `/tools/vpd-calculator` |
| Fertilizer | ปุ๋ย | Fertilizer | `/tools/fertilizer` |
| Plant Doctor | หมอพืช | Plant Doctor | `/tools/plant-doctor` |

- Layout: horizontal scroll dock · glass pills · emerald icon accent
- Touch: **48×48px min** per tool · **≥8px** gap (`7_A11Y_CHECKLIST.md`)
- Target component: `components/storefront/AiQuickToolsDock.tsx` (implement phase)

---

## 3. Component Governance

### 3.1 Call-to-action (CTA)

| Type | Spec |
|------|------|
| Primary | `bg-emerald-500 hover:bg-emerald-400` · `text-primary-foreground` · `min-h-12` · `rounded-lg` |
| Secondary | ghost / outline on glass slate surface |
| Focus | `focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| Touch | **min 48×48px** · stacked gap **≥8px** |

### 3.2 Cards & commerce

- Product cards: glass surface · **one primary link** per card (stretched-link)
- Skeletons: `bg-slate-800/50 animate-pulse` on dark backgrounds
- Hero: `next/image` + `priority={true}` on **single** LCP candidate · `ssb_vp` SSR side

### 3.3 Performance UX (unchanged)

- Skeleton loaders for every dynamic data block
- CLS: aspect ratio on all image containers
- Non-critical fetch: `withTimeout` 2s + empty/skeleton fallback

---

## 4. Brand Attribution (Footer — mandatory)

Every storefront footer **must** display (TH, verbatim):

> ทำรูปประกอบและค้นหาข้อมูลโดย: ผู้ช่วย Gemini, เรียบเรียงโดย: ทอมมี่ สไมล์ซี้ด

- Placement: bottom bar near copyright
- Style: mono caption · `text-muted-foreground` on dark footer
- Do not hide, abbreviate, or omit

---

## 5. Accessibility tokens (V4)

See `7_A11Y_CHECKLIST.md` for full gate.

- Touch: min **48×48px** · gap **≥8px**
- Cards: **one primary link** per card
- Focus: `focus-visible:ring-2 ring-offset-2` on all controls
- Forms: label + `id` · submit **`min-h-12`**
- Dark contrast: body `text-slate-200+` on slate-950 · CTA emerald-500 meets WCAG AA for large text

---

## 6. V3 → V4 migration (reference)

| V3 Eco-Clinical | V4 Cyber-Organic |
|-----------------|------------------|
| White background | slate-950 / `--background` |
| Teal primary (`162 70% 22%`) | Emerald primary (`160 84% 45%`) |
| Lavender secondary (Indica UI) | Violet / slate Indica glow only |
| Light product cards | Glass `bg-slate-900/40` + blur |
| Admin + storefront light | **Storefront dark only** · Admin stays light |

Code migration (out of doc scope): `globals.css`, `tailwind.config.ts`, storefront components — PSI retest before updating `6_PERF_BUDGETS.md`.
