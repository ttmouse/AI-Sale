// ============================================================
// 工作台引擎单元测试 — QUnit + Node.js
// 覆盖率目标: 引擎层 ≥ 90%
// ============================================================

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = __dirname;

// 加载 scenario-data.js (全局挂载 SCENARIOS)
eval(readFileSync(join(base, 'scenario-data.js'), 'utf-8'));

// 加载 workbench-engine.js (挂载到 globalThis)
eval(readFileSync(join(base, 'workbench-engine.js'), 'utf-8'));

// ===== Test Helpers =====
let p = 0, f = 0;

function a(cond, msg) {
  cond ? p++ : f++;
  process.stdout.write(cond ? '  ✅ ' : '  ❌ ');
  console.log(msg);
}

function ae(actual, expected, msg) {
  const ok = actual === expected || (Array.isArray(actual) && Array.isArray(expected) && JSON.stringify(actual) === JSON.stringify(expected));
  ok ? p++ : f++;
  process.stdout.write(ok ? '  ✅ ' : '  ❌ ');
  if (!ok) console.log(`${msg} (期望:${JSON.stringify(expected)}, 实际:${JSON.stringify(actual)})`);
  else console.log(msg);
}

// ===== ===== ===== ===== =====
// 阶段管理
// ===== ===== ===== ===== =====
console.log('\n=== 阶段管理 ===');

const stages = WorkbenchEngine.getStages();
ae(stages.length, 7, 'getStages() 返回7个阶段');

const stageIds = stages.map(s => s.id);
ae(stageIds, ['P1','P2','P3','P4','P5','P6','P7'], '阶段ID顺序正确');

// 每个阶段有必填字段
stages.forEach(s => {
  a(s.name && s.name.length > 0, `阶段${s.id} 有名称`);
  a(s.color && s.color.startsWith('#'), `阶段${s.id} 有颜色值`);
  a(s.order >= 1 && s.order <= 7, `阶段${s.id} 排序正确`);
});

const p3 = WorkbenchEngine.getStageById('P3');
ae(p3.name, '产品匹配与方案推荐', 'getStageById() 返回正确阶段');
ae(WorkbenchEngine.getStageById('PX'), null, 'getStageById() 无效ID返回null');

// ===== ===== ===== ===== =====
// 场景获取
// ===== ===== ===== ===== =====
console.log('\n=== 场景获取 ===');

const allScenarios = WorkbenchEngine.getScenarios();
a(allScenarios.length >= 12, `getScenarios() 返回 ${allScenarios.length} 个场景（≥12）`);

// 每个场景有必填字段
allScenarios.forEach(s => {
  a(s.id && s.id.length > 0, `场景 ${s.id} 有ID`);
  a(s.name && s.name.length > 0, `场景 ${s.id} 有名称`);
  a(s.stageId && stageIds.includes(s.stageId), `场景 ${s.id} 属于有效阶段`);
  a(s.painPoint && s.painPoint.length > 0, `场景 ${s.id} 有痛点`);
  a(Array.isArray(s.highlights) && s.highlights.length > 0, `场景 ${s.id} 有功能亮点`);
  a(s.demoGoal && s.demoGoal.length > 0, `场景 ${s.id} 有演示目标`);
  a(Array.isArray(s.messages) && s.messages.length > 0, `场景 ${s.id} 有消息序列`);
});

// 按阶段获取
const p1Scenarios = WorkbenchEngine.getScenarios('P1');
a(p1Scenarios.length >= 2, `P1 阶段有 ${p1Scenarios.length} 个场景（≥2）`);
p1Scenarios.forEach(s => ae(s.stageId, 'P1', `P1场景 ${s.id} 的 stageId 正确`));

const p7Scenarios = WorkbenchEngine.getScenarios('P7');
a(p7Scenarios.length >= 2, `P7 阶段有 ${p7Scenarios.length} 个场景（≥2）`);

// getScenario
const s1 = WorkbenchEngine.getScenario('1-1');
ae(s1.name, '抖音线索智能开场', 'getScenario("1-1") 返回正确场景');
ae(WorkbenchEngine.getScenario('invalid'), null, 'getScenario() 无效ID返回null');

// ===== ===== ===== ===== =====
// 场景选择
// ===== ===== ===== ===== =====
console.log('\n=== 场景选择 ===');

const selected = WorkbenchEngine.selectScenario('2-1');
a(selected, 'selectScenario("2-1") 返回true');

