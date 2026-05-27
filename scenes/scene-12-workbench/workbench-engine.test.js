// ============================================================
// 工作台引擎单元测试 — QUnit + Node.js
// 加载 JSON 场景文件
// ============================================================

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = __dirname;

// 直接读 JSON 文件构建数据（模拟引擎 init）
const scenariosDir = join(base, 'scenarios');
import { readdirSync } from 'fs';
const jsonFiles = readdirSync(scenariosDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const allScenarios = [];
const scenarioCache = {};

jsonFiles.forEach(f => {
  const data = JSON.parse(readFileSync(join(scenariosDir, f), 'utf-8'));
  // 兼容 annotations→annotationsAt 转换
  if (data.annotations && Array.isArray(data.annotations)) {
    data.defaultAnnotations = null;
    data.annotationsAt = [];
    var foundFirst = false;
    data.annotations.forEach(function(ann, idx) {
      if (ann !== null) {
        if (!foundFirst) { data.defaultAnnotations = ann; foundFirst = true; }
        else { data.annotationsAt.push({ atIndex: idx, annotations: ann }); }
      }
    });
    delete data.annotations;
  }
  allScenarios.push(data);
  scenarioCache[data.id] = data;
});

// 模拟引擎 API
const Engine = {
  getStages: () => [
    {id:'P1',name:'线索接入与智能破冰',color:'#60A5FA',order:1},
    {id:'P2',name:'客户画像与需求洞察',color:'#34D399',order:2},
    {id:'P3',name:'产品匹配与方案推荐',color:'#FBBF24',order:3},
    {id:'P4',name:'价值证明与异议化解',color:'#F97316',order:4},
    {id:'P5',name:'试菜拜访与现场推进',color:'#EC4899',order:5},
    {id:'P6',name:'报价合同与成交推进',color:'#8B5CF6',order:6},
    {id:'P7',name:'交付培训与复购经营',color:'#06B6D4',order:7},
  ],
  getStageById: (id) => Engine.getStages().find(s => s.id === id) || null,
  getScenarios: (stageId) => stageId ? allScenarios.filter(s => s.stageId === stageId) : allScenarios.slice(),
  getScenario: (id) => scenarioCache[id] || null,
  selectScenario: (id) => { if (!scenarioCache[id]) return false; Engine._currentId = id; Engine._msgIdx = 0; return true; },
  getCurrentScenario: () => Engine._currentId ? scenarioCache[Engine._currentId] : null,
  getCurrentMessageIndex: () => Engine._msgIdx || 0,
  getMessages: () => { const sc = Engine.getCurrentScenario(); return sc ? (sc.messages || []) : []; },
  hasNextMessage: () => Engine._msgIdx < Engine.getMessages().length,
  advanceMessage: () => { const msgs = Engine.getMessages(); if (Engine._msgIdx >= msgs.length) return null; const m = msgs[Engine._msgIdx]; Engine._msgIdx++; return m; },
  getVisibleMessages: () => Engine.getMessages().slice(0, Engine._msgIdx),
  getCurrentAnnotations: () => Engine.getAnnotationAtIndex(Engine._msgIdx),
  getAnnotationAtIndex: (idx) => {
    const sc = Engine.getCurrentScenario();
    if (!sc) return null;
    if (sc.annotationsAt && sc.annotationsAt.length > 0) {
      var sorted = sc.annotationsAt.slice().sort((a,b) => a.atIndex - b.atIndex);
      var match = null;
      sorted.forEach(function(e) { if (e.atIndex <= idx) match = e.annotations; });
      if (match) return match;
    }
    return sc.defaultAnnotations || null;
  },
  reset: () => { Engine._currentId = null; Engine._msgIdx = 0; },
  getNextScenarioId: () => {
    if (!Engine._currentId) return null;
    const ids = allScenarios.map(s => s.id).sort();
    const i = ids.indexOf(Engine._currentId);
    return (i >= 0 && i < ids.length - 1) ? ids[i + 1] : null;
  },
  getPrevScenarioId: () => {
    if (!Engine._currentId) return null;
    const ids = allScenarios.map(s => s.id).sort();
    const i = ids.indexOf(Engine._currentId);
    return (i > 0) ? ids[i - 1] : null;
  },
  _currentId: null,
  _msgIdx: 0,
};
globalThis.WorkbenchEngine = Engine;

// ===== Test Helpers =====
let p = 0, f = 0;

function a(cond, msg) { cond ? p++ : f++; process.stdout.write(cond ? '  \u2705 ' : '  \u274c '); console.log(msg); }
function ae(actual, expected, msg) {
  const ok = actual === expected || (Array.isArray(actual) && Array.isArray(expected) && JSON.stringify(actual) === JSON.stringify(expected));
  ok ? p++ : f++;
  process.stdout.write(ok ? '  \u2705 ' : '  \u274c ');
  if (!ok) console.log(msg + ' (期望:' + JSON.stringify(expected) + ', 实际:' + JSON.stringify(actual) + ')');
  else console.log(msg);
}

// ===== 阶段管理 =====
console.log('\n=== 阶段管理 ===');
const stages = Engine.getStages();
ae(stages.length, 7, 'getStages() 返回7个阶段');
const stageIds = stages.map(s => s.id);
ae(stageIds, ['P1','P2','P3','P4','P5','P6','P7'], '阶段ID顺序正确');
stages.forEach(s => { a(s.name && s.name.length > 0, '阶段${s.id} 有名称'); a(s.color && s.color.startsWith('#'), '阶段${s.id} 有颜色值'); });
ae(Engine.getStageById('P3').name, '产品匹配与方案推荐', 'getStageById() 返回正确阶段');
ae(Engine.getStageById('PX'), null, 'getStageById() 无效ID返回null');

// ===== 场景获取 =====
console.log('\n=== 场景获取 ===');
a(allScenarios.length >= 12, 'getScenarios() 返回 ${allScenarios.length} 个场景（>=12）');
allScenarios.forEach(s => {
  a(s.id && s.id.length > 0, '场景 ${s.id} 有ID');
  a(s.name && s.name.length > 0, '场景 ${s.id} 有名称');
  a(s.stageId && stageIds.includes(s.stageId), '场景 ${s.id} 属于有效阶段');
  a(s.painPoint && s.painPoint.length > 0, '场景 ${s.id} 有痛点');
  a(Array.isArray(s.highlights) && s.highlights.length > 0, '场景 ${s.id} 有功能亮点');
  a(s.demoGoal && s.demoGoal.length > 0, '场景 ${s.id} 有演示目标');
  a(Array.isArray(s.messages) && s.messages.length > 0, '场景 ${s.id} 有消息序列');
});

const p1Scenarios = Engine.getScenarios('P1');
a(p1Scenarios.length >= 2, 'P1 阶段有 ${p1Scenarios.length} 个场景（>=2）');
p1Scenarios.forEach(s => ae(s.stageId, 'P1', 'P1场景 ${s.id} 的 stageId 正确'));

const p7Scenarios = Engine.getScenarios('P7');
a(p7Scenarios.length >= 2, 'P7 阶段有 ${p7Scenarios.length} 个场景（>=2）');

ae(Engine.getScenario('1-1').name, '抖音线索智能开场', 'getScenario("1-1") 返回正确场景');
ae(Engine.getScenario('invalid'), null, 'getScenario() 无效ID返回null');

// ===== 场景选择 =====
console.log('\n=== 场景选择 ===');
a(Engine.selectScenario('2-1'), 'selectScenario("2-1") 返回true');
ae(Engine.getCurrentScenario().id, '2-1', 'getCurrentScenario() 返回选中场景');
ae(Engine.getCurrentMessageIndex(), 0, '选中场景后消息索引为0');
a(!Engine.selectScenario('invalid'), 'selectScenario("invalid") 返回false');

// ===== 消息播放 =====
console.log('\n=== 消息播放 ===');
Engine.selectScenario('1-1');
const msgs = Engine.getMessages();
a(msgs.length >= 3, '场景1-1 有 ${msgs.length} 条消息（>=3）');
a(Engine.hasNextMessage(), '初始状态 hasNextMessage() 为true');
const firstMsg = Engine.advanceMessage();
a(firstMsg !== null, 'advanceMessage() 返回非空');
ae(Engine.getCurrentMessageIndex(), 1, '推进后索引为1');

Engine.selectScenario('1-1');
let count = 0;
while (Engine.hasNextMessage()) { Engine.advanceMessage(); count++; }
a(count === msgs.length, '推进了全部 ${count} 条消息');
a(!Engine.hasNextMessage(), '所有消息推进后 hasNextMessage() 为false');

Engine.selectScenario('1-1');
Engine.advanceMessage(); Engine.advanceMessage();
ae(Engine.getVisibleMessages().length, 2, '推进2条后可见消息为2');

// ===== 注解 =====
console.log('\n=== 注解 ===');
Engine.selectScenario('1-1');
const ann = Engine.getAnnotationAtIndex(0);
a(ann !== null, 'getAnnotationAtIndex(0) 返回非空');
if (ann) {
  a(typeof ann.fields === 'object' && ann.fields !== null, '注解包含 fields');
  a(ann.progress && typeof ann.progress.currentStage === 'string', '注解包含 progress.currentStage');
}

// 不同场景注解不同
const ann1 = Engine.getAnnotationAtIndex(0);
Engine.selectScenario('2-1');
const ann2 = Engine.getAnnotationAtIndex(0);
if (ann1 && ann2 && ann1.progress && ann2.progress) {
  a(ann1.progress.currentStage !== ann2.progress.currentStage, '不同场景的注解阶段不同');
}

// ===== 重置 =====
console.log('\n=== 重置 ===');
Engine.selectScenario('3-1');
Engine.advanceMessage(); Engine.advanceMessage();
Engine.reset();
ae(Engine.getCurrentScenario(), null, 'reset() 后当前场景为null');
ae(Engine.getCurrentMessageIndex(), 0, 'reset() 后消息索引为0');

// ===== 导航 =====
console.log('\n=== 导航 ===');
Engine.selectScenario('1-2');
ae(Engine.getPrevScenarioId(), '1-1', '场景1-2的上一个是1-1');
ae(Engine.getNextScenarioId(), '1-3', '场景1-2的下一个是1-3');
Engine.selectScenario('1-1');
ae(Engine.getNextScenarioId(), '1-2', '第一个场景的下一个是1-2');
ae(Engine.getPrevScenarioId(), null, '第一个场景没有上一个');

const allIds = allScenarios.map(s => s.id).sort();
const lastId = allIds[allIds.length - 1];
Engine.selectScenario(lastId);
ae(Engine.getNextScenarioId(), null, '最后一个场景没有下一个');
a(Engine.getPrevScenarioId() !== null, '最后一个场景有上一个');

// ===== 数据完整性 =====
console.log('\n=== 数据完整性 ===');
allScenarios.forEach(s => {
  const types = s.messages.map(m => m.type);
  a(types.includes('customer'), '场景${s.id} 包含客户消息');
  a(types.includes('sales'), '场景${s.id} 包含销售消息');
});

// 每个阶段至少2个场景
stageIds.forEach(sid => {
  const c = Engine.getScenarios(sid).length;
  a(c >= 2, '阶段${sid} 有 ${c} 个场景（>=2）');
});

// ===== 边界情况 =====
console.log('\n=== 边界情况 ===');
Engine.reset();
ae(Engine.getCurrentScenario(), null, '未选择场景返回null');
ae(Engine.getMessages().length, 0, '未选择场景消息为空');
ae(Engine.getVisibleMessages().length, 0, '未选择场景可见消息为空');
ae(Engine.getCurrentAnnotations(), null, '未选择场景注解为null');
ae(Engine.hasNextMessage(), false, '未选择场景没有下一步');
ae(Engine.getNextScenarioId(), null, '未选择场景没有下一个');
ae(Engine.getPrevScenarioId(), null, '未选择场景没有上一个');

Engine.selectScenario('4-1');
a(Engine.getCurrentScenario() !== null, '重置后可选场景');
ae(Engine.getCurrentScenario().id, '4-1', '重新选中4-1');

// ===== 统计 =====
const total = p + f;
const pct = total > 0 ? Math.round((p / total) * 100) : 0;
console.log('\n∑ ' + p + '/' + total + ' 通过, ' + pct + '%');
process.exit(f > 0 ? 1 : 0);
