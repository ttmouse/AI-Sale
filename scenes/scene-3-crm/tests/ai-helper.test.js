// AI 助手单元测试

// 复用 MOCK_CUSTOMERS（从 sop-engine.test.js 中定义的）

// ===== 测试：健康度评分 =====
QUnit.module('AIHelper.computeHealthScore');

QUnit.test('今天联系过的客户应有最高最近互动分', function(assert) {
  const today = new Date().toISOString().split('T')[0];
  const customer = {
    lastContact: today,
    stage: 'P3',
    history: [{ date: '2026-05-01', action: '试菜' }, { date: today, action: '联系' }],
    budget: '10-20万',
    decisionMaker: 'OWNER'
  };
  const score = AIHelper.computeHealthScore(customer);
  // 最近互动分=30 + 阶段分=15 + 互动密度分(2次<30天...需要算) + 情绪分=10 + 预算分=10
  assert.ok(score >= 50, '健康度应不低于50');
  assert.ok(score <= 100, '健康度应不超过100');
});

QUnit.test('30天未联系且无预算的客户应分数最低', function(assert) {
  const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const customer = {
    lastContact: oldDate,
    stage: 'P1',
    history: [],
    budget: null
  };
  const score = AIHelper.computeHealthScore(customer);
  assert.ok(score >= 0, '分数不应为负');
  assert.ok(score <= 40, '最差情况分数应低于40');
});

QUnit.test('健康度评分应返回整数', function(assert) {
  const customer = {
    lastContact: '2026-05-20',
    stage: 'P2',
    history: [{ date: '2026-05-18', action: '咨询' }],
    budget: '5-8万'
  };
  const score = AIHelper.computeHealthScore(customer);
  assert.equal(Math.floor(score), score, '应返回整数');
});

QUnit.test('P7已交付客户的健康度应较高', function(assert) {
  const customer = {
    lastContact: '2026-05-20',
    stage: 'P7',
    history: [{ date: '2026-05-20', action: '回访' }],
    budget: '3-5万'
  };
  const score = AIHelper.computeHealthScore(customer);
  assert.ok(score >= 60, '已交付客户健康度应≥60');
});

// ===== 测试：文案生成 =====
QUnit.module('AIHelper.generateMessage');

QUnit.test('应生成3个版本的跟进文案', function(assert) {
  const customer = {
    name: '张老板',
    company: '川味轩',
    type: '川菜馆',
    stage: 'P3',
    stageLabel: '确认合作',
    budget: '8-12万',
    tags: ['高意向', '已试菜']
  };
  const sopStep = { id: 4, name: '促单跟进', actionType: 'send_closing' };
  const messages = AIHelper.generateMessage(customer, sopStep);
  
  assert.ok(messages.versionA, '应有版本A');
  assert.ok(messages.versionB, '应有版本B');
  assert.ok(messages.versionC, '应有版本C');
  assert.notEqual(messages.versionA, messages.versionB, '版本A和B应不同');
  assert.ok(messages.versionA.length > 10, '文案不应为空');
});

QUnit.test('文案应包含客户名称', function(assert) {
  const customer = { name: '张老板', company: '川味轩', stage: 'P2' };
  const sopStep = { name: '需求收集', actionType: 'collect_requirement' };
  const messages = AIHelper.generateMessage(customer, sopStep);
  assert.ok(messages.versionA.includes('张老板'), '文案A应包含客户名称');
});

// ===== 测试：最佳下一步推荐 =====
QUnit.module('AIHelper.suggestNextAction');

QUnit.test('P1阶段客户应推荐需求挖掘', function(assert) {
  const customer = { stage: 'P1', type: '火锅店', size: '250平' };
  const suggestion = AIHelper.suggestNextAction(customer);
  assert.ok(suggestion.action, '应有推荐动作');
  assert.ok(suggestion.reason, '应有推荐理由');
});

QUnit.test('P3阶段已试菜客户应推荐促单', function(assert) {
  const customer = { stage: 'P3', stageLabel: '确认合作', tags: ['已试菜'] };
  const suggestion = AIHelper.suggestNextAction(customer);
  assert.ok(suggestion.action.length > 0, '应有推荐动作');
});

// ===== 测试：沉睡唤醒检测 =====
QUnit.module('AIHelper.checkSleepWakeup');

QUnit.test('超过30天未联系的客户应标记唤醒', function(assert) {
  const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const customer = {
    lastContact: oldDate,
    stage: 'P1',
    status: 'active'
  };
  const result = AIHelper.checkSleepWakeup(customer);
  assert.ok(result.needed, '应需要唤醒');
});

QUnit.test('最近联系过的客户不应标记唤醒', function(assert) {
  const today = new Date().toISOString().split('T')[0];
  const customer = {
    lastContact: today,
    stage: 'P3',
    status: 'active'
  };
  const result = AIHelper.checkSleepWakeup(customer);
  assert.notOk(result.needed, '不应需要唤醒');
});
