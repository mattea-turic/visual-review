# Copilot instructions — visual-review

This repo is a **design visual-review tool for Canonical Vanilla / Jinja demo PRs**.
When you (the Copilot coding agent) are assigned an issue titled **"Visual review: …"**,
your job is to review the external demo PR named in the issue and draft the review.

## Do this

1. **Follow [`SKILL.md`](../SKILL.md) exactly** — it is the full review procedure and
   the required output format/voice.
2. The issue body contains the PR URL and pre-parsed inputs (demo URL, Figma link +
   node id, copy-doc URL). Read the **public** PR with `gh pr view` / `gh pr diff` —
   this needs no special access.
3. **Post the finished review as a comment on the assigned issue** in *this* repo.
4. **Save a copy** to `reports/<page-slug>-<YYYY-MM-DD>.md` and open a PR adding it.

## Never do this

- **Never comment on, or push to, the external PR / ubuntu.com.** This is a
  *draft-for-Mattea* tool — she edits and submits the review herself. All output
  stays in this repo.
- Don't claim you checked Figma or ran screenshots if this environment couldn't —
  say so plainly so Mattea knows what still needs a human eye.

## Voice

Match Mattea's voice precisely — warm opener, @-tag the author, `- [ ]` checkboxes,
hedged asks with the reason attached, polite scope-outs with cc's. Asks only: no
LGTM lines, no closer after the last item, visual findings only. The Voice section
at the bottom of `SKILL.md` is the spec.
