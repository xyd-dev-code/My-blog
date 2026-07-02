#!/usr/bin/env node
// Parse Issue body, extract YAML frontmatter + body sections
// Usage: echo "$ISSUE_BODY" | node parse-issue.mjs

const input = await new Promise((resolve) => {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (data += chunk));
  process.stdin.on('end', () => resolve(data));
});

const result = { slug: '', title: '', category: '', tags: [], estimated_words: 0, body_after_frontmatter: '', error: null };

// Match fenced YAML block (Issue template uses ```yaml ... ```)
const fencedMatch = input.match(/```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/);
if (!fencedMatch) {
  // Try bare --- style
  const bareMatch = input.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!bareMatch) {
    result.error = 'No YAML frontmatter found (neither fenced nor bare ---)';
    console.log(JSON.stringify(result));
    process.exit(1);
  }
  result.body_after_frontmatter = bareMatch[2];
  parseYaml(bareMatch[1], result);
} else {
  // Find the body content after the fenced block
  const fenceEnd = input.indexOf(fencedMatch[0]) + fencedMatch[0].length;
  result.body_after_frontmatter = input.slice(fenceEnd).trim();
  parseYaml(fencedMatch[1], result);
}

if (!result.slug || !result.title) {
  result.error = `Missing required field (slug=${result.slug}, title=${result.title})`;
  console.log(JSON.stringify(result));
  process.exit(1);
}

console.log(JSON.stringify(result));

function parseYaml(yaml, target) {
  const lines = yaml.split('\n');
  let inTags = false;
  for (const line of lines) {
    if (inTags) {
      const tagMatch = line.match(/^\s*-\s*(.+?)\s*$/);
      if (tagMatch) {
        target.tags.push(tagMatch[1].trim());
        continue;
      }
      inTags = false;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (key === 'tags') {
      // Inline array: [a, b, c]
      const inline = value.match(/^\[(.*)\]$/);
      if (inline) {
        target.tags = inline[1].split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        inTags = true; // multi-line list follows
      }
    } else if (key === 'estimated_words') {
      target.estimated_words = parseInt(value.trim(), 10) || 0;
    } else if (key === 'slug' || key === 'title' || key === 'category') {
      target[key] = value.trim();
    }
  }
}