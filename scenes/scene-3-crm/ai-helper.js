// ============================================================
// AI 助手 — 健康度评分 + 文案生成 + 下一步推荐 + 沉睡检测
// ============================================================

const AIHelper = (() => {
  'use strict';

  // ---- 健康度评分 ----
  // 分数 = 最近互动分(30) + 阶段进展分(25) + 互动密度分(20) + 情绪倾向分(15) + 预算明确分(10)

  function daysBetween(a, b) {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  function scoreRecency(lastContact) {
    if (!lastContact) return 0;
    const days = daysBetween(lastContact, new Date().toISOString().split('T')[0]);
    if (days <= 0) return 30;
    if (days <= 3) return 24;
    if (days <= 7) return 18;
    if (days <= 14) return 10;
    if (days <= 30) return 5;
    return 0;
  }

  function scoreStage(stage) {
    const stageScores = {
      P1: 5, P2: 10, P3: 15,
      P4: 18, P5: 21, P6: 23, P7: 25,
      LOST: 0
    };
    return stageScores[stage] || 5;
  }

  function scoreInteractionDensity(history) {
    if (!history || !history.length) return 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = history.filter(h => {
      if (!h.date) return false;
      return new Date(h.date) >= thirtyDaysAgo;
    }).length;
    if (recentCount >= 5) return 20;
    if (recentCount >= 3) return 15;
    if (recentCount >= 1) return 10;
    return 0;
  }

  function scoreSentiment(history) {
    if (!history || !history.length) return 15; // 默认满分
    // 检查是否有负面关键词
    const negativeWords = ['贵', '太贵', '差', '不好', '不满', '考虑', '再看看', '不需要'];
    for (const h of history) {
      const text = ((h.detail || '') + (h.action || '')).toLowerCase();
      for (const w of negativeWords) {
        if (text.includes(w)) return 10; // 扣5分
      }
    }
    return 15;
  }

  function scoreBudget(budget) {
    if (!budget) return 0;
    return 10;
  }

  /**
   * 计算客户健康度 (0-100)
   */
  function computeHealthScore(customer) {
    if (!customer) return 0;
    const recency = scoreRecency(customer.lastContact);
    const stage = scoreStage(customer.stage);
    const density = scoreInteractionDensity(customer.history);
    const sentiment = scoreSentiment(customer.history);
    const budget = scoreBudget(customer.budget);
    return Math.min(100, Math.max(0, recency + stage + density + sentiment + budget));
  }

  // ---- 文案生成 ----

  const MESSAGE_TEMPLATES = {
    send_message: {
      A: '您好{customerName}，感谢您对优特智厨的关注！我们专注智能炒菜机18年，已服务全国3000+餐饮客户。如需了解产品信息，随时联系我。',
      B: '您好{customerName}，看到您对我们的产品感兴趣。我们刚帮{customerType}客户提升了40%后厨效率，想给您分享一下案例？',
      C: '您好{customerName}，本月我们有限时体验活动，前10名预约可享免费上门演示，名额有限，感兴趣的话回复我！'
    },
    collect_requirement: {
      A: '{customerName}，为了给您推荐最合适的方案，想了解下您的{questions}？方便的话告诉我，我帮您出方案。',
      B: '{customerName}，我这边整理了不同类型客户的配置方案，您这边主要是做{customerType}的吗？面积和日均单量大概多少？',
      C: '{customerName}，我们最快能帮您出方案。能否简单说一下：①您的餐厅类型 ②后厨面积 ③每天大概多少单？'
    },
    send_proposal: {
      A: '{customerName}，根据您的需求，我整理了一套配置方案。推荐{customerType}客户使用G系列，性价比高、出餐稳定。您看什么时候方便详细聊聊？',
      B: '{customerName}，分享一个和您类似的成功案例：同类型{customerType}客户用了我们的方案，后厨人力降低了40%，6个月回本。这是他们的配置清单。',
      C: '{customerName}，方案已出！本月签约可享免费安装+3年延保，价值2万元。方案有效期到本月底，建议尽快确定。'
    },
    invite_trial: {
      A: '{customerName}，诚邀您来我们体验中心试菜！亲身体验智能炒菜机的效果，可以带上您的厨师一起来。这周四周五您方便吗？',
      B: '{customerName}，我们有个{customerType}标杆客户就在您附近，我可以安排您去实地参观，看看真实出餐效果。',
      C: '{customerName}，本周末我们有新品试菜会，名额有限。现场签约可享特别优惠，想给您留个位置。'
    },
    send_closing: {
      A: '{customerName}，试菜后感觉怎么样？如果您觉得没问题，我们可以推进签约流程了。本月有优惠活动，签约即送延保服务。',
      B: '{customerName}，跟您汇报下：同类型客户试菜后平均3天就定了。他们反馈机器帮了大忙，后厨省了2个人。您看这周能定下来吗？',
      C: '{customerName}，提醒您一下，本月优惠活动还剩5天。活动期签约可省2万，建议您尽快决定。'
    },
    wakeup: {
      A: '{customerName}，好久不见！最近生意怎么样？我们出了新款设备，效率更高了，有空了解一下？',
      B: '{customerName}，跟您分享个好消息：最近我们帮{customerType}客户实现了出餐标准化，菜品品质稳定，客户好评率提升30%。',
      C: '{customerName}，老客户专享：本月回访客户可获免费设备体检+菜谱更新服务。需要我安排吗？'
    },
    default: {
      A: '{customerName}，您好！我是优特智厨的销售顾问，有任何问题随时问我。',
      B: '{customerName}，想跟您聊聊厨房效率提升的方案，您方便的时候回复我。',
      C: '{customerName}，我们最近有优惠活动，感兴趣的话可以了解一下。'
    }
  };

  function fillTemplate(template, customer) {
    return template
      .replace(/{customerName}/g, customer.name || '客户')
      .replace(/{customerType}/g, customer.type || '餐饮')
      .replace(/{questions}/g, '餐厅类型、面积和日均单量');
  }

  /**
   * 生成跟进文案（3个版本）
   */
  function generateMessage(customer, sopStep) {
    const actionType = (sopStep && sopStep.actionType) || 'default';
    const templates = MESSAGE_TEMPLATES[actionType] || MESSAGE_TEMPLATES.default;
    return {
      versionA: fillTemplate(templates.A, customer || { name: '客户', type: '餐饮' }),
      versionB: fillTemplate(templates.B, customer || { name: '客户', type: '餐饮' }),
      versionC: fillTemplate(templates.C, customer || { name: '客户', type: '餐饮' })
    };
  }

  // ---- 最佳下一步推荐 ----

  function suggestNextAction(customer) {
    if (!customer) return { action: '了解客户情况', reason: '缺少客户信息' };

    const stage = customer.stage || 'P1';
    const suggestions = {
      P1: { action: '需求挖掘：了解餐厅类型/面积/日均单量', reason: '客户处于认知阶段，先收集需求再推荐方案' },
      P2: { action: '方案推送：根据需求推荐设备配置', reason: '需求已收集，及时出方案可推进到评估阶段' },
      P3: { action: '试菜邀约：安排试菜体验', reason: '客户有意向，试菜是转化关键节点' },
      P4: { action: '合同推进：发送合同并跟进签署', reason: '客户已确认合作，加速合同流程' },
      P5: { action: '发货跟进：确认物流安排', reason: '合同已签，进入执行阶段' },
      P6: { action: '交付安排：协调安装培训', reason: '尾款已到账，安排交付' },
      P7: { action: '售后回访+复购挖掘', reason: '已交付，维护关系准备复购' }
    };
    return suggestions[stage] || suggestions.P1;
  }

  // ---- 沉睡唤醒检测 ----

  function checkSleepWakeup(customer) {
    if (!customer || !customer.lastContact) return { needed: false, message: '' };
    if (customer.status === 'closed' || customer.stage === 'LOST') return { needed: false, message: '' };

    const days = daysBetween(customer.lastContact, new Date().toISOString().split('T')[0]);
    if (days >= 30) {
      return {
        needed: true,
        message: `${customer.name || '客户'}已${days}天未联系，建议发送唤醒话术`
      };
    }
    return { needed: false, message: '' };
  }

  // ==== 公开接口 ====
  return {
    computeHealthScore,
    generateMessage,
    suggestNextAction,
    checkSleepWakeup,
    // 仅暴露给测试
    _scoreRecency: scoreRecency,
    _scoreStage: scoreStage,
    _scoreInteractionDensity: scoreInteractionDensity,
    _scoreSentiment: scoreSentiment,
    _scoreBudget: scoreBudget
  };
})();