const current = WorkbenchEngine.getCurrentScenario();
ae(current.id, '2-1', 'getCurrentScenario() 返回选中场景');
ae(current.name, '社餐客户画像自动补全', '当前场景名称正确');
ae(WorkbenchEngine.getCurrentMessageIndex(), 0, '选中场景后消息索引为0');

const invalidSelect = WorkbenchEngine.selectScenario('invalid');
a(!invalidSelect, 'selectScenario("invalid") 返回false');

// ===== ===== ===== ===== =====
// 消息播放
// ===== ===== ===== ===== =====
console.log('\n=== 消息播放 ===');

// 选中1-1场景
WorkbenchEngine.selectScenario('1-1');

const msgs = WorkbenchEngine.getMessages();
a(msgs.length >= 3, `场景1-1 有 ${msgs.length} 条消息（≥3）`);

// 消息类型验证
msgs.forEach((m, i) => {
  const validTypes = ['customer','sales','ai-hint','ai-recommend','system'];
  a(validTypes.includes(m.type), `消息${i} 类型为有效值 (${m.type})`);
  a(m.content && m.content.length > 0, `消息${i} 有内容`);
});

// 第一条消息通常是 system 或 customer
a(msgs[0].type === 'system' || msgs[0].type === 'customer', '第一条消息类型正确');

// hasNextMessage
a(WorkbenchEngine.hasNextMessage(), '初始状态 hasNextMessage() 为true');

// advanceMessage 推进
const firstMsg = WorkbenchEngine.advanceMessage();
ae(firstMsg, msgs[0], 'advanceMessage() 返回第一条消息');
ae(WorkbenchEngine.getCurrentMessageIndex(), 1, '推进后索引为1');

// 推进全部消息
WorkbenchEngine.selectScenario('1-1');
let count = 0;
while (WorkbenchEngine.hasNextMessage()) {
  const msg = WorkbenchEngine.advanceMessage();
  a(msg !== null, `advanceMessage() 返回消息 #${count+1}`);
  count++;
}
a(count === msgs.length, `推进了全部 ${count} 条消息`);
a(!WorkbenchEngine.hasNextMessage(), '所有消息推进后 hasNextMessage() 为false');
ae(WorkbenchEngine.advanceMessage(), null, '超出后 advanceMessage() 返回null');

// getVisibleMessages
WorkbenchEngine.selectScenario('1-1');
ae(WorkbenchEngine.getVisibleMessages().length, 0, '未推进时可见消息为0');
WorkbenchEngine.advanceMessage();
WorkbenchEngine.advanceMessage();
ae(WorkbenchEngine.getVisibleMessages().length, 2, '推进2条后可见消息为2');

// ===== ===== ===== ===== =====
// 注解
// ===== ===== ===== ===== =====
console.log('\n=== 注解 ===');

// 场景1-1 有 defaultAnnotations 和 annotationsAt
WorkbenchEngine.selectScenario('1-1');
const ann = WorkbenchEngine.getCurrentAnnotations();
a(ann !== null, 'getCurrentAnnotations() 返回非空');
if (ann) {
  a(typeof ann.profile === 'string' && ann.profile.length > 0, '注解包含 profile');
  a(ann.progress && typeof ann.progress.currentStage === 'string', '注解包含 progress.currentStage');
  a(Array.isArray(ann.flows), '注解包含 flows');
  a(Array.isArray(ann.cards), '注解包含 cards');
  a(ann.nextAction && typeof ann.nextAction.suggestion === 'string', '注解包含 nextAction');
}

// annotationsAt 测试
const s1Data = WorkbenchEngine.getScenario('1-1');
if (s1Data.annotationsAt && s1Data.annotationsAt.length > 0) {
  // 在索引0之前的注解
  const ann0 = WorkbenchEngine.getAnnotationAtIndex(0);
  a(ann0 !== null, 'getAnnotationAtIndex(0) 返回非空');
}

// 不同场景的注解不同
WorkbenchEngine.selectScenario('2-1');
const ann2 = WorkbenchEngine.getCurrentAnnotations();
if (ann && ann2 && ann.progress && ann2.progress) {
  a(ann.progress.currentStage !== ann2.progress.currentStage,
    '不同场景的注解内容不同');
}

// ===== ===== ===== ===== =====
// 重置
// ===== ===== ===== ===== =====
console.log('\n=== 重置 ===');

