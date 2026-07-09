# /posts 去分页改造实施计划
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
**Goal:** 把 `src/pages/posts/[...page].astro` 改造为不分页的 `src/pages/posts/index.astro`,37 篇 article 一次性铺出来,删除分页 chip + 客户端分页逻辑,保留侧栏搜索 / tag cloud / sticky 同步 / 排序切换。
**Architecture:** Astro 5 静态生成,build time 一次性产出 `/posts/index.html`,内嵌全量 card DOM + `all-posts-data` JSON + `search-index` JSON,客户端脚本只做"排序切换"(重排整个 ul)+ "侧栏搜索" + "tag cloud 位置解算" + "sticky header 同步"。旧路由 `/posts/[page].astro` 文件删除,`/posts/N` URL 直接 404。
**Tech Stack:** Astro 5 + MDX + Tailwind + 原生 TS inline script(`<script>` 块)。
**Spec:** `docs/superpowers/specs/2026-07-09-posts-no-pagination-design.md`

## Global Constraints
- 一篇一动,每步 commit 必须可回退
- 不改 `src/pages/index.astro`(首页 `data-tilt` 卡片)
- 不改 `src/pages/posts/[...slug].astro`(文章详情页)
- 不改 `src/consts.ts` 的 `POSTS_PER_PAGE = 4`(保留为 deprecated)
- 不动侧栏 sticky 同步 / 标签云 collision resolve / 侧栏即时搜索,这三个块原样保留
- 不重定向 `/posts/2` `/posts/3`(用户原话"直接删掉换页功能")
- 不做 lazy load / 虚拟滚动(37 篇全量铺无必要)
- `[...page].astro` 必须物理删除(不留 Astro fallback)

---

## 文件结构

| 文件 | 改动 | 责任 |
|---|---|---|
| `src/pages/posts/index.astro` | 新建 | 不分页的 /posts 主文件 |
| `src/pages/posts/[...page].astro` | 删除 | 旧分页页(让 `/posts/2` 等失效) |
| `src/consts.ts` | 不改 | `POSTS_PER_PAGE = 4` 保留 |
| `src/pages/posts/[...slug].astro` | 不改 | 文章详情 |
| `src/pages/index.astro` | 不改 | 首页 3 篇 data-tilt |
| `src/layouts/BaseLayout.astro` | 不改 | 通用布局 |

---

## Task 1: 在新分支上从 [...page].astro 复制基线到 index.astro

**Files:**
- Modify (新建): `src/pages/posts/index.astro`

**Steps:**

- [ ] **1.1** 当前在 main。检查 git 状态干净:
      ```bash
      git status --short
      ```
      期望输出空。如果不空,先 stash 或 reset(取决于未跟踪文件是不是上一次 PR 的残留)。

- [ ] **1.2** 切到新分支:
      ```bash
      git checkout -b refactor/posts-no-pagination
      ```
      命名解释:`refactor/*` 因为这是行为改写(去掉分页功能),不是 `feat/*`。

- [ ] **1.3** 用 cp 直接复制基线:
      ```bash
      cp src/pages/posts/[...page].astro src/pages/posts/index.astro
      ```

- [ ] **1.4** 验证文件存在 + 行数大致等于源文件(~650 行):
      ```bash
      wc -l src/pages/posts/index.astro
      ```
      期望:~655 行(`[...page].astro` 当前大小,可读)。

- [ ] **1.5** 不 commit(Task 1 不留 commit,因为接下来 Task 2 会立刻大改)。

---

## Task 2: 删 getStaticPaths + 改 frontmatter

**Files:**
- Modify: `src/pages/posts/index.astro`(只动 frontmatter)

**Steps:**

- [ ] **2.1** 删掉整个 `export async function getStaticPaths()` 块(`[...page].astro:7-14`):
      ```typescript
      export async function getStaticPaths() {
        const all = (await getCollection('posts', ({ data }) => !data.draft))
          .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
        const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
        return Array.from({ length: totalPages }, (_, i) => ({
          params: { page: i === 0 ? undefined : String(i + 1) },
        }));
      }
      ```
      整段删除(含上面留的 1 空行)。

- [ ] **2.2** 改 frontmatter 里 `currentPage` / `totalPages` 的派生为常量:
      ```typescript
      // 现状:
      const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
      const rawPage = Astro.params.page;
      const currentPage = rawPage === undefined ? 1 : Math.min(Math.max(1, Number(rawPage)), totalPages);
      const posts = all.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
      const pageHref = (n: number) => (n === 1 ? '/posts' : `/posts/${n}`);
      ```
      替换为:
      ```typescript
      const posts = all;
      ```
      删除上面 5 行(`totalPages` / `rawPage` / `currentPage` / `posts = all.slice(...)` / `pageHref`),只保留 `const posts = all;`。

