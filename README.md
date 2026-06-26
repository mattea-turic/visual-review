# visual-review

A Claude Code skill + GitHub Action for design visual reviews of Canonical Vanilla/Jinja demo PRs.

It works across three layers — **code**, **screenshots**, and **Figma** — and runs the following checks:

**General (page-wide)**
Background and theme classes applied correctly (no hard-coded hex values); section rhythm consistent; Ubuntu font and accent colours used correctly; no `!important`, inline styles, or raw px values in the SCSS diff.

**Pattern / macro alignment**
Each section uses the canonical Vanilla macro (`vf_hero`, `vf_tiered_list`, `vf_tab_section`, `vf_basic_section`, `vf_divided_section`), not hand-rolled HTML. Call signatures and slot structures verified. Deprecated patterns flagged with the correct replacement (`.p-block` → `.p-section--shallow`, `.p-strip--dark` → `.is-dark`, etc.).

**Padding and spacing**
Spacing classes verified against the Figma spacing token per section — mismatches between what Figma specifies (regular / deep / shallow) and what the code uses get flagged. Structural nesting issues caught too: regular padding at block level inside a section, trailing shallow that stacks with the section wrapper, any form of double-wrapping.

**Images, logos, and Figma fidelity**
Aspect ratios checked (3:2 default, 16:9 for video, cinematic only where Figma specifies). Asset URLs verified against the Canonical assets server. Logos confirmed as Figma-exported. Alt text presence and correctness checked. With Figma MCP connected, asset filenames and dimensions compared to the design node directly.

**Responsive behaviour**
Screenshots at mobile (375px), tablet (768px), and desktop (1280px). Content stacking, overflow, and spacing tiers checked at each breakpoint. Image sizing checked per section — flags anything that dominates the viewport or looks disproportionate at smaller sizes, with suggestions to hide (`u-hide--small`) or cap with `max-width`.

---

## Local use (Claude Code skill)

Copy `visual-review.md` to `~/.claude/commands/visual-review.md`, then run:

```
/visual-review <pr-url>
```

Claude fetches the PR, reads the changed templates, takes responsive screenshots, compares to the Figma design, and drafts a review for you to edit and post.

Requires:
- `gh` CLI authenticated
- Playwright: `npm install -g playwright && playwright install chromium`
- Screenshot tool at `~/.claude/tools/screenshots/capture.mjs` (see `tools/`)
- Figma MCP: enable Dev Mode MCP Server in Figma Preferences, then `claude mcp add --transport http --scope user figma-desktop http://127.0.0.1:3845/mcp`

## GitHub Action (team use)

Add the workflow file to the target repo's `.github/workflows/visual-review.yml` (see `.github/workflows/` here for the file), then add two secrets to that repo:

| Secret | What it is |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `FIGMA_TOKEN` | Figma personal access token |

Once set up, comment `/visual-review` on any PR — Claude runs a review and posts a draft to the Actions summary for you to edit and submit.
