# My-blog 项目记忆

## 项目概述
- Astro 5 + Tailwind 3 + MDX 个人技术博客
- 部署在 GitHub Pages，自定义域名 www.personalblog.website
- 仓库：github.com/xyd-dev-code/My-blog
- 作者：XiaoyouDong

## 技术栈
- Astro 5.7 (Islands 架构)
- Tailwind CSS 3.4 (晴空主题：sky蓝 + cloud白 + sun金 + leaf绿)
- MDX 内容写作 (35篇文章)
- Shiki 代码高亮 (github-dark-dimmed)
- Pagefind 静态搜索 (postbuild 生成)
- Decap CMS 在线编辑器 (/admin/)
- pnpm 包管理

## 关键文件
- `src/consts.ts` — 站点配置 (URL/导航/社交/分页)
- `astro.config.mjs` — Astro 配置 (rehype插件链)
- `tailwind.config.mjs` — 晴空主题色板 + 字体 + 阴影 + 动画
- `src/content/config.ts` — 文章 zod schema (title/description/pubDate/tags/draft/cover)
- `src/styles/global.css` — 全局样式 (CSS变量 + paper-card + prose排版)
- `.github/workflows/deploy.yml` — GitHub Actions 部署流程

## 路径别名
- `~/*` → `src/*` (tsconfig.json 配置)

## 待处理
- Giscus 评论未配置（REPLACE_ME 占位符）
- Comments.astro 残留旧霓虹主题样式需迁移
