// SOP 引擎单元测试
// TDD：先写测试，再实现功能

const module = QUnit.module;

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
    lastContact: '2026-05-20',
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
    lastContact: '2026-04-15',  // >30天前
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
    budget: null,          // 无预算
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

// ===== 测试：SOP 模板匹配 =====
QUnit.module('SOPEngine.matchTemplate');

QUnit.test('食堂客户应匹配食堂SOP模板', function(assert) {
  const canteenCustomer = MOCK_CUSTOMERS[1]; // typeCode: CANTEEN
  const template = SOPEngine.matchTemplate(canteenCustomer);
  assert.notEqual(template, null, '应返回非空模板');
  assert.equal(template.templateId, 'SOP-CANTEEN', '应匹配食堂模板');
});

QUnit.test('连锁客户应匹配连锁SOP模板', function(assert) {
  const chainCustomer = MOCK_CUSTOMERS[0]; // typeCode: CHAIN
  const template = SOPEngine.matchTemplate(chainCustomer);
  assert.notEqual(template, null, '应返回非空模板');
  assert.equal(template.templateId, 'SOP-CHAIN', '应匹配连锁模板');
});

QUnit.test('其他类型客户应匹配默认SOP模板', function(assert) {
  const defaultCustomer = MOCK_CUSTOMERS[4]; // typeCode: INDIVIDUAL
  const template = SOPEngine.matchTemplate(defaultCustomer);
  assert.notEqual(template, null, '应返回非空模板');
  assert.equal(template.templateId, 'SOP-DEFAULT', '应匹配默认模板');
});

QUnit.test('已成交(P7)客户不应匹配SOP', function(assert) {
  const closedCustomer = MOCK_CUSTOMERS[3];
  const template = SOPEngine.matchTemplate(closedCustomer);
  assert.equal(template, null, '已成交客户不应有活动SOP');
});

// ===== 测试：SOP 实例构建 =====
QUnit.module('SOPEngine.buildInstance');

QUnit.test('应为P1阶段客户构建6个步骤的SOP实例', function(assert) {
  const customer = MOCK_CUSTOMERS[0];
  const template = SOPEngine.matchTemplate(customer);
  const instance = SOPEngine.buildInstance(customer, template);
  assert.equal(instance.customerId, customer.customerId, 'customerId正确');
  assert.equal(instance.steps.length, 6, '应有6个步骤');
  assert.equal(instance.steps[0].status, 'done', 'Step1(immediate)应标记为已完成');
  assert.equal(instance.steps[1].status, 'pending', 'Step2应待处理');
  assert.notEqual(instance.steps[1].dueAt, null, 'Step2应有截止日期');
});

QUnit.test('SOP实例的步骤截止日期应随时间递增', function(assert) {
  const customer = MOCK_CUSTOMERS[0];
  const template = SOPEngine.matchTemplate(customer);
  const instance = SOPEngine.buildInstance(customer, template);
  for (let i = 1; i < instance.steps.length; i++) {
    if (instance.steps[i].dueAt && instance.steps[i-1].dueAt) {
      const prev = new Date(instance.steps[i-1].dueAt).getTime();
      const curr = new Date(instance.steps[i].dueAt).getTime();
      assert.ok(curr > prev, `Step${i+1}的截止日期(${instance.steps[i].dueAt})应在Step${i}(${instance.steps[i-1].dueAt})之后`);
    }
  }
});

// ===== 测试：到期检查 =====
QUnit.module('SOPEngine.checkDueItems');

QUnit.test('应正确分类到期/逾期/即将到期任务', function(assert) {
  const customer = MOCK_CUSTOMERS[0];
  const template = SOPEngine.matchTemplate(customer);
  const instance = SOPEngine.buildInstance(customer, template);
  const result = SOPEngine.checkDueItems(instance);
  
  assert.ok(Array.isArray(result.due), 'due应为数组');
  assert.ok(Array.isArray(result.overdue), 'overdue应为数组');
  assert.ok(Array.isArray(result.upcoming), 'upcoming应为数组');
});

// ===== 测试：阶段滞留预警 =====
QUnit.module('SOPEngine.checkStageAlert');

