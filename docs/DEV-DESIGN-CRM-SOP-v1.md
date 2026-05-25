# 开发设计：客户分层 + 智能 SOP 跟进系统

> **版本**: v1.0 | **日期**: 2026-05-23 | **关联PRD**: `docs/PRD-CRM-SOP-v1.md`

---

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html (入口)                       │
│  加载 shared/css/styles.css + 场景自定义样式                    │
├─────────────────────────────────────────────────────────────┤
│                     scene-3-crm/index.html                    │
│  ├─ 布局骨架（导航 + 筛选栏 + 视图切换 + 客户网格 + 抽屉）     │
│  └─ 加载以下 JS 模块                                          │
├─────────────────────────────────────────────────────────────┤
│  JS 模块架构                                                  │
│                                                              │
│  ┌──────────────────────────────────────────────────┐        │
│  │              crm-app.js (主应用)                  │        │
│  │  路由/状态管理/视图调度/事件绑定/UI渲染            │        │
│  └──────────────┬───────────────────────┬───────────┘        │
│                 │                       │                      │
│        ┌────────▼──────┐      ┌────────▼──────┐              │
│        │ sop-engine.js │      │ data-loader.js │              │
│        │ SOP模板+阶段机 │      │ 数据加载+过滤   │              │
│        │ 打分+预警规则  │      │ 索引构建       │              │
│        └───────────────┘      └───────────────┘              │
│                 │                       │                      │
│        ┌────────▼──────┐      ┌────────▼──────┐              │
│        │ ai-helper.js │       │ renderer.js   │              │
│        │ 文案生成+健康 │       │ 卡片/漏斗/看板  │              │
│        │ 度计算        │       │ 抽屉渲染       │              │
│        └───────────────┘      └───────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 模块职责

| 模块 | 文件 | 职责 | 依赖 |
|------|------|------|------|
| 数据加载器 | `crm-app.js` (内联) | 从 JSON 加载客户数据，构建索引，暴露过滤接口 | `data/customers.json`, `data/products.json` |
| SOP 引擎 | `sop-engine.js` | SOP 模板定义、阶段机、滞留预警计算、自动打标规则 | 无（纯计算） |
| AI 助手 | `ai-helper.js` | 文案生成（模拟）、健康度评分 | 无（规则驱动） |
| 渲染器 | `renderer.js` | 卡片/漏斗/看板视图渲染、详情抽屉 | DOM API |
| 主应用 | `crm-app.js` | 状态管理、视图切换、事件绑定、任务系统 | 以上全部 |

---

## 2. 文件结构

```
scenes/scene-3-crm/
├── index.html              # 主页面（加载所有资源）
├── crm-app.js              # 主应用逻辑（数据加载+状态管理+事件绑定）
├── sop-engine.js           # SOP 引擎（独立模块，可测试）
├── ai-helper.js            # AI 能力（文案+健康度+推荐，可测试）
├── renderer.js             # UI 渲染层（卡片/漏斗/看板/抽屉）
└── tests/
    ├── index.html          # 测试入口
    ├── sop-engine.test.js  # SOP 引擎测试
    ├── ai-helper.test.js   # AI 助手测试
    └── crm-app.test.js     # 主应用测试
```

---

## 3. 核心模块详细设计

### 3.1 SOP 引擎 (`sop-engine.js`)

#### 对外接口

```javascript
class SOPEngine {
  /**
   * 根据客户类型匹配合适的 SOP 模板
   */
  static matchTemplate(customer, templates): SOPTemplate | null
  
  /**
   * 计算客户的 SOP 实例（展开所有步骤的时间线）
   */
  static buildInstance(customer, template, baseDate): SOPInstance
  
  /**
   * 检查当前哪些步骤到期/逾期
   */
  static checkDueItems(instance): { due: SOPStep[], overdue: SOPStep[], upcoming: SOPStep[] }
  
  /**
   * 计算阶段滞留预警
   */
  static checkStageAlert(customer): { level: 'none'|'yellow'|'red', message: string }
  
  /**
   * 自动标签规则引擎
   */
  static computeAutoTags(customer): string[]
  
  /**
   * 计算阶段转化率
   */
  static computeFunnel(customers): FunnelData
  
  /**
   * 计算 SOP 执行率
   */
  static computeSOPRate(customers): number
}
```

#### SOP 模板库（内置）

根据客户类型提供 3 个预置模板：

