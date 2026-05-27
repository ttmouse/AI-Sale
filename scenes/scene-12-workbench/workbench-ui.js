// ============================================================
// 工作台 UI 渲染 — 使用 wecom-chat.js 组件 + AI 时间轴
// 聊天区只显示客户/销售消息
// AI 时间轴累加显示每一步的分析记录
// 右侧面板显示当前最新状态
// ============================================================

(function() {
  'use strict';

  var AUTO_PLAY_DELAY = 1800;
  var _autoPlayTimer = null;
  var _isPlaying = false;
  var _lastTimelineIdx = -1;  // 最后渲染的时间轴步数
  var _lastAnnContent = '';     // 上次渲染的注解内容，用来检测变化

  var els = {};
  function _cache() {
    els = {
      stageTabs: document.getElementById('stage-tabs'),
      scenarioList: document.getElementById('scenario-list'),
      scenarioTitle: document.getElementById('scenario-title'),
      scenarioPain: document.getElementById('scenario-pain'),
      scenarioHighlights: document.getElementById('scenario-highlights'),
      scenarioGoal: document.getElementById('scenario-goal'),
      stageBadge: document.getElementById('stage-badge'),
      profileCard: document.getElementById('profile-card'),
      progressCard: document.getElementById('progress-card'),
      flowCard: document.getElementById('flow-card'),
      knowledgeCard: document.getElementById('knowledge-card'),
      nextActionCard: document.getElementById('next-action-card'),
      timelineBody: document.getElementById('timeline-body'),
      prevBtn: document.getElementById('btn-prev'),
      nextBtn: document.getElementById('btn-next'),
      autoPlayBtn: document.getElementById('btn-autoplay'),
      stepBtn: document.getElementById('btn-step'),
      resetBtn: document.getElementById('btn-reset'),
      progressFill: document.getElementById('msg-progress-fill'),
      progressText: document.getElementById('msg-progress-text'),
      scenarioCount: document.getElementById('scenario-count'),
    };
  }

  // ===== 阶段 Tab =====
  function renderStageTabs() {
    var stages = WorkbenchEngine.getStages();
    var html = '';
    stages.forEach(function(s) {
      html += '<button class="stage-tab" data-stage="' + s.id + '" style="--tab-color:' + s.color + '">'
        + '<span class="stage-tab-num">' + s.id + '</span>'
        + '<span class="stage-tab-name">' + s.name + '</span>'
        + '</button>';
    });
    els.stageTabs.innerHTML = html;
    els.stageTabs.querySelectorAll('.stage-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { selectStage(this.getAttribute('data-stage')); });
    });
  }

  // ===== 选择阶段 =====
  function selectStage(stageId) {
    els.stageTabs.querySelectorAll('.stage-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-stage') === stageId);
    });
    var scenarios = WorkbenchEngine.getScenarios(stageId);
    var html = '';
    scenarios.forEach(function(s) {
      html += '<div class="scenario-item" data-scenario="' + s.id + '">'
        + '<span class="scenario-item-id">' + s.id + '</span>'
        + '<span class="scenario-item-name">' + s.name + '</span>'
        + '</div>';
    });
    els.scenarioList.innerHTML = html;
    if (els.scenarioCount) els.scenarioCount.textContent = scenarios.length + ' 个场景';
    els.scenarioList.querySelectorAll('.scenario-item').forEach(function(item) {
      item.addEventListener('click', function() { loadScenario(this.getAttribute('data-scenario')); });
    });
    if (scenarios.length > 0) loadScenario(scenarios[0].id);
  }

  // ===== 加载场景 =====
  function loadScenario(scenarioId) {
    WorkbenchEngine.selectScenario(scenarioId);
    var scene = WorkbenchEngine.getCurrentScenario();
    if (!scene) return;

    // 高亮
    els.scenarioList.querySelectorAll('.scenario-item').forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('data-scenario') === scenarioId);
    });

    // 左侧面板
    var stage = WorkbenchEngine.getStageById(scene.stageId);
    els.stageBadge.textContent = (stage ? stage.id + ' \u00B7 ' + stage.name : scene.stageId);
    els.stageBadge.style.background = stage ? stage.color : '#999';
    els.scenarioTitle.textContent = scene.name;
    els.scenarioPain.textContent = (scene.painPoint || '').length > 120 ? scene.painPoint.substring(0, 120) + '...' : (scene.painPoint || '');
    var highlightsHtml = '';
    (scene.highlights || []).forEach(function(h) { highlightsHtml += '<li>' + h + '</li>'; });
    els.scenarioHighlights.innerHTML = highlightsHtml;
    els.scenarioGoal.textContent = scene.demoGoal || '';

    // 重置
    WecomChat.clearMessages();
    _lastTimelineIdx = -1;
    els.timelineBody.innerHTML = '';
    els.progressFill.style.width = '0%';
    els.progressText.textContent = '0 / ' + (scene.messages ? scene.messages.length : 0);

    // 清空右侧面板
    els.profileCard.innerHTML = '等待对话开始...';
    els.progressCard.innerHTML = '等待对话开始...';
    els.flowCard.innerHTML = '等待对话开始...';
    els.knowledgeCard.innerHTML = '等待对话开始...';
    els.nextActionCard.innerHTML = '等待对话开始...';

    stopAutoPlay();
    setTimeout(function() { stepForward(); }, 400);
  }

  // ===== 渲染消息（通过 WecomChat 组件）=====
  function renderMessage(msg) {
    if (msg.type === 'customer') WecomChat.addMessage('customer', msg.content);
    else if (msg.type === 'sales') WecomChat.addMessage('sales', msg.content);
  }

  // ===== 更新注解 + 时间轴 =====
  function updateAnnotations() {
    var ann = WorkbenchEngine.getCurrentAnnotations();
    var msgIdx = WorkbenchEngine.getCurrentMessageIndex();
    if (!ann) return;

    // --- 时间轴：检测注解内容变化后才追加卡片 ---
    var annContent = JSON.stringify(ann.profile || '') + '|' + (ann.progress ? ann.progress.currentStage : '') + '|' + JSON.stringify((ann.progress||{}).completed||[]);
    if (annContent !== _lastAnnContent) {
      _lastAnnContent = annContent;
      _lastTimelineIdx = msgIdx;
      appendTimelineCard(ann, msgIdx);
    }

    // --- 右侧面板：始终显示当前最新状态 ---
    if (ann.profile) els.profileCard.innerHTML = _mdToHtml(ann.profile);
    if (ann.progress) {
      var p = ann.progress;
      var html = '<div class="ann-stage">当前阶段：<strong>' + p.currentStage + '</strong></div>';
      if (p.stageChange) html += '<div class="ann-badge ann-badge-change">' + p.stageChange + '</div>';
      if (p.completed && p.completed.length > 0) {
        html += '<div class="ann-section">已完成</div>';
        p.completed.forEach(function(item) { html += '<div class="ann-check-item">' + item + '</div>'; });
      }
      if (p.pending && p.pending.length > 0) {
        html += '<div class="ann-section ann-pending">待确认</div>';
        p.pending.forEach(function(item) { html += '<div class="ann-pending-item">' + item + '</div>'; });
      }
      els.progressCard.innerHTML = html;
    }
    if (ann.flows && ann.flows.length > 0) {
      var html = '';
      ann.flows.forEach(function(f) {
        html += '<button class="flow-btn" onclick="window.showToast(\'' + f.label.replace(/'/g, "\\'") + ' 已创建\')">'
          + _iconHtml(f.icon || 'circle') + '<span>' + f.label + '</span></button>';
      });
      els.flowCard.innerHTML = html;
    }
    if (ann.cards && ann.cards.length > 0) {
      var html = '';
      ann.cards.forEach(function(c) { html += '<div class="knowledge-item">' + c + '</div>'; });
      els.knowledgeCard.innerHTML = html;
    }
    if (ann.nextAction) {
      var na = ann.nextAction;
      var html = '<div class="next-suggestion">' + na.suggestion + '</div>';
      if (na.reason) html += '<div class="next-reason">' + na.reason + '</div>';
      if (na.recommendedScript) {
        html += '<div class="next-script"><div class="next-script-label">推荐话术</div>'
          + '<div class="next-script-text">' + na.recommendedScript + '</div></div>';
      }
      els.nextActionCard.innerHTML = html;
    }
  }

  // ===== 追加时间轴卡片 =====
  function appendTimelineCard(ann, msgIdx) {
    if (!els.timelineBody) return;

    var html = '<div class="tl-card">';
    html += '<div class="tl-step">步骤 ' + msgIdx + '</div>';

    // 阶段
    if (ann.progress) {
      var p = ann.progress;
      var stageObj = WorkbenchEngine.getStageById(p.currentStage);
      var color = stageObj ? stageObj.color : '#999';
      html += '<span class="tl-stage" style="background:' + color + '">' + p.currentStage + '</span>';
      if (p.stageChange) html += ' <span class="ann-badge ann-badge-change" style="font-size:0.5625rem;">' + p.stageChange + '</span>';
    }

    // 已完成的项
    if (ann.progress && ann.progress.completed && ann.progress.completed.length > 0) {
      ann.progress.completed.forEach(function(item) {
        html += '<div class="tl-line green">' + item + '</div>';
      });
    }

    // 画像是否有更新
    if (ann.profile) {
      // 提取画像完整度变化
      var m = ann.profile.match(/\*\*画像完整度[：:]\s*(\S+)\*\*/);
      if (m) {
        html += '<div class="tl-line hl">画像完整度 ' + m[1] + '</div>';
      }
      // 提取客户类型
      var typeMatch = ann.profile.match(/细分类别[：:]\s*(.+)/);
      if (typeMatch) {
        html += '<div class="tl-line">识别：' + typeMatch[1].trim() + '</div>';
      }
      var sourceMatch = ann.profile.match(/客户来源[：:]\s*(.+)/);
      if (sourceMatch && msgIdx < 3) {
        html += '<div class="tl-line">来源：' + sourceMatch[1].trim() + '</div>';
      }
    }

    // 下一步建议
    if (ann.nextAction) {
      html += '<div class="tl-line hl">' + ann.nextAction.suggestion + '</div>';
    }

    html += '</div>';

    // 移除空状态
    var empty = els.timelineBody.querySelector('.tl-empty');
    if (empty) empty.remove();

    els.timelineBody.insertAdjacentHTML('beforeend', html);
    // 滚动到底部
    els.timelineBody.scrollTop = els.timelineBody.scrollHeight;
  }

  // ===== 步进 =====
  // 自动跳过AI/系统消息，只停在客户和销售消息上
  function stepForward() {
    if (!WorkbenchEngine.getCurrentScenario()) return;
    if (WorkbenchEngine.hasNextMessage()) {
      var msg = WorkbenchEngine.advanceMessage();
      renderMessage(msg);
      updateAnnotations();
      updateProgress();
      // 如果当前消息不是客户/销售，继续推进（自动跳过AI提示/系统消息）
      if (msg.type !== 'customer' && msg.type !== 'sales') {
        // 递归步进，但限制最多10步防止死循环
        var safety = 0;
        while (WorkbenchEngine.hasNextMessage() && safety < 10) {
          var next = WorkbenchEngine.advanceMessage();
          renderMessage(next);
          updateAnnotations();
          updateProgress();
          safety++;
          if (next.type === 'customer' || next.type === 'sales') break;
        }
      }
    } else {
      window.showToast('场景对话已播放完毕');
      stopAutoPlay();
    }
  }

  // ===== 进度 =====
  function updateProgress() {
    var msgs = WorkbenchEngine.getMessages();
    var current = WorkbenchEngine.getCurrentMessageIndex();
    var total = msgs.length;
    var pct = total > 0 ? Math.round((current / total) * 100) : 0;
    els.progressFill.style.width = pct + '%';
    els.progressText.textContent = current + ' / ' + total;
  }

  // ===== 播放控制 =====
  function toggleAutoPlay() { if (_isPlaying) stopAutoPlay(); else startAutoPlay(); }
  function startAutoPlay() {
    if (_isPlaying || !WorkbenchEngine.hasNextMessage()) return;
    _isPlaying = true;
    if (els.autoPlayBtn) els.autoPlayBtn.classList.add('playing');
    _autoPlayTimer = setInterval(function() {
      if (!WorkbenchEngine.hasNextMessage()) { stopAutoPlay(); window.showToast('全部播放完毕'); return; }
      stepForward();
    }, AUTO_PLAY_DELAY);
  }
  function stopAutoPlay() {
    _isPlaying = false;
    if (els.autoPlayBtn) els.autoPlayBtn.classList.remove('playing');
    if (_autoPlayTimer) { clearInterval(_autoPlayTimer); _autoPlayTimer = null; }
  }

  // ===== 导航 =====
  function goPrev() { var id = WorkbenchEngine.getPrevScenarioId(); if (id) loadScenario(id); }
  function goNext() { var id = WorkbenchEngine.getNextScenarioId(); if (id) loadScenario(id); }
  function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ''; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }

  // ===== Toast =====
  window.showToast = function(msg) {
    var existing = document.querySelector('.wb-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'wb-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('wb-toast-show'); }, 10);
    setTimeout(function() {
      toast.classList.remove('wb-toast-show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  };

  // ===== 工具 =====
  function _mdToHtml(text) {
    return (text || '')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, function(m) { return '<ul>' + m + '</ul>'; });
  }

  function _iconHtml(name) {
    var icons = {
      'user-plus': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
      'calendar-plus': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
      'tag': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
      'edit': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      'thumbs-up': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
      'file-text': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      'link': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      'send': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      'list': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
      'map-pin': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      'check-square': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      'bell': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      'truck': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><rect x="9" y="3" width="6" height="13"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M15 15h2.5c1.5 0 2.5-1 2.5-2.5V10l-6-5v10H3"/></svg>',
      'calendar': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      'circle': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
    };
    return icons[name] || icons.circle;
  }

  // ===== 初始化 =====
  function init() {
    _cache();
    WecomChat.render('phone-container');
    renderStageTabs();
    selectStage('P1');

    if (els.prevBtn) els.prevBtn.addEventListener('click', goPrev);
    if (els.nextBtn) els.nextBtn.addEventListener('click', goNext);
    if (els.stepBtn) els.stepBtn.addEventListener('click', stepForward);
    if (els.resetBtn) els.resetBtn.addEventListener('click', goReset);
    if (els.autoPlayBtn) els.autoPlayBtn.addEventListener('click', toggleAutoPlay);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight') stepForward();
      else if (e.key === 'ArrowLeft') goReset();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
