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