```javascript
const SOP_TEMPLATES = [
  {
    templateId: 'SOP-DEFAULT',
    name: '标准跟进SOP',
    applicableTo: { types: [], stages: ['P1','P2','P3'] },
    steps: [
      { id:1, name:'欢迎触达', delay:{type:'immediate'}, actionType:'send_message' },
      { id:2, name:'需求收集', delay:{type:'days', value:1}, actionType:'collect_requirement' },
      { id:3, name:'方案推送', delay:{type:'days', value:3}, actionType:'send_proposal' },
      { id:4, name:'试菜邀约', delay:{type:'days', value:7}, condition:'方案已查看' },
      { id:5, name:'促单跟进', delay:{type:'days', value:14}, actionType:'send_closing' },
      { id:6, name:'沉睡唤醒', delay:{type:'days', value:30}, condition:'未进入P4' },
    ]
  },
  {
    templateId: 'SOP-CHAIN',
    name: '连锁客户跟进SOP',
    applicableTo: { types: ['CHAIN'], stages: ['P1','P2','P3'] },
    steps: [ /* 连锁专有步骤 */ ]
  },
  {
    templateId: 'SOP-CANTEEN',
    name: '食堂客户跟进SOP',
    applicableTo: { types: ['CANTEEN','CATERING'], stages: ['P1','P2','P3'] },
    steps: [ /* 食堂专有步骤 */ ]
  }
];
```

### 3.2 AI 助手 (`ai-helper.js`)

#### 对外接口

```javascript
class AIHelper {
  /**
   * 生成跟进文案（3个版本）
   */
  static generateMessage(customer, sopStep): { versionA: string, versionB: string, versionC: string }
  
  /**
   * 计算客户健康度 (0-100)
   */
  static computeHealthScore(customer): number
  
  /**
   * 推荐最佳下一步动作
   */
  static suggestNextAction(customer): { action: string, reason: string }
  
  /**
   * 检测是否需要沉睡唤醒
   */
  static checkSleepWakeup(customer): { needed: boolean, message: string }
}
```

#### 健康度评分算法

```
分数 = 最近互动分(30) + 阶段进展分(25) + 互动密度分(20) + 情绪倾向分(15) + 预算明确分(10)

最近互动分:
  today     → 30
  1-3天前   → 24
  4-7天前   → 18
  8-14天前  → 10
  15-30天前 → 5
  >30天前   → 0

阶段进展分:
  P1 → 5    P2 → 10   P3 → 15
  P4 → 18   P5 → 21   P6 → 23   P7 → 25

互动密度分: (过去30天)
  >=5次 → 20    3-4次 → 15    1-2次 → 10    0次 → 0

情绪倾向分: (默认10，如有负面互动记➖5)
  默认 → 10   有负面互动 → 5

预算明确分:
  有预算区间 → 10   无 → 0
```

### 3.3 渲染器 (`renderer.js`)

#### 对外接口

```javascript
class Renderer {
  /**
   * 渲染卡片视图
   */
  static renderCards(container, customers, onCardClick): void
  
  /**
   * 渲染漏斗视图
   */
  static renderFunnel(container, funnelData): void
  
  /**
   * 渲染看板视图
   */
  static renderKanban(container, customersByStage, onDragEnd): void
  
  /**
   * 渲染客户详情抽屉
   */
  static renderDetailDrawer(customer, sopInstance): HTMLElement
  
  /**
   * 渲染筛选栏
   */
  static renderFilterBar(container, activeFilters, onChange): void
  
  /**
   * 渲染 KPI 卡片
   */
  static renderKPICards(container, metrics): void
  
  /**
   * 渲染待办列表
   */
  static renderTaskList(container, tasks): void
}
```

### 3.4 主应用 (`crm-app.js`)

#### 状态管理

```javascript
const store = {
  customers: [],          // 全量客户
  filteredCustomers: [],  // 筛选后客户
  activeView: 'card',     // card | funnel | kanban
  filters: {              // 筛选条件
    stage: 'all',
    industry: 'all',
    budget: 'all',
    status: 'active',
    search: ''
  },
  sopInstances: {},       // customerId → SOPInstance
  activeCustomer: null,   // 当前展开的客户
  tasks: {                // 待办数据
    today: [],
    overdue: [],
    upcoming: []
  }
};
```

#### 初始化流程

