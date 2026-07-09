# /posts 页全量展示设计

## Context

`/posts` 页当前是分页模式:每页 4 篇 (`POSTS_PER_PAGE`),URL 通过 `[...page].astro` 路由生成 `/posts/1` `/posts/2` `/posts/3`(`/posts` 走 default)。37 篇分了 10 页。

用户期望把 `/posts` 改成 **所有文章一次性铺出来**,不再分页。原因:`/posts` 应该是一站到底的归档视图,用户不应该为了看一篇旧文章需要"翻页"。

附带要求:
- 整个站点**去掉所有卡片右下角的序号**(首页和 `/posts` 一致),所有卡片视觉零序号
- `[/posts/2]`、`[/posts/3]` 等历史 URL 失效(用户明确说"直接删掉换页功能"),无 301 重定向
- 首页不动,继续保留"最近 3 篇 data-tilt 卡片"展示

---

## Scope

**In:**
- 改写 `src/pages/posts/[...page].astro` → 重命名为 `src/pages/posts/index.astro`(或保留 `[...page].astro` 但只 render 一页),简化掉分页逻辑
- 删除分页相关 JS 状态 / DOM 节点(无 `currentPageIdx` / 无 `data-pagination` / 无页码 chip)
- 全站去掉卡片右下角 `01 02 ...` 序号(首页 3 卡 + /posts 列表卡)
- `src/consts.ts` 里 `POSTS_PER_PAGE = 4` 常量**保留**(其他地方不引用的话可后续清掉,但本次先不动,避免牵动 consts)
- 顶部"X / Y 页"小字改成"X 篇"
- 侧栏即时搜索 / tag cloud / 上下滚动 sticky / 侧栏 LATEST / HOT **全部保留**(跟分页无关)

**Out:**
- 不动首页 (`src/pages/index.astro`)
- 不动文章详情页 (`src/pages/posts/[...slug].astro`)
- 不动标签页 / about / friends / projects / guestbook
- 不重定向 `/posts/2` `/posts/3`(直接 404)
- 不做 lazy load / 虚拟滚动(37 篇全量铺没问题,等真破 100 再加)

---

## 设计

### 1. 路由 / 文件结构

**方案 A(推荐):** 把 `[...page].astro` 整个文件改写,删 `getStaticPaths()`,命名保留 `[...page].astro`,但只 render `/posts` 路径(去掉 `[page]` 形态)。这样 Astro 5 会因为文件没了 `[page]` 而路由 `/posts/2` 失效(404)。

不,这样做会让路由变化不可控。更稳的做法:

**方案 B(推荐):**
1. 把 `[...page].astro` **正文全量铺**(不分页)
2. 文件名改成 `index.astro`,`getStaticPaths()` 删掉
3. `[...page].astro` 文件**删除**(让 `/posts/2` 之类路径 404)

更稳的"直接删 `[...page].astro`"。

### 2. 卡片视觉

完全沿用现在 `/posts` 卡片的 DOM 结构(`group paper-card flex flex-col block overflow-hidden min-h-[12rem]` + 左侧 cover `sm:w-40` + 右侧标题/desc/tags)。**去掉**右下角 `01 02 03...` 序号 span。

发布时间的 `<time>` 元素仍然保留在右上角(跟现在一致)。

### 3. 列表渲染

```astro
<ul class="space-y-4" data-posts-list>
  {all.map((post) => (
    <li data-pubdate={post.data.pubDate.toISOString()}>
      <a href={`/posts/${post.id}`} class="group paper-card ...">
        ...
      </a>
    </li>
  ))}
</ul>
```

直接 `all.map`,无 `slice((currentPage - 1) * POSTS_PER_PAGE, ...)`,无 `data-per-page` 属性。

### 4. 客户端脚本简化

现在 `<script>` 块干了三件事:
1. 排序切换(asc/desc) + 跨页联动的页面切换:逻辑保留,**删分页**相关(`currentPageIdx` / `renderPagination` / `data-pagination` DOM 操作)
2. 侧栏即时搜索:完整保留
3. 侧栏 sticky 同步 header 高度:完整保留
4. 标签云 collision resolve:完整保留

排序切换逻辑简化后:**JS 重排时**仍然从 `all-posts-data` JSON 拿所有 id → 按 sort → `renderCard(id)` 拼接 HTML 注入 `<ul>`,无 slice,无分页。但 — 全量铺(不需要分页)为什么还要客户端重排?因为 `all-posts-data` 仍然以 desc 顺序嵌入,**用户点 "↑ 开篇优先"** 时 JS 重排整个 DOM(从第 37 篇排到第 1 篇)。

### 5. 顶部信息条变化

```diff
- 共 {all.length} articles found · <X> / <Y>
+ 共 {all.length} 篇,按 ↓ 最新优先 排列
```

