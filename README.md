# Ouyang Hao · Tech Blog

> 一个深色霓虹/赛博风的个人技术博客——记录学习、踩坑与项目复盘。写给未来的我、同学，以及所有路过的同行。

![preview](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro&logoColor=white)
![tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)
![deploy](https://img.shields.io/badge/Deploy-GitHub_Pages-222?logo=githubpages&logoColor=white)
![license](https://img.shields.io/badge/License-MIT-00f0ff)

🔗 访问：<https://www.personalblog.website/>

## 特性

- 🌌 **深色霓虹/赛博朋克风** — 自研 Tailwind 主题（cyan / magenta / lime / purple）
- ⚡ **极致性能** — Astro 5 Islands 架构，首屏 < 50KB
- 📝 **MDX 写作** — Markdown 里能塞 React 组件
- 🔍 **Pagefind 全文搜索** — `Cmd/Ctrl + K` 唤起
- 🧭 **自动 TOC** — 滚动同步高亮
- 🌈 **代码霓虹高亮** — Shiki + github-dark-dimmed 主题
- 💬 **Giscus 评论** — GitHub Discussions 驱动
- 📡 **RSS 订阅** — `/rss.xml`
- 📝 **Decap CMS 在线编辑器** — 浏览器写文章，自动 commit + 自动部署
- 🚀 **一键部署** — push → GitHub Actions → GitHub Pages

## 目录

```
src/
├── components/      # UI 组件（Header/Footer/TOC/...）
├── content/posts/   # 所有文章（MDX）
├── layouts/         # 布局
├── pages/           # 路由
├── styles/global.css
└── consts.ts        # 站点配置
```

## 写新文章

```bash
# 1. 创建文件
touch src/content/posts/my-new-post.mdx
```

```mdx
---
title: "你的标题"
description: "副标题/摘要"
pubDate: 2026-07-01
tags: ["topic", "category"]
---

## 第一段

正文，支持 Markdown + MDX 组件。
```

写完即部署：push 到 `main` 分支，GitHub Actions 自动跑 `astro build` 并部署。

## 使用 CMS 在线编辑

直接浏览器打开 `https://www.personalblog.website/admin/` 就能写文章，所见即所得、保存即自动 commit、自动触发部署。底层用 [Decap CMS](https://decapcms.org/) + GitHub OAuth，OAuth 代理由 [Netlify Identity](https://docs.netlify.com/visitor-access/identity/) 免费提供（无需部署到 Netlify）。

### 首次配置（一次性，5 分钟）

1. 访问 `https://www.personalblog.website/admin/`
2. 点 **Login with GitHub**
3. 第一次会引导你创建一个 **Netlify Identity site**（免费、一键）
4. 创建后自动跳到 **Configure Git Gateway**，Provider 选 GitHub
5. 点 **Connect to GitHub**，在 GitHub 弹窗里选 `xyd-dev-code/My-blog` 仓库，授权 read/write
6. 完成后浏览器自动跳回 `/admin/`，登录成功

之后每次打开 `/admin/` 直接点 Login 即可，无需重做配置。

### 写一篇文章

1. 进入 CMS 后，点左侧 **文章 → New Post**
2. 填写字段：
   - **URL Slug** — 文件名后缀，只用英文/数字/横杠（例：`spring-boot-jdk21`）
   - **标题** — 文章标题（中文 OK）
   - **描述** — 副标题/摘要
   - **发布日期** — 选今天
   - **标签** — 多个标签以回车分隔
   - **草稿** — 勾选后文章只在本地 dev 显示，生产环境不可见
   - **正文** — 纯 Markdown 编辑器（**不支持** `<Callout>` 等 React 组件，需要组件的文章请用本地编辑器写 MDX）
3. 点右上角 **Publish**
4. 几秒后 CMS 显示 "Status: Published"，GitHub 仓库 `main` 分支收到一个 commit（消息形如 `feat(posts): 新增 2026-06-30-spring-boot-jdk21`）
5. 等 2-3 分钟 GitHub Actions 自动部署，刷新线上博客即可看到新文章

### 图片上传

拖拽图片到正文编辑器，会自动上传到 `public/images/uploads/`，并在 Markdown 里生成引用 URL（形如 `/images/uploads/xxx.jpg`）。

### 本地限制

`pnpm dev` 访问 `/admin/` 只能看 UI 界面，**不能登录/提交**——因为 GitHub OAuth 回调 URL 是线上域名，localhost 不在白名单。所有端到端验证都在线上 `/admin/` 完成。

### 配置文件位置

- `public/admin/index.html` — Decap CMS SPA 入口（锁版本 `decap-cms@3.6.4`）
- `public/admin/config.yml` — CMS 行为定义（backend / 字段 / 媒体路径）
- 改 schema 时**只改 `config.yml`**，不动 `src/content/config.ts`（那是 Astro 构建时的 zod 校验，两套独立机制）

## 本地开发

```bash
# 装依赖
pnpm install

# 启动 dev server
pnpm dev          # → http://localhost:4321

# 生产构建
pnpm build        # → ./dist
pnpm preview      # 预览构建结果
```

## 部署到 GitHub Pages

1. 在 GitHub 创建一个新仓库，名为 `My-blog`（或同名）
2. 推送代码：`git remote add origin git@github.com:xyd-dev-code/My-blog.git && git push -u origin main`
3. 仓库 → **Settings** → **Pages** → **Source** 选 `GitHub Actions`
4. push 后 `Actions` tab 会自动跑 `.github/workflows/deploy.yml`
5. 几分钟后访问 `https://<user>.github.io/My-blog/`

### ⚠️ `base` 路径配置

本仓库 `astro.config.mjs` 设置了 `base: ''`（空字符串），站点绑定自定义域名 `www.personalblog.website`，访问 URL 不含子路径前缀。如果你换成 user page（`username.github.io`）也无需改；换成项目页才需要设回 `base`。

## 配置 Giscus 评论（可选）

1. 仓库 → Settings → Features → 开启 **Discussions**
2. 访问 <https://giscus.app/zh-CN>，填入仓库名 `xyd-dev-code/My-blog`
3. 复制生成的 `data-repo-id` 和 `data-category-id`
4. 替换 `src/components/Comments.astro` 里的 `placeholder`

## 主题定制

所有霓虹色 token 在 `tailwind.config.mjs` 的 `colors` 段：

```js
colors: {
  neon: { cyan: '#00f0ff', magenta: '#ff00aa', lime: '#aaff00', purple: '#b14aed' },
  bg: { base: '#0a0a0f', card: '#12121a', elev: '#1a1a26' },
}
```

字体：`Inter`（正文）+ `Space Grotesk`（标题）+ `JetBrains Mono`（代码）。

## 致谢

- [Astro](https://astro.build/) — 静态站框架
- [Tailwind CSS](https://tailwindcss.com/) — 样式
- [tsparticles](https://particles.js.org/) — 首页粒子背景
- [Shiki](https://shiki.style/) — 代码高亮
- [Pagefind](https://pagefind.app/) — 静态搜索
- [Giscus](https://giscus.app/) — 评论

---

© 2026 Ouyang Hao · MIT
