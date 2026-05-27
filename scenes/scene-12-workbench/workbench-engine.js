// ============================================================
// 工作台引擎 — 纯逻辑，无 DOM 依赖
// 场景数据从独立 JSON 文件加载，数据/代码完全解耦
// ============================================================

(function(global) {
  'use strict';

  var STAGES = [
    { id: 'P1', name: '线索接入与智能破冰', color: '#60A5FA', order: 1 },
    { id: 'P2', name: '客户画像与需求洞察', color: '#34D399', order: 2 },
    { id: 'P3', name: '产品匹配与方案推荐', color: '#FBBF24', order: 3 },
    { id: 'P4', name: '价值证明与异议化解', color: '#F97316', order: 4 },
    { id: 'P5', name: '试菜拜访与现场推进', color: '#EC4899', order: 5 },
    { id: 'P6', name: '报价合同与成交推进', color: '#8B5CF6', order: 6 },
    { id: 'P7', name: '交付培训与复购经营', color: '#06B6D4', order: 7 },
  ];

  var _scenarios = [];       // 全部已加载的场景
  var _scenarioCache = {};   // id → Scenario
  var _currentScenarioId = null;
  var _messageIndex = 0;
  var _initialized = false;
  var _initPromise = null;

  // ===== 初始化：从 scenarios/ 目录加载所有 JSON =====
  function init() {
    if (_initPromise) return _initPromise;
    _initPromise = new Promise(function(resolve, reject) {
      var ids = [];
      // 先尝试加载 manifest.json，没有就使用已知的场景 ID 列表
      fetch('scenarios/manifest.json')
        .then(function(r) { return r.json(); })
        .then(function(manifest) { ids = manifest.ids || []; })
        .catch(function() {
          // 没有 manifest 时使用默认 ID 列表
          ids = [];
          for (var p = 1; p <= 7; p++) {
            var count = [0,4,5,6,5,4,4,5]; // P1=4, P2=5, ...
            for (var i = 1; i <= count[p]; i++) {
              ids.push(p + '-' + i);
            }
          }
        })
        .then(function() {
          // 加载所有场景
          var promises = ids.map(function(id) {
            return fetch('scenarios/' + id + '.json')
              .then(function(r) { return r.json(); })
              .then(function(data) {
                data._loaded = true;
                _scenarios.push(data);
                _scenarioCache[data.id] = data;
              })
              .catch(function() { /* 单个场景加载失败不影响其他 */ });
          });
          return Promise.all(promises);
        })
        .then(function() {
          _initialized = true;
          resolve();
        })
        .catch(function(err) { reject(err); });
    });
    return _initPromise;
  }

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
    if (stageId) return _scenarios.filter(function(s) { return s.stageId === stageId; });
    return _scenarios.slice();
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
    return _currentScenarioId ? getScenario(_currentScenarioId) : null;
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
    // 使用 _messageIndex - 1 获取当前已显示消息的注解，而非下一条消息
    var idx = _messageIndex > 0 ? _messageIndex - 1 : 0;
    return getAnnotationAtIndex(idx);
  }

  function getAnnotationAtIndex(index) {
    var scene = getCurrentScenario();
    if (!scene) return null;
    if (!scene.annotationsAt && scene.annotations) {
      // 兼容 JSON 格式：annotations 数组，需转换为 annotationsAt
      convertAnnotations(scene);
    }
    if (scene.annotationsAt && scene.annotationsAt.length > 0) {
      var sorted = scene.annotationsAt.slice().sort(function(a, b) { return a.atIndex - b.atIndex; });
      var match = null;
      for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].atIndex <= index) match = sorted[i].annotations;
        else break;
      }
      if (match) return match;
    }
    return scene.defaultAnnotations || null;
  }

  function convertAnnotations(scene) {
    if (!scene.annotations || !Array.isArray(scene.annotations)) return;
    scene.defaultAnnotations = null;
    scene.annotationsAt = [];
    var foundFirst = false;
    scene.annotations.forEach(function(ann, idx) {
      if (ann !== null) {
        if (!foundFirst) { scene.defaultAnnotations = ann; foundFirst = true; }
        else { scene.annotationsAt.push({ atIndex: idx, annotations: ann }); }
      }
    });
    delete scene.annotations;
  }

  // ===== 重置 =====
  function reset() {
    _currentScenarioId = null;
    _messageIndex = 0;
  }

  // ===== 导航 =====
  function getNextScenarioId() {
    if (!_currentScenarioId) return null;
    var ids = _scenarios.map(function(s) { return s.id; }).sort();
    var idx = ids.indexOf(_currentScenarioId);
    if (idx < 0 || idx >= ids.length - 1) return null;
    return ids[idx + 1];
  }

  function getPrevScenarioId() {
    if (!_currentScenarioId) return null;
    var ids = _scenarios.map(function(s) { return s.id; }).sort();
    var idx = ids.indexOf(_currentScenarioId);
    if (idx <= 0) return null;
    return ids[idx - 1];
  }

  // ===== 导出 =====
  var engine = {
    init: init,
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
    get initialized() { return _initialized; },
  };

  global.WorkbenchEngine = engine;

})(typeof window !== 'undefined' ? window : globalThis);
