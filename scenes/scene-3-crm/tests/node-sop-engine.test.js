// Node.js QUnit 测试运行器 — SOP 引擎
// 加载 sop-engine.js 和 ai-helper.js 并运行所有测试

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 在 globalThis 上模拟 window
// sop-engine.js 和 ai-helper.js 使用 IIFE 分配到全局
// 它们在浏览器中通过 <script> 加载时自动成为全局变量
// 在 Node.js 中，我们需要手动 eval 并捕获结果

function loadModule(filePath) {
  let code = readFileSync(filePath, 'utf-8');
  // IIFE 模式：const X = (() => { ... return {...}; })();
  // 替换 const X = (...) 为 globalThis.X = (...) 使其在 eval 后可访问
  code = code.replace(/^const (\w+) = \(\(\)/m, 'globalThis.$1 = (()');
  eval(code);
}

const sopPath = join(__dirname, '../sop-engine.js');
const aiPath = join(__dirname, '../ai-helper.js');

loadModule(sopPath);
loadModule(aiPath);

// 验证加载成功
if (typeof SOPEngine === 'undefined') throw new Error('SOPEngine 加载失败');
if (typeof AIHelper === 'undefined') throw new Error('AIHelper 加载失败');

// ===== 测试数据 =====
const MOCK_CUSTOMERS = [
  {
    customerId: 'CUS-TEST-001',
    name: '测试川菜馆',
    company: '测试餐饮公司',
    type: '川菜馆',
    typeCode: 'CHAIN',
    region: '第一大区',
    city: '成都',
    storeCount: 3,
    budget: '8-12万',
    stage: 'P1',
    stageLabel: '了解信息',
    lastContact: '2026-05-01',
    nextAction: null,
    status: 'active',
    source: 'AD',
    tags: ['新客户'],
    healthScore: 0,
    history: [],
    order: null,
    decisionMaker: 'OWNER',
    decisionMakerLabel: '创始人'
  },
  {
    customerId: 'CUS-TEST-002',
    name: '测试食堂',
    company: '某企业食堂',
    type: '企业食堂',
    typeCode: 'CANTEEN',
    region: '第二大区',
    city: '上海',
    storeCount: 1,
    budget: '20-30万',
    stage: 'P3',
    stageLabel: '确认合作',
    lastContact: new Date().toISOString().split('T')[0],
    nextAction: '2026-05-25',
    nextActionLabel: '二次试菜',
    status: 'active',
    source: 'EXHIBITION',
    tags: ['大项目', '已试菜'],
    healthScore: 0,
    history: [
      { date: '2026-05-01', action: '展会接触', detail: '食品设备展' },
      { date: '2026-05-10', action: '试菜', detail: '试菜完成，评价高' }
    ],
    order: null,
    decisionMaker: 'CORPORATE',
    decisionMakerLabel: '采购部'
  },
  {
    customerId: 'CUS-TEST-003',
    name: '沉睡客户',
    company: null,
    type: '火锅店',
    typeCode: 'HOTPOT',
    region: '第三大区',
    city: '重庆',
    storeCount: 1,
    budget: '10-15万',
    stage: 'P1',
    stageLabel: '了解信息',
    lastContact: '2026-04-15',
    nextAction: null,
    status: 'sleeping',
    source: 'SELF',
    tags: ['低意向'],
    healthScore: 0,
    history: [
      { date: '2026-04-15', action: '留言咨询', detail: '抖音留言' }
    ],
    order: null,
    decisionMaker: 'OWNER',
    decisionMakerLabel: '创始人'
  },
  {
    customerId: 'CUS-TEST-004',
    name: '已成交客户',
    company: '快食尚',
    type: '快餐店',
    typeCode: 'FAST_FOOD',
    region: '第四大区',
    city: '广州',
    storeCount: 1,
    budget: '3-5万',
    stage: 'P7',
    stageLabel: '已交付',
    lastContact: '2026-05-10',
    nextAction: null,
    status: 'closed',
    source: 'AD',
    tags: ['已成交', 'YC-2000'],
    healthScore: 0,
    history: [
      { date: '2026-04-01', action: '初次咨询', detail: '抖音私信' },
      { date: '2026-04-15', action: '签约', detail: 'YC-2000标准版' },
      { date: '2026-04-20', action: '交付', detail: '安装培训完成' }
    ],
    order: { id: 'ORD-TEST-001', product: 'YC-2000 × 1台', amount: 49800, status: '已交付' },
    decisionMaker: 'OWNER',
    decisionMakerLabel: '店长'
  },
  {
    customerId: 'CUS-TEST-005',
    name: '预算未明确客户',
    company: '个体小吃',
    type: '小吃店',
    typeCode: 'INDIVIDUAL',
    region: '第五大区',
    city: '长沙',
    storeCount: 1,
    budget: null,
    stage: 'P2',
    stageLabel: '收集需求',
    lastContact: '2026-05-18',
    nextAction: '2026-05-22',
    nextActionLabel: '发送方案',
    status: 'active',
    source: 'REFERRAL',
    tags: [],
    healthScore: 0,
    history: [],
    order: null,
    decisionMaker: 'OWNER',
    decisionMakerLabel: '老板'
  }
];

// ===== SOP 引擎测试 =====
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write('  ✅ ');
  } else {
    failed++;
    process.stdout.write('  ❌ ');
  }
  console.log(message);
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    process.stdout.write('  ✅ ');
  } else {
    failed++;
    process.stdout.write('  ❌ ');
  }
  console.log(`${message} (期望: ${expected}, 实际: ${actual})`);
}

