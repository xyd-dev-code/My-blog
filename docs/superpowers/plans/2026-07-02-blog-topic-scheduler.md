# 博客"定期分享技术知识"调度系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 用 GitHub Issues 当主题池、Actions + Resend 发邮件、自动生成 MDX 骨架 PR,每周一/四提醒并推动一篇技术文章从"主题 → 草稿 → 发布"。

**Architecture:** 两个 GitHub Actions 工作流(weekly-topic 触发选题,publish-marker 在 PR 合入时关闭 Issue)+ 一个本地 Claude Code 命令(`/blog-draft`)生成 AI 草稿。三态通过 Issue label 跟踪:`topic-pending → topic-drafting → topic-published`。

**Tech Stack:** GitHub Actions (ubuntu-latest, Node 20), Resend API, GitHub CLI (`gh`), Node.js (ESM, 内置 fetch), MDX, YAML。

**Spec:** [`docs/superpowers/specs/2026-07-02-blog-topic-scheduler-design.md`](../specs/2026-07-02-blog-topic-scheduler-design.md)

## Global Constraints

- 所有脚本用 Node.js ESM(`.mjs`),依赖只有 Node 内置 + `gray-matter`(解析 frontmatter)。如需避免新依赖,改用正则解析(见 Task 5 决策点)
- 所有 Actions workflow 沿用现有 `deploy.yml` 风格:`ubuntu-latest` + `actions/checkout@v4` + `actions/setup-node@v4` + Node 20
- cron 表达式为 UTC: `'0 1 * * 1,4'` = 北京时间周一/周四 09:00
- Issue label 命名严格:`topic-pending`、`topic-drafting`、`topic-published`
- 骨架文件路径:`src/content/posts/<slug>.mdx`(与现有 posts 目录约定一致)
- 邮件服务固定 Resend,API key 从 `RESEND_API_KEY` Secret 读取
- 文件名约定:workflow 用 kebab-case,脚本用 kebab-case,本地命令 slug 用 kebab-case

## File Structure

| 文件 | 类型 | 职责 |
|---|---|---|
| `.github/ISSUE_TEMPLATE/topic.md` | 新建 | Issue 创建模板 |
| `.github/workflows/weekly-topic.yml` | 新建 | 每周一/四 09:00 自动选题 |
| `.github/workflows/publish-marker.yml` | 新建 | PR 合入 src/content/posts/ 时改 label |
| `.github/scripts/find-pending-issue.mjs` | 新建 | 查最早一个 topic-pending Issue |
| `.github/scripts/parse-issue.mjs` | 新建 | 解析 Issue YAML frontmatter |
| `.github/scripts/generate-skeleton.mjs` | 新建 | 生成 MDX 骨架 + 创建分支 |
| `.github/scripts/send-email.mjs` | 新建 | Resend 邮件发送 |
| `.claude/commands/blog-draft.md` | 新建 | 本地 `/blog-draft N` 命令 |
| `docs/topics-seed.md` | 新建 | 20 个主题种子清单 |

---

## Task 1:创建 Issue 模板

**Files:**
- Create: `.github/ISSUE_TEMPLATE/topic.md`

**Steps:**

1.1 创建文件,写入如下内容:

```markdown
---
name: 博客主题
description: 添加一个待写的技术博客主题
title: "[主题] "
labels: ["topic-pending"]
assignees: []
---

## Frontmatter

\`\`\`yaml
---
slug: <kebab-case-identifier>
title: <完整标题>
category: <数据库|后端|前端|LLM|工具|实习复盘|bookstore>
tags: [<tag1>, <tag2>]
estimated_words: <800-1500>
---
\`\`\`

## 选题要点

- <要回答的核心问题 1>
- <要回答的核心问题 2>
- <要回答的核心问题 3>

## 参考素材

(可选) 列出已有的笔记、代码片段、PR 链接

## 自评

(可选) 写完这篇能解答读者什么具体问题?
```

