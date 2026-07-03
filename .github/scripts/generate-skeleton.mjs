#!/usr/bin/env node
// Create branch + MDX skeleton + open PR via GitHub REST API
// Usage: SLUG=foo TITLE=Bar CATEGORY=数据库 TAGS_JSON='["a","b"]' POINTS_BODY="..." ISSUE_NUMBER=42 ISSUE_URL=https://... GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node generate-skeleton.mjs

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
const token = process.env.GITHUB_TOKEN;

if (!slug || !title || !category || !issueNumber || !repo || !token) {
  console.error('Missing required env: SLUG, TITLE, CATEGORY, ISSUE_NUMBER, GITHUB_REPOSITORY, GITHUB_TOKEN');
  process.exit(1);
}

const [owner, repoName] = repo.split('/');
if (!owner || !repoName) {
  console.error(`Invalid GITHUB_REPOSITORY: ${repo}`);
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

// Configure git with GITHUB_TOKEN for push
const gitUrl = `https://x-access-token:${token}@github.com/${repo}.git`;

try {
  execSync(`git checkout -B "${branch}"`, { stdio: 'inherit' });
} catch (e) {
  console.error(`git checkout -B failed: ${e.message}`);
  process.exit(1);
}

writeFileSync(filePath, mdx, 'utf8');
console.log(`Wrote skeleton: ${filePath}`);

execSync('git config user.email "github-actions[bot]@users.noreply.github.com"', { stdio: 'inherit' });
execSync('git config user.name "github-actions[bot]"', { stdio: 'inherit' });
execSync(`git add "${filePath}"`, { stdio: 'inherit' });
const commitMsg = `feat(posts): 骨架 - ${slug}\n\nRefs #${issueNumber}`;
const commitMsgFile = join(tmpdir(), `commit-msg-${Date.now()}.txt`);
writeFileSync(commitMsgFile, commitMsg, 'utf8');
execSync(`git commit -F "${commitMsgFile}"`, { stdio: 'inherit' });
execSync(`git push -u --force-with-lease "${gitUrl}" "${branch}"`, { stdio: 'inherit' });

// Open PR via REST API
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

const prRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
  method: 'POST',
  headers: {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: `骨架 - ${slug}`,
    head: branch,
    base: 'main',
    body: prBody,
  }),
});

if (!prRes.ok) {
  const text = await prRes.text();
  console.error(`PR create failed (${prRes.status}): ${text}`);
  process.exit(1);
}

const pr = await prRes.json();
console.log(JSON.stringify({ branch, file_path: filePath, pr_url: pr.html_url }));