去掉 "currentPage / totalPages" 显示,改为静态文案。

### 6. 页码导航

直接**删除** `<nav data-posts-pagination>` 那一整块 JSX 和 nav DOM(150 行+)。Grid 的 `lg:row-start-2` 占位也不用要了,改回单行 grid 或直接删 grid 多行结构。

### 7. 序号移除

首页 (`src/pages/index.astro`):
- 现在没有序号?确认一下 — 看代码 line 79-133 卡片,**没有序号**。好,首页已经无序号,本次不用动首页。

`/posts` 列表:
- 现在**也没有**右下角序号?让我看截图,序号 `01 02 03` 是在哪儿?回头看 README 重审:

回看前面已读的 `[...page].astro:398-432` — 序号 `01 02 03` 实际是**分页页码 chip** (`<nav data-posts-pagination>` 里的 `getPageNumbers` 输出),不是卡片右下角。卡片右下角的 `String(i + 1).padStart(2, '0')` 在 hot 侧栏(line 199-201),但那是"热门文章"列表的序号,不是卡片右下角。

那"全站去掉右下角序号"实际 = **删除分页 chip 导航**,首页和 /posts 卡片本身没序号。修订:本次改动 = 删分页 chip,首页不动,/posts 卡片本身不动。

### 8. consts

```diff
- export const POSTS_PER_PAGE = 4;
// ← 保留,作为文档/未来参考。但本次不引用
```

不动 consts。

---

## 文件改动清单

| 文件 | 改动 |
|---|---|
| `src/pages/posts/[...page].astro` | **删除**整个文件 |
| `src/pages/posts/index.astro` | **新建**:从 `[...page].astro` 复制过来,删 `getStaticPaths()` / `currentPage` / `totalPages` / `data-pagination` JS / 分页 chip JSX / `data-per-page` 属性 |
| `src/consts.ts` | 不改(`POSTS_PER_PAGE` 保留,注释为 deprecated) |
| `src/pages/index.astro` | 不改 |

---

## 验证步骤

1. `pnpm dev` → `localhost:4321/posts` → 看到 37 篇全量铺,无分页 chip
2. `localhost:4321/posts/2` → 404(预期)
3. `localhost:4321/posts/3` → 404(预期)
4. 侧栏即时搜索 → 输入 "MySQL" → 匹配文章列表正常显示
5. 排序切换 → 点 "↑ 开篇优先" → 37 篇倒序排列(JS 重排整个 ul)
6. tag cloud hover 仍然浮动放位,sticky header-offset 仍然同步
7. 移动端 (375px) → 单列铺,无横向滚动
8. `pnpm build` 通过
9. 部署到 GH Pages 后真实环境测试:`/posts` 37 篇全显示,`/posts/2` 404

---

## 风险 & 边缘情况

1. **JSON 体积**:`all-posts-data` 嵌入 37 条 metadata (id + pubDate),< 2KB,无问题
2. **search-index JSON 体积**:`searchIndex` 嵌入 37 条 t + d + tags + url + cover,< 10KB,无问题
3. **`/posts/2` 外链**:已存在,直接 404;用户已确认接受(意思是"git history 里能查到",不影响实际发现)
4. **Astro 5 缓存**:`pnpm dev` 删除 `node_modules/.astro` 一次确认无 build 缓存污染
5. **CSS 类 `.paper-card`、`.tag-chip` 已被 tag-chip-warm/leaf 引用**:`/posts` 里 tags 用的循环 `i % 3` 还是 `slice(0, 4)`,保留

---

## Out of Scope(本期不做)

- Lazy load / virtual scroll(37 篇无必要)
- 年份 anchor toc(用户选 C:无年份分隔)
- `/posts/2` 301 重定向
- 改 `POSTS_PER_PAGE` 常量值的迁移(它已经不被 `/posts` 引用,留作历史)
- 客户端 filter / sort(仅保留原有 asc/desc 切换)

---

## Critical Files for Implementation

- `src/pages/posts/[...page].astro`(改:替换为 `index.astro`;删原文件)
- `src/pages/posts/index.astro`(新)
- 不改:`src/pages/index.astro` / `src/pages/posts/[...slug].astro` / `src/layouts/BaseLayout.astro`
- 不改:`src/consts.ts`(`POSTS_PER_PAGE` 保留为 deprecated)

---

## 实施后产物

- `/posts` 页**一份干净的"全量流"**(37 条 card,无任何分页 UI)
- `/posts/2`、`/posts/3`、`/posts/N` **全 404**(用户原话:"直接删掉")
- 首页、`/posts/{slug}`、tag cloud、侧栏搜索、侧栏 sticky 偏移 全部不受影响
