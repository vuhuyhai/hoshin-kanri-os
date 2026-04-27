---
name: neo-brutalism-design-vuhai
description: >
  Design system Neo-Brutalism v3.2 "Refined Tempered NB" của Vũ Hải —
  chuẩn modern NB với muted pastel palette. Đặc trưng: brand #c73937 +
  muted accents (yellow #F5E4B8, cyan #C4DEDC, lime #DDE4C5, pink
  #F0DCDD), font Space Grotesk + Inter + JetBrains Mono, controlled
  chaos nhẹ (tilted cards, mixed font sizes), border-radius nhẹ 4px,
  hard offset shadows, photo-friendly với 3 image treatment layers
  (portrait polaroid-fixed, work browser frame, illustration). Dùng
  cho personal site, blog, indie tool. LUÔN dùng skill này khi Vũ Hải
  yêu cầu: thiết kế website/landing page/HTML component theo phong
  cách Neo-Brutalism, NB style, "thiết kế theo style của tôi", brand
  color #c73937, hard shadow offset, tilted card, sticker badge,
  controlled chaos, photo hero, portrait section. Mặc định LIGHT MODE.
  Bao gồm: muted 3-color palette, typography 3-font, 18+ component,
  image treatment system fixed alignment, dark mode tokens, WCAG AA+.
---

# Neo-Brutalism Design System — Vũ Hải v3.2 "Refined Tempered NB"

## Mục đích

Skill này cung cấp design system Neo-Brutalism v3.2 — phiên bản **refined tempered NB** với muted pastel palette. Tinh thần NB vẫn nguyên vẹn (hard shadow, heavy border, controlled chaos) nhưng màu nhẹ nhàng hơn để phù hợp đọc lâu, content-heavy site.

**Triết lý "Refined Tempered NB":**
- Giữ NB DNA: hard offset shadow, heavy border, controlled chaos (tilt nhẹ)
- Muted colors: pastel saturation thấp hơn v3.1 (~30% softer)
- Border-radius nhẹ 4px (cards/buttons), giữ 0 cho avatar/sticker
- Photo-friendly với 3 image treatment layers, **alignment đã fix**

**Khác biệt v3.1 → v3.2:**
- Yellow `#FFE5A0` → `#F5E4B8` (muted hơn, đỡ chói)
- Cyan `#A8E6E3` → `#C4DEDC` (calm hơn)
- Pink `#FFD4D6` → `#F0DCDD` (warm gentle)
- Polaroid card: fix khoảng trắng, caption đúng vị trí, tilt giảm còn 1.5deg
- Layout symmetric hơn — bỏ asymmetric chỗ không cần thiết

**v3.2 dùng cho:** personal site Vũ Hải, blog cá nhân, content-heavy reading, portfolio, tools cá nhân — nơi cần đọc lâu mà không mỏi mắt.

**v3.2 KHÔNG dùng cho:** Ladysfit (vẫn quá NB cho audience nữ), tài liệu tư vấn neutral, viral landing pages cần "đập mặt" (dùng v3.0/v3.1).

## Khi nào dùng

- Yêu cầu thiết kế web cá nhân Vũ Hải
- Request "NB style", "neo-brutalism", "thiết kế theo style của tôi"
- Brand color `#c73937` với accent pastel
- Tạo HTML component với hard shadow, heavy border, sticker, tilted card
- Indie tool, content platform, blog cá nhân
- Trang có portrait/headshot, work screenshot, illustration
- Personal portfolio/showcase

## NB Philosophy v3.2 — 5 Refined Commandments

⚠ Vi phạm bất kỳ điều nào = không còn là NB:

1. **Interface announces itself** — Mọi UI element nhìn rõ là chính nó. Border heavy + shadow offset luôn hiện diện.
2. **Shadows flat, offset, colorful** — Không blur, không grey. Hard offset only.
3. **Design like it wasn't designed (refined)** — Hand-placed > algorithmic. Tilt NHẸ (1-2deg, không 3-4deg như v3.1). Sticker overlap có chủ đích, KHÔNG dày đặc.
4. **Muted clashes are still clashes** — Muted yellow `#F5E4B8` next to brand red `#c73937` vẫn là clash, chỉ refined hơn. Không phải "polished tasteful" — vẫn có character.
5. **Soften, don't polish** — `border-radius: 4px` allowed. Vẫn không gradient (trừ highlight trick), không italic, không ease-in-out.

## Theme Policy — Light-First Default

Mặc định **LIGHT MODE ONLY**. Chỉ thêm dark mode khi user yêu cầu rõ ràng:
- "dark mode", "chế độ tối", "giao diện tối"
- "light/dark toggle", "theme toggle"
- "cả hai theme", "support dark mode"
- "auto theo system", "auto dark"

**Nếu opt-in dark mode → chọn 1 trong 2:**

| Cơ chế | Khi nào | Implement |
|--------|---------|-----------|
| **Auto** | "auto theo system" hoặc không nói rõ | `@media (prefers-color-scheme: dark) { :root { ... } }` |
| **Manual toggle** | "có nút chuyển", "toggle", "user chọn" | `[data-theme="dark"] { ... }` + JS toggle + localStorage |

**Quy tắc chung:**
- `--brand: #c73937` GIỮ NGUYÊN ở light. Trong dark mode dùng `--brand: #E84947` (sáng hơn)
- Pastel accents stay vibrant trong dark mode (chúng pop tự nhiên trên bg đen)
- Dark mode dùng warm dark `#1A1A1A`, KHÔNG dùng `#000000`

## Cách sử dụng

**Bước 1** — Đọc `references/design-system.md` TOÀN BỘ trước khi viết bất kỳ dòng CSS/HTML nào.

**Bước 2** — Copy CSS variables từ SECTION 2: DESIGN SYSTEM TOKENS vào `:root {}`.

**Bước 3** — Áp dụng theo thứ tự:

| Cần gì | Xem ở đâu |
|--------|-----------|
| 5 Commandments NB tempered | SECTION 1 — NB Philosophy |
| Color tokens pastel hybrid | SECTION 2 — Color Tokens |
| Typography 3-font system | SECTION 2 — Font System |
| Border, shadow, radius 4px | SECTION 2 — Border & Shadow |
| Motion DNA | SECTION 2 — Motion System |
| Controlled chaos rules | SECTION 3 — Controlled Chaos |
| **Image treatment 3 layers** | **SECTION 4 — Image System** |
| Component library | SECTION 5 — Components |
| Layout & grid | SECTION 6 — Layout |
| Nav & footer | SECTION 7 — Nav & Footer |
| Page structure | SECTION 8 — Page Template |
| Responsive + a11y | SECTION 9 — Responsive & A11y |
| Background patterns | SECTION 10 — BG Patterns |

## Nguyên tắc bất biến (không được vi phạm)

1. **Brand `#c73937`** giữ ở light, brightened `#E84947` ở dark mode
2. **`border-radius`** — `4px` cho cards/buttons/inputs; `0` cho avatar/sticker/marquee/checkbox
3. **Không italic** — `font-style: normal !important` toàn bộ
4. **Không `#000000`** — dùng `var(--ink)` (#1A1A1A)
5. **Offset shadow chỉ dùng tokens** — `var(--ink)`, `var(--brand)`, `var(--accent-*)`
6. **Motion NB** — `cubic-bezier(0.25, 0, 0, 1)`, không bao giờ `ease`/`ease-in-out`
7. **Mobile font minimum** — body 16px, label 12px, touch target 48px
8. **Light-first default** — không tự thêm dark mode nếu user không yêu cầu
9. **Controlled chaos PHẢI có** — ít nhất 2 element rotated (sticker hoặc tilted card) + 1 mixed font-size moment trong hero
10. **3 fonts PHẢI dùng** — Space Grotesk (display), Inter (body), JetBrains Mono (labels/metadata)
11. **Image treatment** — luôn dùng `.img-frame-*` class với offset frame, không bao giờ ảnh trần
12. **Portrait section** — nếu có headshot, dùng `.portrait-card` với polaroid-style frame

## Output format

Luôn tạo **một file HTML duy nhất** với embedded CSS và JS:
- Google Fonts: Space Grotesk + Inter + JetBrains Mono, `&subset=vietnamese`
- `:root {}` chứa toàn bộ CSS variables (light mode mặc định)
- Dark mode CHỈ thêm khi user yêu cầu
- Global reset: `* { font-style: normal !important; box-sizing: border-box; font-optical-sizing: auto; }`
- `h1,h2,h3 { text-wrap: balance; }` và `p,li { text-wrap: pretty; }`
- Mobile-first media queries
- Touch targets ≥ 48×48px
- Focus state: colored shadow ring
- Reduced motion support
- Image placeholders: dùng `https://images.unsplash.com/photo-...` hoặc `https://placehold.co/...` cho prototype

## Tham chiếu

Đọc `references/design-system.md` để lấy full spec v3.1 với CSS đầy đủ, image treatment system, và 18+ component.
