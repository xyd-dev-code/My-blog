#!/usr/bin/env node
// Find earliest open Issue with label topic-pending
// Uses GitHub REST API with GITHUB_TOKEN (auto-injected by Actions)

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) {
  console.error('GITHUB_REPOSITORY env not set');
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN env not set');
  process.exit(1);
}

const label = process.env.LABEL || 'topic-pending';
const [owner, repoName] = repo.split('/');

// Use REST API: GET /repos/{owner}/{repo}/issues?labels={label}&state=open&direction=asc&sort=created
// direction=asc + sort=created gives us earliest first
const url = `https://api.github.com/repos/${owner}/${repoName}/issues?labels=${encodeURIComponent(label)}&state=open&sort=created&direction=asc&per_page=1`;

const res = await fetch(url, {
  headers: {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

if (!res.ok) {
  const text = await res.text();
  console.error(`GitHub API failed (${res.status}): ${text}`);
  process.exit(1);
}

const issues = await res.json();
if (!Array.isArray(issues) || issues.length === 0) {
  console.log('{}');
  process.exit(0);
}

const it = issues[0];
console.log(JSON.stringify({
  number: it.number,
  title: it.title,
  body: it.body || '',
  url: it.html_url,
}));