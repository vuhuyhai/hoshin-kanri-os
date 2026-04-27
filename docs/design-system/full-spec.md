# Neo-Brutalism Design System — Full Spec v3.2 "Refined Tempered NB"

**Vũ Hải Personal Edition** · Refined muted NB · Chuẩn neobrutalism.dev + Kristina Volchek + NN/g

---

## Cách dùng

Copy **toàn bộ prompt** trong các SECTION dưới đây vào AI tool (Claude/ChatGPT) để generate website Neo-Brutalism v3.1.

Thay placeholder:
- `[TÊN WEBSITE]` → tên cụ thể
- `[MÔ TẢ CONTENT]` → mô tả nội dung trang
- `[PORTRAIT_URL]` → URL headshot Vũ Hải (nếu có)

---

## Full Prompt (paste from here)

```
You are a senior UI/UX engineer with 15 years experience designing 
neobrutalist interfaces for indie tech products and creator-economy tools.

Design a complete, production-ready website for [TÊN WEBSITE].
[MÔ TẢ CONTENT: e.g. "A personal blog and tool dashboard for 
Vũ Hải — business consultant, content creator, vibe coder"]

Apply NEO-BRUTALISM v3.1 "TEMPERED NB" — Vũ Hải Personal Edition. 
This is modern tempered NB inspired by neobrutalism.dev and Kristina 
Volchek's work. Keep the NB spirit (hard shadows, heavy borders, 
controlled chaos) but with softer pastel accents, slight 4px rounding 
on cards/buttons, and photo-friendly image treatment system. The 
design must feel intentional, hand-placed, photo-rich, and warm — 
NOT raw or aggressive.
```

---

## SECTION 1 — NB PHILOSOPHY (Tempered Edition)

### ⚠ THE 5 TEMPERED COMMANDMENTS

Break any of these = not NB anymore:

**1. THE INTERFACE ANNOUNCES ITSELF.**
Border heavy + shadow offset luôn hiện diện. No ghost buttons, no hairline dividers.

**2. SHADOWS ARE FLAT, OFFSET, COLORFUL.**
Never blur. Never grey. Use `--ink`, `--brand`, or pastel accents. Hard offset only: `5px 5px 0 var(--ink)`.

**3. DESIGN LIKE IT WASN'T DESIGNED.**
Hand-placed > algorithmic. Several elements MUST tilt, overlap, or break the grid intentionally. Mixed font sizes (35px, 47px, 89px) > rigid scale.

**4. COLOR CLASHES ARE TEMPERED, NOT RAW.**
Pastel yellow `#FFE5A0` next to brand red `#c73937` is correct — warm + bold. Saturated neon yellow next to red would be aggressive (v3.0). Pastel softens without losing contrast.

**5. SOFTEN, DON'T POLISH.**
`border-radius: 4px` is allowed (subtle softening). Still: zero gradient (except `.nb-highlight`), zero italic, zero ease-in-out, zero soft shadow.

---

## SECTION 2 — DESIGN SYSTEM TOKENS

### Google Fonts — Vietnamese subset (bắt buộc)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?
  family=Space+Grotesk:wght@500;600;700
  &family=Inter:wght@400;500;600;700;800;900
  &family=JetBrains+Mono:wght@400;500;700
  &subset=vietnamese&display=swap" rel="stylesheet">
```

### Font System — 3 typefaces with distinct roles

⚠ **STRICT RULE:** `font-style: italic` is FORBIDDEN site-wide. Emphasis = `font-weight: 700` or `color: var(--brand)`.

```css
--font-display: "Space Grotesk", "Inter", sans-serif;
  /* H1/H2/H3: weight 700, tracking -0.02em
     Hero numbers: weight 700, can scale to 120px+
     Big quotes: weight 600 */

--font-body: "Inter", system-ui, sans-serif;
  /* Body: weight 400, line-height 1.6
     Body strong: weight 700 (replaces italic)
     Body small: weight 400, 15px */

--font-mono: "JetBrains Mono", "IBM Plex Mono", monospace;
  /* Labels: weight 500, uppercase, letter-spacing .08em
     Metadata: weight 400 (timestamps, tags, IDs)
     Code blocks: weight 400
     Prices/numbers: weight 700 (data emphasis)
     Nav links: weight 500, uppercase */
```

### Font Size Scale — INTENTIONALLY UNRULY (NB DNA)

⚠ Pick sizes that feel slightly off: 14, 17, 21, 28, 38, 56, 88. This creates the "hand-placed" feel.

```css
H1:      clamp(48px, 9vw, 88px)  / Space Grotesk 700 / tracking -0.03em
H2:      clamp(32px, 5vw, 56px)  / Space Grotesk 700 / tracking -0.02em
H3:      28px                    / Space Grotesk 700
H4:      21px                    / Space Grotesk 600
Body:    17px / line-height 1.6  / Inter 400
Strong:  17px                    / Inter 700
Small:   14px                    / Inter 400
Label:   13px / uppercase / tracking .08em / JetBrains Mono 500
Mono-md: 15px                    / JetBrains Mono 400
Big-num: clamp(64px,12vw,128px)  / Space Grotesk 700
```

### Mobile minimum sizes (< 768px)

```
Body:           16px minimum (Inter)
Small/caption:  14px minimum
Label/overline: 12px minimum
Touch targets:  min-height: 48px, min-width: 48px
```

### Typography Enhancements (2025-2026)

```css
h1, h2, h3 { text-wrap: balance; }
p, li, blockquote { text-wrap: pretty; }
* { font-optical-sizing: auto; }
```

### Color Tokens — VŨ HẢI HYBRID PALETTE (Light Mode)

⚠ NEVER use `#000000`. Use `--ink` (#1A1A1A) — softer black for NB.

