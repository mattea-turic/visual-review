---
description: Visual review of a Vanilla / Jinja demo PR, in Mattea's voice
argument-hint: <pr-url-or-number>
allowed-tools: Bash(gh:*), Bash(node:*), Bash(mkdir:*), Read, Grep, Glob, WebFetch, mcp__figma__*
---

# Visual review: $ARGUMENTS

You are doing a **design visual review** of a Canonical `vanilla-framework`
(or ubuntu.com / canonical.com) demo PR, and writing it up **in Mattea's voice**
(see the Voice section at the bottom — match it closely).

Order of work: gather → **Figma comparison** → **general checks** → identify each pattern → per-pattern
checks → **responsive screenshots** → write up.

Most checks are verifiable from the code (Vanilla spacing is class-driven, not
hand-typed px). Render / compare to Figma where code alone can't tell you.

---

## Step 0 — Gather the PR

```
gh pr view $ARGUMENTS --json title,body,url,files,headRefName,author
gh pr diff $ARGUMENTS
```

Read each changed Jinja template **in full** (not just the diff hunk). Note:
changed templates, changed SCSS, the demo/example page, any preview URL, and the
**Figma frame link**.

> The dev should include a Figma link in the PR — it's almost always there. Pull it
> from the PR body. **If there's no Figma link, raise it as a finding** (politely
> ask the dev to add it) before reviewing, since it's the reference everything else
> is checked against.

---

## Step 0.5 — Figma comparison

Extract the Figma link from the PR body. The URL contains a `node-id` param — use
the Figma MCP to fetch that node and note:
- Expected spacing tokens and layout for each section
- Component names (so you can match them to patterns in Step 2)
- Image/asset dimensions and aspect ratios
- Any visible discrepancies vs. what the code produces

Refer back to these notes when writing up each pattern's findings.

If no Figma link is present: skip this step, fall back to pattern-first checks
below, and raise the missing link as a finding in the write-up.

---

## Step 1 — General checks (do these first, page-wide)

Before drilling into patterns, sweep the whole page:

**Background / theme:**
- Background colour correct and applied via a Vanilla theme class (`.is-dark`, `.is-paper`, `.is-highlighted`) or token — **not** a hard-coded hex or inline `style="background:…"`. If you see a raw hex anywhere, flag it and name the correct token/class.
- Theme class applied at the right level — typically on the `.p-strip` or section wrapper, not buried inside a `.col-*`.
- Ubuntu font in use page-wide (check rendered screenshots — if a system font is falling back, something is wrong with the font stack).
- Ubuntu accent colours used correctly: orange (`#E95420`) only for interactive/brand moments, not decorative fills. If something looks off chromatically, flag it.

**Section rhythm (code + visual):**
- Every top-level section uses a Vanilla spacing class (`.p-section`, `.p-section--deep`, `.p-section--shallow`) — no section should have no spacing class and rely on default browser margins.
- The last section on the page uses `.p-section--deep` (~128px). If it's `.p-section`, flag it.
- Spacing between sections looks visually even when scanning the desktop screenshot — no section looks collapsed or unexpectedly airy compared to its neighbours.

**Page-wide code hygiene:**
- No `!important` overrides in the SCSS diff.
- No inline `style=""` attributes setting spacing, colour, or layout.
- No hard-coded px/rem values for spacing that should be a Vanilla class.

*(Add to this list as new page-wide patterns emerge.)*

---

## Step 2 — Identify each pattern (the Figma tie-in)

Patterns are the shared language between Figma and Vanilla, so name what you're
reviewing, then check it against *that pattern's* spec. "It's obvious a tiered list
is a tiered list" — lean on that.

| Pattern | Likely classes / macro | Vanilla docs | Figma component (fill in) |
|---|---|---|---|
| Basic section | `.p-section` + content blocks macro | vanillaframework.io/docs/patterns/section | … |
| Divided section | `.p-section`, divided-block macro | vanillaframework.io/docs/patterns/divided-section | … |
| Strip | `.p-strip` (`.is-deep` / `.is-shallow`) | vanillaframework.io/docs/patterns/strip | … |
| Hero | `.p-section--hero` | vanillaframework.io/docs/patterns/hero | … |
| Tiered list | (check Vanilla docs) | vanillaframework.io/docs/… | … |

> Fill the Figma-component column in once and the agent always knows which Figma
> component each demo section should match.

**Figma comparison — default to frame-precise, since the link is usually present:**
- **Frame-precise (preferred):** with the Figma link + Figma MCP connected, read
  the node's spacing tokens, component name, and export settings, and compare to
  the rendered demo. Best for asset fidelity and exact spacing.