function assertNotEqual(actual, expected, message) {
  if (actual !== expected) {
    passed++;
    process.stdout.write('  ✅ ');
  } else {
    failed++;
    process.stdout.write('  ❌ ');
  }
  console.log(`${message} (${actual} !== ${expected})`);
}

function assertOk(val, message) {
  if (val) {
    passed++;
    process.stdout.write('  ✅ ');
  } else {
    failed++;
    process.stdout.write('  ❌ ');
  }
  console.log(message + (val ? '' : ' — 失败'));
}

// ==========================================
console.log('\n📋 SOPEngine.matchTemplate');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
assertNotEqual(SOPEngine.matchTemplate(MOCK_CUSTOMERS[1]), null, '食堂客户匹配非空');
assertEqual(SOPEngine.matchTemplate(MOCK_CUSTOMERS[1]).templateId, 'SOP-CANTEEN', '食堂客户配食堂模板');
assertEqual(SOPEngine.matchTemplate(MOCK_CUSTOMERS[0]).templateId, 'SOP-CHAIN', '连锁客户配连锁模板');
assertEqual(SOPEngine.matchTemplate(MOCK_CUSTOMERS[4]).templateId, 'SOP-DEFAULT', '其他客户配默认模板');
assertEqual(SOPEngine.matchTemplate(MOCK_CUSTOMERS[3]), null, 'P7客户应无活动SOP');

console.log('\n📋 SOPEngine.buildInstance');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const template = SOPEngine.matchTemplate(MOCK_CUSTOMERS[0]);
const instance = SOPEngine.buildInstance(MOCK_CUSTOMERS[0], template);
assertEqual(instance.customerId, 'CUS-TEST-001', 'customerId正确');
assertEqual(instance.steps.length, 6, '6个步骤');
assertEqual(instance.steps[0].status, 'done', 'Step1 immediate = done');
assertEqual(instance.steps[1].status, 'pending', 'Step2 = pending');
assertNotEqual(instance.steps[1].dueAt, null, 'Step2有截止日期');

// 检查日期递增
for (let i = 1; i < instance.steps.length; i++) {
  if (instance.steps[i].dueAt && instance.steps[i-1].dueAt) {
    const prev = new Date(instance.steps[i-1].dueAt).getTime();
    const curr = new Date(instance.steps[i].dueAt).getTime();
    assertOk(curr >= prev, `Step${i+1}日期>=Step${i}`);
  }
}

console.log('\n📋 SOPEngine.checkDueItems');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const result = SOPEngine.checkDueItems(instance);
assertOk(Array.isArray(result.due), 'due是数组');
assertOk(Array.isArray(result.overdue), 'overdue是数组');
assertOk(Array.isArray(result.upcoming), 'upcoming是数组');

console.log('\n📋 SOPEngine.checkStageAlert');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
// 52天前 → red
const oldCust = { ...MOCK_CUSTOMERS[0], lastContact: '2026-04-01' };
assertEqual(SOPEngine.checkStageAlert(oldCust).level, 'red', '52天前P1客户→红色预警');

// 11天前 → yellow
const midCust = { ...MOCK_CUSTOMERS[0], lastContact: '2026-05-12' };
assertEqual(SOPEngine.checkStageAlert(midCust).level, 'yellow', '11天前P1客户→黄色预警');

// 1天前 → none
const newCust = { ...MOCK_CUSTOMERS[0], lastContact: new Date().toISOString().split('T')[0] };
assertEqual(SOPEngine.checkStageAlert(newCust).level, 'none', '1天前P1客户→无预警');

assertEqual(SOPEngine.checkStageAlert(MOCK_CUSTOMERS[3]).level, 'none', 'P7客户→无预警');

console.log('\n📋 SOPEngine.computeAutoTags');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const sleepingTags = SOPEngine.computeAutoTags(MOCK_CUSTOMERS[2]);
assertOk(sleepingTags.includes('沉睡预警'), '沉睡客户→沉睡预警');