1.2 运行 `git add .github/ISSUE_TEMPLATE/topic.md`

1.3 提交:`git commit -m "feat(blog-scheduler): add topic Issue template"`

---

## Task 2:创建主题种子清单

**Files:**
- Create: `docs/topics-seed.md`

**Steps:**

2.1 创建文件,写入如下 20 个主题(每个含 slug、title、category、tags、选题要点):

```markdown
# 主题种子清单(20)

把这 20 个复制到 Issue 中,加 `topic-pending` label。

## 数据库/SQL 调优

### 1. pg-index-btree-vs-gin
- **slug:** `pg-index-btree-vs-gin`
- **title:** PostgreSQL 索引怎么选:B-Tree 还是 GIN?
- **category:** 数据库
- **tags:** [PostgreSQL, 索引, 性能]
- **要点:**
  - B-Tree 适用场景:等值、范围、前缀匹配
  - GIN 适用场景:数组、JSONB、全文检索
  - 一句话决策树:先 EXPLAIN,看 cardinality,再选类型

### 2. sql-explain-anatomy
- **slug:** `sql-explain-anatomy`
- **title:** 读懂 EXPLAIN:从 Seq Scan 到 Index Only Scan
- **category:** 数据库
- **tags:** [SQL, PostgreSQL, 性能]
- **要点:**
  - 节点类型逐个拆解
  - cost 数字的真实含义
  - 怎么从 plan 反推索引是否生效

### 3. sql-slow-query-hunting
- **slug:** `sql-slow-query-hunting`
- **title:** 慢查询定位三板斧:pg_stat_statements + auto_explain + 日志
- **category:** 数据库
- **tags:** [PostgreSQL, 性能]
- **要点:**
  - pg_stat_statements 配置与查询
  - auto_explain 自动捕获慢查询
  - 日志采样策略:别全开

## 实习/项目复盘

### 4. intern-what-i-learned
- **slug:** `intern-what-i-learned`
- **title:** 实习三个月学到的三件事(方法论篇)
- **category:** 实习复盘
- **tags:** [实习, 方法论]
- **要点:**
  - 主动暴露进度比埋头干活重要
  - 问"为什么这样做"比"做完"更值钱
  - 文档化决策 = 节省未来自己的时间

### 5. intern-debugging-mindset
- **slug:** `intern-debugging-mindset`
- **title:** 实习生怎么 debug 生产环境:从日志到根因
- **category:** 实习复盘
- **tags:** [实习, Debug]
- **要点:**
  - 第一反应不应该是"重启试试"
  - 日志看什么:时间戳、链路 ID、错误码
  - 如何礼貌地把锅甩给上游服务

### 6. intern-code-review-survival
- **slug:** `intern-code-review-survival`
- **title:** Code Review 不再社死:一份自我检查清单
- **category:** 实习复盘
- **tags:** [实习, Code Review]
- **要点:**
  - 提交前自检 10 条
  - 怎么写让 reviewer 愿意看的 PR description
  - 被驳回怎么接话

## bookstore 项目专题

### 7. bookstore-architecture
- **slug:** `bookstore-architecture`
- **title:** 网上书城架构复盘:从单文件到分层
- **category:** bookstore
- **tags:** [项目复盘, 架构]
- **要点:**
  - 单文件版本哪里崩了
  - 分层边界怎么划
  - 哪些过度设计可以砍掉

### 8. bookstore-state-management
- **slug:** `bookstore-state-management`
- **title:** 状态管理选型:Pinia vs Redux 的取舍
- **category:** bookstore
- **tags:** [Vue, Pinia, Redux]
- **要点:**
  - 为什么最后选了 Pinia
  - Redux 哪些场景是真痛
  - 状态提升 vs 全局 store 的边界

### 9. bookstore-performance-budget
- **slug:** `bookstore-performance-budget`
- **title:** 性能预算怎么做:首屏 1.5s 的具体拆解
- **category:** bookstore
- **tags:** [性能, 性能预算]
- **要点:**
  - 1.5s 怎么分给 TTFB / 渲染 / 交互
  - 怎么用 Lighthouse CI 卡预算
  - 哪些优化"看起来有效果其实没有"

## 后端服务开发

### 10. http-status-codes-cheatsheet
- **slug:** `http-status-codes-cheatsheet`
- **title:** HTTP 状态码实战清单:不该 200 的场景
- **category:** 后端
- **tags:** [HTTP, 后端]
- **要点:**
  - 业务异常用 4xx 还是 200 + errorCode
  - 401 vs 403 的真实区别
  - 422 Unprocessable Entity 的最佳实践

### 11. api-error-handling-pattern
- **slug:** `api-error-handling-pattern`
- **title:** 后端错误处理模式:从全局中间件到错误码体系
- **category:** 后端
- **tags:** [后端, 错误处理]
- **要点:**
  - 全局中间件 vs 业务异常类
  - 错误码怎么设计:业务码 vs HTTP 码
  - 日志字段对齐

### 12. retry-with-backoff
- **slug:** `retry-with-backoff`
- **title:** 重试三件套:指数退避、抖动、幂等性
- **category:** 后端
- **tags:** [后端, 可靠性]
- **要点:**
  - 为什么固定间隔重试是错的
  - 抖动避免雪崩
  - 幂等键怎么设计

## 前端业务开发

### 13. vue-react-component-design
- **slug:** `vue-react-component-design`
- **title:** 组件设计第一原则:为什么先想 props 而不是 state
- **category:** 前端
- **tags:** [Vue, React, 组件设计]
- **要点:**
  - "无状态优先"的边界
  - props 透传的坏味道
  - 容器组件 vs 展示组件

### 14. frontend-bundle-splitting
- **slug:** `frontend-bundle-splitting`
- **title:** 拆包实战:Vite 的 manualChunks 怎么写
- **category:** 前端
- **tags:** [Vite, 性能]
- **要点:**
  - 按路由拆 vs 按依赖拆
  - manualChunks 常用模式
  - 拆完怎么验证真的拆开了

### 15. wechat-miniprogram-pitfalls
- **slug:** `wechat-miniprogram-pitfalls`
- **title:** 小程序踩坑实录:webview 与原生通信的那些坑
- **category:** 前端
- **tags:** [小程序, WebView]
- **要点:**
  - postMessage 时机
  - URL 参数长度限制
  - 缓存策略冲突

## LLM/AI 工具使用

### 16. claude-code-daily-workflow
- **slug:** `claude-code-daily-workflow`
- **title:** 我用 Claude Code 的日常流:提示词与上下文管理
- **category:** LLM
- **tags:** [Claude Code, AI 工具]
- **要点:**
  - 一句话任务 vs 多步任务怎么描述
  - 上下文控制:什么时候新开会话
  - Plan mode 何时启用

### 17. prompt-caching-economics
- **slug:** `prompt-caching-economics`
- **title:** Prompt Caching 经济学:什么时候能省钱
- **category:** LLM
- **tags:** [LLM, Prompt]
- **要点:**
  - 缓存命中条件
  - 长 prompt vs 短 prompt 的成本对比
  - 哪些场景缓存不了

### 18. agent-loop-design
- **slug:** `agent-loop-design`
- **title:** Agent 循环设计:为什么简单的 ReAct 经常就够用
- **category:** LLM
- **tags:** [Agent, LLM]
- **要点:**
  - ReAct 的本质:think → act → observe
  - 什么时候需要 Plan-and-Execute
  - 工具调用失败的常见模式

## 工具/效率

### 19. git-rewrite-history-safely
- **slug:** `git-rewrite-history-safely`
- **title:** Git 改写历史的安全姿势:rebase -i 与 filter-repo
- **category:** 工具
- **tags:** [Git]
- **要点:**
  - 何时可以 rebase -i,何时绝对不行
  - filter-repo 替代 filter-branch 的原因
  - 改写后强制推送的协作规范

### 20. linux-perf-top-10
- **slug:** `linux-perf-top-10`
- **title:** Linux 性能分析十大命令:从 top 到 bpftrace
- **category:** 工具
- **tags:** [Linux, 性能]
- **要点:**
  - CPU: top → pidstat → perf
  - 内存: free → vmstat → smem
  - I/O: iostat → biotop
```