- [ ] **2.3** 保留 `getPageNumbers` 函数(客户端 JS 还要用 — 不,客户端 JS 已经不用了,客户端不需要分页)。**删除** `getPageNumbers` 整段(`[...page].astro:28-39`)。
      ```typescript
      function getPageNumbers(current: number, total: number): (number | '...')[] {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages: (number | '...')[] = [];
        pages.push(1);
        if (current > 3) pages.push('...');
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < total - 2) pages.push('...');
        pages.push(total);
        return pages;
      }
      ```
      整段删除。

- [ ] **2.4** 跑 build 看 frontmatter 阶段错误:
      ```bash
      npx astro check 2>&1 | tail -5
      ```
      期望:仍有 4 个 errors(`CardCursor.astro` / `rss.xml.ts`),但**不应**有 `src/pages/posts/index.astro` 的 error。如果有,修。

- [ ] **2.5** Commit Task 2:
      ```bash
      git add src/pages/posts/index.astro
      git commit -m "refactor(posts): 复制 [page].astro → index.astro,删分页 frontmatter"
      ```

---

## Task 3: 改 HTML 结构(删分页 chip + 修顶栏文字)

**Files:**
- Modify: `src/pages/posts/index.astro`(JSX)

**Steps:**

- [ ] **3.1** 删顶部 "X / Y page" 那段(`[...page].astro:222-226`):
      ```astro
      <p class="mt-1.5 text-xs text-ink-400">
        <span class="text-leaf-500">●</span> {all.length} article{all.length === 1 ? '' : 's'} found
        <span class="mx-1.5 text-ink-300">·</span>
        <span class="font-mono tabular-nums"><span data-posts-current-page>{currentPage}</span> / {totalPages}</span>
      </p>
      ```
      整段 `<p>...</p>` 替换为:
      ```astro
      <p class="mt-1.5 text-xs text-ink-400">
        共 <span class="font-mono tabular-nums text-sky-600">{all.length}</span> 篇,按发布顺序倒序排列
      </p>
      ```
      (用 `共 X 篇` 替代 `X articles found · 1 / 10`,跟 spec 一致)

- [ ] **3.2** 在 Grid 容器移除多余 row(因为不再有分页 nav 占第二行):
      现状(`[...page].astro:134`):
      ```astro
      <div class="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)_16rem] lg:grid-rows-[minmax(0,1fr)_auto] gap-6 lg:gap-8 items-stretch">
      ```
      删 `lg:grid-rows-[minmax(0,1fr)_auto]`:
      ```astro
      <div class="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)_16rem] gap-6 lg:gap-8 items-stretch">
      ```

- [ ] **3.3** 删 `data-posts-list data-per-page={POSTS_PER_PAGE}` 里的 `data-per-page`:
      现状(`[...page].astro:272`):
      ```astro
      <ul class="space-y-4" data-posts-list data-per-page={POSTS_PER_PAGE}>
      ```
      改成:
      ```astro
      <ul class="space-y-4" data-posts-list>
      ```

- [ ] **3.4** 删整段 `<nav data-posts-pagination>` (`[...page].astro:398-432`,约 35 行):
      ```astro
      {totalPages > 1 && (
        <nav
          class="lg:col-start-2 lg:row-start-2 ..."
          data-posts-pagination
          data-current-page={currentPage}
          data-total-pages={totalPages}
        >
          ... 35 行
        </nav>
      )}
      ```
      整段删除。

- [ ] **3.5** 跑 build 看类型 + JSX 错误:
      ```bash
      npx astro check 2>&1 | tail -10
      ```
      期望:`src/pages/posts/index.astro` 没有新增 error。

- [ ] **3.6** Commit:
      ```bash
      git add src/pages/posts/index.astro
      git commit -m "refactor(posts): 删分页 chip + 改顶栏文字 + 单行 Grid"
      ```

---

## Task 4: 删客户端分页逻辑(保留搜索/tag cloud/sticky)

**Files:**
- Modify: `src/pages/posts/index.astro`(`<script>` 块)

**Steps:**

