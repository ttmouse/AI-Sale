// ============================================================
// SOP 引擎 — 客户生命周期跟进模板 + 阶段机 + 预警 + 自动标签
// ============================================================

const SOPEngine = (() => {
  'use strict';

  // ---- 内置 SOP 模板库 ----
  const SOP_TEMPLATES = [
    {
      templateId: 'SOP-DEFAULT',
      name: '标准跟进SOP',
      description: '面向各类餐饮客户的标准化跟进流程',
      applicableTo: { types: [], stages: ['P1', 'P2', 'P3', 'P4'] },
      steps: [
        { id: 1, name: '欢迎触达', delay: { type: 'immediate' }, actionType: 'send_message',
          content: '您好，感谢您了解优特智厨！我们专注智能炒菜机18年...' },
        { id: 2, name: '需求收集', delay: { type: 'days', value: 1 }, actionType: 'collect_requirement',
          content: '为了给您推荐最合适的方案，请告诉我：①餐厅类型 ②面积 ③日均单量' },
        { id: 3, name: '方案推送', delay: { type: 'days', value: 3 }, actionType: 'send_proposal',
          content: '根据您的需求，推荐以下配置方案...',
          escalation: { timeout: { type: 'days', value: 7 }, action: 'notify_manager',
            message: '客户在「方案推送」步骤滞留超过7天' } },
        { id: 4, name: '试菜邀约', delay: { type: 'days', value: 7 }, actionType: 'invite_trial',
          content: '我们诚邀您来试菜体验，亲身体验智能炒菜机的效果...' },
        { id: 5, name: '促单跟进', delay: { type: 'days', value: 14 }, actionType: 'send_closing',
          content: '本月有优惠活动，签约可享延保服务...' },
        { id: 6, name: '沉睡唤醒', delay: { type: 'days', value: 30 }, actionType: 'wakeup',
          content: '老板，最近生意怎么样？我们出了新款设备，有空了解一下？' }
      ]
    },
    {
      templateId: 'SOP-CHAIN',
      name: '连锁客户跟进SOP',
      description: '面向连锁餐饮品牌的跟进流程',
      applicableTo: { types: ['CHAIN'], stages: ['P1', 'P2', 'P3'] },
      steps: [
        { id: 1, name: '总部对接', delay: { type: 'immediate' }, actionType: 'send_message',
          content: '感谢您关注优特智厨！我们已服务陈香贵、小江溪等连锁品牌...' },
        { id: 2, name: '需求调研', delay: { type: 'days', value: 2 }, actionType: 'collect_requirement',
          content: '请提供：①门店数 ②菜品类型 ③现有后厨配置 ④痛点需求' },
        { id: 3, name: '标杆案例推送', delay: { type: 'days', value: 5 }, actionType: 'send_proposal',
          content: '同类型连锁客户案例：陈香贵400家门店...' },
        { id: 4, name: '总部试菜', delay: { type: 'days', value: 10 }, actionType: 'invite_trial',
          content: '欢迎到总部试菜中心体验，可携带您的厨师一起来...' },
        { id: 5, name: '区域试点方案', delay: { type: 'days', value: 20 }, actionType: 'send_proposal',
          content: '建议先选1-2家门店试点，我们提供全程运营支持...' },
        { id: 6, name: '沉睡唤醒', delay: { type: 'days', value: 45 }, actionType: 'wakeup',
          content: '连锁品牌客户专享：新品发布会邀请函...' }
      ]
    },
    {
      templateId: 'SOP-CANTEEN',
      name: '食堂客户跟进SOP',
      description: '面向企业食堂/团餐客户的跟进流程',
      applicableTo: { types: ['CANTEEN', 'CATERING'], stages: ['P1', 'P2', 'P3'] },
      steps: [
        { id: 1, name: '欢迎触达', delay: { type: 'immediate' }, actionType: 'send_message',
          content: '感谢您了解优特智厨！我们已服务200+企业食堂...' },
        { id: 2, name: '用餐人数确认', delay: { type: 'days', value: 1 }, actionType: 'collect_requirement',
          content: '请问食堂每日用餐人数多少？目前后厨配置是？' },
        { id: 3, name: '方案推送', delay: { type: 'days', value: 3 }, actionType: 'send_proposal',
          content: '根据用餐人数，推荐配置方案如下...' },
        { id: 4, name: '上门考察', delay: { type: 'days', value: 7 }, actionType: 'invite_trial',
          content: '我们可以安排工程师上门实地考察，免费出改造方案...' },
        { id: 5, name: '试菜体验', delay: { type: 'days', value: 14 }, actionType: 'send_closing',
          content: '邀请您到就近的标杆客户食堂体验真实出餐效果...' },
        { id: 6, name: '沉睡唤醒', delay: { type: 'days', value: 30 }, actionType: 'wakeup',
          content: '食堂客户专享：团餐出餐效率提升方案...' }
      ]
    }
  ];

  // ---- 阶段定义 ----
  const STAGES = {
    P1: { label: '了解信息', sort: 1, color: 'status-gray' },
    P2: { label: '收集需求', sort: 2, color: 'status-blue' },
    P3: { label: '确认合作', sort: 3, color: 'status-yellow' },
    P4: { label: '合同签署', sort: 4, color: 'status-orange' },
    P5: { label: '发货', sort: 5, color: 'status-purple' },
    P6: { label: '已回款', sort: 6, color: 'status-green' },
    P7: { label: '已交付', sort: 7, color: 'status-green' },
    LOST: { label: '已丢失', sort: 8, color: 'status-red' }
  };

  // ---- 阶段滞留预警阈值（天） ----
  const STAGE_ALERT_THRESHOLDS = {
    P1: { yellow: 7, red: 14 },
    P2: { yellow: 10, red: 18 },
    P3: { yellow: 14, red: 21 },
    P4: { yellow: 14, red: 21 },
    P5: { yellow: 10, red: 20 },
    P6: { yellow: 14, red: 30 }
  };

  // ---- 工具函数 ----
  function daysBetween(a, b) {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function parseBudget(budgetStr) {
    if (!budgetStr) return null;
    // 解析 "8-12万" 或 ">30万" 或 "<3万" 或 "¥50万+"
    const cleaned = budgetStr.replace('¥', '').replace('+', '').trim();
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*[~-]\s*(\d+(?:\.\d+)?)/);
    if (match) return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
    const gtMatch = cleaned.match(/>(\d+(?:\.\d+)?)/);
    if (gtMatch) return { min: parseFloat(gtMatch[1]), max: Infinity };
    const ltMatch = cleaned.match(/<(\d+(?:\.\d+)?)/);
    if (ltMatch) return { min: 0, max: parseFloat(ltMatch[1]) };
    return null;
  }

  // ---- 公共 API ----

  /**
   * 根据客户类型匹配合适的 SOP 模板
   */
  function matchTemplate(customer) {
    if (!customer || !customer.stage) return null;
    // P5+ 阶段不再需要跟进 SOP
    if (['P5', 'P6', 'P7', 'LOST'].includes(customer.stage)) return null;

    // 按 typeCode 精确匹配
    const typeCode = (customer.typeCode || '').toUpperCase();
    for (const tpl of SOP_TEMPLATES) {
      if (tpl.templateId === 'SOP-DEFAULT') continue; // 默认兜底
      if (tpl.applicableTo.types.includes(typeCode)) return tpl;
    }
    // 按类型关键词模糊匹配
    const type = (customer.type || '').toLowerCase();
    if (type.includes('食堂') || type.includes('团餐')) {
      return SOP_TEMPLATES.find(t => t.templateId === 'SOP-CANTEEN');
    }
    if (type.includes('连锁') || type.includes('品牌') || type.includes('酒店')) {
      return SOP_TEMPLATES.find(t => t.templateId === 'SOP-CHAIN');
    }
    // 默认模板
    return SOP_TEMPLATES.find(t => t.templateId === 'SOP-DEFAULT');
  }

  /**
   * 构建 SOP 实例（展开所有步骤时间线）
   */
  function buildInstance(customer, template) {
    if (!template) {
      return { customerId: customer ? customer.customerId : '', templateId: '', steps: [], appliedAt: '', status: 'completed' };
    }
    const baseDate = customer.lastContact || new Date().toISOString().split('T')[0];
    const steps = template.steps.map((step, idx) => {
      let dueAt = null;
      let status = 'pending';
      if (step.delay.type === 'immediate') {
        dueAt = baseDate;
        status = 'done'; // immediate 步骤默认已完成
      } else if (step.delay.type === 'hours') {
        dueAt = addDays(baseDate, 0); // hours < 24, 当天
      } else if (step.delay.type === 'days') {
        dueAt = addDays(baseDate, step.delay.value);
      }
      return {
        stepId: step.id,
        name: step.name,
        status: status,
        dueAt: dueAt,
        completedAt: status === 'done' ? baseDate : null,
        completedBy: status === 'done' ? 'system' : null,
        actionType: step.actionType,
        content: step.content
      };
    });
    return {
      customerId: customer.customerId,
      templateId: template.templateId,
      steps: steps,
      appliedAt: baseDate,
      status: 'active'
    };
  }

  /**
   * 检查到期/逾期/即将到期任务
   */
  function checkDueItems(instance) {
    const today = new Date().toISOString().split('T')[0];
    const due = [];
    const overdue = [];
    const upcoming = [];

    if (!instance || !instance.steps) return { due, overdue, upcoming };

    for (const step of instance.steps) {
      if (step.status !== 'pending') continue;
      if (!step.dueAt) continue;

      const days = daysBetween(today, step.dueAt);
      if (days > 0 && days <= 1) {
        due.push(step); // 今天或明天到期
      } else if (days < 0) {
        overdue.push(step); // 已逾期
      } else if (days > 1 && days <= 3) {
        upcoming.push(step); // 2-3天内到期
      }
    }

    return { due, overdue, upcoming };
  }

  /**
   * 计算阶段滞留预警
   */
  function checkStageAlert(customer) {
    if (!customer || !customer.stage || !customer.lastContact) {
      return { level: 'none', message: '' };
    }
    if (customer.status === 'closed' || customer.stage === 'P7' || customer.stage === 'LOST') {
      return { level: 'none', message: '' };
    }

    const thresholds = STAGE_ALERT_THRESHOLDS[customer.stage];
    if (!thresholds) return { level: 'none', message: '' };

    const daysSinceContact = daysBetween(customer.lastContact, new Date().toISOString().split('T')[0]);
    const stageLabel = STAGES[customer.stage] ? STAGES[customer.stage].label : customer.stage;

    if (daysSinceContact >= thresholds.red) {
      return {
        level: 'red',
        message: `${customer.stage}(${stageLabel})滞留超过${thresholds.red}天，建议升级主管介入`
      };
    }
    if (daysSinceContact >= thresholds.yellow) {
      return {
        level: 'yellow',
        message: `${customer.stage}(${stageLabel})滞留超过${thresholds.yellow}天，建议主动推进`
      };
    }
    return { level: 'none', message: '' };
  }

  /**
   * 自动标签规则引擎
   */
  function computeAutoTags(customer) {
    if (!customer) return [];
    const tags = [];

    // 1. 沉睡预警：P1-P3 阶段且超过14天未联系
    if (['P1', 'P2', 'P3'].includes(customer.stage) && customer.lastContact) {
      const days = daysBetween(customer.lastContact, new Date().toISOString().split('T')[0]);
      if (days >= 14) tags.push('沉睡预警');
    }

    // 2. 已试菜：互动历史中有试菜记录
    if (customer.history && customer.history.some(h =>
      h.action.includes('试菜') || h.detail.includes('试菜')
    )) {
      tags.push('已试菜');
    }

    // 3. 大客户：预算 >15万 或 连锁 >5家门店
    const budget = parseBudget(customer.budget);
    if (budget && (budget.min >= 15 || budget.max >= 15)) {
      tags.push('大客户');
    }
    if (customer.storeCount && customer.storeCount >= 5) {
      if (!tags.includes('大客户')) tags.push('大客户');
    }

    // 4. 高意向：P3+阶段
    if (['P3', 'P4', 'P5', 'P6', 'P7'].includes(customer.stage)) {
      tags.push('高意向');
    }

    // 5. 比价中：标签包含相关关键词
    if (customer.tags && customer.tags.some(t => t.includes('比价') || t.includes('对比'))) {
      tags.push('比价中');
    }

    // 6. 企业未关联
    if (!customer.company || customer.company === '') {
      tags.push('企业未关联');
    }

    return tags;
  }

  /**
   * 计算漏斗数据
   */
  function computeFunnel(customers) {
    if (!customers || !customers.length) return { stages: [], conversions: [], total: 0 };

    const stageOrder = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'LOST'];
    const stageMap = {};
    customers.forEach(c => {
      const stage = c.stage || 'P1';
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });

    const stages = stageOrder.map(stage => ({
      stage: stage,
      label: STAGES[stage] ? STAGES[stage].label : stage,
      count: stageMap[stage] || 0,
      color: STAGES[stage] ? STAGES[stage].color : 'status-gray'
    }));

    const conversions = [];
    for (let i = 0; i < stageOrder.length - 1; i++) {
      const from = stageOrder[i];
      const to = stageOrder[i + 1];
      // 从该阶段及之后的所有客户 = 曾经经过此阶段的总人数
      const totalPassed = stageOrder.slice(i).reduce((sum, s) => sum + (stageMap[s] || 0), 0);
      // 成功进展到下一阶段的客户
      const advanced = stageOrder.slice(i + 1).reduce((sum, s) => sum + (stageMap[s] || 0), 0);
      // 转化率 = 进展人数 / 经过此阶段总人数
      const rate = totalPassed > 0 ? advanced / totalPassed : 0;
      conversions.push({
        from, to,
        fromLabel: STAGES[from] ? STAGES[from].label : from,
        toLabel: STAGES[to] ? STAGES[to].label : to,
        rate: Math.round(rate * 100)
      });
    }

    return { stages, conversions, total: customers.length };
  }

  /**
   * 计算整体 SOP 执行率
   */
  function computeSOPRate(customers) {
    if (!customers || !customers.length) return 0;
    let totalSteps = 0;
    let doneSteps = 0;
    customers.forEach(c => {
      if (c.sop && c.sop.length) {
        c.sop.forEach(s => {
          totalSteps++;
          if (s.done) doneSteps++;
        });
      }
    });
    return totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
  }

  /**
   * 筛选客户
   */
  function filterCustomers(customers, filters) {
    if (!customers || !customers.length) return [];
    if (!filters) return [...customers];

    return customers.filter(c => {
      // 阶段筛选
      if (filters.stage && filters.stage !== 'all' && c.stage !== filters.stage) return false;
      // 状态筛选
      if (filters.status && filters.status !== 'all' && c.status !== filters.status) return false;
      // 搜索
      if (filters.search) {
        const kw = filters.search.toLowerCase();
        const name = (c.name || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        if (!name.includes(kw) && !company.includes(kw)) return false;
      }
      // 预算筛选
      if (filters.budget && filters.budget !== 'all') {
        const b = parseBudget(c.budget);
        if (!b) return false;
        if (filters.budget === 'small' && (b.max > 5)) return false;
        if (filters.budget === 'mid' && (b.min < 5 || b.max > 15)) return false;
        if (filters.budget === 'large' && (b.min < 15)) return false;
      }
      return true;
    });
  }

  // ==== 公开接口 ====
  return {
    matchTemplate,
    buildInstance,
    checkDueItems,
    checkStageAlert,
    computeAutoTags,
    computeFunnel,
    computeSOPRate,
    filterCustomers,
    SOP_TEMPLATES,
    STAGES,
    STAGE_ALERT_THRESHOLDS,
    // 暴露工具函数方便测试
    daysBetween,
    addDays,
    parseBudget
  };
})();
