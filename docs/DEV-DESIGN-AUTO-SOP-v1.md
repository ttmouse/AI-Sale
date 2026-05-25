# 开发设计：自动化 SOP 触达系统

> **版本**: v2.0 | **日期**: 2026-05-23 | **关联PRD**: `docs/PRD-AUTO-SOP-v1.md`

---

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     scene-3-auto-sop/index.html                  │
│   加载 shared/css/styles.css + 场景自定义样式 + JS 模块           │
├─────────────────────────────────────────────────────────────────┤
│   JS 模块架构                                                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │               auto-sop-app.js (主应用)                │       │
│  │  初始化/状态管理/UI 渲染/事件绑定                     │       │
│  └──────────┬────────────────────────────────┬──────────┘       │
│             │                                │                    │
│    ┌────────▼──────────┐       ┌─────────────▼─────────┐        │
│    │  auto-engine.js    │       │   auto-renderer.js    │        │
│    │  自动化引擎核心     │       │  UI渲染层              │        │
│    │  ────────────────  │       │  ────────────────     │        │
│    │  • 时间线扫描器    │       │  • 异常处理视图        │        │
│    │  • 规则执行器      │       │  • 客户洞察视图        │        │
│    │  • 阶段迁移机      │       │  • 互动时间线视图      │        │
│    │  • 关键词检测器    │       │  • 系统日志视图        │        │
│    │  • 异常上报器      │       └────────────────────────┘        │
│    │  • 频率控制器      │                                        │
│    └────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 自动化引擎核心设计 (`auto-engine.js`)

### 2.1 引擎工作流

```
每天 10:00 定时触发（或手动触发）
  ↓
autoEngine.dailyScan(allCustomers)
  ↓
对每个 active 客户：
  ├─ 1. 检查关键词回复（新回复中是否含关键词）
  │     └─ 匹配 → 触发对应动作（阶段迁移/异常上报）
  │
  ├─ 2. 检查待执行的 SOP 规则
  │     ├─ 到时间了？ → 条件满足？ → 执行动作
  │     └─ 执行动作 → 记录消息 → 更新状态
  │
  ├─ 3. 检查阶段滞留预警
  │     ├─ 超过阈值 → 自动降级/标记沉睡
  │     └─ 触发沉睡唤醒规则
  │
  └─ 4. 收集异常（关键词异常/超时异常）
        └─ 上报给销售处理中心

  ↓
汇总今日执行结果：
  ├─ 自动发送消息：N 条
  ├─ 阶段迁移：M 个
  ├─ 异常上报：K 个
  └─ 需销售处理：P 个
```

### 2.2 核心接口

```javascript
class AutoEngine {
  /**
   * 每日扫描：对所有活跃客户执行SOP检查
   * @returns {{ sent: number, migrated: number, escalated: number, exceptions: number }}
   */
  static dailyScan(customers): DailyReport
  
  /**
   * 检查单个客户的新回复中是否含关键词
   * 命中关键词 → 阶段迁移 或 异常上报
   */
  static checkKeywords(customer): KeywordResult | null
  
  /**
   * 执行客户当前待执行的SOP规则
   * 按时间线顺序执行到期的规则
   */
  static executeRules(customer, rules): ExecutionResult[]
  
  /**
   * 检查阶段滞留，触发降级或沉睡
   * P1 >14天无互动 → 黄色预警
   * P1 >30天无互动 → 自动标记沉睡
   */
  static checkStale(customer): StaleResult
  
  /**
   * 发送消息（模拟）
   * 记录发送状态，支持重试
   */
  static sendMessage(customer, rule, channel): SendResult
}
```

### 2.3 SOP 规则定义（内置）