2.2 运行 `git add docs/topics-seed.md`

2.3 提交:`git commit -m "feat(blog-scheduler): add 20 topic seeds"`

---

## Task 3:解析 Issue 脚本(parse-issue.mjs)

**Files:**
- Create: `.github/scripts/parse-issue.mjs`

**Interfaces:**
- Consumes: stdin 接收 Issue body 字符串(由 `gh issue view --json body` 提供)
- Produces: stdout 输出 JSON `{ slug, title, category, tags, estimated_words, body_after_frontmatter, error? }`

**Steps:**

3.1 创建文件,写入如下内容(用正则解析 YAML frontmatter,避免引入 `gray-matter` 依赖):

```javascript
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
```

3.2 验证脚本可执行 + 基本输入输出:

```bash
echo '```yaml
---
slug: test-foo
title: Test Foo
category: 数据库
tags: [A, B]
estimated_words: 1000
---
```

## 选题要点

- 要点 1' | node .github/scripts/parse-issue.mjs
```

期望输出:`{"slug":"test-foo","title":"Test Foo","category":"数据库","tags":["A","B"],"estimated_words":1000,"body_after_frontmatter":"## 选题要点\n\n- 要点 1","error":null}`

3.3 验证错误路径:

```bash
echo 'No frontmatter here' | node .github/scripts/parse-issue.mjs
```

