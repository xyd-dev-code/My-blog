#!/usr/bin/env node
// Create branch + MDX skeleton + open PR
// Usage: SLUG=foo TITLE=Bar CATEGORY=数据库 TAGS_JSON='["a","b"]' POINTS_BODY="..." ISSUE_NUMBER=42 ISSUE_URL=https://... GH_TOKEN=... GITHUB_REPOSITORY=owner/repo node generate-skeleton.mjs

import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const slug = process.env.SLUG;
const title = process.env.TITLE;
const category = process.env.CATEGORY;
const tagsJson = process.env.TAGS_JSON || '[]';
const pointsBody = process.env.POINTS_BODY || '';
const issueNumber = process.env.ISSUE_NUMBER;
const issueUrl = process.env.ISSUE_URL;
const repo = process.env.GITHUB_REPOSITORY;
const ghToken = process.env.GH_TOKEN;

if (!slug || !title || !category || !issueNumber || !repo || !ghToken) {
  console.error('Missing required env: SLUG, TITLE, CATEGORY, ISSUE_NUMBER, GITHUB_REPOSITORY, GH_TOKEN');
  process.exit(1);
}

const tags = JSON.parse(tagsJson);
const tagsYaml = tags.length ? `[${tags.map((t) => `"${t}"`).join(', ')}]` : '[]';

const today = new Date().toISOString().slice(0, 10);

const mdx = `---
title: "${title.replace(/"/g, '\\"')}"
pubDate: ${today}
description: ""
category: "${category}"
tags: ${tagsYaml}
---

${pointsBody}

## 草稿

> 由 \`/blog-draft\` 命令生成的 AI 草稿粘贴到此处。参考骨架 Issue: ${issueUrl}

<!-- 本 PR 合并后,workflow 会把 Issue #${issueNumber} 标记为 topic-published -->
`;

const branch = `topic/${slug}`;
const filePath = `src/content/posts/${slug}.mdx`;

const env = { ...process.env, GH_TOKEN: ghToken };

try {
  execSync(`git checkout -b "${branch}"`, { stdio: 'inherit', env });
} catch (e) {
  console.error(`git checkout -b failed (branch may exist): ${e.message}`);
  process.exit(1);
}

writeFileSync(filePath, mdx, 'utf8');
console.log(`Wrote skeleton: ${filePath}`);

execSync(`git add "${filePath}"`, { stdio: 'inherit', env });
const commitMsg = `feat(posts): 骨架 - ${slug}\n\nRefs #${issueNumber}`;
execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit', env });
execSync(`git push -u origin "${branch}"`, { stdio: 'inherit', env });

// Write PR body to temp file to avoid shell-escaping issues
const tmpDir = mkdtempSync(join(tmpdir(), 'pr-body-'));
const bodyFile = join(tmpDir, 'body.md');
const prBody = `## 选题骨架

来自 Issue #${issueNumber}

${pointsBody}

## 下一步

1. 本地跑 \`/blog-draft ${issueNumber}\` 生成草稿
2. 粘贴到 \`${filePath}\` 的 "## 草稿" 部分
3. 调整 frontmatter(description/tags)
4. 合并 PR

合并后 workflow 会自动把 Issue 标记为 topic-published。
`;
writeFileSync(bodyFile, prBody, 'utf8');

const prJson = execSync(
  `gh pr create --base main --head "${branch}" --title "骨架 - ${slug}" --body-file "${bodyFile}" --repo "${repo}"`,
  { encoding: 'utf8', env }
).trim();

const prUrlMatch = prJson.match(/https:\/\/github\.com\/[^\s]+/);
const prUrl = prUrlMatch ? prUrlMatch[0] : prJson;

console.log(JSON.stringify({ branch, file_path: filePath, pr_url: prUrl }));