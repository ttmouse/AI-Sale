# Smart Mapping Log

> 记录每次分析中「发现了什么、修了什么、踩了什么坑」
> 模式重复出现后升格到 `smart_mapping.md` 正文

---

## 2026-05-23 · 初始化

### 项目初探发现

**路径 Bug**
- `shared/tokens.css` 被各场景引用为 `shared/css/tokens.css`（错误路径）
- 日志中反复出现 `404 shared/css/tokens.css`
- 受影响的场景：scene-2, scene-7, scene-8 等

**AI 层现状**
- 每个场景的 AI 逻辑是独立硬编码的（scene-1 用 `findAnswer()` 查 KB 对象，scene-2 用 if/else 判断 P1-P4，没有统一 prompt 层）
- 没有 LLM 调用——所有"AI 回复"都是预制文本
- 数据层（JSON）和 AI 层完全解耦，AI 不读 products.json / customers.json

**跨场景数据**
- 各场景独立加载 JSON 数据，没有共享状态
- 同一客户在不同场景间"不认得"——S1 问"张老板"和 S3 看"张老板"不共享上下文

### 日志里发现的稳定模式

```
404 shared/css/tokens.css    出现 6+ 次（路径错误）
404 favicon.ico              出现 2+ 次（根目录缺 favicon）
404 .well-known/...          每次 Chrome 调试都会触发（无害）
```

---

## 2026-05-23 · 场景 1 数据驱动升级

### 做了什么
把 scene-1 的 AI 回复从 7 条硬编码 KB 对象改为异步加载 3 个 JSON 文件，在 JS 端做关键词匹配 + 数据格式化输出。

### 发现

**① `shared/js/app.js` 的 `loadData()` 路径错误**
```
fetch(`/demo/data/${name}.json`)  → 实际文件在 /data/ 下
```
路径前缀 `/demo/data/` 不存在。且此函数在所有 HTML 中**从未被调用**——定义即死代码。

**② 关键词匹配 vs LLM 的边界**
场景 1 升级后仍然是关键词匹配（`lower.includes(keyword)`），不是真 LLM。有得也有失：
- **优点**：0 依赖、0 延迟、行为完全可预期
- **缺点**：用户说"YC2000"不匹配"YC-2000"、"2000 型号"不匹配"YC-2000A"
- → 这是 demo 的合理折衷，但如果要真 LLM，需要在 smart_mapping.md 里标清楚"当前层是规则引擎"

**③ Price 格式处理**
`products.json` 的 price 是纯数字（`29800`），需要转成万字 + 千分位。需要注意 null 值（定制款 `price: null`）。

**④ 场景推荐匹配粒度**
按 `scenes` 字段（中文数组如 `["创业小店","私房菜"]`）做关键词匹配效果不错，但 `customerTypes` 字段是英文枚举（"STARTUP"），中文用户不会说，所以匹配不了。→ 需要回退查 dict.json 的 `customerTypes[].label` 做翻译映射。

### 踩坑
- `loadData()` 路径导致 debug 了 3 秒才决定自己写 fetch
- `dict.json` 的层级是 `dict.customerTypes.values`，不是平面结构——第一次读时忽略了
- 金额格式化时 `(29800/10000).toFixed(2)` = `"2.98"` 正确，但 `118000/10000` = `"11.80"` 需要去掉多余 .00

### 升格检查
- [x] **路径验证模式**：每次引用相对路径时先确认实际位置 — 已写入 smart_mapping.md 常见陷阱
- [ ] 数据层共享模式待观察：如果场景 3/5 也走类似路径，再升格