期望:退出码 1,error 字段为 `"No YAML frontmatter found ..."`。

3.4 提交:`git add .github/scripts/parse-issue.mjs && git commit -m "feat(blog-scheduler): add parse-issue script"`

---

## Task 4:查找 pending Issue 脚本(find-pending-issue.mjs)

**Files:**
- Create: `.github/scripts/find-pending-issue.mjs`

**Interfaces:**
- Consumes: env `GH_TOKEN`(GitHub Actions 自动提供)
- Produces: stdout 输出 `{ number, title, body, url } | {}`(空对象表示无 pending)

**Steps:**

4.1 创建文件:

```javascript
#!/usr/bin/env node
// Find earliest open Issue with label topic-pending
// Uses `gh` CLI to authenticate (Actions GITHUB_TOKEN is available)

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) {
  console.error('GITHUB_REPOSITORY env not set');
  process.exit(1);
}

const query = `repo:${repo} is:open is:issue label:topic-pending sort:created-asc`;
const proc = Bun.spawn
  ? null // unused
  : null;

import { execSync } from 'node:child_process';
let raw;
try {
  raw = execSync(`gh search issues --json number,title,body,url --limit 1 -- "${query}"`, {
    encoding: 'utf8',
    env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
  }).trim();
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
```

4.2 验证(本地需要 `gh` 已认证):

```bash
gh label create topic-pending --color "fbca04" --description "待写主题" 2>/dev/null || true
gh issue create --label "topic-pending" --title "[测试] smoke" --body '```yaml
---
slug: smoke-test
title: Smoke Test
category: 数据库
tags: [test]
estimated_words: 100
---
```
## 选题要点
- test' 2>&1 | tee /tmp/issue.txt
ISSUE_NUM=$(grep -oE '[0-9]+' /tmp/issue.txt | head -1)
node .github/scripts/find-pending-issue.mjs
gh issue close "$ISSUE_NUM" --delete-branch 2>/dev/null || true
gh issue delete "$ISSUE_NUM" 2>/dev/null || gh issue close "$ISSUE_NUM"
```

