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
  var _stepCounter = 0;
  var _stepHistory = [0];
var _lastAnnContent = '';     // 上次渲染的注解内容，用来检测变化
  var _pendingConfirmState = {}; // { itemId: 'confirmed' | 'dismissed' | null }
  var _prevAnn = null; // 前一步的 annotation，用于 AgentEngine 差异分析

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
      confirmCard: document.getElementById('confirm-card'),
      confirmCount: document.getElementById('confirm-count'),
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
      var badge = s.polished ? ' <span class="sc-badge">精</span>' : '';
      html += '<div class="scenario-item" data-scenario="' + s.id + '">'
        + '<span class="scenario-item-id">' + s.id + '</span>'
        + '<span class="scenario-item-name">' + s.name + badge + '</span>'
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

    // 设置企微头部标题和销售信息
    WecomChat.setTitle(scene.customerName || '企业微信');
    WecomChat.setSalesInfo(scene.salesName || '小陈');

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
    _lastAnnContent = "";
    _stepCounter = 0;
    _prevAnn = null;
    els.timelineBody.innerHTML = '';
    els.progressFill.style.width = '0%';
    els.progressText.textContent = '0 / ' + (scene.messages ? scene.messages.length : 0);

    // 清空右侧面板
    els.profileCard.innerHTML = '等待对话开始...';
    els.progressCard.innerHTML = '等待对话开始...';
    els.flowCard.innerHTML = '等待对话开始...';
    els.knowledgeCard.innerHTML = '等待对话开始...';
    els.nextActionCard.innerHTML = '等待对话开始...';
    els.confirmCard.innerHTML = '';
    if (els.confirmSection) els.confirmSection.style.display = 'none';
    if (els.confirmCount) els.confirmCount.style.display = 'none';
    _pendingConfirmState = {};

    stopAutoPlay();
    // 自动推进到第一条可见消息
    setTimeout(function() { stepForward(); }, 300);
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

    // --- 时间轴：延迟追加卡片，模拟AI实时分析 ---
    var annContent = JSON.stringify(ann.profile || '') + '|' + (ann.progress ? ann.progress.currentStage : '') + '|' + JSON.stringify((ann.progress||{}).completed||[]);
    if (annContent !== _lastAnnContent) {
      _lastAnnContent = annContent;
      _lastTimelineIdx = msgIdx;
      _stepCounter++;
      _stepHistory.push(WorkbenchEngine.getCurrentMessageIndex());
      appendTimelineCard(ann, _stepCounter);
      _prevAnn = ann;
    }

    // --- 同步数据到手机侧边栏 ---
    WecomChat.updateSidebar(ann);

    // --- 右侧面板：始终显示当前最新状态 ---
    // 结构化字段面板：固定顺序，空值显示占位
    if (ann.fields) {
      var fieldHtml = '';
      // 使用固定的字段顺序（来自数据或默认顺序）
      var fixedOrder = ann._fieldOrder || Object.keys(ann.fields);
      fixedOrder.forEach(function(key) {
        var f = ann.fields[key];
        if (!f) return;
        var val = f.value;
        var st = f.status || 'empty';
        var cls = 'sf-row';
        if (st === 'empty') { cls += ' sf-empty'; val = '—'; }
        else if (st === 'new') { cls += ' sf-new'; }
        else if (st === 'updated') { cls += ' sf-updated'; }
        var badge = '';
        if (st === 'new') badge = '<span class="sf-badge sf-badge-new">✦</span>';
        else if (st === 'updated') badge = '<span class="sf-badge sf-badge-upd">←</span>';
        fieldHtml += '<div class="' + cls + '"><span class="sf-key">' + key + '</span><span class="sf-val">' + val + '</span>' + badge + '</div>';
      });
      els.profileCard.innerHTML = fieldHtml;
    } else if (ann.profile) {
      els.profileCard.innerHTML = _mdToHtml(ann.profile);
    }
    if (ann.progress) {
      var p = ann.progress;
      // 阶段进度条：展示P1-P7整体旅程
      var allStages = ['P1','P2','P3','P4','P5','P6','P7'];
      var stageNames = {'P1':'线索破冰','P2':'需求洞察','P3':'方案推荐','P4':'异议化解','P5':'试菜拜访','P6':'报价成交','P7':'交付复购'};
      var curIdx = allStages.indexOf(p.currentStage);
      if (curIdx < 0) curIdx = 0;
      var barHtml = '<div class="stage-progress-bar">';
      allStages.forEach(function(s, i) {
        var cls = 'sp-dot';
        if (i < curIdx) cls += ' sp-done';
        else if (i === curIdx) cls += ' sp-current';
        barHtml += '<div class="' + cls + '" title="' + (stageNames[s]||s) + '"><span class="sp-label">' + s + '</span></div>';
        if (i < allStages.length - 1) {
          var lineCls = 'sp-line';
          if (i < curIdx) lineCls += ' sp-line-done';
          barHtml += '<div class="' + lineCls + '"></div>';
        }
      });
      barHtml += '</div>';

      var html = barHtml;
      html += '<div class="ann-stage">当前阶段：<strong>' + p.currentStage + '</strong>';
      if (p.stageChange) html += ' <span class="ann-badge ann-badge-change">' + p.stageChange + '</span>';
      html += '</div>';
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

    // 待确认事项渲染
    if (ann.pendingConfirm && ann.pendingConfirm.length > 0) {
      renderPendingConfirm(ann.pendingConfirm);
    }
  }

  // ===== 追加时间轴卡片 =====
  function appendTimelineCard(ann, msgIdx) {
    if (!els.timelineBody) return;

    var html = '<div class="tl-card">';

    // Agent 日志模式：由 AgentEngine 动态生成工具调用链
    if (ann.agentLog) {
      html += '<div class="tl-step">#' + msgIdx + '</div>';

      var log = ann.agentLog || {};
      var context = {
        triggerMessage: log.received || '',
        analysis: log.analysis || '',
        suggestion: log.recommendedAction || (ann.nextAction ? ann.nextAction.suggestion : ''),
      };
      var tools = AgentEngine.buildToolChain(_prevAnn, ann, context);

      if (tools && tools.length > 0) {
        var phaseLabels = {observe:'OBSERVE', reason:'REASON', execute:'EXECUTE'};
        tools.forEach(function(t, si) {
          var style = si === 0 ? '' : ' style="display:none"';
          var durTag = t.duration ? ' <span class="tl-dur">' + fmtDuration(t.duration) + '</span>' : '';
          var outputHtml = t.output ? ' <span class="tl-agent-result">→ ' + t.output + '</span>' : '';
          var promptHtml = t.prompt ? ' <span class="tl-prompt">' + t.prompt + '</span>' : '';
          if (t.phase) {
            html += '<div class="tl-phase-divider tl-phase-' + t.phase + '" id="al-phase-' + msgIdx + '-' + si + '"' + style + '>' + (phaseLabels[t.phase] || t.phase) + '</div>';
          }
          // 卡片结构：头部=名称+耗时，体部=工具名+结果
          html += '<div class="tl-scard tl-scard-' + t.phase + '" id="al-step-' + msgIdx + '-' + si + '"' + style + '>'
            + '<div class="tl-scard-hd">'
            + '<span class="tl-agent-icon">' + AgentEngine.getIcon(t.icon) + '</span>'
            + ' <span class="tl-agent-label">' + t.action + '</span>'
            + durTag
            + '</div>'
            + '<div class="tl-scard-bd">'
            + ' <span class="tl-agent-tool">' + t.tool + '</span>'
            + promptHtml
            + outputHtml
            + '</div>'
            + '</div>';
        });
      }
    } else {
      // 不再显示轮次编号
      if (ann.progress) {
        var p = ann.progress;
        var stageObj = WorkbenchEngine.getStageById(p.currentStage);
        var color = stageObj ? stageObj.color : '#999';
        html += '<span class="tl-stage" style="background:' + color + '">' + p.currentStage + '</span>';
        if (p.stageChange) html += ' <span class="ann-badge ann-badge-change" style="font-size:0.5625rem;">' + p.stageChange + '</span>';
      }
      if (ann.progress && ann.progress.completed && ann.progress.completed.length > 0) {
        ann.progress.completed.forEach(function(item) { html += '<div class="tl-line green">' + item + '</div>'; });
      }
      if (ann.nextAction) {
        html += '<div class="tl-line hl">' + ann.nextAction.suggestion + '</div>';
      }
    }

    html += '</div>';

    var empty = els.timelineBody.querySelector('.tl-empty');
    if (empty) empty.remove();

    els.timelineBody.insertAdjacentHTML('beforeend', html);
    requestAnimationFrame(function() {
      els.timelineBody.scrollTop = els.timelineBody.scrollHeight;
    });

    // Agent 执行步骤逐行展示 + 实时滚动到底部
    function scrollToBottom() {
      requestAnimationFrame(function() {
        els.timelineBody.scrollTop = els.timelineBody.scrollHeight;
      });
    }
    function addRunning(el) {
      if (el) {
        var runEl = document.createElement('span');
        runEl.className = 'tl-running';
        runEl.textContent = '...';
        var durEl = el.querySelector('.tl-dur');
        if (durEl) durEl.after(runEl);
      }
    }
    function removeRunning(el) {
      if (el) {
        var r = el.querySelector('.tl-running');
        if (r) r.remove();
      }
    }
    var context = ann.agentLog ? {
      triggerMessage: ann.agentLog.received || '',
      analysis: ann.agentLog.analysis || '',
      suggestion: ann.agentLog.recommendedAction || (ann.nextAction ? ann.nextAction.suggestion : ''),
    } : {};
    var revealTools = ann.agentLog ? AgentEngine.buildToolChain(_prevAnn, ann, context) : [];
    if (revealTools.length > 0) {
      var total = revealTools.length;
      for (var si = 1; si < total; si++) {
        (function(idx) {
          var delay = 350;
          // 如果是 reason 阶段的 LLM 调用，在显示后保留运行状态一段时间
          var tool = revealTools[idx];
          var extraTime = (tool && tool.tool === 'llmReason' && tool.duration) ? tool.duration * 0.6 : 0;
          setTimeout(function() {
            var el = document.getElementById('al-step-' + msgIdx + '-' + idx);
            if (el) { el.style.display = ''; addRunning(el); scrollToBottom(); }
            var ph = document.getElementById('al-phase-' + msgIdx + '-' + idx);
            if (ph) { ph.style.display = ''; scrollToBottom(); }
            // 额外保留运行状态（模拟 LLM 耗时）
            if (extraTime > 0) {
              setTimeout(function() {
                removeRunning(el);
                scrollToBottom();
              }, extraTime);
            }
          }, delay * idx);
        })(si);
      }
    }

  }

  // ===== 步进 =====
  // 自动跳过AI/系统消息，只停在客户和销售消息上
  function stepForward() {
    if (!WorkbenchEngine.getCurrentScenario()) return;
    if (WorkbenchEngine.hasNextMessage()) {
      // 如果是AI/系统消息，自动跳过
      var safety = 0;
      var msg = WorkbenchEngine.advanceMessage();
      while ((msg.type === 'system' || msg.type === 'ai-hint' || msg.type === 'ai-recommend') && WorkbenchEngine.hasNextMessage() && safety < 10) {
        safety++;
        msg = WorkbenchEngine.advanceMessage();
      }
      renderMessage(msg);
      updateAnnotations();
      updateProgress();
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
  function goBack() {
    if (_stepHistory.length <= 1) return;
    _stepHistory.pop();
    var sceneId = WorkbenchEngine.getCurrentScenario() ? WorkbenchEngine.getCurrentScenario().id : null;
    if (!sceneId) return;
    var targetSteps = _stepHistory.length - 1;
    loadScenario(sceneId);
    if (targetSteps > 0) {
      setTimeout(function() {
        for (var i = 0; i < targetSteps; i++) {
          if (WorkbenchEngine.hasNextMessage()) {
            var m = WorkbenchEngine.advanceMessage();
            var safety = 0;
            while (m && (m.type === 'system' || m.type === 'ai-hint' || m.type === 'ai-recommend') && WorkbenchEngine.hasNextMessage() && safety < 10) {
              safety++; m = WorkbenchEngine.advanceMessage();
            }
            if (m) { renderMessage(m); updateAnnotations(); updateProgress(); }
          }
        }
      }, 400);
    }
  }
  function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ''; _stepCounter = 0; _stepHistory = [0]; _pendingConfirmState = {}; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }

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

  // ===== 待确认渲染 =====
  function renderPendingConfirm(items) {
    if (!els.confirmCard) return;
    var html = '';
    var activeCount = 0;
    items.forEach(function(item) {
      var state = _pendingConfirmState[item.id];
      var typeClass = item.type === 'newTag' ? 'tag' : (item.type === 'fieldUpdate' ? 'conflict' : 'field');
      var typeLabel = item.type === 'newTag' ? '打标' : (item.type === 'fieldUpdate' ? '冲突' : '字段');
      var isResolved = state === 'confirmed' || state === 'dismissed';

      if (!isResolved) activeCount++;

      html += '<div class="pc-item' + (isResolved ? ' pc-resolved' : '') + '" id="pc-' + item.id + '">';
      html += '<div class="pc-header">';
      html += '<span class="pc-label">' + _escapeHtml(item.label) + '</span>';
      html += '<span class="pc-type ' + typeClass + '">' + typeLabel + '</span>';
      html += '</div>';

      if (item.type === 'fieldUpdate' && item.oldValue) {
        html += '<div class="pc-conflict-values">';
        html += '<span class="pc-old-val">' + _escapeHtml(item.oldValue) + '</span>';
        html += '<span class="pc-arrow">→</span>';
        html += '<span class="pc-new-val">' + _escapeHtml(item.newValue) + '</span>';
        html += '</div>';
      } else {
        html += '<div class="pc-value">' + _escapeHtml(item.value) + '</div>';
      }

      if (item.desc) {
        html += '<div class="pc-desc">' + _escapeHtml(item.desc) + '</div>';
      }

      if (isResolved) {
        html += state === 'confirmed'
          ? '<div class="pc-confirmed">' + (item.action === '标记' ? '已标记' : '已采纳') + '</div>'
          : '<div class="pc-dismissed">已忽略</div>';
      } else {
        html += '<div class="pc-actions">';
        html += '<button class="pc-btn confirm" onclick="handleConfirmAction(\'' + item.id + '\',\'confirm\',\'' + item.action + '\')">' + item.action + '</button>';
        html += '<button class="pc-btn dismiss" onclick="handleConfirmAction(\'' + item.id + '\',\'dismiss\',\'' + item.action + '\')">忽略</button>';
        html += '</div>';
      }
      html += '</div>';
    });

    els.confirmCard.innerHTML = html || '';
    if (els.confirmSection) {
      els.confirmSection.style.display = html ? '' : 'none';
    }
    if (els.confirmCount) {
      if (activeCount > 0) {
        els.confirmCount.textContent = activeCount;
        els.confirmCount.style.display = 'inline-flex';
      } else {
        els.confirmCount.style.display = 'none';
      }
    }
  }

  window.handleConfirmAction = function(itemId, action, actionLabel) {
    _pendingConfirmState[itemId] = action === 'confirm' ? 'confirmed' : 'dismissed';
    var item = null;
    var ann = WorkbenchEngine.getCurrentAnnotations();
    if (ann && ann.pendingConfirm) {
      ann.pendingConfirm.forEach(function(pc) { if (pc.id === itemId) item = pc; });
    }
    if (!item) return;

    if (action === 'confirm') {
      // 飞签动画
      var el = document.getElementById('pc-' + itemId);
      if (el) {
        var rect = el.getBoundingClientRect();
        var flyingTag = document.createElement('div');
        flyingTag.className = 'pc-flying';
        flyingTag.textContent = (item.type === 'newTag' ? '🏷️ ' : '') + item.value;
        flyingTag.style.left = rect.left + 'px';
        flyingTag.style.top = rect.top + 'px';
        document.body.appendChild(flyingTag);
        setTimeout(function() { flyingTag.remove(); }, 850);
      }
      window.showToast((item.action === '标记' ? '已标记：' : '已采纳：') + item.value);
    } else {
      window.showToast('已忽略');
    }

    // 重新渲染
    if (ann && ann.pendingConfirm) {
      renderPendingConfirm(ann.pendingConfirm);
    }
  };

  function fmtDuration(ms) {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms + 'ms';
  }

  function _escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

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

  // ===== 静默选择阶段（只渲染列表，不自动加载第一个场景）=====
  function _selectStageSilent(stageId) {
    els.stageTabs.querySelectorAll('.stage-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-stage') === stageId);
    });
    var scenarios = WorkbenchEngine.getScenarios(stageId);
    var html = '';
    scenarios.forEach(function(s) {
      var badge = s.polished ? ' <span class="sc-badge">精</span>' : '';
      html += '<div class="scenario-item" data-scenario="' + s.id + '">'
        + '<span class="scenario-item-id">' + s.id + '</span>'
        + '<span class="scenario-item-name">' + s.name + badge + '</span>'
        + '</div>';
    });
    els.scenarioList.innerHTML = html;
    if (els.scenarioCount) els.scenarioCount.textContent = scenarios.length + ' 个场景';
    els.scenarioList.querySelectorAll('.scenario-item').forEach(function(item) {
      item.addEventListener('click', function() { loadScenario(this.getAttribute('data-scenario')); });
    });
  }

  // ===== 初始化 =====
  function init() {
    _cache();
    WecomChat.render('phone-container');

    // 先初始化引擎（异步加载 JSON），再渲染界面
    if (typeof WorkbenchEngine.init === 'function') {
      WorkbenchEngine.init().then(function() {
        renderStageTabs();
        _selectStageSilent('P1');
        loadScenario('1-4');
      });
    } else {
      renderStageTabs();
      _selectStageSilent('P1');
      loadScenario('1-4');
    }

    if (els.prevBtn) els.prevBtn.addEventListener('click', goPrev);
    if (els.nextBtn) els.nextBtn.addEventListener('click', goNext);
    if (els.stepBtn) els.stepBtn.addEventListener('click', stepForward);
    if (els.resetBtn) els.resetBtn.addEventListener('click', goReset);
    if (els.autoPlayBtn) els.autoPlayBtn.addEventListener('click', toggleAutoPlay);

    document.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowRight') stepForward();
      else if (e.key === 'ArrowLeft') goBack();
    });
  }

  // 确保引擎就绪后再初始化
  var ready = function() {
    if (typeof WorkbenchEngine.init === 'function') {
      // 如果引擎有 init 方法，先确保引擎脚本已加载
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    } else {
      // 回退：引擎可能已同步加载
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

})();
