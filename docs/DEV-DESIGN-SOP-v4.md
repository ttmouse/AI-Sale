# 开发设计：阶段待办清单 SOP 系统

> **版本**: v4.0 | **日期**: 2026-05-23 | **关联PRD**: `docs/PRD-SOP-v4.md`

---

## 1. 系统架构

```
index.html
  │
  ├─ stage-todo-engine.js    ← 核心引擎：待办检测+执行+状态跟踪
  ├─ rule-store.js           ← 阶段待办模板存储（替代旧规则存储）
  ├─ todo-ui.js              ← UI渲染：配置界面+看板+执行日志
  ├─ sop-app.js              ← 主应用
  └─ tests/
      └─ all.test.js
```

### 模块依赖

```
sop-app.js
  ├─ stage-todo-engine.js (无依赖)
  └─ todo-ui.js (引用 stage-todo-engine)
```

---

## 2. 核心引擎（stage-todo-engine.js）

### 2.1 阶段待办模板（内置默认）

```javascript
const STAGE_TODOS = {
  P1: [
    { itemId: 'p1-welcome', name: '发送欢迎消息', audienceId: null, autoExec: true,
      triggerOn: 'stage_enter', action: { type: 'send_message', content: '您好{customerName}...' },
      completionKey: 'welcome_sent' },
    { itemId: 'p1-proposal', name: '发送方案资料', audienceId: null, autoExec: true,
      triggerOn: 'stage_enter', action: { type: 'send_message', content: '{customerName}，方案如下...' },
      completionKey: 'proposal_sent' },
  ],
  P2: [...],
  ...
};
```

### 2.2 核心 API

```javascript
class StageTodoEngine {
  /**
   * 为客户初始化阶段完成状态
   */
  static initStageState(customer): void

  /**
   * 获取客户当前阶段未完成的待办事项
   */
  static getPendingItems(customer): TodoItem[]

  /**
   * 检查单个待办是否可以执行
   */
  static shouldExecute(customer, item): boolean

  /**
   * 执行待办事项
   */
  static executeItem(customer, item): ExecutionResult

  /**
   * 标记某事项已完成
   */
  static markCompleted(customer, stage, completionKey, doneBy): void

  /**
   * 扫描所有客户，执行所有可执行的待办
   */
  static scanAll(customers): ScanReport
}
```

### 2.3 执行流程

```
scanAll(customers):
  report = { executed: 0, logs: [] }
  
  for each customer:
    // 初始化完成状态（如需要）
    initStageState(customer)
    
    // 获取当前阶段未完成事项
    stage = customer.stage
    items = STAGE_TODOS[stage] || []
    pending = items.filter(i => !isCompleted(customer, stage, i))
    
    for each item in pending:
      if shouldExecute(customer, item):
        result = executeItem(customer, item)
        markCompleted(customer, stage, item.completionKey, 'system')
        report.executed++
        report.logs.push(result)
  
  return report
```

---

## 3. 文件结构

```
scenes/scene-3-crm/
├── index.html
├── stage-todo-engine.js    ← 引擎：待办检测+执行+状态跟踪
├── rule-store.js           ← 待办模板配置存储（简化版）
├── todo-ui.js              ← UI渲染
├── sop-app.js              ← 主应用
└── tests/
    └── all.test.js
```
