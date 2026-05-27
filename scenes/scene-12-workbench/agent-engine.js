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
  };

  // ===== 核心：根据状态变化生成工具调用链 =====
  function buildToolChain(prevAnn, currAnn, context) {
    var tools = [];
    if (!currAnn) return tools;

    var triggerMsg = context.triggerMessage || '';
    var analysis = context.analysis || '';
    var suggestion = context.suggestion || '';

    // --- READ 阶段 ---
    tools.push({ phase:'read', icon:'message-square', tool:'getMessageHistory', action:'拉取会话消息', output: triggerMsg });

    // 读取当前系统字段
    var fieldSummary = getFieldSummary(currAnn);
    tools.push({ phase:'read', icon:'database', tool:'getSystemFields', action:'读取系统字段', output: fieldSummary });

    // --- THINK 阶段 ---
    if (analysis) {
      tools.push({ phase:'think', icon:'search', tool:'detectIntent', action:'语义理解与意图识别', output: analysis });
    }

    // --- EXEC 阶段 ---
    // 字段变更
    var fieldChanges = getFieldChanges(prevAnn, currAnn);
    if (fieldChanges.length > 0) {
      tools.push({ phase:'exec', icon:'edit', tool:'updateCustomerField', action:'更新画像字段', output: fieldChanges.join('; ') });
    }

    // 阶段变更
    if (currAnn.progress && currAnn.progress.stageChange) {
      tools.push({ phase:'exec', icon:'file-text', tool:'updateStage', action:'更新销售阶段', output: currAnn.progress.stageChange });
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