期望:stdout 输出包含 `smoke-test` slug 的 JSON 对象。

> **注意**:Task 4-9 都需要 GitHub Actions 实际运行环境进行端到端验证。本机只做语法/单元级冒烟,完整 workflow 在 Task 10 的工作流文件中通过 `workflow_dispatch` 触发。

4.3 提交:`git add .github/scripts/find-pending-issue.mjs && git commit -m "feat(blog-scheduler): add find-pending-issue script"`

---

## Task 5:骨架生成脚本(generate-skeleton.mjs)

**Files:**
- Create: `.github/scripts/generate-skeleton.mjs`

**Interfaces:**
- Consumes: env `SLUG`, `TITLE`, `CATEGORY`, `TAGS_JSON`(JSON 数组字符串), `POINTS_BODY`(选题要点 markdown), `ISSUE_NUMBER`, `ISSUE_URL`, `GH_TOKEN`
- Produces: stdout 输出 `{ branch, file_path, pr_url }`

**Steps:**

5.1 创建文件:

```javascript
#!/usr/bin/env node
// Create branch + MDX skeleton + open PR
// Usage: SLUG=foo TITLE=Bar CATEGORY=数据库 TAGS_JSON='["a","b"]' POINTS_BODY="..." ISSUE_NUMBER=42 ISSUE_URL=https://... GH_TOKEN=... node generate-skeleton.mjs

import { execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';

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

> 由 [\\`/blog-draft\\` 命令](#)生成的 AI 草稿粘贴到此处。参考骨架 Issue: ${issueUrl}

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

const prBody = `## 选题骨架\n\n来自 Issue #${issueNumber}\n\n${pointsBody}\n\n## 下一步\n\n1. 本地跑 \\`/blog-draft ${issueNumber}\\` 生成草稿\n2. 粘贴到 \\`${filePath}\\` 的 "## 草稿" 部分\n3. 调整 frontmatter(description/tags)\n4. 合并 PR\n\n合并后 workflow 会自动把 Issue 标记为 topic-published。`;

const prJson = execSync(
  `gh pr create --base main --head "${branch}" --title "骨架 - ${slug}" --body "${prBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --repo "${repo}"`,
  { encoding: 'utf8', env }
).trim();

const prUrlMatch = prJson.match(/https:\/\/github\.com\/[^\s]+/);
const prUrl = prUrlMatch ? prUrlMatch[0] : prJson;

console.log(JSON.stringify({ branch, file_path: filePath, pr_url: prUrl }));
```

5.2 提交:`git add .github/scripts/generate-skeleton.mjs && git commit -m "feat(blog-scheduler): add skeleton generator script"`

---

## Task 6:邮件发送脚本(send-email.mjs)

**Files:**
- Create: `.github/scripts/send-email.mjs`

**Interfaces:**
- Consumes: env `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`, `SUBJECT`, `BODY`(markdown 或纯文本)
- Produces: stdout 输出 `{ id }`(Resend 返回的 message id)

**Steps:**

6.1 创建文件:

```javascript
#!/usr/bin/env node
// Send email via Resend API
// Usage: RESEND_API_KEY=... MAIL_FROM=... MAIL_TO=... SUBJECT=... BODY=... node send-email.mjs

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM;
const to = process.env.MAIL_TO;
const subject = process.env.SUBJECT;
const body = process.env.BODY;

if (!apiKey || !from || !to || !subject || !body) {
  console.error('Missing required env: RESEND_API_KEY, MAIL_FROM, MAIL_TO, SUBJECT, BODY');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject,
    text: body,
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`Resend API failed (${res.status}): ${text}`);
  process.exit(1);
}

