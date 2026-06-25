---
agent: agent
description: 'Visual review of a Vanilla/Jinja demo PR, in Mattea voice'
tools: ['terminal', 'codebase', 'editFiles', 'figma', 'playwright']
---

# Visual review: ${input:pr}

You are doing a **design visual review** of a Canonical `vanilla-framework`
(or ubuntu.com / canonical.com) demo PR, and writing it up **in Mattea's voice**
(see the Voice section at the bottom — match it closely).

Order of work: gather → **general checks** → identify each pattern → per-pattern
checks → **confirm every pattern at mobile / tablet / desktop** → write up.

Most checks are verifiable from the code (Vanilla spacing is class-driven, not
hand-typed px). Render / compare to Figma where code alone can't tell you.


## Step 0 — Gather the PR

```
gh pr view ${input:pr} --json title,body,url,files,headRefName
gh pr diff ${input:pr}
```

Read each changed Jinja template **in full** (not just the diff hunk). Note:
changed templates, changed SCSS, the demo/example page, any preview URL, and the
**Figma frame link**.

> The dev should include a Figma link in the PR — it's almost always there. Pull it
> from the PR body. **If there's no Figma link, raise it as a finding** (politely
> ask the dev to add it) before reviewing, since it's the reference everything else
> is checked against.


## Step 1 — General checks (do these first, page-wide)

Before drilling into patterns, sweep the whole page:

- **Background colour** correct (e.g. `#F3F3F3` where expected) — and applied via
  the theme class / Vanilla token, **not a hard-coded hex**.
- Overall section rhythm looks right at a glance (regular spacing between sections,
  deep at the bottom).
- Correct theme / fonts / Ubuntu accent usage page-wide.
- Anything that's true of the whole page rather than one pattern.

*(Extend this list as your standing "General:" checklist.)*


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


## Check A — Pattern / macro alignment

- Uses the canonical Vanilla **macro** (`{% call %}` section macros, `vf-*`
  includes), not hand-rolled `<div class="…">`? `grep` for the macro and confirm
  this PR matches the established call signature / slot structure.
- Macro already applies section padding → template must not also hand-set it.
  **Watch for double-wrapping** (e.g. two `.p-section--shallow`s around one element)
  — phrase it like *"wrapped twice I think? could we remove one of the shallows
  please?"*.
- Flag deprecated patterns + name the fix: `.p-block` → `.p-section--shallow`;
  `.p-strip--dark/--light/--accent` → theming (`is-dark`) / `.p-strip--highlighted`;
  lone `col-12` for fixed width → `.u-fixed-width`.


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


## Check C — Images, logos & Figma fidelity

- **Aspect ratio:** default images **3:2**; videos **16:9**; **cinematic** only
  where the Figma frame specifies it. Flag 16:9 on a static image.
- **Source:** images/logos from the **assets server**, not hard-coded/local paths.
- **Logos:** use the **Figma-exported** version so it aligns to adjacent text per
  Figma (call out specifically for hero/CTA logos).
- Explicit `width`+`height` (or `aspect-ratio`) to avoid layout shift; `alt`
  present (`alt=""` only if decorative).
- With Figma MCP + link: confirm asset names/exports and spacing tokens match the
  node.


## Cross-cutting — Responsive (check EVERY pattern)

Confirm each pattern at all three breakpoints — open the demo (or run `dotrun`) and
view at roughly:

- **Mobile** ≈ 375px (Vanilla "small")
- **Tablet** ≈ 768px (Vanilla "medium")
- **Desktop** ≈ 1280px (Vanilla "large")

At each: content stacks sensibly, no overflow / overlap, images scale, spacing tiers
still hold. Don't eyeball padding — read it: `getComputedStyle(el).paddingBottom`.
Raise broken responsive behaviour as a real flag; offer enhancements (e.g. dropping
images at small breakpoints where they don't scale well) as hedged suggestions.


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
- Casual register fine: *pls, lil, kinda, Lmk*, em-dashes.
- Close effort-aware when you've suggested rework: *"Lmk if the above takes too much
  engineering effort, though!"*

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
