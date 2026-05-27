// ============================================================
// 工作台引擎 — 纯逻辑，无 DOM 依赖
// 负责场景管理、消息队列、状态推进
// ============================================================

(function(global) {
  'use strict';

  // ===== 阶段定义 =====
  const STAGES = [
    { id: 'P1', name: '线索接入与智能破冰', color: '#60A5FA', order: 1 },
    { id: 'P2', name: '客户画像与需求洞察', color: '#34D399', order: 2 },
    { id: 'P3', name: '产品匹配与方案推荐', color: '#FBBF24', order: 3 },
    { id: 'P4', name: '价值证明与异议化解', color: '#F97316', order: 4 },
    { id: 'P5', name: '试菜拜访与现场推进', color: '#EC4899', order: 5 },
    { id: 'P6', name: '报价合同与成交推进', color: '#8B5CF6', order: 6 },
    { id: 'P7', name: '交付培训与复购经营', color: '#06B6D4', order: 7 },
  ];

  // ===== 内部状态 =====
  let _currentScenarioId = null;
  let _messageIndex = 0;
  let _scenarioCache = {};

  // ===== 初始化 =====
  function _buildCache() {
    _scenarioCache = {};
    if (typeof SCENARIOS !== 'undefined') {
      SCENARIOS.forEach(function(s) { _scenarioCache[s.id] = s; });
    }
  }
  _buildCache();

  // ===== 阶段 API =====
  function getStages() { return STAGES; }

  function getStageById(id) {
    for (var i = 0; i < STAGES.length; i++) {
      if (STAGES[i].id === id) return STAGES[i];
    }
    return null;
  }

  // ===== 场景 API =====
  function getScenarios(stageId) {
    var list = [];
    for (var key in _scenarioCache) {
      if (_scenarioCache.hasOwnProperty(key)) list.push(_scenarioCache[key]);
    }
    if (stageId) return list.filter(function(s) { return s.stageId === stageId; });
    return list;
  }

  function getScenario(id) { return _scenarioCache[id] || null; }

  // ===== 状态管理 =====
  function selectScenario(id) {
    if (!getScenario(id)) return false;
    _currentScenarioId = id;
    _messageIndex = 0;
    return true;
  }

  function getCurrentScenario() {
    if (!_currentScenarioId) return null;
    return getScenario(_currentScenarioId);
  }

  function getCurrentMessageIndex() { return _messageIndex; }

  // ===== 消息播放 =====
  function getMessages() {
    var scene = getCurrentScenario();
    return scene ? (scene.messages || []) : [];
  }

  function hasNextMessage() {
    return _messageIndex < getMessages().length;
  }

  function advanceMessage() {
    var msgs = getMessages();
    if (_messageIndex >= msgs.length) return null;
    var msg = msgs[_messageIndex];
    _messageIndex++;
    return msg;
  }

  function getVisibleMessages() {
    return getMessages().slice(0, _messageIndex);
  }

  // ===== 注解 =====
  function getCurrentAnnotations() {
    return getAnnotationAtIndex(_messageIndex);
  }

  function getAnnotationAtIndex(index) {
    var scene = getCurrentScenario();
    if (!scene) return null;
    // 优先使用 annotationsAt（索引更新）
    if (scene.annotationsAt && scene.annotationsAt.length > 0) {
      var sorted = scene.annotationsAt.slice().sort(function(a, b) { return a.atIndex - b.atIndex; });
      var match = null;
      for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].atIndex <= index) match = sorted[i].annotations;
        else break;
      }
      if (match) return match;
    }
    // 回退到 defaultAnnotations
    return scene.defaultAnnotations || null;
  }

  // ===== 重置 =====
  function reset() {
    _currentScenarioId = null;
    _messageIndex = 0;
  }

  // ===== 导航 =====
  function _getSortedIds() {
    return Object.keys(_scenarioCache).sort();
  }

  function getNextScenarioId() {
    if (!_currentScenarioId) return null;
    var ids = _getSortedIds();
    var idx = ids.indexOf(_currentScenarioId);
    if (idx < 0 || idx >= ids.length - 1) return null;
    return ids[idx + 1];
  }

  function getPrevScenarioId() {
    if (!_currentScenarioId) return null;
    var ids = _getSortedIds();
    var idx = ids.indexOf(_currentScenarioId);
    if (idx <= 0) return null;
    return ids[idx - 1];
  }

  // ===== 刷新缓存（测试用） =====
  function _refreshCache() { _buildCache(); reset(); }

  // ===== 导出 =====
  var engine = {
    getStages: getStages,
    getStageById: getStageById,
    getScenarios: getScenarios,
    getScenario: getScenario,
    selectScenario: selectScenario,
    getCurrentScenario: getCurrentScenario,
    getCurrentMessageIndex: getCurrentMessageIndex,
    getMessages: getMessages,
    hasNextMessage: hasNextMessage,
    advanceMessage: advanceMessage,
    getVisibleMessages: getVisibleMessages,
    getCurrentAnnotations: getCurrentAnnotations,
    getAnnotationAtIndex: getAnnotationAtIndex,
    reset: reset,
    getNextScenarioId: getNextScenarioId,
    getPrevScenarioId: getPrevScenarioId,
    _refreshCache: _refreshCache,
  };

  global.WorkbenchEngine = engine;

})(typeof window !== 'undefined' ? window : globalThis);
