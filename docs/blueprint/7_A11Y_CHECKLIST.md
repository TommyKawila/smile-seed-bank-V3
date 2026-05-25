# Accessibility Checklist (Blueprint V3.2)

Design and ship accessible UI **before** PSI — not as a post-launch patch.

Target: **≥95** Lighthouse Accessibility (current lock: **100** on `/`).

---

## Touch targets (WCAG 2.5.8)

- Minimum **48×48px** for buttons, inputs, icon controls, pill tabs.
- Spacing between stacked targets: **≥8px** (newsletter row uses **gap-5 / 20px**).
- Submit buttons: **`min-h-12`** on forms (newsletter, checkout).

---

## Links & cards

- **One primary link per card** — use stretched-link pattern (`::after` overlay or single `<Link>` wrapper).
- Decorative hero/thumbnail on card: `alt=""` + **`aria-hidden="true"`** when CTA is a separate visible control.
- No **2+ links** to the same URL in one card (insights, blog grid, product tiles).
- External links: `rel="noopener noreferrer"` + visible or sr-only hint when needed.

---

## Focus & keyboard

- All interactive elements: visible **`focus-visible`** ring (2px outline, 2px offset).
- Modals/drawers: trap focus · Esc closes · restore focus to trigger.
- Carousels: prev/next buttons with **`aria-label`** · slide indicators if autoplay.

---

## Forms

- Every input has `<Label htmlFor="…">` or **`sr-only`** label with matching `id`.
- Error text linked via `aria-describedby` / `aria-invalid`.
- Required fields marked in label or `aria-required`.

---

## Images & media

- LCP/hero: meaningful `alt` on content images; decorative slides use empty alt.
- Icons-only buttons: **`aria-label`** (cart, search, menu, language switch).
- Autoplay carousel: respect **`prefers-reduced-motion`** where implemented.

---

## Color & contrast

- Body text on white: zinc-700+ · primary buttons on teal meet contrast for large text.
- Sale/error states: do not rely on color alone — add text or icon.
- Use design tokens (`primary`, `muted-foreground`) — avoid low-contrast gray on lavender.

---

## Language & i18n

- `<html lang="th">` or `en` per locale route/layout.
- Language switcher exposes current language to AT.
- Bilingual content: one visible language per render — no duplicate headings in DOM.

---

## Storefront components (reference implementations)

| Component | Pattern |
|-----------|---------|
| `HomeNewsletterSection` | 48px targets · gap-5 |
| `HomeInsightSection` / insight cards | single stretched link |
| `Navbar` | labeled icon buttons · mobile menu focus trap |
| Product cards | one link to PDP · sale badge as text |

---

## PR gate

Before merge on UI PR:

- [ ] No duplicate same-URL links in new cards/lists
- [ ] New buttons/inputs ≥48px touch target
- [ ] Form fields have labels
- [ ] Icon-only controls have `aria-label`
- [ ] Run Lighthouse A11y on affected page if home/shop/product

---

*See also `5_UI_UX_DESIGN_SYSTEM.md` §4 Accessibility tokens.*