```javascript
const AUTO_RULES = [
  // P1 阶段规则
  { ruleId: 'R001', name: 'Day1 欢迎触达',
    trigger: { type: 'stage_entry', stage: 'P1', delay: '0d' },
    action: { type: 'send_message', channel: 'wecom',
      content: '您好{customerName}！我是优特智厨的销售顾问……' }},
  
  { ruleId: 'R002', name: 'Day2 同行案例推送',
    trigger: { type: 'stage_entry', stage: 'P1', delay: '1d' },
    condition: "!hasReplied",
    action: { type: 'send_message', channel: 'wecom',
      content: '{customerName}，分享一个和您类似的案例……' }},
  
  { ruleId: 'R003', name: 'Day4 方案推送',
    trigger: { type: 'stage_entry', stage: 'P1', delay: '3d' },
    condition: "!hasReplied",
    action: { type: 'send_message', channel: 'wecom',
      content: '根据您的场景，推荐以下配置方案……' }},
  
  { ruleId: 'R004', name: 'Day7 试菜邀约',
    trigger: { type: 'stage_entry', stage: 'P1', delay: '7d' },
    condition: "!hasReplied && !hasTrialScheduled",
    action: { type: 'send_message', channel: 'wecom',
      content: '{customerName}，诚邀您到体验中心试菜……' }},
  
  // 关键词迁移
  { ruleId: 'R010', name: '客户主动问试菜',
    trigger: { type: 'keyword_match', keywords: ['试菜','尝尝','体验','来看看'] },
    action: { type: 'stage_transition', toStage: 'P2' },
    escalation: { level: 'MEDIUM', message: '{customerName}主动询问试菜，请安排', assignTo: 'sales' }},
  
  { ruleId: 'R011', name: '客户询价',
    trigger: { type: 'keyword_match', keywords: ['多少钱','价格','报价','预算','费用'] },
    action: { type: 'send_message', channel: 'wecom',
      content: '{customerName}，价格根据配置从3万到8万都有。我先给您匹配最适合的方案？' },
    escalation: { level: 'LOW', message: '{customerName}询价，正常跟进即可', assignTo: 'sales' }},
  
  // 异常检测
  { ruleId: 'R020', name: '客户嫌贵',
    trigger: { type: 'keyword_match', keywords: ['太贵','贵了','便宜点','折扣','优惠'] },
    action: { type: 'escalation', level: 'MEDIUM' },
    escalation: { level: 'MEDIUM', message: '{customerName}反馈价格问题，建议用人力成本换算回应', assignTo: 'sales' }},
  
  { ruleId: 'R021', name: '竞品对比',
    trigger: { type: 'keyword_match', keywords: ['美膳狮','饭来','繁兴','黑菠萝','其它品牌','竞品'] },
    action: { type: 'send_message', channel: 'wecom',
      content: '关于{customerName}提到的竞品，我们核心优势是……' },
    escalation: { level: 'HIGH', message: '{customerName}在对比竞品，建议尽快联系', assignTo: 'sales' }},
  
  // 沉睡唤醒
  { ruleId: 'R030', name: '30天沉睡检测',
    trigger: { type: 'time_elapsed', days: 30, condition: "stage IN ('P1','P2') && noRecentReply" },
    action: { type: 'stage_transition', toStage: 'P0' }},
  
  { ruleId: 'R031', name: '沉睡唤醒消息',
    trigger: { type: 'stage_entry', stage: 'P0', delay: '0d' },
    action: { type: 'send_message', channel: 'wecom',
      content: '{customerName}，好久不见！最近生意怎么样？我们出了新款……' }},
  
  // 阶段迁移后触发
  { ruleId: 'R040', name: 'P2阶段自动欢迎',
    trigger: { type: 'stage_entry', stage: 'P2', delay: '0d' },
    action: { type: 'send_message', channel: 'wecom',
      content: '太好了{customerName}！收到您的试菜意向，我马上安排……' }},
];
```

### 2.4 关键词检测器

```javascript
class KeywordDetector {
  // 内置关键词规则
  static KEYWORD_RULES = {
    // 正向信号 → 阶段迁移
    trial: { keywords: ['试菜','尝尝','体验','来看看','什么时候能试'], action: 'transition', toStage: 'P2', level: 'MEDIUM' },
    
    // 询价信号 → 自动回复 + 销售通知
    price: { keywords: ['多少钱','价格','报价','预算','费用','成本'], action: 'reply+notify', level: 'LOW' },
    
    // 负面信号 → 异常上报
    expensive: { keywords: ['太贵','贵了','便宜','折扣','优惠','别家便宜'], action: 'escalate', level: 'MEDIUM' },
    
    // 竞品信号 → 自动回复 + 紧急上报
    competitor: { keywords: ['美膳狮','饭来','繁兴','黑菠萝','竞品','别家','另一家'], action: 'reply+escalate', level: 'HIGH' },
    
    // 异议处理
    objection: { keywords: ['不需要','考虑','再看看吧','不感兴趣'], action: 'escalate', level: 'LOW' },
  };
  
  /**
   * 检测客户的最新回复中是否含有关键词
   */
  static detect(customer, replyText): MatchResult | null
  
  /**
   * 根据匹配结果执行对应动作
   */
  static executeMatch(customer, match): ActionResult
}
```

---

## 3. 数据流