```javascript
async function init() {
  // 1. 加载数据
  const customers = await loadData('../../data/customers.json');
  
  // 2. 初始化 SOP 实例
  store.sopInstances = customers.map(c => ({
    customerId: c.customerId,
    instance: SOPEngine.buildInstance(c, matchTemplate(c))
  }));
  
  // 3. 计算健康度 + 自动标签
  customers.forEach(c => {
    c.autoTags = SOPEngine.computeAutoTags(c);
    c.healthScore = AIHelper.computeHealthScore(c);
  });
  
  // 4. 计算待办
  refreshTasks();
  
  // 5. 渲染
  renderAll();
  
  // 6. 绑定事件
  bindEvents();
}
```

---

## 4. 数据流

```
用户操作                    JS 处理                        UI 更新
─────────                 ─────────                     ────────
点击筛选条件   →   store.filters 更新            →   renderCards() / renderFunnel()
                customers 过滤
                
切换视图       →   store.activeView 更新          →   hideAllViews() + showView('funnel')
                
点击客户卡片   →   store.activeCustomer = c        →   renderDetailDrawer()
                SOPEngine.buildInstance(c)
                
点击"完成"任务  →  sopInstance.step[i].status='done' →  重新渲染待办 + 卡片SOP
                
阶段拖拽       →  customer.stage 更新             →  重新渲染所有视图
                记录时间线
                
加载数据       →  SOPEngine.computeAutoTags()     →  渲染卡片（含标签）
                AIHelper.computeHealthScore()
```

---

## 5. 测试策略

### 5.1 测试框架
使用 **QUnit**，纯浏览器内运行，无需 Node.js 环境。

### 5.2 测试文件组织

```
tests/
├── index.html          # QUnit 测试入口
├── sop-engine.test.js  # SOP 引擎单元测试
│   ├  测试 SOP 模板匹配
│   ├  测试 SOP 实例构建（时间线计算）
│   ├  测试到期/逾期检查
│   ├  测试阶段滞留预警
│   ├  测试自动标签规则
│   └  测试漏斗计算
├── ai-helper.test.js   # AI 助手单元测试
│   ├  测试健康度评分（各边界值）
│   ├  测试文案生成（3个版本）
│   └  测试下一步推荐
└── crm-app.test.js     # 主应用测试
    ├  测试数据加载
    ├  测试筛选逻辑
    └  测试标签叠加
```

### 5.3 覆盖率目标
- SOP 引擎：100% 函数覆盖，100% 分支覆盖
- AI 助手：100% 函数覆盖，>90% 分支覆盖
- 渲染器：按需（纯 UI 层，覆盖率要求降低）
- 主应用：>80%

### 5.4 测试数据
使用硬编码的 mock 客户数据（3-5 条覆盖各种场景）进行测试，不依赖文件加载。

---

## 6. UI 组件树

```
ScenePage
├── SceneNav (initNav)
├── FilterBar
│   ├── 阶段筛选 (P1/P2/P3/P4/P5/P6/P7/LOST)
│   ├── 状态筛选 (all/active/sleeping/closed)
│   ├── 搜索框 (按名称/公司搜索)
│   ├── 视图切换 (card/funnel/kanban)
│   └── KPI 卡片 (总数/新增/转化/SOP执行率)
├── ViewContainer
│   ├── CardView
│   │   └── CustomerCard[]
│   │       ├── Header (名称+公司+阶段徽标)
│   │       ├── Tags (标签列表)
│   │       ├── Info (上次联系/下次动作)
│   │       └── SOP Timeline (进度点线图)
│   ├── FunnelView
│   │   ├── StageBar[] (横条+数字+转化箭头)
│   │   └── 点击筛选联动
│   └── KanbanView
│       ├── StageColumn[]
│       │   ├── ColumnHeader (阶段名+数量)
│       │   └── KanbanCard[] (可拖拽)
│       └── LOST Column (带原因表单)
├── DetailDrawer (右侧滑出)
│   ├── 基本信息区
│   ├── 标签区 (可编辑)
│   ├── SOP时间线区
│   ├── 互动历史区
│   └── 同类型客户参考区
└── Toast (操作反馈)
```

---

## 7. 样式约定

- **基底色**: `--bg-base: #F0F2F5`
- **卡片背景**: `--bg-surface: #FFFFFF`
- **品牌色**: `--brand: #2563EB`
- **阶段色**: 沿用 `status-gray/blue/yellow/orange/purple/green`
- **卡片圆角**: `--radius-card: 0.875rem`
- **交互过渡**: `--transition: cubic-bezier(0.16, 1, 0.3, 1)`
- 所有颜色变量已定义在 `shared/css/styles.css`
