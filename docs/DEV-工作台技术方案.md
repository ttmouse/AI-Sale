# 开发设计：销售对话智能工作台 — 技术方案

> 版本: v1.0 | 日期: 2026-07-22 | 基于 PRD v1.0

---

## 1. 技术架构

### 1.1 分层结构

```
┌──────────────────────────────────────────────────────────┐
│                      index.html                          │
│  (HTML骨架 + 样式引入 + 页面初始化脚本)                   │
├──────────────────────────────────────────────────────────┤
│                   workbench-ui.js                        │
│  (UI渲染层：三栏渲染、场景切换UI、消息播放器、卡片渲染)    │
├──────────────────────────────────────────────────────────┤
│                  workbench-engine.js                     │
│  (核心引擎：场景管理、阶段管理、消息队列、状态模拟)        │
├──────────────────────────────────────────────────────────┤
│                  scenario-data.js                        │
│  (数据层：7阶段×27场景的结构化数据定义)                   │
├──────────────────────────────────────────────────────────┤
│            shared/css/styles.css + tokens.css            │
│  (全局样式：依赖现有设计系统)                             │
└──────────────────────────────────────────────────────────┘
```

### 1.2 依赖关系
- `scenario-data.js` → 无外部依赖
- `workbench-engine.js` → 依赖 `scenario-data.js`
- `workbench-ui.js` → 依赖 `workbench-engine.js` + `tokens.css` + `styles.css`
- `index.html` → 依赖以上所有

---

## 2. 数据模型

### 2.1 阶段定义 (Stage)

```typescript
interface Stage {
  id: string;          // "P1" ~ "P7"
  name: string;        // "线索接入与智能破冰"
  color: string;       // 阶段色
  order: number;       // 排序
}
```

### 2.2 场景定义 (Scenario)

```typescript
interface Scenario {
  id: string;              // "1-1", "2-1"...
  stageId: string;         // 所属阶段 "P1"
  name: string;            // "抖音线索智能开场"
  painPoint: string;       // 销售痛点
  highlights: string[];    // AI功能亮点列表
  demoGoal: string;        // 演示目标
  messages: Message[];     // 对话消息序列
  annotations: {           // 右侧注解数据
    profileUpdate: string;        // 画像更新
    stageProgress: StageProgress; // 阶段推进
    flowActions: FlowAction[];    // 流程动作
    knowledgeCards: string[];     // 知识卡
    nextAction: NextAction;       // 下一步建议
  };
}
```

### 2.3 消息定义 (Message)

```typescript
interface Message {
  type: 'customer' | 'sales' | 'ai-hint' | 'ai-recommend' | 'system';
  content: string;
  sender?: string;        // 发送者名称
  options?: string[];     // AI推荐选项
  selected?: number;      // 销售选中的推荐索引
}
```

### 2.4 注解数据结构

```typescript
interface StageProgress {
  currentStage: string;
  completed: string[];
  pending: string[];
  stageChange?: string;     // "P2 → P3"
}

interface FlowAction {
  label: string;
  action: string;
  icon: string;
}

interface NextAction {
  suggestion: string;
  reason: string;
  recommendedScript?: string;
}
```

---

## 3. 引擎 API 设计

### WorkbenchEngine — 纯逻辑，无 DOM 依赖

```typescript
class WorkbenchEngine {
  // ===== 初始化 =====
  constructor()
  
  // ===== 场景 =====
  getStages(): Stage[]                      // 获取所有阶段
  getScenarios(stageId: string): Scenario[] // 获取某阶段下的场景
  getScenario(id: string): Scenario | null  // 按ID获取场景
  
  // ===== 状态管理 =====
  selectScenario(id: string): void          // 选中场景
  getCurrentScenario(): Scenario | null     // 当前场景
  getCurrentMessageIndex(): number          // 当前消息索引
  
  // ===== 消息播放 =====
  hasNextMessage(): boolean                 // 是否有下一条
  advanceMessage(): Message | null          // 推进到下一条
  getMessages(): Message[]                  // 获取该场景所有消息
  getVisibleMessages(): Message[]           // 当前可见消息
  
  // ===== 注解 =====
  getCurrentAnnotations(): Annotations | null  // 当前注解
  getAnnotationAtIndex(index: number): Annotations | null  // 指定消息的注解
  
  // ===== 重置 =====
  reset(): void                             // 重置到初始状态
}
```