WorkbenchEngine.selectScenario('3-1');
WorkbenchEngine.advanceMessage();
WorkbenchEngine.advanceMessage();
WorkbenchEngine.reset();
ae(WorkbenchEngine.getCurrentScenario(), null, 'reset() 后当前场景为null');
ae(WorkbenchEngine.getCurrentMessageIndex(), 0, 'reset() 后消息索引为0');
ae(WorkbenchEngine.getMessages().length, 0, 'reset() 后消息列表为空');

// ===== ===== ===== ===== =====
// 导航
// ===== ===== ===== ===== =====
console.log('\n=== 导航 ===');

WorkbenchEngine.selectScenario('1-2');
ae(WorkbenchEngine.getPrevScenarioId(), '1-1', '场景1-2的上一个是1-1');
ae(WorkbenchEngine.getNextScenarioId(), '1-3', '场景1-2的下一个是1-3');

// 第一个场景没有上一个
WorkbenchEngine.selectScenario('1-1');
ae(WorkbenchEngine.getPrevScenarioId(), null, '第一个场景没有上一个');
ae(WorkbenchEngine.getNextScenarioId(), '1-2', '第一个场景的下一个是1-2');

// 最后一个场景没有下一个
const allIds = WorkbenchEngine.getScenarios().map(s => s.id).sort();
const lastId = allIds[allIds.length - 1];
WorkbenchEngine.selectScenario(lastId);
ae(WorkbenchEngine.getNextScenarioId(), null, '最后一个场景没有下一个');
a(WorkbenchEngine.getPrevScenarioId() !== null, '最后一个场景有上一个');

// ===== ===== ===== ===== =====
// 数据完整性 — 每个场景的消息序列有至少1条 customer 和1条 sales
// ===== ===== ===== ===== =====
console.log('\n=== 数据完整性 ===');

allScenarios.forEach(s => {
  const types = s.messages.map(m => m.type);
  a(types.includes('customer'), `场景${s.id} 包含客户消息`);
  a(types.includes('sales'), `场景${s.id} 包含销售消息`);
  a(types.includes('ai-hint') || types.includes('ai-recommend'), `场景${s.id} 包含AI提示或推荐`);
});

// annotation 完整
allScenarios.forEach(s => {
  if (s.defaultAnnotations) {
    const d = s.defaultAnnotations;
    a(d.profile && d.profile.length > 0, `场景${s.id} defaultAnnotations.profile 非空`);
    a(d.progress && d.progress.currentStage, `场景${s.id} defaultAnnotations.progress 有效`);
    a(Array.isArray(d.flows), `场景${s.id} defaultAnnotations.flows 为数组`);
    a(Array.isArray(d.cards), `场景${s.id} defaultAnnotations.cards 为数组`);
    a(d.nextAction && d.nextAction.suggestion, `场景${s.id} defaultAnnotations.nextAction 有效`);
  }
});

// 每个阶段至少2个场景
stageIds.forEach(sid => {
  const count = WorkbenchEngine.getScenarios(sid).length;
  a(count >= 2, `阶段${sid} 有 ${count} 个场景（≥2）`);
});

// ===== ===== ===== ===== =====
// 边界情况
// ===== ===== ===== ===== =====
console.log('\n=== 边界情况 ===');

// 未选择场景时
WorkbenchEngine.reset();
ae(WorkbenchEngine.getCurrentScenario(), null, '未选择场景返回null');
ae(WorkbenchEngine.getMessages().length, 0, '未选择场景消息为空');
ae(WorkbenchEngine.getVisibleMessages().length, 0, '未选择场景可见消息为空');
ae(WorkbenchEngine.getCurrentAnnotations(), null, '未选择场景注解为null');
ae(WorkbenchEngine.hasNextMessage(), false, '未选择场景没有下一步');
ae(WorkbenchEngine.getNextScenarioId(), null, '未选择场景没有下一个');
ae(WorkbenchEngine.getPrevScenarioId(), null, '未选择场景没有上一个');

// 重置后重新选择
WorkbenchEngine.selectScenario('4-1');
a(WorkbenchEngine.getCurrentScenario() !== null, '重置后可选场景');
ae(WorkbenchEngine.getCurrentScenario().id, '4-1', '重新选中4-1');

// ===== ===== ===== ===== =====
// 统计
// ===== ===== ===== ===== =====
const total = p + f;
const pct = total > 0 ? Math.round((p / total) * 100) : 0;
console.log(`\n∑ ${p}/${total} 通过, ${pct}%`);
process.exit(f > 0 ? 1 : 0);