```css
/* Neutrals */
--ink:         #1A1A1A;  /* border, shadow, heading, primary text */
--ink-soft:    #2C2B2B;  /* secondary headings */
--text-2:      #4A4848;  /* body text */
--text-3:      #6B6868;  /* metadata, captions */
--bg:          #FFFEF9;  /* page bg — slightly warm white */
--bg-paper:    #F5F0E8;  /* card alt bg, paper feel */
--bg-muted:    #ECE8E0;  /* section bg */
--white:       #FFFFFF;  /* on dark, button text */

/* Brand */
--brand:        #c73937;  /* Vũ Hải red — primary CTA, brand */
--brand-dark:   #9E1F1E;  /* hover/pressed */

/* MUTED ACCENTS (v3.2 refined — softer for content-heavy sites) */
--accent-yellow: #F5E4B8;  /* muted warm yellow — main accent */
--accent-cyan:   #C4DEDC;  /* muted calm teal */
--accent-lime:   #DDE4C5;  /* muted green — success */
--accent-pink:   #F0DCDD;  /* gentle warm pink */
--accent-peach:  #F0DCC0;  /* muted peach — optional */
--accent-lavender:#DDD3EE; /* muted lavender — optional */

/* Semantic — pastels with ink text */
--success-fg:  #1A1A1A;
--success-bg:  var(--accent-lime);
--warning-fg:  #1A1A1A;
--warning-bg:  var(--accent-yellow);
--info-fg:     #1A1A1A;
--info-bg:     var(--accent-cyan);
--danger-fg:   #FFFFFF;
--danger-bg:   var(--brand);
```

### Contrast Ratios — verified WCAG AAA

⚠ All text on pastel uses `--ink` for max contrast (12-14:1 AAA).

```
✅ --ink on --bg:               16:1  AAA
✅ --text-2 on --bg:             8:1  AAA
✅ --white on --brand:          5.16:1 AA
✅ --ink on --accent-yellow:   13.82:1 AAA
✅ --ink on --accent-cyan:     12.29:1 AAA
✅ --ink on --accent-lime:     13.24:1 AAA
✅ --ink on --accent-pink:     13.25:1 AAA
✅ --ink on --accent-peach:    13.01:1 AAA
✅ --ink on --accent-lavender: 12.12:1 AAA
✅ --white on --ink:            16:1  AAA
```

### Border System — heavy with subtle 4px rounding

```css
--border:        2px solid var(--ink);
--border-md:     3px solid var(--ink);
--border-heavy:  4px solid var(--ink);  /* signature — cards/CTAs */
--border-extra:  5px solid var(--ink);  /* hero, big features */

/* RADIUS — v3.1 tempered (subtle) */
--radius-sm:     3px;   /* small inputs, tags */
--radius-md:     4px;   /* cards, buttons (default) */
--radius-lg:     6px;   /* hero feature, modals */
--radius-none:   0;     /* avatars, stickers, marquee, checkboxes */
```

### Offset Shadows — NB signature

```css
--shadow-xs:        2px 2px 0 var(--ink);
--shadow-sm:        4px 4px 0 var(--ink);
--shadow-md:        6px 6px 0 var(--ink);  /* default card */
--shadow-lg:        8px 8px 0 var(--ink);  /* hover */
--shadow-xl:       12px 12px 0 var(--ink); /* hero */

/* Asymmetric variants (medium chaos DNA) */
--shadow-tilt-l:   -6px 6px 0 var(--ink);
--shadow-tilt-r:    6px 6px 0 var(--ink);

/* Colored shadows (pastel for softer pop) */
--shadow-brand:     6px 6px 0 var(--brand);
--shadow-yellow:    6px 6px 0 var(--accent-yellow);
--shadow-cyan:      6px 6px 0 var(--accent-cyan);
--shadow-pink:      6px 6px 0 var(--accent-pink);

/* Double shadow (hero CTAs only — striking but rare) */
--shadow-double:    6px 6px 0 var(--accent-yellow), 12px 12px 0 var(--ink);
```

### Spacing — NB allows generous AND tight

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  20px;  /* not 16, not 24 — NB unruly */
--space-5:  32px;
--space-6:  48px;
--space-7:  72px;
--space-8:  96px;  /* section spacing */
```

### Motion System — abrupt, mechanical, never "smooth"

```css
--duration-instant: 0ms;
--duration-snap:    100ms;
--duration-base:    150ms;
--ease-nb: cubic-bezier(0.25, 0, 0, 1);  /* hard snap */

/* Apply to all interactive elements */
transition: transform var(--duration-snap) var(--ease-nb),
            box-shadow var(--duration-snap) var(--ease-nb),
            background var(--duration-base) var(--ease-nb);

/* Accordion: stepped, never smooth */
.accordion-body {
  transition: height 200ms steps(5);
}

