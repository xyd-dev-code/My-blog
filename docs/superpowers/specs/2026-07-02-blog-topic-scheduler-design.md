# 个人博客"定期分享技术知识"调度系统 — 设计文档

## 目标

让博客以每周两篇的节奏持续产出技术文章,自动化以下三件事:
1. **提醒**:到点发邮件提醒"该写哪个主题了"
2. **骨架生成**:自动在 `src/content/posts/` 生成包含 frontmatter + 选题要点的 MDX 文件
3. **状态追踪**:通过 GitHub Issue label 管理"待写/草稿中/已发布"三态

AI 草稿生成与本系统**解耦**——用户在自己的 Claude Code 中手动调用命令生成草稿,然后粘贴进 PR。

## 范围

### 包含

- GitHub Actions 工作流(每周一/四触发)
- Resend 邮件发送集成
- Issue 模板与 label 定义
- 骨架生成脚本(Node.js)
- 本地 Claude Code 命令 `/blog-draft <issue-number>`
- 初始主题池 20 个(七个领域)

### 不包含(YAGNI)

- AI 选题/主题推荐(本系统只消费预先准备好的主题)
- 自动 merge、自动部署
- 发布日历 UI(Issue 列表已足够)
- 多渠道分发(只邮件)
- 多用户/团队协作(单用户)
- 数据持久化(状态全靠 GitHub Issue)

## 架构

```
                  ┌──────────────────────┐
                  │  GitHub Issue 主题池   │
                  │  (label: pending)     │
                  └──────────┬───────────┘
                             │ 每周一/四 09:00 (Asia/Shanghai)
                             ▼
┌────────────────────────────────────────────────┐
│  GitHub Actions: weekly-topic.yml              │
│                                                │
│  1. gh api 查首个 label=topic-pending 的 Issue │
│  2. 调用 Resend API 发邮件到指定收件人          │
│  3. 调用骨架脚本,创建分支 + 写 MDX 骨架         │
│  4. 创建 PR(assign 给用户)                     │
│  5. 更新 Issue label: pending → drafting       │
└────────────┬───────────────────────────────────┘
             │  PR URL
             ▼
       用户收到邮件,打开 PR
             │
             │  本地 Claude Code 命令
             ▼
┌────────────────────────────────────────────────┐
│  /blog-draft <issue-number>                    │
│  读取 Issue → 生成 MDX 草稿 → 输出到剪贴板/终端│
└────────────┬───────────────────────────────────┘
             │  用户粘贴草稿到 PR 文件
             ▼
       PR 合并 → Actions 触发 publish-marker.yml
             │  PR 路径匹配 src/content/posts/* 时
             ▼
       Issue label: drafting → published,关闭 Issue
```

## 组件

| 组件 | 路径 | 作用 |
|---|---|---|
| 主题 Issue 模板 | `.github/ISSUE_TEMPLATE/topic.md` | 标准化主题创建 |
| 工作流:周选题 | `.github/workflows/weekly-topic.yml` | 每周一/四 09:00 触发 + 支持手动 dispatch |
| 工作流:发布标记 | `.github/workflows/publish-marker.yml` | PR 合入 `src/content/posts/` 时改 Issue label |
| 骨架生成脚本 | `.github/scripts/generate-skeleton.mjs` | 用 Issue 内容生成 MDX 骨架 |
| Resend 调用封装 | `.github/scripts/send-email.mjs` | 邮件发送逻辑 |
| Claude 命令 | `.claude/commands/blog-draft.md` | 本地命令 `/blog-draft N` |
| 主题清单(种子) | `docs/topics-seed.md` | 20 个初始主题,用户据此创建 Issue |

## 数据格式

### Issue body(YAML frontmatter 风格)

```yaml
---
slug: pg-index-btree-vs-gin
title: PostgreSQL 索引怎么选:B-Tree 还是 GIN?
category: 数据库
tags: [PostgreSQL, 索引, 性能]
estimated_words: 1200
---

## 选题要点

- 什么时候用 B-Tree,什么时候 GIN?
- 复合索引的最左前缀陷阱
- 一句话决策树:先 EXPLAIN,看 cardinality,再选类型

## 参考素材

(可选) 列出你已有的笔记/代码片段/PR 链接

## 自评

(可选) 这篇写完能解答读者什么具体问题?
```

### 生成的 MDX 骨架

```mdx
---
title: "PostgreSQL 索引怎么选:B-Tree 还是 GIN?"
pubDate: 2026-07-07
description: ""
category: 数据库
tags: [PostgreSQL, 索引, 性能]
---

## 选题要点

(从 Issue body 复制)

## 草稿

(由 /blog-draft 命令生成,粘贴到此处)
```

## 触发与状态

### cron 表达式(UTC,时区独立)

GitHub Actions cron 解释为 UTC。我们想要北京时间周一/周四 09:00 → UTC 01:00:

```yaml
schedule:
  - cron: '0 1 * * 1'    # UTC 周一 01:00 = 北京周一 09:00
  - cron: '0 1 * * 4'    # UTC 周四 01:00 = 北京周四 09:00
```

不依赖 `TZ` 环境变量,行为跨 runner 一致。

### 状态机

```
[无]──创建 Issue──▶ topic-pending
                       │
                       │  weekly-topic.yml 触发
                       ▼
                  topic-drafting
                       │
                       │  publish-marker.yml(PR 合入)
                       ▼
                  topic-published(Issue close)
```