---

## 4. UI 组件树

```
Workbench Page
├── StageNavBar (阶段Tab导航)
│   ├── StageTab (P1-P7)
│   └── ScenarioSelector (子场景下拉)
├── ThreeColumnLayout
│   ├── LeftPanel (场景说明区)
│   │   ├── StageBadge (阶段标识)
│   │   ├── ScenarioName (场景名称)
│   │   ├── PainPoint (销售痛点)
│   │   ├── Highlights (功能亮点列表)
│   │   └── DemoGoal (演示目标)
│   ├── CenterPanel (对话区)
│   │   ├── PhoneFrame (手机壳容器)
│   │   │   ├── MessagesContainer (消息列表)
│   │   │   │   └── MessageBubble (消息气泡)
│   │   │   └── PlaybackControls (播放控制)
│   │   └── ChatActions (快捷按钮)
│   └── RightPanel (AI注解区)
│       ├── ProfileCard (画像更新)
│       ├── ProgressCard (阶段推进)
│       ├── FlowCard (流程动作)
│       ├── KnowledgeCard (知识卡推荐)
│       └── NextActionCard (下一步建议)
└── NavControls (上/下场景切换)
```

---

## 5. 测试策略

### 5.1 测试框架
- 使用现有项目的 QUnit 测试框架（已在 scene-3-crm/tests 中使用）
- 在 `scenes/scene-12-workbench/workbench-engine.test.js` 下编写

### 5.2 测试范围
| 测试类别 | 测试项 | 优先级 |
|----------|--------|--------|
| **阶段管理** | getStages() 返回7个阶段 | P0 |
| **阶段管理** | 每个阶段有正确的id/name/order | P0 |
| **场景获取** | getScenario() 返回正确场景 | P0 |
| **场景获取** | getScenarios() 按阶段过滤正确 | P0 |
| **场景选择** | selectScenario() 更新当前场景 | P0 |
| **消息播放** | getMessages() 返回场景所有消息 | P0 |
| **消息播放** | hasNextMessage() 正确判断 | P0 |
| **消息播放** | advanceMessage() 返回正确消息 | P0 |
| **消息播放** | advanceMessage() 到最后返回null | P0 |
| **消息播放** | getVisibleMessages() 按进度返回 | P0 |
| **注解** | getCurrentAnnotations() 场景切换后正确 | P1 |
| **注解** | getAnnotationAtIndex() 每个消息对应注解 | P1 |
| **边界** | 最后一个场景 advMessage 行为 | P1 |
| **边界** | reset() 后状态归零 | P1 |
| **数据完整性** | 每个场景的 annotation 字段完整 | P1 |
| **数据完整性** | 所有场景的 messages 非空 | P1 |

### 5.3 覆盖率目标
- 引擎层（workbench-engine.js）：语句覆盖 ≥ 95%，分支覆盖 ≥ 90%
- 数据层（scenario-data.js）：场景结构完整性校验
- 不测试 UI 层（纯渲染，不包含业务逻辑）

---

## 6. 文件清单

| 文件 | 说明 |
|------|------|
| `scenes/scene-12-workbench/index.html` | 页面入口，依赖所有 JS/CSS |
| `scenes/scene-12-workbench/scenario-data.js` | 27个场景的结构化数据 |
| `scenes/scene-12-workbench/workbench-engine.js` | 核心引擎（纯逻辑，可测试） |
| `scenes/scene-12-workbench/workbench-ui.js` | UI 渲染组件 |
| `scenes/scene-12-workbench/workbench-engine.test.js` | 引擎单元测试 |
| `docs/PRD-销售对话智能工作台.md` | 产品需求文档 |
| `docs/DEV-工作台技术方案.md` | 本开发设计文档 |

---

## 7. 数据流

```
用户点击阶段Tab
  → UI调用 engine.getScenarios(stageId) 
  → 渲染子场景列表
  → 用户选择场景
  → UI调用 engine.selectScenario(id)
  → engine 内部加载场景的 messages 和 annotations
  → UI调用 engine.getVisibleMessages() 渲染消息
  → UI调用 engine.getCurrentAnnotations() 渲染注解
  → 用户点击"下一条"
  → UI调用 engine.advanceMessage()
  → engine 更新内部索引
  → UI重新渲染消息列表和注解区
```
