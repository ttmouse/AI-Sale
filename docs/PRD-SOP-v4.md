# PRD：阶段待办清单 SOP 系统

> **版本**: v4.0（方向修正终版） | **日期**: 2026-05-23
> **核心变更**: 从「时间线驱动」彻底转向「阶段待办清单驱动」

---

## 0. 核心命题

**之前（错的）**：
```
P1 阶段 → Day 1 欢迎 → Day 3 方案 → Day 7 试菜
           ↑ 用时间线模拟流程，但客户在不同阶段停留时间不确定
```

**现在（对的）**：
```
P1 阶段 →
  □ 发送欢迎消息        ← 未完成 → 系统自动执行
  □ 发送方案资料        ← 未完成 → 系统自动执行
  □ 安排试菜体验        ← 未完成 → 系统自动执行
  □ 确认客户需求        ← 已完成（销售手动标记）
  
系统不管客户在 P1 待了 3 天还是 30 天——只要待办没完成，就去完成它。
```

### 关键转变

| 维度 | 旧模型（时间线） | 新模型（待办清单） |
|------|----------------|------------------|
| 触发条件 | 进入阶段 N 天后 | 进入阶段 + 事项未完成 |
| 时间依赖 | 强依赖（Day 1/3/7） | 无依赖（随时执行） |
| 人工动作 | 不支持跟踪 | 销售完成的事项自动标记已完成 |
| 重复执行 | 需频率控制 | 事项完成即停止，不会重复 |
| 阶段间的边界 | 模糊（天数跨阶段） | 清晰（每个阶段独立清单） |

---

## 1. 用户故事

### 故事：一个客户从 P1 到 P2 的完整流程

```
客户进入 P1 阶段
  ↓
系统检测：P1 有待办事项 4 项，全部未完成
  ↓
自动执行第 1 项「发送欢迎消息」→ 标记已完成
自动执行第 2 项「发送方案资料」→ 标记已完成
第 3 项「安排试菜体验」→ 客户没回复，继续等待（条件不满足）
第 4 项「确认客户需求」→ 等待销售手动完成
  ↓
客户回复"想试菜"→ 系统检测到关键词
  ↓
系统自动完成第 3 项「安排试菜体验」→ 标记已完成
系统自动迁移客户到 P2 阶段
  ↓
进入 P2 → 系统检测：P2 有待办事项 3 项，全部未完成
  ↓
自动执行第 1 项「发送试菜确认」→ 标记已完成
...
```

**关键观察**：系统不关心"客户在 P1 待了几天"，只关心"P1 的事项还没做完的还有哪些"。

---

## 2. 数据模型

### 2.1 阶段待办事项模板

```json
{
  "stage": "P1",
  "items": [
    {
      "itemId": "p1-welcome",
      "name": "发送欢迎消息",
      "description": "客户进入P1后，自动发送品牌欢迎消息",
      "audienceId": "aud-chain",
      "triggerOn": "stage_enter",        // 进入阶段时触发
      "condition": "none",               // 无条件
      "autoExec": true,                  // 系统可自动执行
      "action": {
        "type": "send_message",
        "channel": "wecom",
        "contentTemplate": "您好{customerName}..."
      },
      "completionKey": "welcome_sent"    // 唯一标识，用于跟踪完成状态
    },
    {
      "itemId": "p1-proposal",
      "name": "发送方案资料",
      "description": "发送产品方案和报价",
      "audienceId": "aud-chain",
      "triggerOn": "stage_enter",
      "condition": "none",
      "autoExec": true,
      "action": {
        "type": "send_message",
        "channel": "wecom",
        "contentTemplate": "{customerName}，根据您的场景..."
      },
      "completionKey": "proposal_sent"
    },
    {
      "itemId": "p1-trial",
      "name": "安排试菜体验",
      "description": "邀请客户到体验中心试菜",
      "audienceId": "aud-chain",
      "triggerOn": "keyword",             // 客户回复关键词后触发
      "keywords": ["试菜","尝尝","体验"],
      "autoExec": true,
      "action": {
        "type": "send_message",
        "channel": "wecom",
        "contentTemplate": "{customerName}，诚邀您来试菜..."
      },
      "completionKey": "trial_arranged"
    },
    {
      "itemId": "p1-need-confirm",
      "name": "确认客户需求",
      "description": "销售人工确认客户的具体需求信息",
      "audienceId": null,                 // 所有客户
      "triggerOn": "stage_enter",
      "autoExec": false,                  // 需要销售手动完成
      "action": null,                     // 无系统动作
      "completionKey": "need_confirmed"
    }
  ]
}
```

### 2.2 客户各阶段完成状态

```json
{
  "customerId": "C001",
  "stageStates": {
    "P1": {
      "completions": {
        "welcome_sent": { "done": true, "doneBy": "system", "doneAt": "2026-05-23" },
        "proposal_sent": { "done": true, "doneBy": "system", "doneAt": "2026-05-23" },
        "trial_arranged": { "done": false },
        "need_confirmed": { "done": false }
      },
      "allDone": false                     // 全部完成后才可推进
    }
  }
}
```

### 2.3 引擎执行逻辑

```
scanAll(customers):
  for each customer:
    for each stage in [P1,P2,P3,P4,P5,P6,P7,P0]:
      if customer.stage === stage:
        stageItems = getItemsForStage(stage)
        pendingItems = stageItems.filter(item => !isCompleted(customer, stage, item))
        
        for each pendingItem:
          if pendingItem.autoExec && triggerConditionMet(customer, pendingItem):
            executeAction(customer, pendingItem)
            markCompleted(customer, stage, pendingItem)
```

---

## 3. 验收标准

| 功能 | 验收项 | 优先级 |
|------|--------|-------|
| 阶段待办模板 | 每个阶段可配置多个待办事项 | P0 |
| 待办执行 | 系统自动执行 autoExec=true 的待办 | P0 |
| 完成状态跟踪 | 事项执行后自动标记已完成 | P0 |
| 不重复执行 | 已完成的事项不再执行 | P0 |
| 关键词触发 | 待办可按客户回复关键词触发 | P0 |
| 人工完成 | 销售可手动标记某事项已完成 | P0 |
| 待办进度视图 | 运营可查看客户的阶段待办完成进度 | P0 |