/* Skeleton: stepped pulse */
@keyframes nb-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
```

---

## SECTION 3 — CONTROLLED CHAOS (MEDIUM LEVEL)

### 1. Tilted Cards

```css
.card-tilt:nth-child(odd)  { transform: rotate(-1.5deg); }
.card-tilt:nth-child(even) { transform: rotate(1.5deg); }
.card-tilt:hover           { transform: rotate(0deg) translate(-3px,-3px); }
```

### 2. Sticker Elements (kept square — radius 0)

```css
.nb-sticker {
  display: inline-block;
  background: var(--accent-yellow);
  color: var(--ink);
  border: var(--border-md);
  border-radius: var(--radius-none);  /* SQUARE for sticker effect */
  box-shadow: var(--shadow-sm);
  padding: 6px 14px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transform: rotate(-3deg);
}
.nb-sticker:nth-child(2n) { 
  transform: rotate(2deg); 
  background: var(--accent-cyan); 
}
.nb-sticker:nth-child(3n) { 
  transform: rotate(-1.5deg); 
  background: var(--accent-pink); 
}
```

### 3. Asymmetric Shadow Mix

```css
.card-grid > .card:nth-child(3n+1) { box-shadow: var(--shadow-md); }
.card-grid > .card:nth-child(3n+2) { box-shadow: var(--shadow-tilt-l); }
.card-grid > .card:nth-child(3n+3) { box-shadow: var(--shadow-tilt-r); }
```

### 4. Mixed Font Sizes — break modular scale

```css
.hero-headline {
  font-size: clamp(56px, 11vw, 128px);
  line-height: 0.9;
  letter-spacing: -0.04em;
}
.hero-headline .accent-word {
  font-size: 0.55em;
  color: var(--brand);
  display: inline-block;
  transform: rotate(-2deg) translateY(8px);
}
.hero-headline .small-word {
  font-size: 0.3em;
  font-family: var(--font-mono);
  font-weight: 400;
  vertical-align: middle;
}
```

### 5. Overlap

```css
.overlap-sticker {
  position: absolute;
  top: -16px;
  right: -12px;
  z-index: 10;
}
.overlap-image {
  margin-bottom: -40px;
  position: relative;
  z-index: 5;
}
```

### 6. Highlight (replaces italic for emphasis)

```css
.nb-highlight {
  background: linear-gradient(
    180deg, 
    transparent 0%, 
    transparent 60%, 
    var(--accent-yellow) 60%, 
    var(--accent-yellow) 95%, 
    transparent 95%
  );
  padding: 0 4px;
  /* The ONE allowed gradient */
}
```

### 7. Marquee/Ticker (kept square — no radius)

```css
.nb-marquee {
  background: var(--ink);
  color: var(--bg);
  border-top: var(--border-md);
  border-bottom: var(--border-md);
  border-radius: var(--radius-none);
  padding: 16px 0;
  overflow: hidden;
  white-space: nowrap;
}
.nb-marquee-track {
  display: inline-block;
  animation: scroll-left 25s steps(50) infinite;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 17px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.nb-marquee-item::after {
  content: ' ✦ ';
  color: var(--accent-yellow);
  margin: 0 24px;
}
@keyframes scroll-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

---

## SECTION 4 — IMAGE TREATMENT SYSTEM (NEW IN v3.1)

⚠ Đây là điểm mới quan trọng nhất của v3.1. **NEVER use raw images without treatment.**

### 4.1. Portrait/Headshot — `.portrait-card`

For Vũ Hải's headshot, founder photos, team members. Polaroid-inspired with NB twist.

⚠ **v3.2 fix:** Dùng flexbox column thay vì absolute positioning cho caption. Loại bỏ khoảng trắng vô nghĩa giữa ảnh và caption. Tilt giảm từ 2deg xuống 1.5deg.

```css
.portrait-card {
  display: inline-flex;
  flex-direction: column;
  background: var(--bg);
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 14px 14px 18px 14px;  /* even padding, no awkward space */
  position: relative;
  transform: rotate(-1.5deg);  /* gentle polaroid tilt */
  max-width: 280px;
}
.portrait-card:nth-of-type(even) { transform: rotate(1.5deg); }

.portrait-card img {
  width: 100%;
  height: auto;
  aspect-ratio: 4/5;  /* portrait orientation */
  object-fit: cover;
  display: block;
  border-radius: var(--radius-sm);
  border: 2px solid var(--ink);
  margin-bottom: 12px;  /* breathing room above caption */
}

.portrait-card .caption {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: center;  /* center caption like real polaroid */
  line-height: 1.3;
}

.portrait-card .caption-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
  text-align: center;
}

/* Tape effect — sticker dán góc trên */
.portrait-card::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) rotate(-3deg);
  width: 70px;
  height: 22px;
  background: var(--accent-yellow);
  border: 2px solid var(--ink);
  opacity: 0.85;
  z-index: 2;
}

/* Hover: settle to neutral */
.portrait-card:hover {
  transform: rotate(0deg) translate(-2px, -2px);
  box-shadow: 10px 10px 0 var(--ink);
  transition: transform var(--duration-snap) var(--ease-nb),
              box-shadow var(--duration-snap) var(--ease-nb);
}
```

**Usage:**
```html
<div class="portrait-card">
  <img src="[PORTRAIT_URL]" alt="Vũ Hải">
  <div class="caption">Vũ Hải</div>
  <div class="caption-sub">Hanoi · 2026</div>
</div>
```

**Layout guidance:** Khi đặt portrait-card cạnh text (hero), dùng `display: grid; grid-template-columns: 1fr auto; align-items: center;` để 2 elements **căn gióng giữa theo chiều dọc**, không bị lệch hoặc khoảng trắng vô nghĩa.

### 4.2. Work Screenshot — `.work-frame`

For tool screenshots, project mockups, dashboard previews. Browser-window aesthetic.

```css
.work-frame {
  background: var(--bg);
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  position: relative;
}
.work-frame .browser-bar {
  background: var(--bg-muted);
  border-bottom: var(--border-md);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-2);
}
.work-frame .browser-dots {
  display: flex;
  gap: 6px;
  margin-right: 12px;
}
.work-frame .browser-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;  /* EXCEPTION: dots are round (Mac-style) */
  border: 2px solid var(--ink);
}
.work-frame .browser-dot:nth-child(1) { background: var(--accent-pink); }
.work-frame .browser-dot:nth-child(2) { background: var(--accent-yellow); }
.work-frame .browser-dot:nth-child(3) { background: var(--accent-lime); }
.work-frame .url-bar {
  background: var(--bg);
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
  flex: 1;
}
.work-frame img {
  width: 100%;
  height: auto;
  display: block;
}

/* Sticker label option */
.work-frame .work-label {
  position: absolute;
  top: -16px;
  right: -12px;
  z-index: 10;
}
```

**Usage:**
```html
<figure class="work-frame">
  <div class="browser-bar">
    <div class="browser-dots">
      <span class="browser-dot"></span>
      <span class="browser-dot"></span>
      <span class="browser-dot"></span>
    </div>
    <div class="url-bar">vuhai.com/tools/financial-projection</div>
  </div>
  <img src="[SCREENSHOT_URL]" alt="Financial Projection Tool">
  <div class="nb-sticker work-label">v2.0 · Live</div>
</figure>
```

### 4.3. Illustration Mix — `.illust-frame`

For illustrations, icons mixed with photos, hero artwork. Pastel background, offset frame.

```css
.illust-frame {
  position: relative;
  display: inline-block;
  padding: 24px;
  background: var(--accent-yellow);  /* or cyan, lime, pink */
  border: var(--border-heavy);
  border-radius: var(--radius-md);
}
.illust-frame img,
.illust-frame svg {
  display: block;
  width: 100%;
  height: auto;
  position: relative;
  z-index: 2;
}
.illust-frame::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 100%;
  height: 100%;
  background: var(--ink);
  border-radius: var(--radius-md);
  z-index: 1;
}

/* Color variants */
.illust-frame.cyan  { background: var(--accent-cyan); }
.illust-frame.lime  { background: var(--accent-lime); }
.illust-frame.pink  { background: var(--accent-pink); }
.illust-frame.peach { background: var(--accent-peach); }
```

### 4.4. General Image Frame — `.img-frame`

For any other photo: blog covers, content images, Open Graph hero.

```css
.img-frame {
  position: relative;
  display: inline-block;
}
.img-frame img {
  display: block;
  width: 100%;
  height: auto;
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  object-fit: cover;
}
.img-frame::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 100%;
  height: 100%;
  background: var(--accent-yellow);
  border-radius: var(--radius-md);
  z-index: -1;
}
.img-frame.cyan::after  { background: var(--accent-cyan); }
.img-frame.brand::after { background: var(--brand); }
.img-frame.lime::after  { background: var(--accent-lime); }
.img-frame.pink::after  { background: var(--accent-pink); }

/* Aspect ratio variants */
.img-frame.ratio-16-9 img { aspect-ratio: 16/9; }
.img-frame.ratio-4-3  img { aspect-ratio: 4/3; }
.img-frame.ratio-1-1  img { aspect-ratio: 1/1; }
```

### 4.5. Avatar — square, NB style (radius-none)

```css
.nb-avatar {
  width: 48px;
  height: 48px;
  border: var(--border-md);
  border-radius: var(--radius-none);  /* SQUARE — NB doesn't use circles */
  background: var(--accent-cyan);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
  overflow: hidden;
}
.nb-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Size variants */
.nb-avatar-sm { width: 32px; height: 32px; font-size: 14px; }
.nb-avatar-lg { width: 64px; height: 64px; font-size: 24px; }
.nb-avatar-xl { width: 96px; height: 96px; font-size: 32px; border-width: 4px; }
```

### 4.6. Image Sources Recommendation

```
For prototypes/placeholders (free):
- Unsplash: https://images.unsplash.com/photo-{ID}?w=800
- Placehold: https://placehold.co/400x500/FFE5A0/1A1A1A?text=Portrait
- DiceBear avatars: https://api.dicebear.com/7.x/notionists/svg?seed={name}

For real production:
- Vũ Hải portrait: shoot tại studio, neutral background, 4:5 ratio
- Work screenshot: dùng screenshot tool, crop 16:10 ratio, padding 24px
- Illustration: hire designer hoặc dùng Phosphor/Lucide icons xếp tổ hợp
```

---

## SECTION 5 — COMPONENT LIBRARY

### Buttons (with 4px radius)

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  padding: 14px 28px;
  min-height: 48px;
  border: var(--border-heavy);
  border-radius: var(--radius-md);  /* 4px softening */
  cursor: pointer;
  text-decoration: none;
  transition: transform var(--duration-snap) var(--ease-nb),
              box-shadow var(--duration-snap) var(--ease-nb);
}
.btn-primary {
  background: var(--brand);
  color: var(--white);
  box-shadow: var(--shadow-md);
}
.btn-primary:hover {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 var(--ink);
}
.btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--ink);
}
.btn-yellow {
  background: var(--accent-yellow);
  color: var(--ink);
  box-shadow: var(--shadow-md);
}
.btn-cyan {
  background: var(--accent-cyan);
  color: var(--ink);
  box-shadow: var(--shadow-md);
}
.btn-ghost {
  background: var(--bg);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}
