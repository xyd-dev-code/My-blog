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
- 草稿里不要使用 `import` 语句,因为现有 posts 是 MDX 但没用 import