- **Pattern-first (fallback if no link / no MCP):** compare to the identified
  pattern's documented spec + conventions below.

---

## Check A — Pattern / macro alignment

**Macro usage:**
- Each section should use a canonical Vanilla macro, not hand-rolled HTML. Known macros to look for:
  - `vf_hero` / `{% call(slot) vf_hero(…) %}`
  - `vf_tiered_list`
  - `vf_tab_section`
  - `vf_basic_section` / `vf_divided_section`
  - `{% include "templates/…/_…_section.html" %}` includes
- Grep for the macro name and confirm it's being called correctly. A section built entirely from `<div class="p-section">…<div class="row">…</div></div>` by hand is a red flag unless there genuinely isn't a macro for it yet.
- Check the macro's **call signature / slot structure**: required args present, no extra wrapper divs inserted inside `{% call %}` blocks that the macro doesn't expect. If a slot is being passed content that doesn't match what the macro renders into, the layout will be off even if it visually looks close.

**Macro + padding interaction:**
- Most macros already apply their own section padding internally. If the template also adds a `.p-section` or `.p-section--shallow` on the outer wrapper, that doubles the spacing. Watch for **any form of double-wrapping**: same class twice, or a padding class on both the macro call-site and the element inside `{% call %}`.
- Phrase it as: *"wrapped twice I think? could we remove one of the shallows please?"*

**Deprecated patterns — flag and name the fix:**
- `.p-block` → use `.p-section--shallow`
- `.p-strip--dark` / `.p-strip--light` / `.p-strip--accent` → use theming (`.is-dark`) or `.p-strip--highlighted`
- Lone `<div class="col-12">` for fixed-width content → use `.u-fixed-width`
- Any other pattern that appears in the diff but is absent from current Vanilla docs should be flagged with a link to the replacement.

---

## Check B — Padding / wrapping

Verify the classes, not raw px:

| Intent | Approx. | Class |
|---|---|---|
| Regular section spacing | 64px | `.p-section` |
| Deep / bottom-of-page spacing | 128px | `.p-section--deep` |
| Item / sub-section spacing within a section | 24px | `.p-section--shallow` |

- Bottom / last section → `.p-section--deep`; items inside a section →
  `.p-section--shallow`.
- `.p-section` is **bottom padding only**; if both top + bottom are needed (e.g. a
  background change), use a `.p-strip` instead.
- `.p-strip` / `.p-section` must be the **parent** of `.row`; `.col-*` must be a
  **direct child** of `.row`.
- **FLAG:** inline `style="padding…"`, arbitrary px/rem padding, or `$spv`/`$sph`
  overrides faking any tier.

**Figma → code spacing comparison (do this per section):**
For each section visible in the Figma frame, read the spacing token Figma shows (regular / deep / shallow) and check the code uses the matching class. Common mismatches to catch:
- Figma shows regular spacing → code has `.p-section--deep` → flag as too much bottom padding
- Figma shows regular → code has no spacing class or inline padding → flag
- Figma shows deep (end of page) → code has `.p-section` → flag as too little

**Structural nesting issues (check the template carefully):**
- `.p-section` (regular) used at **block level inside another section** — blocks within a section should use `.p-section--shallow`, not regular. Regular padding here adds ~64px inside a section that already has its own spacing.
- **Trailing shallow before a section boundary** — if the last block/element inside a section has `.p-section--shallow`, and the wrapping section also has `.p-section`, those two stack: the shallow's 24px bottom sits on top of the section's 64px bottom, producing ~88px where 64px was intended. Flag it.
- More generally: scan the nesting and ask "does padding exist at both the block level and the section level for the same gap?" If yes, one of them is excess.

---

## Check C — Images, logos & Figma fidelity

**Aspect ratio:**
- Default images: **3:2**. Videos: **16:9**. Cinematic crops only where the Figma frame explicitly specifies them.
- In the code, look for `width` + `height` attributes or `aspect-ratio` CSS — the ratio should match. A `width="800" height="450"` on a static image is 16:9, which is wrong for a standard image; flag it.
- If the Figma frame shows a 3:2 crop and the code renders 16:9 (or vice versa), that's a fidelity issue — name both what Figma shows and what the code produces.

**Asset source:**
- All images and logos must come from the Canonical **assets server** (`assets.ubuntu.com` or `assets.canonical.com`). Grep the template for `src=` and check every URL. A local path (`/static/images/…`), a relative path, or any other domain is a flag.
- With Figma MCP: confirm the asset filename in the Figma export settings matches what's in the `src` attribute. If the names differ, it may be an outdated or wrong asset.