```

### Cards (with 4px radius)

```css
.card {
  background: var(--bg);
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 28px;
  transition: transform var(--duration-snap) var(--ease-nb),
              box-shadow var(--duration-snap) var(--ease-nb);
}
.card:hover {
  transform: translate(-4px, -4px);
  box-shadow: var(--shadow-lg);
}
.card-feature {
  background: var(--accent-yellow);
  color: var(--ink);
  border: var(--border-extra);
  box-shadow: var(--shadow-lg);
}
.card-cyan { background: var(--accent-cyan); color: var(--ink); }
.card-lime { background: var(--accent-lime); color: var(--ink); }
.card-pink { background: var(--accent-pink); color: var(--ink); }
.card-dark {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
  box-shadow: 6px 6px 0 var(--brand);
}
```

### Forms

```css
.field-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink);
  margin-bottom: 8px;
}
.field-label::after { 
  content: '*'; 
  color: var(--brand); 
  margin-left: 4px; 
}
.field-label.optional::after { content: ''; }

.field-input,
.field-textarea,
.field-select {
  width: 100%;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  color: var(--ink);
  background: var(--bg);
  border: var(--border-md);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  min-height: 52px;
  transition: border-color var(--duration-snap) var(--ease-nb),
              box-shadow var(--duration-snap) var(--ease-nb);
}
.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 4px 4px 0 var(--brand);
}
.field-helper {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}
.field-error {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 6px;
}
.field-input.error {
  border-color: var(--brand);
  background: #FFF5F5;
}
.field-input.success {
  border-color: var(--accent-lime);
  box-shadow: 4px 4px 0 var(--accent-lime);
}
```

### Checkbox / Radio (kept square — NB DNA)

```css
.nb-checkbox {
  width: 24px;
  height: 24px;
  border: var(--border-md);
  border-radius: var(--radius-none);  /* SQUARE */
  background: var(--bg);
  cursor: pointer;
  appearance: none;
  position: relative;
}
.nb-checkbox:checked {
  background: var(--ink);
}
.nb-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: var(--accent-yellow);
  font-weight: 900;
  font-size: 16px;
}

