// ============================================================
// Agent 执行引擎 — 根据状态变化自动推断工具调用链路
// JSON 只存状态结果，引擎负责生成执行过程
// ============================================================

(function(global) {
  'use strict';

  // SVG 图标映射
  var ICONS = {
    'message-square': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'database': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    'search': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'edit': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    'arrow-right': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    'file-text': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    'code': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'activity': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    'check-circle': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    'bar-chart': '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  };

  // ===== 核心：根据状态变化生成工具调用链 =====
  function buildToolChain(prevAnn, currAnn, context) {
    var tools = [];
    if (!currAnn) return tools;

    var triggerMsg = context.triggerMessage || '';
    var analysis = context.analysis || '';
    var suggestion = context.suggestion || '';
    var fieldChanges = getFieldChanges(prevAnn, currAnn);
    var hasStageChange = currAnn.progress && currAnn.progress.stageChange;
    var newFields = getNewFields(prevAnn, currAnn);

    // --- READ 阶段 ---
    tools.push({ phase:'read', icon:'message-square', tool:'getMessageHistory', action:'拉取会话消息', output: triggerMsg });
    var fieldSummary = getFieldSummary(currAnn);
    tools.push({ phase:'read', icon:'database', tool:'getSystemFields', action:'读取系统字段', output: fieldSummary });

    // --- THINK 阶段：多步推理 ---
    // 第一步：分析消息
    tools.push({ phase:'think', icon:'code', tool:'analyzeMessage', action:'分析消息内容', output: '消息长度 ' + triggerMsg.length + ' 字, 角色: ' + (triggerMsg.indexOf('销售') === 0 ? '销售' : '客户') });

    // 第二步：提取实体（有字段变化时才真正提取到新信息）
    if (newFields.length > 0) {
      // 新增字段 → 从消息中提取到了新实体
      var entityOutput = newFields.map(function(k) { return k + '=' + getFieldValue(currAnn, k); }).join(', ');
      tools.push({ phase:'think', icon:'search', tool:'extractEntities', action:'提取关键实体', output: entityOutput });
    } else if (fieldChanges.length > 0) {
      // 字段更新 → 实体值发生了变化
      var changeOutput = fieldChanges.join(', ');
      tools.push({ phase:'think', icon:'search', tool:'extractEntities', action:'提取关键实体', output: changeOutput });
    } else {
      // 无变化 → 仅确认上下文
      tools.push({ phase:'think', icon:'activity', tool:'evaluateContext', action:'评估当前上下文', output: '对话正常推进，无需更新字段' });
    }

    // 第三步：对比已有画像
    if (newFields.length > 0) {
      tools.push({ phase:'think', icon:'bar-chart', tool:'compareProfile', action:'对比已有画像', output: '检测到 ' + newFields.length + ' 个新字段, ' + fieldChanges.length + ' 个变更' });
    } else if (fieldChanges.length > 0) {
      tools.push({ phase:'think', icon:'bar-chart', tool:'compareProfile', action:'对比已有画像', output: fieldChanges.length + ' 个字段值发生变化' });
    }

    // 总结
    if (newFields.length > 0 || fieldChanges.length > 0 || analysis) {
      tools.push({ phase:'think', icon:'check-circle', tool:'conclude', action:'总结分析结论', output: analysis || '完成本轮分析' });
    }

    // --- EXEC 阶段 ---
    // 字段更新
    if (fieldChanges.length > 0) {
      tools.push({ phase:'exec', icon:'edit', tool:'updateCustomerField', action:'更新画像字段', output: fieldChanges.join('; ') });
    }

    // 阶段评估与更新
    if (hasStageChange) {
      // 先评估阶段推进条件
      var stageGoal = currAnn.progress.currentStage || '';
      var completedItems = (currAnn.progress.completed || []).join(', ');
      tools.push({ phase:'exec', icon:'bar-chart', tool:'evaluateStageProgress', action:'评估阶段推进条件', output: '已完成: ' + (completedItems || '—') + ' → 满足 ' + stageGoal + ' 条件' });
      tools.push({ phase:'exec', icon:'file-text', tool:'updateStage', action:'更新销售阶段', output: currAnn.progress.stageChange });
    }

    // 阶段变化提示（即使没有 stageChange，如果 completed 增加了也记录进度）
    if (!hasStageChange && currAnn.progress && currAnn.progress.completed && currAnn.progress.completed.length > 0) {
      var prevCompleted = prevAnn && prevAnn.progress ? (prevAnn.progress.completed || []).length : 0;
      if (currAnn.progress.completed.length > prevCompleted) {
        tools.push({ phase:'exec', icon:'check-circle', tool:'updateProgress', action:'更新任务进度', output: '已完成 ' + currAnn.progress.completed.length + '/' + (currAnn.progress.completed.length + (currAnn.progress.pending || []).length) + ' 项' });
      }
    }

    // --- OUT 阶段 ---
    if (suggestion) {
      tools.push({ phase:'out', icon:'arrow-right', tool:'generateSuggestion', action:'生成下一步建议', output: suggestion });
    }

    return tools;
  }

  // ===== 解析字段差异 =====
  function getFieldChanges(prev, curr) {
    if (!curr || !curr.fields) return [];
    var changes = [];
    var currFields = typeof curr.fields === 'string' ? safeParse(curr.fields) : curr.fields;
    var prevFields = prev && prev.fields ? (typeof prev.fields === 'string' ? safeParse(prev.fields) : prev.fields) : {};

    Object.keys(currFields).forEach(function(key) {
      var cv = currFields[key];
      if (!cv || cv.status === 'empty') return;
      var pv = prevFields[key];
      if (!pv || pv.status === 'empty' || pv.value !== cv.value) {
        changes.push(key + ' → ' + cv.value);
      }
    });

    return changes;
  }

  // ===== 获取新增字段 =====
  function getNewFields(prev, curr) {
    if (!curr || !curr.fields) return [];
    var currFields = typeof curr.fields === 'string' ? safeParse(curr.fields) : curr.fields;
    if (!prev || !prev.fields) return Object.keys(currFields).filter(function(k) { return currFields[k] && currFields[k].status !== 'empty'; });
    var prevFields = typeof prev.fields === 'string' ? safeParse(prev.fields) : prev.fields;
    var result = [];
    Object.keys(currFields).forEach(function(key) {
      var cv = currFields[key];
      if (!cv || cv.status === 'empty') return;
      var pv = prevFields[key];
      if (!pv || pv.status === 'empty') result.push(key);
    });
    return result;
  }

  // ===== 获取字段值 =====
  function getFieldValue(ann, key) {
    if (!ann || !ann.fields) return '';
    var f = typeof ann.fields === 'string' ? safeParse(ann.fields) : ann.fields;
    return (f[key] && f[key].value) || '';
  }

  // ===== 生成字段摘要 =====
  function getFieldSummary(ann) {
    if (!ann || !ann.fields) return '—';
    var f = typeof ann.fields === 'string' ? safeParse(ann.fields) : ann.fields;
    var filled = [];
    Object.keys(f).forEach(function(k) {
      if (f[k] && f[k].value && f[k].status !== 'empty') {
        filled.push(k + '=' + f[k].value);
      }
    });
    return filled.length > 0 ? filled.join('; ') : '—';
  }

  // ===== 获取 SVG 图标 =====
  function getIcon(name) {
    return ICONS[name] || ICONS['file-text'];
  }

  // ===== 工具 =====
  function safeParse(str) {
    try { return JSON.parse(str); } catch(e) { return {}; }
  }

  var engine = {
    buildToolChain: buildToolChain,
    getIcon: getIcon,
    getFieldChanges: getFieldChanges,
    getFieldSummary: getFieldSummary,
  };

  global.AgentEngine = engine;

})(typeof window !== 'undefined' ? window : globalThis);