- [ ] **4.1** 删 `renderPagination` 函数 + 调用 + 数据引用。整个 `<script>` 块从 `[...page].astro:438-647` 里需要:
      - 删变量 `pagination = document.querySelector('[data-posts-pagination]')`
      - 删变量 `currentPageIdx`
      - 删变量 `totalDescPages`
      - 删整个 `renderPagination` 函数(约 30 行,`[...page].astro:475-505`)
      - 改 `renderList` 不再调用 `renderPagination()`
      - 改 `currentPageIdx` 永远 = 1(永远渲染全量)
      - 删 `renderList` 内的 `slice((currentPageIdx - 1) * PER_PAGE, currentPageIdx * PER_PAGE)` → 直接 `sorted`(全量)

      替换最终版:
      ```typescript
      let currentSort: 'desc' | 'asc' = 'desc';

      const renderList = () => {
        const sorted = [...allMeta].sort((a, b) => currentSort === 'asc'
          ? new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
          : new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        list.innerHTML = sorted.map((p) => renderCard(p.id)).join('');
      };

      const updateButtons = () => {
        toggle.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((b) => {
          const active = b.dataset.sort === currentSort;
          b.classList.toggle('bg-sky-500', active);
          b.classList.toggle('text-white', active);
          b.classList.toggle('shadow-sm', active);
          b.classList.toggle('text-ink-500', !active);
          b.classList.toggle('hover:text-sky-700', !active);
        });
      };

      const applySort = (dir: 'desc' | 'asc') => {
        currentSort = dir;
        updateButtons();
        renderList();
        try { localStorage.setItem('posts-sort', dir); } catch {}
      };
      ```
      (对比 `[...page].astro:470-533` 减掉了 `currentPageIdx` / `totalDescPages` / `renderPagination` / `slice`,保留排序+卡片 render 逻辑)

- [ ] **4.2** 删 `PER_PAGE` 变量引用(原来的 `Number(document.querySelector('[data-posts-list]')?.dataset.perPage || '4')`)。
      现状(`[...page].astro:445`):
      ```typescript
      const PER_PAGE = Number(document.querySelector<HTMLElement>('[data-posts-list]')?.dataset.perPage || '4');
      ```
      整行删除。保留 `toggle` / `list` / `metaEl` / `searchEl` 这 4 个变量。

- [ ] **4.3** 顶部入口守卫由 `if (toggle && list && metaEl && searchEl)` 改成 `if (toggle && list && metaEl)`(`searchEl` 删了)。Wait — `searchEl` 在第 449 行用于构造 `detailById`,要保留。保留所有变量和 `if` 守卫不变,只删 `PER_PAGE` 行(已做)。

- [ ] **4.4** 删 `renderPagination` 中的变量同步代码:
      删:
      ```typescript
      const headerCounter = document.querySelector('[data-posts-current-page]');
      ```
      已随 Task 3 删了顶部计数器 `<span data-posts-current-page>`,这里同步清。

- [ ] **4.5** 删 `if (currentSort === 'asc') renderList();` 行的 `currentSort` 守卫 — 不,这段是初始化 + 读 localStorage,保留。
      调整:由于没了分页,asc 初始化只跑一次,逻辑不变。**保留所有 initialization 代码**(读 localStorage,默认 desc)。

- [ ] **4.6** 保留 `doSearch` 函数(侧栏搜索)原样不动。

- [ ] **4.7** 保留 `syncSidebarOffset` 函数原样不动。

- [ ] **4.8** 保留 `resolveTagCloud` 函数原样不动。

- [ ] **4.9** 跑 build:
      ```bash
      npx astro check 2>&1 | tail -10
      ```
      期望:`index.astro` 没新增 error。

      ```bash
      npx astro build 2>&1 | tail -5
      ```
      期望:`✓ Complete!`。

- [ ] **4.10** Commit:
      ```bash
      git add src/pages/posts/index.astro
      git commit -m "refactor(posts): 删客户端分页逻辑,排序+搜索+tag cloud 保留"
      ```

---

## Task 5: 删 `src/pages/posts/[...page].astro` + 验证 `/posts/2` 走 404

**Files:**
- Delete: `src/pages/posts/[...page].astro`

**Steps:**

- [ ] **5.1** 物理删除文件:
      ```bash
      git rm src/pages/posts/[...page].astro
      ```

- [ ] **5.2** 检查目录只剩 2 个文件:`index.astro` + `[...slug].astro`:
      ```bash
      ls src/pages/posts/ 2>&1
      ```
      期望:
      ```
      [...]
      index.astro
      [...slug].astro
      ```

- [ ] **5.3** build:
      ```bash
      npx astro build 2>&1 | tail -10
      ```
      期望:`✓ Complete!`,而且没 `/posts/2/` `/posts/3/` 这些目录被 build 出来(因为 `getStaticPaths` 没了)。

- [ ] **5.4** 检查 dist 目录确认:
      ```bash
      ls dist/posts/ 2>&1
      ```
      期望:
      ```
      index.html
      .../slug/index.html (37 个文章详情页目录)
      ```
      **不应**有 `2/` `3/` 这种目录。

- [ ] **5.5** Commit:
      ```bash
      git commit -m "refactor(posts): 删 [...page].astro,/posts/2/N 走 404"
      ```

---

## Task 6: 本地 dev 端到端验证

**Files:**
- 不改文件,验证

**Steps:**