.nb-radio {
  width: 24px;
  height: 24px;
  border: var(--border-md);
  border-radius: 50%;  /* EXCEPTION: radio is round */
  background: var(--bg);
  cursor: pointer;
  appearance: none;
  position: relative;
}
.nb-radio:checked::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--brand);
  border-radius: 50%;
}
```

### Badges & Tags (small radius)

```css
.nb-tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--ink);
}
.nb-tag-yellow { background: var(--accent-yellow); }
.nb-tag-cyan   { background: var(--accent-cyan); }
.nb-tag-lime   { background: var(--accent-lime); }
.nb-tag-pink   { background: var(--accent-pink); }
.nb-tag-brand  { background: var(--brand); color: var(--white); }
.nb-tag-dark   { background: var(--ink); color: var(--bg); }
```

### Modal / Overlay

```css
.nb-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(26, 26, 26, 0.6);
  z-index: 500;
}
.nb-modal {
  background: var(--bg);
  border: var(--border-extra);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 32px;
  max-width: 560px;
  margin: 80px auto;
  position: relative;
}
.nb-modal-close {
  position: absolute;
  top: -12px; right: -12px;
  width: 40px; height: 40px;
  background: var(--brand);
  color: var(--white);
  border: var(--border-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 700;
  font-size: 20px;
}
```

### Toast

```css
.nb-toast {
  position: fixed;
  bottom: 24px; right: 24px;
  background: var(--ink);
  color: var(--bg);
  border: var(--border-md);
  border-radius: var(--radius-md);
  border-left: 6px solid var(--accent-lime);
  box-shadow: var(--shadow-md);
  padding: 16px 20px;
  font-family: var(--font-mono);
  font-size: 14px;
  z-index: 700;
}
.nb-toast.error { border-left-color: var(--brand); }
.nb-toast.warn  { border-left-color: var(--accent-yellow); }
```

### Skeleton / Loading

```css
.skeleton {
  background: var(--bg-muted);
  border: var(--border);
  border-radius: var(--radius-sm);
  animation: nb-blink 1s steps(2) infinite;
}
```

### Empty State

```css
.empty-state {
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  background: var(--bg-paper);
  padding: 56px 24px;
  text-align: center;
  position: relative;
}
.empty-state::before {
  content: 'EMPTY';
  position: absolute;
  top: -14px; left: 50%;
  transform: translateX(-50%) rotate(-3deg);
  background: var(--accent-yellow);
  border: var(--border-md);
  border-radius: var(--radius-none);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.1em;
}
```

### Pricing Card

```css
.pricing-card {
  background: var(--bg);
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 32px;
  text-align: center;
  position: relative;
}
.pricing-card.featured {
  background: var(--accent-yellow);
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
  z-index: 2;
}
.pricing-card.featured .nb-sticker {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%) rotate(-5deg);
}
.pricing-price {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: clamp(40px, 6vw, 56px);
  color: var(--ink);
  margin: 16px 0;
}
.pricing-features {
  list-style: none;
  padding: 0;
  text-align: left;
  margin: 24px 0;
}
.pricing-features li {
  font-family: var(--font-body);
  font-size: 15px;
  padding: 8px 0;
  border-bottom: 1px solid var(--ink);
  display: flex;
  gap: 8px;
}
.pricing-features li::before {
  content: '✓';
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--brand);
}
```

### FAQ Accordion

```css
.faq-item {
  border-bottom: var(--border-md);
  padding: 20px 0;
}
.faq-question {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 21px;
  color: var(--ink);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  list-style: none;
}
.faq-question::after {
  content: '+';
  font-family: var(--font-mono);
  font-size: 32px;
  color: var(--brand);
  transition: transform var(--duration-snap) var(--ease-nb);
}
.faq-item[open] .faq-question::after {
  transform: rotate(45deg);
}
.faq-answer {
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.6;
  color: var(--text-2);
  padding-top: 12px;
}
```

### Testimonial Card (with avatar photo)

```css
.testimonial-card {
  background: var(--bg);
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 28px;
  position: relative;
}
.testimonial-quote {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 19px;
  line-height: 1.5;
  color: var(--ink);
  margin-bottom: 24px;
  /* NOT italic */
}
.testimonial-quote::before {
  content: '"';
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 64px;
  color: var(--brand);
  line-height: 0.5;
  display: block;
  margin-bottom: 8px;
}
.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.testimonial-author .nb-avatar {
  flex-shrink: 0;
}
.testimonial-author-info {
  display: flex;
  flex-direction: column;
}
.testimonial-author-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.testimonial-author-role {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
}
```

---

## SECTION 6 — LAYOUT & GRID

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (max-width: 768px) {
  .container { padding: 0 16px; }
}
```

