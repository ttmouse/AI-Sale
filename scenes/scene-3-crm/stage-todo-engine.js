// ============================================================
// 阶段待办引擎 — 系统兜底：先检测完成状态，未完成则自动执行
// ============================================================

const StageTodoEngine = (() => {
  'use strict';

  const STORAGE_KEY = 'sop-v5-config';
  const MODEL_VERSION = 3;
  let _msgCounter = 0;

  // ===== 默认预设 =====
  function defaultAudiences() {
    return [
      { audienceId:'aud-chain',name:'连锁品牌',description:'多门店连锁，决策链长，预算高',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'EQ',value:'CHAIN'}]} },
      { audienceId:'aud-hotel',name:'酒店餐饮',description:'星级酒店，品质优先，品牌匹配',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'EQ',value:'HOTEL'}]} },
      { audienceId:'aud-canteen',name:'食堂团餐',description:'企业/学校/机关食堂，批量出餐',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'IN',value:['CANTEEN','CATERING']}]} },
      { audienceId:'aud-fastfood',name:'快餐简餐',description:'标准化快餐，出餐快，翻台率高',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'EQ',value:'FAST_CASUAL'}]} },
      { audienceId:'aud-hotpot',name:'火锅串串',description:'火锅/串串/麻辣烫，对出餐速度和标准化有要求',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'EQ',value:'HOTPOT'}]} },
      { audienceId:'aud-startup',name:'创业小店/个体',description:'夫妻店/档口/初创，预算低，快速决策',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'IN',value:['STARTUP','INDIVIDUAL']}]} },
      { audienceId:'aud-central',name:'中央厨房/云厨房',description:'规模化生产，配送多门店',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'IN',value:['CENTRAL_KITCHEN','CLOUD_KITCHEN']}]} },
      { audienceId:'aud-other',name:'其他类型',description:'不属于以上分类的其他客户',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'typeCode',op:'EQ',value:'OTHER'}]} },
      { audienceId:'aud-big',name:'大客户（预算30万+）',description:'跨类型的超大单，采购量大',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'budget',op:'GTE',value:300000}]} },
      { audienceId:'aud-active',name:'活跃跟进中',description:'正在跟进的活跃客户',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'status',op:'EQ',value:'active'}]} },
      { audienceId:'aud-sleeping',name:'沉睡客户',description:'超过30天未联系，需要唤醒',enabled:true,createdAt:'2026-05-23',
        conditions:{logic:'AND',rules:[{field:'stage',op:'EQ',value:'P0'}]} },
    ];
  }

  function t(name, key, kw, action) {
    const base = { itemId:'i-'+key, name, completionKey:key };
    if (kw) { base.detectFrom = 'message'; base.detectKeyword = kw; }
    if (action) base.action = action;
    return base;
  }

  function defaultTodos() {
    return {
      'aud-chain': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'您好{customerName}！我是优特智厨的销售顾问，专注智能炒菜机18年。有什么可以帮您的？'}),
          t('发送方案资料','proposal','配置方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，根据您的{customerType}场景，为您推荐以下配置方案……方便的话发您详细报价？'}),
          t('安排试菜体验','trial','试菜',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，诚邀您到体验中心试菜！这周四周五您方便吗？'}),
          t('确认客户需求','confirmed'),
        ],
        P2: [
          t('发送详细报价清单','detail_quoted','报价清单',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，这是详细的产品配置和报价清单，请查阅……'}),
          t('安排上门/试菜时间','visit_scheduled'),
        ],
        P3: [t('准备合同草案','contract_prepped')],
        P4: [t('推进合同签署','contract_signed')],
        P5: [t('确认发货安排','shipped')],
        P6: [t('确认回款对账','invoiced')],
        P7: [
          t('确认安装交付','installed'),
          t('发送满意度调查','surveyed','使用体验',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，设备使用还顺利吗？我们想了解一下您的使用体验……'}),
        ],
        P0: [t('发送沉睡唤醒消息','wakeup_sent','新款设备',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，好久不见！最近生意怎么样？我们出了新款设备……'})],
      },
      'aud-canteen': {
        P1: [
          t('发送食堂专属欢迎','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}！感谢您关注优特智厨。我们已服务200+企业食堂，出餐效率提升60%。想了解一下您的用餐人数？'}),
          t('发送团餐方案','proposal','团餐场景',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，根据团餐场景，推荐G系列智能炒菜机……'}),
        ],
        P2: [t('安排上门勘察','visit_scheduled')],
        P3: [t('安排试菜体验','trial_done')],
        P4: [t('推进合同签署','signed')],
        P5: [t('确认发货','shipped')],
        P6: [t('确认回款','paid')],
        P7: [t('确认安装交付','installed')],
        P0: [t('发送唤醒消息','wakeup','新款',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，许久未联系，我们出了新款团餐设备……'})],
      },
      'aud-hotel': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，感谢您关注！我们已服务多家星级酒店，包括维也纳酒店。您这边是新店还是老店升级？'}),
          t('发送酒店方案','proposal','酒店方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，根据酒店场景，推荐定制化配置方案……'}),
        ],
        P2: [t('安排现场勘察','visit_scheduled')],
        P3: [t('安排试菜体验','trial_done')],
        P4: [t('推进合同签署','signed')],
        P5: [t('确认发货','shipped')],
        P6: [t('确认回款','paid')],
        P7: [t('确认安装交付','installed')],
        P0: [t('发送唤醒消息','wakeup','新款设备',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，好久不见，我们有新的酒店专属方案……'})],
      },
      'aud-fastfood': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}您好！推荐YC-2000标准版，适合快餐场景，出餐速度快。您这边日均多少单？'}),
        ],
        P2: [t('发送快餐方案','proposal','快餐方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，这是适合快餐的配置方案……'})],
        P3: [t('安排试菜','trial_done')], P4: [t('签约','signed')], P5: [t('发货','shipped')], P6: [t('回款','paid')], P7: [t('安装交付','installed')],
        P0: [t('唤醒消息','wakeup','新款',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，最近怎么样？我们出了新款适合快餐的设备……'})],
      },
      'aud-hotpot': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}！火锅店用智能炒菜机，出品标准化、人工成本降低。您现在后厨几个人？'}),
        ],
        P2: [t('发送火锅方案','proposal','火锅方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，火锅店推荐G系列，能量足、定时定量……'})],
        P3: [t('安排试菜','trial_done')], P4: [t('签约','signed')], P5: [t('发货','shipped')], P6: [t('回款','paid')], P7: [t('安装交付','installed')],
        P0: [t('唤醒消息','wakeup','新款',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，最近忙什么呢？我们出了新款火锅专用设备……'})],
      },
      'aud-startup': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}您好！小本创业也能用得起的智能炒菜机，YC-2000入门款4.28万起。您预算大概多少？'}),
        ],
        P2: [t('发送入门方案','proposal','入门方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，这是适合初创店的配置方案……'})],
        P3: [t('邀请到店试菜','trial_done')], P4: [t('签约','signed')], P5: [t('发货','shipped')], P6: [t('回款','paid')], P7: [t('安装交付','installed')],
        P0: [t('唤醒消息','wakeup','新款',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，最近生意怎么样？有新款适合小店的设备上市了……'})],
      },
      'aud-central': {
        P1: [t('发送欢迎消息','welcome','中央厨房',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，感谢您的关注。我们已为多家中央厨房提供解决方案……'})],
        P2: [t('发送中央厨房方案','proposal','中央厨房方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，这是适合中央厨房的解决方案……'})],
        P3: [t('安排试菜','trial_done')], P4: [t('签约','signed')], P5: [t('发货','shipped')], P6: [t('回款','paid')], P7: [t('安装交付','installed')],
        P0: [t('唤醒消息','wakeup','新方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，有新的中央厨房解决方案，感兴趣吗？'})],
      },
      'aud-big': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，感谢您对优特智厨的关注！我们已服务超过3000+家客户。您这边大概需要多少台设备？'}),
          t('发送企业级方案','enterprise_plan','企业级方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，根据您的规模，推荐企业级定制方案……'}),
        ], P2: [t('安排专人对接','dedicated_pm')], P3: [t('安排试菜体验','trial_done')], P4: [t('推进合同','signed')], P5: [t('确认发货','shipped')], P6: [t('确认回款','paid')], P7: [t('确认安装交付','installed')],
        P0: [t('唤醒消息','wakeup','新方案',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，为您带来了新的企业级解决方案……'})],
      },
      'aud-active': {
        P1: [t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}您好！感谢您的咨询。'}),
             t('发送资料','proposal','产品资料',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，这是我们的产品资料，请查阅……'})],
        P2: [t('确认需求','confirm_need')], P3: [t('安排试菜','trial_done')], P4: [t('签约','signed')], P5: [t('发货','shipped')], P6: [t('回款','paid')], P7: [t('安装交付','installed')],
        P0: [t('唤醒消息','wakeup','唤醒',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，好久不见！'})],
      },
      'aud-sleeping': {
        P1:[],P2:[],P3:[],P4:[],P5:[],P6:[],P7:[],
        P0: [t('发送唤醒消息','wakeup','唤醒',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，好久不见！最近生意怎么样？我们有新活动……'})],
      },
      'aud-other': {
        P1: [t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}您好！感谢您关注优特智厨。'}),
        ], P2: [t('确认需求','confirm_need')], P3: [t('安排试菜','trial_done')], P4: [t('签约','signed')], P5: [t('发货','shipped')], P6: [t('回款','paid')], P7: [t('安装交付','installed')],
        P0: [t('唤醒消息','wakeup','唤醒',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，好久不见！'})],
      },
      'aud-small': {
        P1: [
          t('发送欢迎消息','welcome','优特智厨',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}您好！优特智厨专注智能炒菜机，小本创业也能用得起。您这边主要做什么类型的餐饮？'}),
          t('发送经济型方案','budget_sent','YC-2000',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，推荐YC-2000标准版，性价比高，占地仅0.52m²，适合中小规模出餐……'}),
        ],
        P2: [t('邀请到店试菜','trial_invited')],
        P3: [t('促成签约','deal_closed')],
        P4: [t('签约','signed')],
        P5: [t('发货','shipped')],
        P6: [t('回款','paid')],
        P7: [t('安装交付','installed')],
        P0: [t('发送唤醒消息','wakeup','新款设备',{type:'send_message',channel:'wecom',contentTemplate:'{customerName}，最近生意怎样？我们出了新款更适合小店的设备……'})],
      },
    };
  }

  // ===== 存储 =====
  let _cache = null;
  function load() {
    if (_cache) return _cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { _cache = { audiences: defaultAudiences(), todos: defaultTodos() }; return _cache; }
      const d = JSON.parse(raw);
      if (d._version !== MODEL_VERSION) { _cache = { audiences: defaultAudiences(), todos: defaultTodos() }; return _cache; }
      _cache = { audiences: d.audiences || [], todos: d.todos || {} };
      return _cache;
    } catch(e) { _cache = { audiences: defaultAudiences(), todos: defaultTodos() }; return _cache; }
  }
  function persist() { const d = load(); localStorage.setItem(STORAGE_KEY, JSON.stringify({ _version:MODEL_VERSION, audiences:d.audiences, todos:d.todos })); }
  function init() { load(); persist(); }

  // ===== 人群 CRUD =====
  function createAudience(data) {
    const d = load(); const a = { audienceId:'aud-'+Date.now(), name:data.name||'新人群', description:data.description||'', enabled:true, conditions:data.conditions||{logic:'AND',rules:[]}, createdAt:new Date().toISOString().split('T')[0] };
    d.audiences.push(a);
    if (!d.todos[a.audienceId]) d.todos[a.audienceId] = {};
    ['P1','P2','P3','P4','P5','P6','P7','P0'].forEach(s => { if (!d.todos[a.audienceId][s]) d.todos[a.audienceId][s] = []; });
    persist(); return a;
  }
  function updateAudience(id, data) { const d = load(); const i = d.audiences.findIndex(a=>a.audienceId===id); if(i>-1){ d.audiences[i]={...d.audiences[i],...data,audienceId:id}; persist(); } }
  function deleteAudience(id) { const d = load(); d.audiences = d.audiences.filter(a=>a.audienceId!==id); delete d.todos[id]; persist(); }
  function getAudiences() { return load().audiences; }

  // ===== 待办 CRUD =====
  function getAudienceTodos(audienceId, stage) { const d = load(); return (d.todos[audienceId]&&d.todos[audienceId][stage])||[]; }
  function setAudienceTodos(audienceId, stage, items) { const d = load(); if(!d.todos[audienceId]) d.todos[audienceId]={}; d.todos[audienceId][stage]=items; persist(); }
  function addTodoItem(audienceId, stage, item) { const items=getAudienceTodos(audienceId,stage); item.itemId='i-'+Date.now(); items.push(item); setAudienceTodos(audienceId,stage,items); return item; }
  function removeTodoItem(audienceId, stage, itemId) { setAudienceTodos(audienceId,stage,getAudienceTodos(audienceId,stage).filter(i=>i.itemId!==itemId)); }
  function updateTodoItem(audienceId, stage, itemId, updates) {
    const items = getAudienceTodos(audienceId, stage);
    const idx = items.findIndex(i => i.itemId === itemId);
    if (idx === -1) return;
    items[idx] = { ...items[idx], ...updates, itemId };
    setAudienceTodos(audienceId, stage, items);
  }
  function getAllTodosForAudience(audienceId) { const d=load(); return d.todos[audienceId]||{}; }

  // ===== 引擎 =====
  function fillTemplate(tpl, c) { return (tpl||'').replace(/{customerName}/g,c.name||'客户').replace(/{customerType}/g,c.type||'餐饮'); }

  function initStageState(c) {
    if (!c._stageTodos) c._stageTodos = {};
    if (!c._stageTodos[c.stage]) c._stageTodos[c.stage] = {};
  }

  function isCompleted(c, stage, key) {
    return c._stageTodos && c._stageTodos[stage] && c._stageTodos[stage][key] && c._stageTodos[stage][key].done === true;
  }

  function markDone(c, stage, key, by) {
    if (!c._stageTodos) c._stageTodos = {};
    if (!c._stageTodos[stage]) c._stageTodos[stage] = {};
    c._stageTodos[stage][key] = { done:true, doneBy:by||'system', doneAt:new Date().toISOString().split('T')[0] };
  }

  /**
   * 检测待办是否已由人工完成（通过对话记录分析）
   */
  function detectCompletion(c, item) {
    if (!item.detectFrom || !item.detectKeyword) return false;
    // 检查客户消息记录中是否含有关键词
    const msgs = c.messages || [];
    return msgs.some(m => (m.content || '').includes(item.detectKeyword) || (m.replyContent || '').includes(item.detectKeyword));
  }

  function matchAudiences(c) {
    const d = load();
    return d.audiences.filter(a => a.enabled !== false && AudienceEngine.matchCustomer(c, a.conditions));
  }

  function getPendingItems(c) {
    initStageState(c);
    const matched = matchAudiences(c);
    const items = [], seen = new Set();
    matched.forEach(aud => {
      (getAudienceTodos(aud.audienceId, c.stage)||[]).forEach(item => {
        if (seen.has(item.completionKey)) return;
        seen.add(item.completionKey);
        // 1. 检查是否已标记完成
        if (isCompleted(c, c.stage, item.completionKey)) return;
        // 2. 检查是否能从对话记录中检测到完成
        if (detectCompletion(c, item)) {
          markDone(c, c.stage, item.completionKey, 'detected');
          return; // 已由人工完成，跳过
        }
        // 3. 需要执行
        items.push(item);
      });
    });
    return items;
  }

  function shouldExecute(c, item) {
    if (!item.action) return { should:false, reason:'no_action' };
    return { should:true, reason:'ok' };
  }

  function executeItem(c, item) {
    const a = item.action; const today = new Date().toISOString().split('T')[0];
    const r = { itemId:item.itemId, itemName:item.name, executedAt:today };
    switch (a.type) {
      case 'send_message': {
        _msgCounter++; const content = fillTemplate(a.contentTemplate||'', c);
        (c.messages||[]).push({ messageId:'msg-'+Date.now()+'-'+_msgCounter, itemId:item.itemId, channel:a.channel||'wecom', content, sentAt:today, status:'sent' });
        c.lastContact = today; r.action='send_message'; r.content=content; break;
      }
      default: r.action='unknown'; r.status='failed';
    }
    markDone(c, c.stage, item.completionKey, 'system');
    r.status='success'; return r;
  }

  function scanAll(customers) {
    const report = { executed:0, logs:[] };
    if (!customers) return report;
    (customers||[]).forEach(c => {
      if (c.status==='closed'||c.status==='lost') return;
      initStageState(c);
      getPendingItems(c).forEach(item => {
        if (!shouldExecute(c,item).should) return;
        const r = executeItem(c,item);
        report.executed++; report.logs.push({ logId:'l-'+Date.now()+'-'+report.executed, executedAt:new Date().toISOString().split('T')[0], customerId:c.customerId, customerName:c.name, itemId:item.itemId, itemName:item.name, action:r.action, detail:r.content||'' });
      });
    });
    return report;
  }

  return {
    load, persist, init, createAudience, updateAudience, deleteAudience, getAudiences,
    getAudienceTodos, setAudienceTodos, addTodoItem, removeTodoItem, updateTodoItem, getAllTodosForAudience,
    matchAudiences, getPendingItems, shouldExecute, executeItem, scanAll,
    fillTemplate, markDone, initStageState, isCompleted, detectCompletion
  };
})();
