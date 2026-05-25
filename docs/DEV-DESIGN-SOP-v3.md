# 开发设计：产品化 SOP 系统

> **版本**: v3.0 | **日期**: 2026-05-23 | **关联PRD**: `docs/PRD-SOP-v3.md`

---

## 1. 系统架构

```
index.html（入口）
  │
  ├─ shared/js/app.js (initNav等工具)
  │
  ├─ audience-engine.js    ← 人群匹配引擎（条件解析+匹配）
  ├─ rule-store.js         ← 规则配置存储（CRUD+校验）
  ├─ auto-executor.js      ← 执行引擎（读取配置→执行→日志）
  ├─ config-ui.js          ← 配置界面渲染器（人群+规则编辑器）
  ├─ workspace-ui.js       ← 工作台渲染器（异常+日志）
  └─ sop-app.js            ← 主应用（状态管理+路由+事件）
```

### 模块依赖

```
sop-app.js
  ├─ audience-engine.js (无依赖)
  ├─ rule-store.js (引用 audience-engine 做预览)
  ├─ auto-executor.js (引用 audience-engine + rule-store)
  ├─ config-ui.js (引用 audience-engine + rule-store)
  └─ workspace-ui.js (引用 auto-executor 的日志数据)
```

---

## 2. 模块详细设计

### 2.1 人群引擎（audience-engine.js）

```javascript
class AudienceEngine {
  // 内置支持的条件字段元数据
  static FIELD_META = {
    typeCode: { label: '行业类型', type: 'multi_select', options: [...] },
    stage: { label: '当前阶段', type: 'select', options: ['P1','P2',...] },
    budget: { label: '预算', type: 'number' },
    status: { label: '状态', type: 'select', options: ['active','sleeping','closed'] },
    source: { label: '来源', type: 'multi_select', options: ['AD','REFERRAL',...] },
    lastContact: { label: '最近联系', type: 'days_ago' },
    stageEnteredAt: { label: '进入阶段时间', type: 'days_ago' },
    tags: { label: '标签', type: 'multi_select', options: [...] }
  };

  // 条件操作符
  static OPERATORS = {
    EQ: (v, target) => v === target,
    NEQ: (v, target) => v !== target,
    IN: (v, targets) => targets.includes(v),
    GTE: (v, target) => parseBudget(v) >= target,
    LTE: (v, target) => parseBudget(v) <= target,
    DAYS_GT: (v, target) => daysBetween(v, today) > target,
    DAYS_LT: (v, target) => daysBetween(v, today) < target,
    CONTAINS: (v, target) => (v || []).includes(target)
  };

  // 匹配单个客户
  static matchCustomer(customer, conditions): boolean

  // 匹配整个客户列表 → 返回匹配的客户
  static matchAll(customers, audience): Customer[]

  // 预览：给定条件，显示前N个匹配客户
  static preview(customers, conditions, limit=5): Customer[]
}
```

### 2.2 规则存储（rule-store.js）

```javascript
class RuleStore {
  // 内置预设数据（第一次加载时的默认值）
  static getDefaultAudiences(): Audience[]
  static getDefaultRules(): Rule[]

  // 操作
  static load(): { audiences: Audience[], rules: Rule[] }
  static save(audiences, rules): void

  // 人群 CRUD
  static createAudience(data): Audience
  static updateAudience(id, data): void
  static deleteAudience(id): void

  // 规则 CRUD
  static createRule(data): Rule
  static updateRule(id, data): void
  static deleteRule(id): void

  // 查询
  static getEnabledRules(): Rule[]
  static getRulesByAudience(audienceId): Rule[]
}
```

### 2.3 执行引擎（auto-executor.js）

```javascript
class AutoExecutor {
  // 主入口：对所有有效人群执行扫描
  static dailyScan(customers, audiences, rules): ScanReport

  // 检查规则是否应该执行
  static shouldExecute(customer, rule): { should: boolean, reason: string }

  // 执行动作
  static executeAction(customer, rule, context): ActionResult
}
```

---

## 3. UI 布局

```
┌──────────────────────────────────────────────────────────────┐
│  自动化SOP系统  [人群管理] [规则配置] [执行监控] [异常处理]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  四个 Tab 对应四个视图                                        │
│                                                              │
│  Tab1 人群管理：列表 + 编辑器弹窗                              │
│  Tab2 规则配置：列表 + 编辑器弹窗                              │
│  Tab3 执行监控：执行日志 + 统计                               │
│  Tab4 异常处理：异常列表 + 标记已处理                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 测试策略

### 测试文件

```
tests/
├── audience-engine.test.js    ← 人群匹配逻辑（15个断言）
├── rule-store.test.js         ← 规则CRUD+校验（10个断言）
├── auto-executor.test.js      ← 执行引擎（15个断言）
└── sop-app.test.js            ← 主应用集成（5个断言）
```

### 关键测试点

| 测试 | 断言数 | 说明 |
|------|-------|------|
| 条件匹配 AND/OR | 4 | 组合逻辑正确性 |
| 操作符 EQ/IN/GTE/DAYS_GT | 6 | 各操作符边界 |
| 人群预览 | 2 | 预览数量+正确性 |
| 规则CRUD | 4 | 增删改查 |
| 触发判定 stage_entry | 3 | 时间计算正确性 |
| 触发判定 keyword_match | 3 | 关键词命中 |
| 前置条件 | 3 | 频率/未回复/阶段检查 |
| 动作执行 | 4 | 发送/迁移/标签/上报 |

---

## 5. 文件结构

```
scenes/scene-3-crm/
├── index.html
├── audience-engine.js
├── rule-store.js
├── auto-executor.js
├── config-ui.js
├── workspace-ui.js
├── sop-app.js
└── tests/
    ├── audience-engine.test.js
    ├── rule-store.test.js
    ├── auto-executor.test.js
    └── sop-app.test.js
```