### Card Grid (with gap, allows tilt)

```css
.card-grid {
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
```

### NB Grid (borders as dividers, responsive-aware)

```css
.nb-grid {
  display: grid;
  border: var(--border-heavy);
  border-radius: var(--radius-md);
  background: var(--bg);
  overflow: hidden;  /* clip children radius */
}
.nb-grid > * {
  padding: 28px;
  border-right: var(--border);
  border-bottom: var(--border);
}

@media (min-width: 1024px) {
  .nb-grid { grid-template-columns: repeat(3, 1fr); }
  .nb-grid > *:nth-child(3n)        { border-right: none; }
  .nb-grid > *:nth-last-child(-n+3) { border-bottom: none; }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .nb-grid { grid-template-columns: repeat(2, 1fr); }
  .nb-grid > *:nth-child(2n)        { border-right: none; }
  .nb-grid > *:nth-last-child(-n+2) { border-bottom: none; }
}
@media (max-width: 767px) {
  .nb-grid { grid-template-columns: 1fr; }
  .nb-grid > * { 
    border-right: none; 
    border-bottom: var(--border);
  }
  .nb-grid > *:last-child { border-bottom: none; }
}
```

### Two-Column Asymmetric (NB favorite)

```css
.split-asym {
  display: grid;
  gap: 32px;
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .split-asym { grid-template-columns: 7fr 5fr; }
  .split-asym.reverse { grid-template-columns: 5fr 7fr; }
}
```

---

## SECTION 7 — NAV & FOOTER

### Sticky Nav

```css
.nav {
  position: sticky; top: 0;
  background: var(--bg);
  border-bottom: var(--border-md);
  height: 68px;
  display: flex;
  align-items: center;
  z-index: 200;
}
.nav-logo {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink);
  letter-spacing: -0.02em;
}
.nav-logo .accent-dot {
  display: inline-block;
  width: 12px; height: 12px;
  background: var(--brand);
  margin-left: 4px;
}
.nav-links {
  display: flex;
  gap: 4px;
  list-style: none;
}
.nav-link {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink);
  padding: 10px 16px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background var(--duration-snap) var(--ease-nb),
              border-color var(--duration-snap) var(--ease-nb);
}
.nav-link:hover {
  background: var(--accent-yellow);
  border-color: var(--ink);
}
.nav-link.active {
  background: var(--ink);
  color: var(--bg);
}
```

### Mobile Nav

```css
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-toggle {
    width: 48px; height: 48px;
    border: var(--border-md);
    border-radius: var(--radius-md);
    background: var(--bg);
    cursor: pointer;
  }
  .nav-mobile-overlay {
    position: fixed; inset: 0;
    background: var(--ink);
    color: var(--bg);
    padding: 24px;
    z-index: 600;
  }
  .nav-mobile-overlay a {
    display: block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 32px;
    color: var(--bg);
    padding: 16px 0;
    border-bottom: 2px solid var(--text-3);
    text-decoration: none;
  }
  .nav-mobile-overlay a:hover { color: var(--accent-yellow); }
}
```

### Footer

```css
.footer {
  background: var(--ink);
  color: var(--bg);
  border-top: 6px solid var(--brand);
  padding: 64px 0 32px;
  margin-top: 96px;
}
.footer h4 {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-yellow);
  margin-bottom: 16px;
}
.footer a {
  color: var(--bg);
  font-family: var(--font-body);
  font-size: 16px;
  text-decoration: none;
}
.footer a:hover {
  background: var(--accent-yellow);
  color: var(--ink);
  padding: 0 4px;
}
```

---

## SECTION 8 — PAGE STRUCTURE TEMPLATE

1. **NAV** — sticky 68px, brand dot logo, mono nav links

2. **HERO with PORTRAIT** — split-asym 7fr 5fr
   - Left: Pre-headline (mono uppercase) + Mixed-size headline với `rotate(-2deg)` accent word + Sub-headline + CTA primary + secondary
   - Right: `.portrait-card` của Vũ Hải (polaroid style, tilt 2deg)
   - Optional sticker overlap

3. **MARQUEE TICKER** — between hero and content. Mono uppercase, ✦ separator in yellow

4. **SOCIAL PROOF / NUMBERS** — `.nb-grid` 3-col, big numbers Space Grotesk 700

5. **WORK SHOWCASE** — `.work-frame` browser-window screenshots
   - Title + description left, work-frame right
   - Multiple frames stacked with offset

6. **FEATURE CARDS** — `.card-grid` with TILT enabled
   - Mix card backgrounds: `.card`, `.card-feature`, `.card-cyan`, `.card-lime`
   - Each card has icon (illustration or Phosphor)
   - Sticker overlap top-right

7. **ABOUT / STORY** — `.split-asym` with `.illust-frame`
   - Left: text + `.nb-highlight` on key phrase
   - Right: `.illust-frame` with illustration
   - Quote block: bg ink, color bg, border-left 6px brand

8. **TESTIMONIALS** — `.nb-grid` 2-col with `.testimonial-card`
   - Each card has `.nb-avatar` with real photo
   - Tilt -1.5deg or +1.5deg alternating

9. **PRICING** — 3 tier `.card-grid`
   - Center tier `.pricing-card.featured` (yellow bg, scale 1.05)
   - Featured includes sticker "POPULAR" rotated

