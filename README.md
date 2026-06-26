# visual-review

A Claude Code skill + GitHub Action for design visual reviews of Canonical Vanilla/Jinja demo PRs.

## Local use (Claude Code skill)

Copy `visual-review.md` to `~/.claude/commands/visual-review.md`, then run:

```
/visual-review <pr-url>
```

Claude fetches the PR, takes responsive screenshots, compares to the Figma design, and drafts a review in the right voice for you to edit and post.

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