## 主题池(20 个,七大领域)

### 数据库/SQL 调优(3)
1. `pg-index-btree-vs-gin` — PostgreSQL 索引怎么选:B-Tree 还是 GIN?
2. `sql-explain-anatomy` — 读懂 EXPLAIN:从 Seq Scan 到 Index Only Scan
3. `sql-slow-query-hunting` — 慢查询定位三板斧:pg_stat_statements + auto_explain + 日志

### 实习/项目复盘(3)
4. `intern-what-i-learned` — 实习三个月学到的三件事(方法论篇)
5. `intern-debugging-mindset` — 实习生怎么 debug 生产环境:从日志到根因
6. `intern-code-review-survival` — Code Review 不再社死:一份自我检查清单

### bookstore 项目专题(3)
7. `bookstore-architecture` — 网上书城架构复盘:从单文件到分层
8. `bookstore-state-management` — 状态管理选型:Pinia vs Redux 的取舍
9. `bookstore-performance-budget` — 性能预算怎么做:首屏 1.5s 的具体拆解

### 后端服务开发(3)
10. `http-status-codes-cheatsheet` — HTTP 状态码实战清单:不该 200 的场景
11. `api-error-handling-pattern` — 后端错误处理模式:从全局中间件到错误码体系
12. `retry-with-backoff` — 重试三件套:指数退避、抖动、幂等性

### 前端业务开发(3)
13. `vue-react-component-design` — 组件设计第一原则:为什么先想 props 而不是 state
14. `frontend-bundle-splitting` — 拆包实战:Vite 的 manualChunks 怎么写
15. `wechat-miniprogram-pitfalls` — 小程序踩坑实录:webview 与原生通信的那些坑

### LLM/AI 工具使用(3)
16. `claude-code-daily-workflow` — 我用 Claude Code 的日常流:提示词与上下文管理
17. `prompt-caching-economics` — Prompt Caching 经济学:什么时候能省钱
18. `agent-loop-design` — Agent 循环设计:为什么简单的 ReAct 经常就够用

### 工具/效率(2)
19. `git-rewrite-history-safely` — Git 改写历史的安全姿势:rebase -i 与 filter-repo
20. `linux-perf-top-10` — Linux 性能分析十大命令:从 top 到 bpftrace

> 用户可根据实际写过的情况删除/补充,以及把已写过的 ID 加上 `topic-published` label 跳过。

## 安全与权限

### Secrets

| Secret | 用途 | 范围 |
|---|---|---|
| `RESEND_API_KEY` | 邮件发送 | Actions |
| `MAIL_TO` | 收件邮箱 | Actions |
| `MAIL_FROM` | 发件邮箱(需在 Resend 域名验证) | Actions |

### 权限

工作流用 `permissions: { issues: write, contents: write, pull-requests: write }`,最小授权。

## 错误处理

| 场景 | 行为 |
|---|---|
| 没有 `topic-pending` Issue | workflow 正常结束,留一行 log "no pending topics, skipped" |
| Resend API 失败 | workflow fail,红色 ✗,用户重跑 |
| Issue body 格式不合法(无 frontmatter) | workflow fail,在该 Issue 评论一条错误信息 |
| 骨架文件已存在(同日重复 slug) | 分支名加时间戳 `topic/<slug>-<YYYYMMDD-HHMM>` |
| `gh api` 调用失败 | workflow fail |
| PR 创建冲突 | 同上,加时间戳 |

## 验证(测试计划)

### 冒烟测试

1. 创建 1 个 `topic-pending` Issue,手动 `workflow_dispatch`,跑通:
   - 收到邮件 ✓
   - `src/content/posts/<slug>.mdx` 出现 ✓
   - PR 创建 ✓
   - Issue label 变更 ✓

### 边界测试

2. 关闭所有 pending Issue,触发 workflow,期望:正常结束 + log "skipped"
3. 创建格式错误的 Issue(无 frontmatter),触发 workflow,期望:fail + Issue 评论
4. 合并 PR 到 main,期望:对应 Issue label 变 `topic-published` 并 close

### 集成测试

5. 完整链路:创建 Issue → 触发 → 邮件 → PR → 本地 `/blog-draft` → 粘贴 → 合 PR → Issue 自动关闭

## 实现步骤(将转 plan)

1. 在 GitHub repo 创建 5 个 label:`topic-pending`、`topic-drafting`、`topic-published`、`topic-blocked`(预留)、`topic`(预筛)
2. 创建 `.github/ISSUE_TEMPLATE/topic.md`
3. 创建 `docs/topics-seed.md`,列出 20 个主题
4. 用户手动把 20 个主题创建为 Issue(可以批量用 `gh issue create`)
5. 编写 `.github/scripts/generate-skeleton.mjs`
6. 编写 `.github/scripts/send-email.mjs`
7. 编写 `.github/workflows/weekly-topic.yml`
8. 编写 `.github/workflows/publish-marker.yml`
9. 在 Resend 注册账号,验证发件域名,生成 API key
10. 在 GitHub repo Settings → Secrets 配置 `RESEND_API_KEY`、`MAIL_TO`、`MAIL_FROM`
11. 创建 `.claude/commands/blog-draft.md`
12. 跑一遍冒烟测试