10. **FAQ** — accordion with `steps(5)` transition

11. **BLOG / RESOURCE LIST** — for personal site
    - Each item: card with `.img-frame` cover photo + metadata (date in mono, tags)
    - Hover: translate(-4px,-4px) + shadow-lg

12. **CTA BANNER** — full-bleed bg ink
    - H2: Space Grotesk 700, color bg
    - CTA: btn-yellow with shadow-double
    - bg-pattern: dots overlay

13. **FOOTER** — bg ink, top border 6px brand

---

## SECTION 9 — RESPONSIVE & ACCESSIBILITY

### Breakpoints: 480 / 768 / 1024 / 1280

### Mobile Adaptations

```css
@media (max-width: 768px) {
  --shadow-md: 4px 4px 0 var(--ink);
  --shadow-lg: 6px 6px 0 var(--ink);
  --shadow-xl: 8px 8px 0 var(--ink);
  
  .card-tilt { transform: rotate(0); }
  .nb-sticker { transform: rotate(-2deg); }
  .portrait-card { transform: rotate(-1deg); }  /* less tilt mobile */
  
  h1 { font-size: clamp(40px, 9vw, 56px); }
  
  .btn-primary { width: 100%; }
  .split-asym { grid-template-columns: 1fr !important; }
  
  /* Portrait card smaller on mobile */
  .portrait-card { max-width: 280px; margin: 0 auto; }
  
  /* Work frame: hide browser bar dots labels on small screens */
  .work-frame .url-bar { font-size: 10px; }
}
```

### Touch Targets — 48px minimum

```css
button, a.btn, input, .nb-checkbox, .nav-toggle {
  min-height: 48px;
  min-width: 48px;
}
```

