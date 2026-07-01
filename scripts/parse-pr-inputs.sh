#!/usr/bin/env bash
#
# parse-pr-inputs.sh — Extract demo URL, Figma URL, and copy-doc URL from a GitHub PR
#
# Usage:
#   ./parse-pr-inputs.sh <PR_URL>
#   ./parse-pr-inputs.sh https://github.com/canonical/ubuntu.com/pull/16495
#
# Output: JSON with demo_urls, figma_url, figma_node_id, copydoc_url, pr metadata.
#
# Detection is domain-based and position-agnostic — it scans the whole PR body
# regardless of which section the links appear in. Reading a public PR needs no
# write access to the target repo. URL extraction is done in Python so this works
# on both GNU (Ubuntu CI) and BSD (macOS) systems.

set -euo pipefail

PR_URL="${1:-}"
if [[ -z "$PR_URL" ]]; then
  echo "Usage: $0 <PR_URL>" >&2
  exit 1
fi

if [[ "$PR_URL" =~ github\.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
  OWNER="${BASH_REMATCH[1]}"; REPO="${BASH_REMATCH[2]}"; PR_NUMBER="${BASH_REMATCH[3]}"
else
  echo "Error: expected https://github.com/{owner}/{repo}/pull/{number}" >&2
  exit 1
fi

command -v gh >/dev/null || { echo "Error: gh CLI required" >&2; exit 1; }

PR_BODY=$(gh pr view "$PR_NUMBER" --repo "${OWNER}/${REPO}" --json body --jq '.body')

PR_URL="$PR_URL" PR_NUMBER="$PR_NUMBER" REPO="${OWNER}/${REPO}" python3 - "$PR_BODY" <<'PY'
import os, re, sys, json

body = sys.argv[1] if len(sys.argv) > 1 else ""
stop = r'[^\s)\]"<>]'  # URL chars: stop at whitespace, ), ], ", <, >

def find_all(pattern):
    return sorted(set(re.findall(pattern, body)))

def find_one(pattern):
    m = re.findall(pattern, body)
    return m[0] if m else None

demo_urls = find_all(r'https?://[a-zA-Z0-9._-]+\.demos\.haus' + stop + '*')
figma_url = find_one(r'https?://(?:www\.)?figma\.com/design/' + stop + '*')
copydoc_url = find_one(r'https?://docs\.google\.com/document/' + stop + '*')

figma_node_id = None
if figma_url:
    m = re.search(r'node-id=([0-9]+-[0-9]+)', figma_url)
    if m:
        figma_node_id = m.group(1)

print(json.dumps({
    "pr_url": os.environ["PR_URL"],
    "pr_number": os.environ["PR_NUMBER"],
    "repo": os.environ["REPO"],
    "demo_urls": demo_urls,
    "figma_url": figma_url,
    "figma_node_id": figma_node_id,
    "copydoc_url": copydoc_url,
}, indent=2))
PY
