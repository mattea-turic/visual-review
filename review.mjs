import Anthropic from '@anthropic-ai/sdk';
import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { ANTHROPIC_API_KEY, GITHUB_TOKEN, FIGMA_TOKEN, PR_NUMBER, REPO, GITHUB_RUN_ID, GITHUB_STEP_SUMMARY } = process.env;
const [owner, repoName] = REPO.split('/');

async function ghFetch(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: opts.accept ?? 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`GitHub ${path}: ${res.status} ${await res.text()}`);
  return opts.raw ? res.text() : res.json();
}

async function react(commentId, content) {
  await ghFetch(`/repos/${owner}/${repoName}/issues/comments/${commentId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// Find the triggering comment so we can react to it
const comments = await ghFetch(`/repos/${owner}/${repoName}/issues/${PR_NUMBER}/comments`);
const triggerComment = [...comments].reverse().find(c => c.body.trim() === '/visual-review');
if (triggerComment) await react(triggerComment.id, 'eyes');

// Fetch PR info and diff
console.log('Fetching PR info...');
const pr = await ghFetch(`/repos/${owner}/${repoName}/pulls/${PR_NUMBER}`);
const diff = await ghFetch(`/repos/${owner}/${repoName}/pulls/${PR_NUMBER}`, {
  raw: true,
  accept: 'application/vnd.github.diff',
});

// Extract preview URL (*.demos.haus or pr-preview style)
const previewMatch = pr.body?.match(/https?:\/\/[^\s)"]+\.demos\.haus[^\s)"']*/);
const previewUrl = previewMatch?.[0];

// Extract Figma URL
const figmaMatch = pr.body?.match(
  /https?:\/\/(?:www\.)?figma\.com\/design\/([A-Za-z0-9]+)[^?\s"']*\?[^"'\s]*node-id=([\d]+-[\d]+)/
);

// Take responsive screenshots
const screenshots = [];
if (previewUrl) {
  console.log(`Taking screenshots of ${previewUrl}...`);
  const browser = await chromium.launch();
  for (const { name, width, height } of [
    { name: 'mobile', width: 375, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 900 },
  ]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });
    try {
      await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3000);
      const buf = await page.screenshot();
      screenshots.push({ name, width, data: buf.toString('base64') });
      console.log(`  captured ${name} (${width}px)`);
    } catch (e) {
      console.warn(`  screenshot failed for ${name}: ${e.message}`);
    }
    await page.close();
  }
  await browser.close();
}

// Fetch Figma design image via REST API
let figmaImageB64 = null;
if (figmaMatch && FIGMA_TOKEN) {
  console.log('Fetching Figma design...');
  const [, fileKey, rawNodeId] = figmaMatch;
  const nodeId = rawNodeId.replace('-', ':');
  try {
    const res = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=1`,
      { headers: { 'X-Figma-Token': FIGMA_TOKEN } }
    );
    const { images, err } = await res.json();
    if (err) throw new Error(err);
    const imgUrl = images[nodeId] ?? images[rawNodeId] ?? Object.values(images)[0];
    if (imgUrl) {
      const imgBuf = await fetch(imgUrl).then(r => r.arrayBuffer());
      figmaImageB64 = Buffer.from(imgBuf).toString('base64');
      console.log('  Figma image fetched');
    }
  } catch (e) {
    console.warn(`  Figma fetch failed: ${e.message}`);
  }
}

// Build Claude prompt
const skillMd = readFileSync(join(__dirname, 'visual-review.md'), 'utf-8');
const promptBody = skillMd.replace(/^---[\s\S]*?---\n+/, '');

const system = `${promptBody}

---
All data has been pre-gathered and is in the user message below.
Skip the data-gathering steps (Step 0, screenshot commands) and go straight to the checks and write-up.
${!figmaImageB64 ? 'No Figma token was available — fall back to pattern-first checks and note the missing comparison.' : ''}
${screenshots.length === 0 ? 'No preview URL was found in the PR — note this and ask the author to confirm responsive behaviour manually.' : ''}`;

const content = [
  {
    type: 'text',
    text: `PR: ${pr.html_url}
Author: @${pr.user.login}
Title: ${pr.title}

PR Description:
${pr.body ?? '(no description)'}

Diff:
\`\`\`diff
${diff.slice(0, 15000)}${diff.length > 15000 ? '\n… (truncated)' : ''}
\`\`\``,
  },
];

if (figmaImageB64) {
  content.push({ type: 'text', text: 'Figma design frame:' });
  content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: figmaImageB64 } });
}

for (const { name, width, data } of screenshots) {
  content.push({ type: 'text', text: `Screenshot — ${name} (${width}px):` });
  content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data } });
}

// Call Claude
console.log('Running visual review with Claude...');
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system,
  messages: [{ role: 'user', content }],
});

const review = response.content[0].text;

// Write draft to Actions run summary so the user can copy it
const runUrl = `https://github.com/${owner}/${repoName}/actions/runs/${GITHUB_RUN_ID}`;
appendFileSync(GITHUB_STEP_SUMMARY, `## Visual review draft\n\n${review}\n`);

// Post a small notification comment (not the review itself)
console.log('Posting draft-ready notification...');
await ghFetch(`/repos/${owner}/${repoName}/issues/${PR_NUMBER}/comments`, {
  method: 'POST',
  body: JSON.stringify({
    body: `📝 **Visual review draft is ready** — [click here to view and copy it](${runUrl}), then paste into the comment box below and edit before submitting.`,
  }),
});

if (triggerComment) await react(triggerComment.id, 'rocket');
console.log('Done!');
