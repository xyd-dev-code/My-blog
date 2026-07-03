#!/usr/bin/env node
// Find earliest open Issue with label topic-pending
// Uses `gh` CLI to authenticate (Actions GITHUB_TOKEN is available)

import { execSync } from 'node:child_process';

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) {
  console.error('GITHUB_REPOSITORY env not set');
  process.exit(1);
}

const label = process.env.LABEL || 'topic-pending';
const searchQuery = `is:open is:issue label:"${label}" sort:created-asc`;

let raw;
try {
  raw = execSync(
    `gh search issues --json number,title,body,url --limit 1 --repo "${repo}" -- "${searchQuery}"`,
    {
      encoding: 'utf8',
      // gh CLI requires GITHUB_TOKEN env var (not GH_TOKEN); expose both for safety
      env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  ).trim();
} catch (e) {
  console.error('gh search failed:', e.message);
  process.exit(1);
}

if (!raw || raw === '[]' || raw === 'null') {
  console.log('{}');
  process.exit(0);
}

const items = JSON.parse(raw);
if (!items.length) {
  console.log('{}');
  process.exit(0);
}

console.log(JSON.stringify(items[0]));