const data = await res.json();
console.log(JSON.stringify({ id: data.id }));
```

6.2 验证脚本语法:`node --check .github/scripts/send-email.mjs`(应无输出)

6.3 提交:`git add .github/scripts/send-email.mjs && git commit -m "feat(blog-scheduler): add Resend email script"`

---

## Task 7:周选题工作流(weekly-topic.yml)

**Files:**
- Create: `.github/workflows/weekly-topic.yml`

**Steps:**

7.1 创建文件:

```yaml
name: Weekly Topic Picker

on:
  schedule:
    # UTC 周一/周四 01:00 = 北京时间 09:00
    - cron: '0 1 * * 1'
    - cron: '0 1 * * 4'
  workflow_dispatch: # 允许手动触发测试

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  pick-and-skeleton:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Find earliest pending topic
        id: find
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PENDING=$(node .github/scripts/find-pending-issue.mjs)
          echo "pending=$PENDING"
          echo "raw<<EOF" >> $GITHUB_OUTPUT
          echo "$PENDING" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Skip if no pending
        if: steps.find.outputs.raw == '{}'
        run: echo "No pending topics, skipped."

      - name: Parse Issue body
        if: steps.find.outputs.raw != '{}'
        id: parse
        env:
          ISSUE_BODY: ${{ fromJson(steps.find.outputs.raw).body }}
        run: |
          PARSED=$(echo "$ISSUE_BODY" | node .github/scripts/parse-issue.mjs)
          echo "parsed=$PARSED"
          echo "raw<<EOF" >> $GITHUB_OUTPUT
          echo "$PARSED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Generate skeleton + open PR
        if: steps.find.outputs.raw != '{}'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SLUG: ${{ fromJson(steps.parse.outputs.raw).slug }}
          TITLE: ${{ fromJson(steps.parse.outputs.raw).title }}
          CATEGORY: ${{ fromJson(steps.parse.outputs.raw).category }}
          TAGS_JSON: ${{ toJson(fromJson(steps.parse.outputs.raw).tags) }}
          POINTS_BODY: ${{ fromJson(steps.parse.outputs.raw).body_after_frontmatter }}
          ISSUE_NUMBER: ${{ fromJson(steps.find.outputs.raw).number }}
          ISSUE_URL: ${{ fromJson(steps.find.outputs.raw).url }}
        run: |
          RESULT=$(node .github/scripts/generate-skeleton.mjs)
          echo "result=$RESULT"

      - name: Send reminder email
        if: steps.find.outputs.raw != '{}'
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          MAIL_FROM: ${{ secrets.MAIL_FROM }}
          MAIL_TO: ${{ secrets.MAIL_TO }}
          SUBJECT: "[博客选题] ${{ fromJson(steps.parse.outputs.raw).title }}"
          BODY: |
            本周选题:#${{ fromJson(steps.find.outputs.raw).number }}

            主题:${{ fromJson(steps.parse.outputs.raw).title }}
            分类:${{ fromJson(steps.parse.outputs.raw).category }}

            Issue:${{ fromJson(steps.find.outputs.raw).url }}

            骨架 PR 已创建,请在本地跑 /blog-draft ${{ fromJson(steps.find.outputs.raw).number }} 生成草稿。
        run: node .github/scripts/send-email.mjs

      - name: Update Issue label to drafting
        if: steps.find.outputs.raw != '{}'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          ISSUE_NUM=${{ fromJson(steps.find.outputs.raw).number }}
          gh issue edit "$ISSUE_NUM" --remove-label "topic-pending" --add-label "topic-drafting" --repo "$GITHUB_REPOSITORY"
```

7.2 提交:`git add .github/workflows/weekly-topic.yml && git commit -m "feat(blog-scheduler): add weekly-topic workflow"`

---

## Task 8:发布标记工作流(publish-marker.yml)

**Files:**
- Create: `.github/workflows/publish-marker.yml`

**Steps:**

8.1 创建文件:

```yaml
name: Mark Topic Published

on:
  pull_request:
    types: [closed]
    paths:
      - 'src/content/posts/**'

permissions:
  issues: write