### Focus States — colored shadow ring

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--bg), 0 0 0 6px var(--brand);
}
.btn:focus-visible {
  box-shadow: 6px 6px 0 var(--ink), 0 0 0 3px var(--bg), 0 0 0 6px var(--brand);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .card-tilt, .nb-sticker, .portrait-card { transform: rotate(0) !important; }
  .nb-marquee-track { animation: none !important; }
}
```

### DARK MODE TOKEN MAP — opt-in only

```css
[data-theme="dark"] {
  --ink:        #FFFEF9;
  --ink-soft:   #F0EBE2;
  --text-2:     #C8C4BB;
  --text-3:     #8A8784;
  --bg:         #1A1A1A;
  --bg-paper:   #252423;
  --bg-muted:   #2C2B2B;
  --white:      #FFFFFF;
  
  --brand:        #E84947;
  
  /* Pastels tăng saturation nhẹ trong dark mode để pop */
  --accent-yellow: #FFD970;
  --accent-cyan:   #7AD4D0;
  --accent-lime:   #B5D580;
  --accent-pink:   #FFAEB1;
  --accent-peach:  #FFB870;
  --accent-lavender:#B8A0F0;
  
  --shadow-md:    6px 6px 0 var(--ink);
  --shadow-lg:    8px 8px 0 var(--ink);
}
```

**2 cơ chế dark mode:**

```css
/* Cơ chế A — Auto theo system */
@media (prefers-color-scheme: dark) {
  :root { --ink: #FFFEF9; --bg: #1A1A1A; /* ...etc */ }
}

/* Cơ chế B — Manual toggle */
[data-theme="dark"] { --ink: #FFFEF9; --bg: #1A1A1A; /* ...etc */ }
/* + JS: document.documentElement.dataset.theme = 'dark';
   + localStorage.setItem('theme', 'dark'); */
```

---

## SECTION 10 — BACKGROUND PATTERNS

### Dot Grid

```css
.bg-dots {
  background:
    radial-gradient(circle, #1A1A1A33 1.5px, transparent 1.5px)
    0 0 / 24px 24px,
    var(--bg);
}
```

### Pastel Wash (NEW v3.1)

```css
.bg-wash-yellow { background: var(--accent-yellow); }
.bg-wash-cyan   { background: var(--accent-cyan); }
.bg-wash-lime   { background: var(--accent-lime); }
.bg-wash-pink   { background: var(--accent-pink); }
/* Use as section bg for visual rhythm */
```

### Checkered

```css
.bg-checker {
  background:
    linear-gradient(45deg, var(--bg-muted) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bg-muted) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--bg-muted) 75%),
    linear-gradient(-45deg, transparent 75%, var(--bg-muted) 75%);
  background-size: 32px 32px;
  background-position: 0 0, 0 16px, 16px -16px, -16px 0;
  background-color: var(--bg);
}
```

### Diagonal Stripes

```css
.bg-stripes {
  background:
    repeating-linear-gradient(
      45deg,
      var(--accent-yellow),
      var(--accent-yellow) 16px,
      var(--ink) 16px,
      var(--ink) 18px
    );
}
```

### Paper Grid

```css
.bg-paper {
  background:
    linear-gradient(to right, #1A1A1A11 1px, transparent 1px) 0 0 / 32px 100%,
    linear-gradient(to bottom, #1A1A1A11 1px, transparent 1px) 0 0 / 100% 32px,
    var(--bg-paper);
}
```

---

## ICONS & ILLUSTRATION

### Icon Style — Phosphor Bold or Lucide

- Stroke width: 2.5px (heavier than default)
- Size: 20px / 24px / 32px
- Color: `var(--ink)`, or `var(--brand)` for active

### Illustration Rules

✅ **DO:**
- Flat fill colors (use palette only)
- 3-4px solid black outline (`--ink`)
- Geometric/simplified forms
- Slightly naive/hand-drawn quality

❌ **DON'T:**
- Photo-realistic
- 3D rendering
- Gradients
- Soft shadows on illustrations

---

## OUTPUT FORMAT — Final Checklist

Single HTML file with embedded CSS:

- [x] Google Fonts: Space Grotesk + Inter + JetBrains Mono with vietnamese subset
- [x] `:root` defines ALL tokens including pastel accents
- [x] Global reset: `* { font-style: normal !important; box-sizing: border-box; }`
- [x] `h1, h2, h3 { text-wrap: balance; }` and `p, li { text-wrap: pretty; }`
- [x] `* { font-optical-sizing: auto; }`
- [x] Mobile-first responsive
- [x] Semantic HTML5 (nav/main/section/article/footer)
- [x] **At least 2 elements with intentional rotation** (sticker, tilted card, portrait-card)
- [x] **At least 1 mixed font-size moment** (hero with rotated accent word)
- [x] **At least 1 marquee or asymmetric layout**
- [x] **Use ALL 3 fonts** (display + body + mono)
- [x] **Mix shadow directions** in card grid
- [x] **Use at least ONE image treatment**: `.portrait-card`, `.work-frame`, `.illust-frame`, or `.img-frame`
- [x] If portrait section exists: use `.portrait-card` with polaroid tilt
- [x] If work showcase exists: use `.work-frame` with browser bar
- [x] All pastel cards have `.nb-sticker` or text accent for visual interest
- [x] Touch targets ≥ 48×48px

### ZERO TOLERANCES

- ❌ ZERO `#000000` (use `var(--ink)`)
- ❌ ZERO `font-style: italic` anywhere
- ❌ ZERO `ease`/`ease-in-out`/`ease-out` (only `var(--ease-nb)`)
- ❌ ZERO blur in shadows
- ❌ ZERO gradient (except `.nb-highlight` underline trick)
- ❌ ZERO transitions over 200ms
- ❌ ZERO raw images without `.img-frame`/`.portrait-card`/`.work-frame`/`.illust-frame` treatment

### ALLOWED RADIUS

- ✅ `border-radius: 4px` on cards, buttons, inputs (default `--radius-md`)
- ✅ `border-radius: 3px` on tags, small inputs (`--radius-sm`)
- ✅ `border-radius: 6px` on hero feature, modals (`--radius-lg`)
- ✅ `border-radius: 0` on avatars, stickers, marquee, checkboxes (`--radius-none`)
- ✅ `border-radius: 50%` ONLY on browser dots and radio buttons (rare exceptions)

---

**Production-ready. Print this prompt's spirit into every line.**

---

## Phụ lục — Evolution v3.0 → v3.1 → v3.2

| Aspect | v3.0 (Raw NB) | v3.1 (Tempered NB) | **v3.2 (Refined NB)** |
|--------|---------------|---------------------|------------------------|
| Yellow | `#FFE14D` saturated | `#FFE5A0` warm pastel | **`#F5E4B8` muted** |
| Cyan | `#4ECDC4` saturated | `#A8E6E3` calm pastel | **`#C4DEDC` muted calm** |
| Pink | — | `#FFD4D6` soft | **`#F0DCDD` gentle** |
| Lime | — | `#D4E8B0` light | **`#DDE4C5` muted** |
| Tilt range | 1.5-3deg | 1.5-3deg | **1-2deg (gentle)** |
| Border-radius | `0` everywhere | `4px` soft | **`4px` soft (giữ)** |
| Polaroid layout | — | absolute positioning (buggy) | **flexbox column (clean)** |
| Caption alignment | — | bottom-anchored awkward | **inline natural flow** |
| Visual feel | Raw, aggressive | Warm photo-rich | **Refined content-friendly** |
| Best for | Viral landing | Personal portfolio | **Long-form blog, content site** |

---

## Layout Symmetry Rules (v3.2)

⚠ Đây là điểm critical mới của v3.2 — fix issues về alignment.

### Hero with Portrait — Use grid alignment

❌ **Sai (v3.1):**
```html
<section class="hero">
  <div>Text + 2 buttons (left)</div>
  <div class="portrait-card">[image]</div>  <!-- floating right -->
</section>
```
→ Buttons ở trái cô đơn, portrait phải lệch xuống.

✅ **Đúng (v3.2):**
```html
<section class="hero" style="display: grid; grid-template-columns: 1.4fr 1fr; align-items: center; gap: 48px;">
  <div class="hero-text">
    <h1>...</h1>
    <p>...</p>
    <div class="cta-group">[buttons]</div>
  </div>
  <div class="hero-portrait">
    <div class="portrait-card">[image + caption]</div>
  </div>
</section>
```
→ `align-items: center` đảm bảo 2 cột căn giữa theo chiều dọc, **không khoảng trắng vô nghĩa**.

### Card Grid — Bỏ tilt khi có hover transform

```css
/* v3.1 (over-tilted): rotate(-1.5deg), rotate(1.5deg), rotate(-1deg)... */
/* v3.2 (refined): chỉ 1 trong 4 cards có tilt nhẹ, others phẳng */
.card-grid > .card { transform: none; }
.card-grid > .card:nth-child(2) { transform: rotate(0.5deg); }  /* 1 card duy nhất tilt */
```

---

**Source authority:**
- neobrutalism.dev — production component library reference
- Kristina Volchek — "Personal Website Redesign for a Product Designer | NeoBrutalism" (Dribbble 2023)
- Nielsen Norman Group — "Neobrutalism: Definition and Best Practices" (2025)
- Etienne Aubert Bonn — "Neobrutalism in Web Design" (2026)
- Bejamas — "Neubrutalism — UI Design Trend That Wins The Web" (2025)