**Logos:**
- Logos should use the **Figma-exported** version — the specific file that Figma's export panel produces — so sizing and alignment match the design exactly. An approximation from a different source may be slightly different dimensions and throw off text alignment.
- Call this out specifically for hero and CTA sections, where logo/text alignment is most visible.
- Check that logos aren't being scaled in CSS in a way that would blur them (prefer SVG; if PNG, confirm it's exported at the correct resolution for its rendered size).

**Alt text:**
- Every `<img>` must have an `alt` attribute.
- `alt=""` is correct **only** for decorative images (background textures, purely visual dividers). Anything that communicates content needs descriptive alt text.
- If `alt` is missing entirely, that's an accessibility flag — call it out clearly.

**Figma → image fidelity (with MCP):**
- For each image in the Figma frame, read the node's export settings and dimensions. Compare to what the template renders: correct asset, correct ratio, matching dimensions / `max-width`.
- If Figma shows a specific asset at a specific size and the code uses a different asset or different sizing, name the discrepancy.

**Viewport-relative size (per section):**
- For each section that contains an image, check whether it's proportionate at tablet (768px) and mobile (375px).
- Red flags: image takes up most of the viewport before the user sees any text; a decorative/supporting image that dwarfs the heading; a logo significantly taller/wider than adjacent copy.
- If it looks out of proportion at a smaller viewport, flag it and suggest `u-hide--small` / `u-hide--medium` to hide, or a `max-width` utility to cap it — whichever fits the pattern.

---

## Step 3 — Responsive screenshots

If the PR body includes a preview URL, take screenshots at three viewports and
inspect each one visually:

```bash
mkdir -p /tmp/vr-screenshots
node /Users/MatteaWork/.claude/tools/screenshots/capture.mjs <PREVIEW_URL> /tmp/vr-screenshots
```

Then Read each image:
- `/tmp/vr-screenshots/mobile.png` — 375px (Vanilla "small")
- `/tmp/vr-screenshots/tablet.png` — 768px (Vanilla "medium")
- `/tmp/vr-screenshots/desktop.png` — 1280px (Vanilla "large")

At each breakpoint, check:
- Content stacks sensibly, no overflow / overlap, spacing tiers hold.
- **Image sizing per section** — scan each section that has an image. Is the image
  proportionate, or does it dominate the viewport and push the actual content way
  down? At mobile especially: would a user have to scroll past a giant image before
  reaching the heading + copy? If yes, flag it. Common fixes: hide with
  `u-hide--small`, cap with `max-width`, or switch to a smaller asset at that
  breakpoint.
- Logos and icons don't balloon at smaller viewports (a logo that's decorative at
  desktop can look absurd at 375px if it's unconstrained).

Raise broken or disproportionate sizing as a real flag; offer hiding/capping as a
hedged suggestion when it's an enhancement rather than a bug.

If no preview URL is in the PR, note this and ask the author to confirm responsive
behaviour manually.

---

## Output — write it in Mattea's voice

**Voice rules (match these):**
- Open warm, @-tag the author, name the page/pattern: *"Thanks for your work on this
  page @author!"* / *"Thank you @author for the updates to this pattern!"*
- Then a `Comments:` line. First a **General:** group, then **bold pattern/section
  headings** (Hero, [CTA section], etc.).
- Use GitHub **checkboxes** (`- [ ]`) per item.
- Passes are just **"LGTM"** / **"LGTM!"** / **"Mostly LGTM, with the caveat …"**.
- Asks are **hedged questions with the reason attached**, not commands:
  *"I'm not sure about X — we typically do Y, for consistency. Could we …?"*,
  *"could you pls …"*, *"would it be possible to …, if that's possible that'd be
  great"*.
- **Scope things out** politely: *"this would be a discussion at a later time"*,
  *"should be investigated a lil (cc: @x @y)"*; cc colleagues when it's broader than
  this PR.
- Casual register fine: *pls, little, kinda, Lmk*, em-dashes.
- Only close with *"Lmk if the above takes too much engineering effort, though!"* if
  the asks genuinely involve significant rework. Omit it for minor or easy changes.

End with an overall call: **approve / comment / request changes**. Write it so it
pastes straight into a GitHub review.

**Skeleton:**

```
Thanks for your work on this page @<author>!

Comments:

**General:**
- [ ] <background / page-wide check>

**<Pattern / section name>**
- [ ] LGTM
- [ ] <hedged ask + reasoning, or scoped-out note with cc>

<effort-aware closer if needed>
```