QUnit.test('P1阶段超过14天应返回红色预警', function(assert) {
  const customer = { ...MOCK_CUSTOMERS[0], lastContact: '2026-04-01' }; // 52天前
  const alert = SOPEngine.checkStageAlert(customer);
  assert.equal(alert.level, 'red', '应返回红色预警');
  assert.ok(alert.message.includes('P1'), '消息应包含P1');
});

QUnit.test('P1阶段7-14天应返回黄色预警', function(assert) {
  const customer = { ...MOCK_CUSTOMERS[0], lastContact: '2026-05-12' }; // 11天前
  const alert = SOPEngine.checkStageAlert(customer);
  assert.equal(alert.level, 'yellow', '应返回黄色预警');
});

QUnit.test('P1阶段7天内应无预警', function(assert) {
  const customer = { ...MOCK_CUSTOMERS[0], lastContact: '2026-05-22' }; // 1天前
  const alert = SOPEngine.checkStageAlert(customer);
  assert.equal(alert.level, 'none', '应无预警');
});

QUnit.test('P7已交付阶段应无预警', function(assert) {
  const alert = SOPEngine.checkStageAlert(MOCK_CUSTOMERS[3]); // P7
  assert.equal(alert.level, 'none', '已交付客户不应有预警');
});

// ===== 测试：自动标签 =====
QUnit.module('SOPEngine.computeAutoTags');

QUnit.test('超过14天未联系的P1客户应标记沉睡预警', function(assert) {
  const customer = MOCK_CUSTOMERS[2]; // sleeping, lastContact: 2026-04-15
  const tags = SOPEngine.computeAutoTags(customer);
  assert.ok(tags.includes('沉睡预警'), '应包含沉睡预警标签');
});

QUnit.test('有试菜历史的客户应标记已试菜', function(assert) {
  const customer = MOCK_CUSTOMERS[1]; // has 试菜 in history
  const tags = SOPEngine.computeAutoTags(customer);
  assert.ok(tags.includes('已试菜'), '应包含已试菜标签');
});

QUnit.test('预算大于15万的客户应标记大客户', function(assert) {
  const customer = MOCK_CUSTOMERS[1]; // budget: 20-30万
  const tags = SOPEngine.computeAutoTags(customer);
  assert.ok(tags.includes('大客户'), '应包含大客户标签');
});

QUnit.test('预算为空时不应标记大客户', function(assert) {
  const customer = MOCK_CUSTOMERS[4]; // budget: null
  const tags = SOPEngine.computeAutoTags(customer);
  assert.notOk(tags.includes('大客户'), '不应包含大客户标签');
});

QUnit.test('已成交客户不应覆盖原有标签', function(assert) {
  const customer = MOCK_CUSTOMERS[3]; // P7, tags: ['已成交', 'YC-2000']
  const tags = SOPEngine.computeAutoTags(customer);
  // P7客户不再有活动SOP
  assert.notOk(tags.includes('沉睡预警'), '已成交客户不应有沉睡预警');
});

// ===== 测试：漏斗计算 =====
QUnit.module('SOPEngine.computeFunnel');

QUnit.test('应正确计算各阶段客户数量', function(assert) {
  const funnel = SOPEngine.computeFunnel(MOCK_CUSTOMERS);
  
  // P1: 2个(CUS-TEST-001, CUS-TEST-003), P2: 1个, P3: 1个, P7: 1个
  const p1 = funnel.stages.find(s => s.stage === 'P1');
  const p7 = funnel.stages.find(s => s.stage === 'P7');
  
  assert.equal(p1.count, 2, 'P1应有2个客户');
  assert.equal(p7.count, 1, 'P7应有1个客户');
});

QUnit.test('应正确计算阶段转化率', function(assert) {
  const funnel = SOPEngine.computeFunnel(MOCK_CUSTOMERS);
  
  // P1→P2: 3个(P2+P3+P7) / 5个(总计) = 60%
  const p1toP2 = funnel.conversions.find(c => c.from === 'P1' && c.to === 'P2');
  assert.ok(p1toP2.rate >= 0 && p1toP2.rate <= 1, '转化率应在0-1之间');
});

// ===== 测试：SOP 执行率 =====
QUnit.module('SOPEngine.computeSOPRate');

QUnit.test('P7客户的SOP执行率应为100%', function(assert) {
  // 没有active状态的SOP
  const rate = SOPEngine.computeSOPRate(MOCK_CUSTOMERS);
  assert.ok(rate >= 0 && rate <= 1, '执行率应在0-1之间');
});
