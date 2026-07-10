# XiaoyouDong · Tech Blog

> 一个晴空主题的个人技术博客——记录学习、踩坑与项目复盘。

![astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro&logoColor=white)
![tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)
![deploy](https://img.shields.io/badge/Deploy-GitHub_Pages-222?logo=githubpages&logoColor=white)
![license](https://img.shields.io/badge/License-MIT-0ea5e9)

🔗 访问：<https://www.personalblog.website/>

## 特性

- ☁️ **晴空主题** — 自研 Tailwind 调色板（`sky` 蓝 + `cloud` 白 + `sun` 金 + `leaf` 绿），衬线标题 `Fraunces` + 正文 `Inter`
- ⚡ **Astro 5 SSG** — Islands 架构，构建产物 86 页 ≈ 1.7s
- 📝 **MDX 文章** — `src/content/posts/` 34 篇；`src/content/projects/` 3 个项目
- 🔍 **Pagefind 全文搜索** — `Cmd/Ctrl + K` 唤起（侧栏搜索 + 命令面板）
- 🧭 **自动 TOC** — 文章页右侧滚动同步高亮
- 🌈 **代码霓虹高亮** — Shiki + `github-dark-dimmed` 主题（rehype-pretty-code）
- 📊 **文章排序切换** — `/posts` 页支持「最新优先 / 开篇优先」两模式，跨页联动（客户端 JS 重排 + localStorage 持久化）
- 🏷️ **标签过滤** — `STOP_TAGS`（`src/consts.ts`）集中过滤非技术标签；点击任意标签跳 `/tags/[tag]`
- 🚀 **一键部署** — push `main` → GitHub Actions → GitHub Pages

## 目录结构

```
src/
├── components/         # UI 组件
│   ├── Background.astro      # 云朵 + 光晕 SVG
│   ├── CardCursor.astro      # 3D 卡片倾斜光标
│   ├── Comments.astro        # Giscus（占位，未启用）
│   ├── Enhance.astro         # PWA / SEO 增强
│   ├── Footer.astro
│   ├── Header.astro
│   ├── PostMeta.astro        # 文章元信息（日期/字数/阅读时长）
│   ├── ProjectCard.astro
│   ├── Search.astro          # Pagefind 命令面板
│   └── TOC.astro             # 右侧目录
├── content/
│   ├── posts/                # 34 篇文章 (MDX)
│   ├── projects/             # 3 个项目 (MDX): bookstore, mall, zhikao-cloud
│   └── config.ts             # zod schema：posts (title/pubDate/tags/...) + projects (title/pubDate/endDate/tags/repo/featured/relatedPosts)
├── layouts/
│   ├── BaseLayout.astro      # 全站通用（OG/Twitter/字体）
│   └── PostLayout.astro      # 文章专用（TOC/PostMeta/阅读时长）
├── pages/
│   ├── index.astro           # 首页：hero + 最近 3 篇
│   ├── about.astro           # config-style about（4 项 key:value）
│   ├── posts/
│   │   ├── [...slug].astro   # 文章详情
│   │   └── [...page].astro   # 文章列表（分页 + 排序切换）
│   ├── projects/
│   │   ├── [...slug].astro   # 项目详情（含 relatedPosts 卡片）
│   │   └── index.astro       # 项目列表（featured 优先）
│   ├── tags/
│   │   ├── [tag].astro       # 按 tag 筛文章
│   │   └── index.astro       # 标签索引
├── styles/global.css         # tokens + prose + paper-card + cubic-bezier
└── consts.ts                 # SITE / NAV / POSTS_PER_PAGE / STOP_TAGS / filterTags()
```

## 写一篇新文章

### 直接创建 MDX

```bash
# 1. 在 posts/ 下新建文件
touch src/content/posts/2026-07-03-my-new-post.mdx
```

```mdx
---
title: "你的标题"
description: "副标题 / 摘要"
pubDate: 2026-07-03
tags: ["topic", "category"]
draft: false                # true 时仅 dev 显示，不发布
cover: "https://..."        # 可选：列表页头图
---

## 第一段

正文，支持 Markdown + MDX。
```

`pubDate` 决定排序：`/posts` 默认 desc（最新在前），可切换 asc（开篇在前）。

### 标签约定

`src/consts.ts` 的 `STOP_TAGS` 集中列出**非技术标签**（"实习"、"项目"、"入门"、"笔记"、"踩坑"等），这些标签**不会出现在标签云**和 `/tags` 索引里。如果你新写了一类技术词想出现在云上，不用动；想屏蔽某标签，添加到 `STOP_TAGS` 即可。

### 写一个新项目

```bash
touch src/content/projects/my-project.mdx
```

```mdx
---
title: "项目名 — 一句话定位"
description: "完整复盘。"
pubDate: 2025-07-29
endDate: 2025-08-15                       # 可选
cover: "https://..."                       # 列表页头图
tags: ["SpringBoot", "MyBatis-Plus", ...]  # 技术栈
repo: "https://github.com/xyd-dev-code/..." # 可选
featured: true                              # true 时排第一
relatedPosts:                               # 关联日志（posts id）
  - "2025-06-10-mall-day1-init"
  - "2025-07-29-mall-wrapup"
---

## 背景
## 架构
...
```

项目详情页底部自动渲染 `relatedPosts` 卡片网格。

### 发布

push 到 `main` 分支，GitHub Actions 自动跑 `astro build` → 部署到 GitHub Pages。

## 本地开发

```bash
pnpm install
pnpm dev               # → http://localhost:4321
pnpm build             # → ./dist（postbuild 跑 Pagefind 索引）
pnpm preview           # 预览构建产物
```

## 部署

GitHub Actions 工作流（`.github/workflows/deploy.yml`）监听 `main` push，跑 `pnpm build` 后把 `dist/` + `dist/pagefind/` 部署到 GitHub Pages。

### 自定义域名

本仓库 `src/consts.ts` 里 `SITE.url = 'https://www.personalblog.website'`，`astro.config.mjs` 设 `base: ''` 适配根域名绑定。DNS 配 CNAME 到 `xyd-dev-code.github.io`，仓库 Settings → Pages → Custom domain 填上。

## 主题定制

`tailwind.config.mjs` 的 `colors` 段：

```js
colors: {
  sky:    { /* 主色：天空蓝 50–900 */ },
  cloud:  { /* 云白 50–300 */ },
  sun:    { /* 阳光金点缀 */ },
  leaf:   { /* 叶子绿点缀 */ },
  ink:    { /* 主文字色阶 */ },
  paper:  { /* 背景白 */ },
}
```

字体（`src/layouts/BaseLayout.astro` 通过 Google Fonts 引入）：
- 正文：`Inter`
- 标题 / 衬线：`Fraunces`（含 italic）
- 代码：`font-mono`（系统栈）

`src/styles/global.css` 定义全局 utility：`paper-card`、`paper-link`、`tag-chip(-warm/-leaf)`、`cubic-bezier(--ease-out-quint)`。

## 评论（Giscus，未启用）

`src/components/Comments.astro` 是占位。要启用：仓库开 Discussions → 在 <https://giscus.app/zh-CN> 生成配置 → 替换 `Comments.astro` 里的 `REPLACE_ME_GISCUS_*` → 同时把组件里的旧 `text-neon-*` 残留类名迁到晴空主题。

## 致谢

- [Astro](https://astro.build/) — 静态站框架
- [Tailwind CSS](https://tailwindcss.org/) — 样式
- [Shiki](https://shiki.style/) + [rehype-pretty-code](https://rehype-pretty.pages.dev/) — 代码高亮
- [Pagefind](https://pagefind.app/) — 静态搜索

---

© 2026 XiaoyouDong · MIT