const trialTags = SOPEngine.computeAutoTags(MOCK_CUSTOMERS[1]);
assertOk(trialTags.includes('已试菜'), '有试菜历史→已试菜');

const bigTags = SOPEngine.computeAutoTags(MOCK_CUSTOMERS[1]);
assertOk(bigTags.includes('大客户'), '预算20-30万→大客户');

const noBigTags = SOPEngine.computeAutoTags(MOCK_CUSTOMERS[4]);
assertOk(!noBigTags.includes('大客户'), '无预算→非大客户');

console.log('\n📋 SOPEngine.computeFunnel');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const funnel = SOPEngine.computeFunnel(MOCK_CUSTOMERS);
assertEqual(funnel.stages.find(s => s.stage === 'P1').count, 2, 'P1=2个');
assertEqual(funnel.stages.find(s => s.stage === 'P7').count, 1, 'P7=1个');
const conv = funnel.conversions.find(c => c.from === 'P1' && c.to === 'P2');
assertOk(conv.rate >= 0 && conv.rate <= 100, '转化率0-100%');

console.log('\n📋 SOPEngine.filterCustomers');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const filtered = SOPEngine.filterCustomers(MOCK_CUSTOMERS, { status: 'sleeping' });
assertEqual(filtered.length, 1, '沉睡筛选=1个');

const stageFiltered = SOPEngine.filterCustomers(MOCK_CUSTOMERS, { stage: 'P1' });
assertEqual(stageFiltered.length, 2, 'P1筛选=2个');

const searchFiltered = SOPEngine.filterCustomers(MOCK_CUSTOMERS, { search: '食堂' });
assertEqual(searchFiltered.length, 1, '搜索"食堂"=1个');

// ===== AI 助手测试 =====
console.log('\n📋 AIHelper.computeHealthScore');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const today = new Date().toISOString().split('T')[0];
const healthyCust = {
  lastContact: today,
  stage: 'P3',
  history: [{ date: '2026-05-01', action: '试菜' }, { date: today, action: '联系' }],
  budget: '10-20万',
  decisionMaker: 'OWNER'
};
const healthScore = AIHelper.computeHealthScore(healthyCust);
assertOk(healthScore >= 50, `健康客户分数>=50 (实际: ${healthScore})`);
assertOk(healthScore <= 100, `健康客户分数<=100 (实际: ${healthScore})`);

const oldCustHealth = {
  lastContact: new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0],
  stage: 'P1',
  history: [],
  budget: null
};
const lowScore = AIHelper.computeHealthScore(oldCustHealth);
assertOk(lowScore <= 40, `低健康分数<=40 (实际: ${lowScore})`);
assertOk(lowScore >= 0, `分数不为负 (实际: ${lowScore})`);

assertEqual(Math.floor(healthScore), healthScore, '健康度返回整数');

console.log('\n📋 AIHelper.generateMessage');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const msgs = AIHelper.generateMessage(
  { name: '张老板', company: '川味轩', type: '川菜馆', stage: 'P3', stageLabel: '确认合作', budget: '8-12万', tags: ['高意向', '已试菜'] },
  { id: 4, name: '促单跟进', actionType: 'send_closing' }
);
assertOk(msgs.versionA.length > 10, '版本A非空');
assertOk(msgs.versionB.length > 10, '版本B非空');
assertOk(msgs.versionC.length > 10, '版本C非空');
assertNotEqual(msgs.versionA, msgs.versionB, '版本AB不同');
assertOk(msgs.versionA.includes('张老板'), '文案含客户名');

console.log('\n📋 AIHelper.suggestNextAction');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const suggestion = AIHelper.suggestNextAction({ stage: 'P1', type: '火锅店', size: '250平' });
assertOk(suggestion.action.length > 0, 'P1有推荐');
assertOk(suggestion.reason.length > 0, '有推荐理由');

console.log('\n📋 AIHelper.checkSleepWakeup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const oldDate = new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0];
assertOk(AIHelper.checkSleepWakeup({ lastContact: oldDate, stage: 'P1', status: 'active' }).needed, '35天前需唤醒');
assertOk(!AIHelper.checkSleepWakeup({ lastContact: today, stage: 'P3', status: 'active' }).needed, '今天联系不需唤醒');

// ===== 总结 =====
console.log('\n═══════════════════════════════════════');
console.log(`📊 测试结果: ${passed + failed} 个断言`);
console.log(`  ✅ 通过: ${passed}`);
console.log(`  ❌ 失败: ${failed}`);
const total = passed + failed;
console.log(`  覆盖率: ${total > 0 ? Math.round(passed / total * 100) : 0}%`);
console.log('═══════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
