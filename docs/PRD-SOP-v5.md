# PRD：统一待办模型（系统兜底版）

**核心变更**：
- 不再区分"系统完成"和"人工完成"
- 每个待办事项，**人和系统都可以完成**
- 系统逻辑：先检测是否已完成 → 未完成则自动执行作为兜底

## 数据模型

```json
{
  "itemId": "p1-welcome",
  "name": "发送欢迎消息",
  "completionKey": "welcome_sent",
  "detectFrom": "message",        // 检测依据：从消息记录中检测
  "detectKeyword": "欢迎",         // 检测关键词：消息内容含"欢迎"即视为已完成
  "fallbackAction": {             // 兜底动作：系统未检测到完成时执行
    "type": "send_message",
    "content": "您好{customerName}..."
  }
}
```

## 执行逻辑

```
for each 客户:
  for each 待办事项:
    if 已标记完成 → 跳过
    if 从消息记录检测到已完成 → 标记完成 → 跳过
    否则 → 执行兜底动作 → 标记完成
```
