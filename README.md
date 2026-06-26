# visual-review

A Claude Code skill + GitHub Action for design visual reviews of Canonical Vanilla/Jinja demo PRs.

It works across three layers:
- **Code** — reads the Jinja templates and SCSS diff to check Vanilla Framework patterns (`vf_hero`, `vf_tiered_list`, etc.), macro usage, spacing classes, structural nesting issues, and deprecated patterns
- **Screenshots** — captures the demo at mobile (375px), tablet (768px), and desktop (1280px) to check responsive behaviour and image sizing per section
- **Figma** — compares against the linked design frame for spacing tokens, asset dimensions, and layout fidelity; flags mismatches between what Figma specifies and what the code does (e.g. regular padding in Figma but `.p-section--deep` in the template)

### Padding checks

The skill checks spacing at two levels:

**Figma → code:** for each section, it reads the spacing token in Figma (regular / deep / shallow) and verifies the code uses the matching Vanilla class. A Figma section showing regular spacing but coded as `.p-section--deep` gets flagged.

**Structural nesting:** it scans the template for padding stacking issues — e.g. a block inside a section using `.p-section` (regular, ~64px) instead of `.p-section--shallow` (~24px), or a trailing `.p-section--shallow` on the last child of a section that also has `.p-section` on the wrapper (the two stack, producing excess bottom spacing).

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