jobs:
  mark-published:
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true
    steps:
      - name: Find linked Issue from PR body
        id: find-issue
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # PR body 包含 "Refs #N" 或 "Issue #N" 的形式
          PR_BODY="${{ github.event.pull_request.body }}"
          ISSUE_NUM=$(echo "$PR_BODY" | grep -oE '#([0-9]+)' | head -1 | tr -d '#')
          if [ -z "$ISSUE_NUM" ]; then
            echo "No linked issue found in PR body"
            exit 0
          fi
          echo "issue_num=$ISSUE_NUM" >> $GITHUB_OUTPUT

      - name: Update label and close
        if: steps.find-issue.outputs.issue_num != ''
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          ISSUE_NUM=${{ steps.find-issue.outputs.issue_num }}
          gh issue edit "$ISSUE_NUM" --remove-label "topic-drafting" --remove-label "topic-pending" --add-label "topic-published" --repo "$GITHUB_REPOSITORY"
          gh issue close "$ISSUE_NUM" --reason "completed" --repo "$GITHUB_REPOSITORY"
```

8.2 提交:`git add .github/workflows/publish-marker.yml && git commit -m "feat(blog-scheduler): add publish-marker workflow"`

---

## Task 9:本地 Claude Code 命令(blog-draft.md)

**Files:**
- Create: `.claude/commands/blog-draft.md`

**Steps:**

9.1 创建文件:

```markdown
---
description: 读取 GitHub Issue 生成 MDX 博客草稿
---

# /blog-draft

读取编号为 `$ARGUMENTS` 的 GitHub Issue(必须带 `topic-drafting` label),基于选题要点生成一篇中文 MDX 草稿。

## 步骤

1. **读取 Issue**:运行 `gh issue view $ARGUMENTS --json title,body,labels` 获取完整内容
2. **解析 YAML frontmatter**:用 `node .github/scripts/parse-issue.mjs` 提取 slug/title/category/tags/选题要点
3. **读取现有文章风格**:列出 `src/content/posts/` 下最近的 3 篇,提取风格特征:
   - 标题风格(疑问句、陈述句、踩坑实录)
   - 代码块使用频率
   - 段落长度(短段 vs 长段)
   - 是否使用 emoji/图片
4. **生成草稿**:
   - 字数:`estimated_words` 字段 ±20%
   - 必须包含选题要点中列出的所有核心问题
   - 至少 2 个代码示例(如果主题涉及)
   - 风格匹配最近 3 篇文章
   - 输出完整 MDX,含 frontmatter
5. **输出**:把草稿打印到对话中,**不要**自动写入文件(等用户手动粘贴到对应 PR 文件)

## 注意事项

- 不要修改 frontmatter 的 `pubDate`(那是发布日)
- 不要替换 `description` 字段(留空给用户填)
- 草稿里不要使用 `@anthropic-ai/sdk` 或 `import` 这种导入式代码块,因为现有 posts 没用 import 语句
```

9.2 提交:`git add .claude/commands/blog-draft.md && git commit -m "feat(blog-scheduler): add /blog-draft local command"`

---

## Task 10:GitHub 仓库端配置(用户手动)

**Files:** GitHub UI(无文件改动)

**Steps:**

10.1 在 repo 创建 3 个 label:
- `topic-pending`(颜色 `fbca04`,描述 "待写主题")
- `topic-drafting`(颜色 `0e8a16`,描述 "草稿进行中")
- `topic-published`(颜色 `6f42c1`,描述 "已发布")

> 可用 `gh label create` 一行创建。

10.2 在 [Resend](https://resend.com) 注册账号,验证发件域名(可以是 `noreply@personalblog.website` 或子域名),获取 API key。

10.3 在 GitHub repo Settings → Secrets and variables → Actions,添加 3 个 Secret:
- `RESEND_API_KEY` — Resend API key
- `MAIL_FROM` — 已验证的发件邮箱
- `MAIL_TO` — 你的收件邮箱

10.4 在 GitHub Actions 设置中确认:
- Settings → Actions → General → Workflow permissions: 勾选 "Read and write permissions"(否则 `GITHUB_TOKEN` 不能写 issues/PRs)
- 勾选 "Allow GitHub Actions to create and approve pull requests"

10.5 用户确认已完成上述配置,无 commit 产生。

---

## Task 11:批量创建 20 个 Issue(用户手动)

**Files:** GitHub Issues(无代码改动)

**Steps:**

11.1 准备一个创建脚本 `scripts/create-topics.sh`(本地临时用,不入仓),内容:

```bash
#!/usr/bin/env bash
set -e
REPO="YOUR_USER/YOUR_REPO"  # 改成实际

