// 浏览器环境模拟 + 集成测试
// 验证模块加载顺序和 API 调用链

import { readFileSync } from 'fs';

// 模拟浏览器全局对象
globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => ({ innerHTML: '', style: {}, textContent: '' }),
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({}),
  body: { appendChild: () => {}, style: {} },
  addEventListener: () => {},
  documentElement: { style: {} }
};
Object.defineProperty(globalThis, 'navigator', {
  value: { clipboard: { writeText: async () => {} } },
  writable: true, configurable: true
});
globalThis.fetch = async () => ({ json: async () => ({ customers: [] }) });
globalThis.CustomEvent = class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts?.detail; } };

// 加载模块
const files = [
  'sop-engine.js',
  'ai-helper.js',
  'renderer.js',
  'crm-app.js'
];

let errors = [];
files.forEach(f => {
  try {
    let code = readFileSync('scenes/scene-3-crm/' + f, 'utf-8');
    if (f === 'crm-app.js') {
      // crm-app.js 引用了 window.CRMApp，直接 eval
    } else {
      // 替换 const XX = (() => 为 globalThis.XX = (() 以在 eval 后访问
      code = code.replace(/^const (\w+) = \(\(\)/m, 'globalThis.$1 = (()');
    }
    eval(code);
    console.log('✅ ' + f + ' 加载成功');
  } catch (e) {
    errors.push(f + ': ' + e.message);
    console.log('❌ ' + f + ' 加载失败: ' + e.message);
  }
});

// 检查全局对象
console.log('\n--- 全局对象检查 ---');
console.log('SOPEngine:', typeof SOPEngine);
console.log('AIHelper:', typeof AIHelper);
console.log('CRMRenderer:', typeof CRMRenderer);
console.log('CRMApp:', typeof CRMApp);

// 执行 API 函数验证
console.log('\n--- API 验证 ---');

// 1. SOP 引擎
const cust = {
  customerId: 'CUS-001', name: '测试', company: '测试公司',
  type: '川菜馆', typeCode: 'CHAIN', stage: 'P1', stageLabel: '了解信息',
  lastContact: '2026-05-20', budget: '8-12万', storeCount: 3,
  status: 'active', tags: [], history: [],
  decisionMaker: 'OWNER', decisionMakerLabel: '创始人'
};
const tpl = SOPEngine.matchTemplate(cust);
console.log('matchTemplate:', tpl ? tpl.templateId : 'null');

const inst = SOPEngine.buildInstance(cust, tpl);
console.log('buildInstance steps:', inst.steps.length, 'status:', inst.steps.map(s => s.status).join(','));

const due = SOPEngine.checkDueItems(inst);
console.log('checkDueItems due:', due.due.length, 'overdue:', due.overdue.length, 'upcoming:', due.upcoming.length);

const alert = SOPEngine.checkStageAlert(cust);
console.log('checkStageAlert:', alert.level);

const tags = SOPEngine.computeAutoTags(cust);
console.log('computeAutoTags:', tags.join(', '));

const funnel = SOPEngine.computeFunnel([cust]);
console.log('computeFunnel total:', funnel.total, 'stages:', funnel.stages.length);

const filtered = SOPEngine.filterCustomers([cust], { stage: 'P1' });
console.log('filterCustomers:', filtered.length);

// 2. AI 助手
const score = AIHelper.computeHealthScore(cust);
console.log('healthScore:', score);

const msgs = AIHelper.generateMessage(cust, { actionType: 'send_message', name: '欢迎触达' });
console.log('generateMessage A:', msgs.versionA.substring(0, 30) + '...');

const suggestion = AIHelper.suggestNextAction(cust);
console.log('suggestNextAction:', suggestion.action);

const wakeup = AIHelper.checkSleepWakeup(cust);
console.log('checkSleepWakeup:', wakeup.needed);

// 3. 渲染器 API
console.log('renderCards:', typeof CRMRenderer.renderCards);
console.log('renderFunnel:', typeof CRMRenderer.renderFunnel);
console.log('renderKanban:', typeof CRMRenderer.renderKanban);
console.log('renderDetailDrawer:', typeof CRMRenderer.renderDetailDrawer);
console.log('renderKPICards:', typeof CRMRenderer.renderKPICards);
console.log('renderTaskList:', typeof CRMRenderer.renderTaskList);
console.log('showToast:', typeof CRMRenderer.showToast);

// 汇总
console.log('\n═══════════════════════════════════════');
if (errors.length === 0) {
  console.log('✅ 集成测试全部通过');
  console.log('   SOPEngine ✅ AIHelper ✅ CRMRenderer ✅ CRMApp ✅');
} else {
  console.log('❌ 失败 ' + errors.length + ' 项:');
  errors.forEach(e => console.log('   ' + e));
  process.exit(1);
}