```
时间线执行器 (每天10:00)
  │
  ├─→ 遍历所有 active 客户
  │     │
  │     ├─→ 检查新回复 → 关键词检测器
  │     │     ├─ 命中"试菜" → 阶段迁移 P1→P2 + 通知销售
  │     │     ├─ 命中"太贵" → 上报异常
  │     │     ├─ 命中"多少钱" → 自动回复 + 通知销售
  │     │     └─ 无命中 → 继续
  │     │
  │     ├─→ 检查待执行规则
  │     │     ├─ 有到期的 → 执行动作
  │     │     │     ├─ send_message → 记录消息
  │     │     │     ├─ stage_transition → 更新阶段
  │     │     │     └─ escalation → 加入异常列表
  │     │     └─ 无到期 → 跳过
  │     │
  │     └─→ 检查阶段滞留
  │           ├─ >30天 → P0 + 唤醒规则
  │           └─ <30天 → 跳过
  │
  └─→ 生成日报 → 更新 UI
```

---

## 4. UI 设计（销售工作台）

### 4.1 异常处理中心（默认视图）

```
┌──────────────────────────────────────────────────────────────┐
│  自动化 SOP 触达系统    [今天10:00已扫描]  [手动触发扫描]      │
├──────────────────────────────────────────────────────────────┤
│  📊 今日概况                                                  │
│  自动发送 12 条 · 阶段迁移 2 个 · 异常上报 3 个               │
├──────────────────────────────────────────────────────────────┤
│  🔴 需要你处理 (3)                          ← 核心区域        │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🔴 HIGH  王老板·川味轩  主动说"想试菜"                    │ │
│  │    系统建议：今天内回电确认试菜时间、地点                   │ │
│  │    [安排试菜] [转同事] [标记已完成]                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🟡 MEDIUM 李总·快食尚   反馈"你们的机器太贵了"            │ │
│  │    系统建议：用人力成本换算，一台机器省2个厨师             │ │
│  │    [查看话术] [标记已完成]                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🟡 MEDIUM 陈主管·企业食堂 回复"多少钱"                   │ │
│  │    系统已自动回复，建议跟进确认需求                        │ │
│  │    [查看对话] [标记已完成]                                │ │
│  └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  ✅ 今日已自动处理 (2)                        ← 灰度信息      │
│  • 刘老板·火锅店   30天无互动 → 已标记沉睡 → 已发送唤醒消息   │
│  • 赵总·维也纳酒店  Day3方案推送 → 已自动发送                 │
│  [查看全部日志]                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 客户洞察视图（点击客户后展开）

```
┌──────────────────────────────────────────────┐
│  👤 王老板 · 川味轩                          │
│  阶段：P1 → 已迁移至 P2（客户主动问试菜）     │
├──────────────────────────────────────────────┤
│  📅 互动时间线                                │
│  ┌────────────────────────────────────────┐  │
│  │ 10:00 系统 → 客户  Day1 欢迎消息       │  │
│  │ 10:00 系统 → 客户  Day2 案例推送       │  │
│  │ 10:00 系统 → 客户  Day4 方案推送       │  │
│  │ 14:23 客户 → 系统  "看着不错，想试菜"  │  │  ← 关键词命中
│  │ 14:23 系统        阶段迁移 P1→P2      │  │
│  │ 14:23 系统 → 销售  异常上报：安排试菜  │  │  ← 需要销售处理
│  └────────────────────────────────────────┘  │
│                                              │
│  🏷️ 自动标签：川菜馆 · 高意向 · 已方案推送   │
│  ⏭️ 下一步：销售安排试菜时间                  │
└──────────────────────────────────────────────┘
```

---

## 5. 文件结构

```
scenes/scene-3-crm/               ← 复用同个目录，覆盖v1
├── index.html                     ← 新的主页面（自动化工作台）
├── auto-engine.js                 ← 自动化引擎核心
├── auto-renderer.js               ← UI渲染层
├── auto-sop-app.js                ← 主应用
└── tests/
    ├── index.html                 ← 测试入口
    ├── auto-engine.test.js        ← 自动化引擎测试
    └── auto-sop-app.test.js       ← 主应用测试
```

---

## 6. 测试策略

### 6.1 测试框架
使用 QUnit（浏览器）/ Node.js 直接运行。

### 6.2 关键测试点

| 测试模块 | 测试点 | 数量 |
|---------|-------|------|
| 规则引擎 | 规则匹配/条件判断/延迟执行 | 8 |
| 关键词检测 | 正向/负面/询价/竞品 4 类关键词命中 | 8 |
| 阶段迁移 | 关键词迁移/时间阈值迁移/手动迁移 | 6 |
| 异常上报 | 上报级别/重复去重/销售处理 | 5 |
| 消息发送 | 发送记录/频率控制/失败重试 | 5 |
| 沉睡检测 | 30天阈值/唤醒规则 | 4 |
| 主应用 | 初始化/日扫描/UI更新 | 4 |
| **合计** | | **≈40** |
