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

  // ===== 核心：Observe → Reason → Execute =====
  function buildToolChain(prevAnn, currAnn, context) {
    var tools = [];
    if (!currAnn) return tools;

    var triggerMsg = context.triggerMessage || '';
    var analysis = context.analysis || '';
    var suggestion = context.suggestion || '';
    var fieldChanges = getFieldChanges(prevAnn, currAnn);
    var hasStageChange = currAnn.progress && currAnn.progress.stageChange;

    // --- OBSERVE: 收集所有上下文输入给 LLM ---
    tools.push({ phase:'observe', icon:'message-square', tool:'collectContext', action:'收集当前上下文', output: '新消息: ' + triggerMsg, duration: 180 });
    var fieldSummary = getFieldSummary(currAnn);
    if (fieldSummary) {
      tools.push({ phase:'observe', icon:'database', tool:'readSystemFields', action:'读取客户系统字段', output: fieldSummary, duration: 240 });
    }

    // --- REASON: 单次 LLM 推理 ---
    // 构造结构化的 prompt/result 展示
    var promptParts = [];
    if (fieldSummary) promptParts.push('系统字段(' + fieldSummary.split(';').length + '项)');
    promptParts.push('新消息(=' + triggerMsg.length + '字)');
    var promptStr = promptParts.join(' + ');

    var resultObj = { understanding: '', decisions: [], plan: '' };
    if (fieldChanges.length > 0) {
      resultObj.understanding = analysis || '分析完成';
      resultObj.decisions = fieldChanges.map(function(c) { return c; });
      resultObj.plan = '更新 ' + fieldChanges.length + ' 个字段' + (suggestion ? ' + ' + suggestion : '');
    } else if (analysis) {
      resultObj.understanding = analysis;
      resultObj.plan = suggestion || '无需操作';
    } else {
      resultObj.plan = '对话正常推进，无需变更';
    }

    var resultStr = resultObj.understanding;
    if (resultObj.decisions.length > 0) resultStr += ' | 决策更新: ' + resultObj.decisions.join(', ');
    resultStr += ' | 计划: ' + resultObj.plan;

    tools.push({
      phase:'reason', icon:'search', tool:'llmReason', action:'LLM 综合分析',
      prompt: promptStr,
      output: resultStr,
      duration: 1800 + Math.floor(Math.random() * 800), // 1.8~2.6s
    });

    // --- EXECUTE: 按推理结果执行工具调用 ---
    if (fieldChanges.length > 0) {
      tools.push({ phase:'execute', icon:'edit', tool:'updateCustomerField', action:'更新客户画像', output: fieldChanges.join('; '), duration: 350 });
    }

    if (hasStageChange) {
      tools.push({ phase:'execute', icon:'bar-chart', tool:'evaluateStage', action:'评估阶段变更条件', output: '满足 ' + (currAnn.progress.currentStage || '') + ' 条件', duration: 200 });
      tools.push({ phase:'execute', icon:'file-text', tool:'updateStage', action:'推进销售阶段', output: currAnn.progress.stageChange, duration: 280 });
    }

    if (suggestion) {
      tools.push({ phase:'execute', icon:'arrow-right', tool:'generateSuggestion', action:'输出下一步建议', output: suggestion, duration: 450 });
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