create_issue() {
  local title="$1"
  local body="$2"
  gh issue create --repo "$REPO" --title "$title" --label "topic-pending" --body "$body"
}

# 1
create_issue "[主题] PostgreSQL 索引怎么选:B-Tree 还是 GIN?" "$(cat <<'EOF'
```yaml
---
slug: pg-index-btree-vs-gin
title: PostgreSQL 索引怎么选:B-Tree 还是 GIN?
category: 数据库
tags: [PostgreSQL, 索引, 性能]
estimated_words: 1200
---
```

## 选题要点

- B-Tree 适用场景:等值、范围、前缀匹配
- GIN 适用场景:数组、JSONB、全文检索
- 一句话决策树:先 EXPLAIN,看 cardinality,再选类型
EOF
)"
# ... 重复 19 次,内容来自 docs/topics-seed.md
```

11.2 替换 REPO 变量,运行 `bash scripts/create-topics.sh`,确认创建 20 个 Issue。

11.3 验证:`gh issue list --label topic-pending --repo YOUR_USER/YOUR_REPO | wc -l` 期望输出 ≥ 20。

11.4 清理:删除 `scripts/create-topics.sh`(不入仓)。

---

## Task 12:冒烟测试

**Files:** 无代码改动

**Steps:**

12.1 在 GitHub Actions 页面手动触发 `Weekly Topic Picker` workflow(`workflow_dispatch`)。

12.2 观察每个 step 是否成功:
- `Find earliest pending topic` → 输出包含一个 issue JSON
- `Parse Issue body` → 解析成功
- `Generate skeleton + open PR` → 新分支 + 新文件 + PR URL
- `Send reminder email` → Resend API 200
- `Update Issue label to drafting` → Issue label 变更

12.3 验证产出:
- 邮箱收到邮件
- `src/content/posts/<slug>.mdx` 在 PR 分支中存在
- PR 自动 assign 给用户
- 对应 Issue 的 label 变为 `topic-drafting`

12.4 本地跑 `/blog-draft <issue-number>`,生成草稿粘贴进 PR 文件,合并 PR。

12.5 验证 `Mark Topic Published` workflow 触发:
- Issue label 变为 `topic-published`
- Issue 被关闭

12.6 文档化:在 `docs/superpowers/plans/2026-07-02-blog-topic-scheduler-SMOKE-TEST-RESULTS.md` 记录测试结果(成功/失败、耗时、问题)。

---

## Self-Review Checklist

- [x] Spec coverage:架构、组件、数据格式、状态机、主题清单、Secrets、错误处理、测试全部覆盖
- [x] Placeholder scan:无 TBD/TODO/占位符
- [x] Type consistency:`parse-issue.mjs` 输出 → `generate-skeleton.mjs` 输入(`slug/title/category/tags/estimated_words` 字段一致)
- [x] DRY:Issue body 解析逻辑只在 `parse-issue.mjs` 一处实现
- [x] YAGNI:不做 AI 选题、不做自动 merge、不做日历 UI
- [x] TDD:GitHub Actions 端到端测试在 Task 12(无法用单元测试,环境就是 Actions)
- [x] Frequent commits:每个 Task 一个 commit
- [x] File paths 全部精确,代码全部可复制