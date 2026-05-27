require('fs').writeFileSync(
  'scenes/scene-12-workbench/workbench-ui.js',
  require('fs').readFileSync('scenes/scene-12-workbench/workbench-ui.js', 'utf-8')
    .replace(
      /function appendTimelineCard\(ann, msgIdx\) \{[\s\S]*?\n  \}\n\n  \/\/ ===== 步进/,
      `function appendTimelineCard(ann, msgIdx) {
    if (!els.timelineBody) return;

    var html = '<div class="tl-card">';

    // Agent 日志模式（优先）
    if (ann.agentLog) {
      var log = ann.agentLog;
      html += '<div class="tl-step">Step ' + msgIdx + '</div>';

      // 阶段标识
      if (ann.progress) {
        var stageObj = WorkbenchEngine.getStageById(ann.progress.currentStage);
        var color = stageObj ? stageObj.color : '#999';
        html += '<span class="tl-stage" style="background:' + color + '">' + ann.progress.currentStage + '</span>';
        if (ann.progress.stageChange) html += ' <span class="ann-badge ann-badge-change" style="font-size:0.5625rem;">' + ann.progress.stageChange + '</span>';
      }

      // 收到消息
      if (log.received) {
        html += '<div class="tl-agent-line tl-agent-received"><span class="tl-agent-icon">\uD83D\uDCE9</span><span class="tl-agent-label">收到消息</span><div class="tl-agent-text">' + _escapeHtml(log.received) + '</div></div>';
      }

      // AI 分析
      if (log.analysis) {
        html += '<div class="tl-agent-line tl-agent-analysis"><span class="tl-agent-icon">\uD83E\uDDE0</span><span class="tl-agent-label">AI 分析</span><div class="tl-agent-text">' + _escapeHtml(log.analysis) + '</div></div>';
      }

      // 更新字段
      if (log.updates && log.updates.length > 0) {
        html += '<div class="tl-agent-line"><span class="tl-agent-icon">\uD83D\uDCCB</span><span class="tl-agent-label">更新字段</span>';
        log.updates.forEach(function(u) {
          html += '<div class="tl-agent-tag">' + _escapeHtml(u) + '</div>';
        });
        html += '</div>';
      }

      // 推荐动作
      if (log.recommendedAction) {
        html += '<div class="tl-agent-line tl-agent-action"><span class="tl-agent-icon">\uD83C\uDFAF</span><span class="tl-agent-label">推荐动作</span><div class="tl-agent-text">' + _escapeHtml(log.recommendedAction) + '</div></div>';
      }

      // 待确认事项
      if (ann.pendingConfirm && ann.pendingConfirm.length > 0) {
        html += '<div class="tl-agent-line"><span class="tl-agent-icon">\u2753</span><span class="tl-agent-label">待确认</span>';
        ann.pendingConfirm.forEach(function(pc) {
          html += '<div class="tl-agent-tag tl-agent-confirm">' + _escapeHtml(pc.label) + ': ' + _escapeHtml(pc.value) + '</div>';
        });
        html += '</div>';
      }

    } else {
      // 旧版渲染（无 agentLog 时回退）
      html += '<div class="tl-step">步骤 ' + msgIdx + '</div>';
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
    els.timelineBody.scrollTop = els.timelineBody.scrollHeight;
  }

  function _escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 步进`
);
console.log('OK');