- [ ] **6.1** 启动 dev server(后台):
      ```bash
      npx astro dev --port 4321 &
      sleep 4
      ```
      等 4 秒启动。

- [ ] **6.2** 抓 `/posts` 看 HTML 长度 + card 数量:
      ```bash
      curl -s http://localhost:4321/posts/ -o /tmp/posts-new.html
      wc -c /tmp/posts-new.html
      grep -c 'data-pubdate=' /tmp/posts-new.html
      grep -c 'data-pagination\|prev\|下一页\|/[0-9]' /tmp/posts-new.html | head
      grep -oE '当前 /[^<]+|共 [0-9]+ 篇|共 [0-9]+ article' /tmp/posts-new.html | head
      ```
      期望:
      - 文件大小:~120KB(原 80KB + 多 33 张 card,每张 ~1KB)
      - `data-pubdate=` 出现 **37** 次
      - `data-pagination` / `下一页` / 页码 chip:0 次
      - `共 37 篇`

- [ ] **6.3** 抓 `/posts/2` 看 404:
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/posts/2/
      ```
      期望:`404`。

- [ ] **6.4** 抓 `/posts/3` 看 404:
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/posts/3/
      ```
      期望:`404`。

- [ ] **6.5** 抓 `/posts` 上 HTML 里 `all-posts-data` JSON 长度:
      ```bash
      grep -oE 'id="all-posts-data"[^>]*>[^<]+' /tmp/posts-new.html | wc -c
      ```
      期望:JSON 文本 < 3KB。

- [ ] **6.6** 抓搜索索引 JSON:
      ```bash
      grep -oE 'id="search-index"[^>]*>[^<]+' /tmp/posts-new.html | wc -c
      ```
      期望:JSON 文本 < 12KB。

- [ ] **6.7** 杀 dev server:
      ```bash
      kill %1 2>/dev/null
      ```

- [ ] **6.8** 跑最终 build:
      ```bash
      npx astro build 2>&1 | tail -5
      ```
      期望:`✓ Completed in ~10s · 133 pages`(`133 = 36 静态页基础 + 37 文章 × 1 + 1 /posts/index.html`,实际数字约此)。

---

## Task 7: 开 PR + 报告

**Files:**
- 不改代码

**Steps:**

- [ ] **7.1** 推送(用 PowerShell,按 memory `git-push-gcm-hang-on-bash`):
      ```bash
      powershell -NoProfile -Command "git push -u origin refactor/posts-no-pagination"
      ```

- [ ] **7.2** 开 PR:
      ```bash
      gh pr create --title "refactor(posts): 不分页 - 37 篇全量铺, /posts/2/N 走 404" --body "$(cat <<'EOF'
      ## Summary

      把 `src/pages/posts/[...page].astro` 改成新建的 `src/pages/posts/index.astro`,37 篇 article 一次性铺出:
      - 删 `getStaticPaths` + 分页 chip(`<nav data-posts-pagination>`)+ 客户端 `currentPageIdx` 分页状态
      - 删 `POSTS_PER_PAGE` 客户端切分(slice 删了) — 排序切换仍按 asc/desc 重排整页 DOM
      - 旧 `[...page].astro` 文件物理删除,`/posts/2` `/posts/3` 直接 404

      ## 保留

      - 排序切换(asc/desc,localStorage 记忆)
      - 侧栏即时搜索(原 `doSearch` 函数)
      - 标签云 collision resolve
      - 侧栏 sticky header-offset 同步
      - 侧栏"最新文章"+"热门文章"列表
      - 卡片视觉本身(序号本来就没有)

      ## 验证

      - [x] `pnpm build` 通过,dist 目录无 `/posts/2/` `/posts/3/`
      - [x] `/posts` HTML 出现 37 个 `data-pubdate=`
      - [x] `/posts/2/` `/posts/3/` 返回 404
      - [x] `all-posts-data` JSON < 3KB,`search-index` JSON < 12KB

      ## 不动

      - 首页 `src/pages/index.astro`(3 篇 data-tilt 卡片)
      - 文章详情 `src/pages/posts/[...slug].astro`
      - `src/consts.ts` 的 `POSTS_PER_PAGE = 4` 仍保留(deprecated)
      - `src/layouts/BaseLayout.astro`
      EOF
      )"
      ```

- [ ] **7.3** 把 PR 链接报告给用户。

---

## 执行选项

实施已锁定 — 接下来:

- **A. 我自己执行(Inline)** — 跳进 executing-plans skill,按 Task 1→7 顺序跑,每 Task 报告。
- **B. subagent-driven** — 每个 Task 一个 subagent,我 review 后再下一 Task。
- **C. 你 review 整份 plan 再决定** — 哪个 Task 你想先看再执行

A 是 recommended(7 个 task 都 < 5 分钟可执行,inline 即可)。
