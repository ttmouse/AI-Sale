// ============================================================
// CRM 渲染器 — 卡片/漏斗/看板/抽屉视图
// ============================================================

const CRMRenderer = (() => {
  'use strict';

  const STAGE_COLORS = {
    P1: 'status-gray', P2: 'status-blue', P3: 'status-yellow',
    P4: 'status-orange', P5: 'status-purple', P6: 'status-green',
    P7: 'status-green', LOST: 'status-red'
  };

  // ---- 工具 ----
  function daysBetween(a, b) {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  function relativeTime(dateStr) {
    if (!dateStr) return '未知';
    const days = daysBetween(dateStr, new Date().toISOString().split('T')[0]);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return days + '天前';
    if (days < 30) return Math.floor(days / 7) + '周前';
    return Math.floor(days / 30) + '个月前';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ============================================================
  // 卡片视图
  // ============================================================
  function renderCards(container, customers, sopInstances, options) {
    const onCardClick = (options && options.onCardClick) || (() => {});
    const onCompleteStep = (options && options.onCompleteStep) || (() => {});

    container.innerHTML = customers.map(c => {
      const inst = sopInstances[c.customerId];
      const sopSteps = inst ? inst.steps : [];
      const doneSteps = sopSteps.filter(s => s.status === 'done').length;
      const totalSteps = sopSteps.length;
      const alert = SOPEngine.checkStageAlert(c);
      const autoTags = SOPEngine.computeAutoTags(c);
      const allTags = [...new Set([...(c.tags || []), ...autoTags])];
      const hasEnterprise = c.company && c.company !== '';

      return `<div class="customer-card" data-cid="${escapeHtml(c.customerId)}">
        <div class="customer-header" onclick="CRMApp.openDetail('${escapeHtml(c.customerId)}')">
          <div>
            <div class="customer-name">${escapeHtml(c.name)}${c.company ? ' · ' + escapeHtml(c.company) : ''}</div>
            <div class="customer-company">${escapeHtml(c.type)} | ${escapeHtml(c.size || '')} | 预算 ${escapeHtml(c.budget || '未明确')}</div>
          </div>
          <span class="status-badge ${STAGE_COLORS[c.stage] || 'status-gray'}">${escapeHtml(c.stageLabel || c.stage)}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          ${allTags.map(t => `<span class="tag" style="font-size:11px;padding:2px 8px">${escapeHtml(t)}</span>`).join('')}
          ${!hasEnterprise ? '<span class="tag" style="font-size:11px;padding:2px 8px;background:#FEF2F2;color:#991B1B;border-color:#FECACA">⚠ 企业未关联</span>' : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px">
          <span style="color:var(--gray-500)"><i class="fas fa-clock"></i> ${relativeTime(c.lastContact)}</span>
          ${c.nextAction ? `<span style="color:var(--warning)"><i class="fas fa-bell"></i> ${escapeHtml(c.nextActionLabel)}</span>` : ''}
          ${c.healthScore ? `<span class="health-badge health-${c.healthScore >= 70 ? 'high' : c.healthScore >= 40 ? 'mid' : 'low'}">${c.healthScore}</span>` : ''}
          ${alert.level !== 'none' ? `<span class="alert-${alert.level}"><i class="fas fa-exclamation-triangle"></i></span>` : ''}
        </div>
        ${totalSteps > 0 ? `<div class="sop-timeline">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:11px;color:var(--gray-500);font-weight:500">SOP 进度</span>
            <span style="font-size:11px;color:var(--gray-400)">${doneSteps}/${totalSteps}</span>
          </div>
          ${sopSteps.map(s => {
            const isOverdue = s.status === 'pending' && s.dueAt && daysBetween(s.dueAt, new Date().toISOString().split('T')[0]) < 0;
            const dotClass = s.status === 'done' ? 'sop-done' : isOverdue ? 'sop-overdue' : 'sop-pending';
            return `<div class="sop-item">
              <div class="sop-dot ${dotClass}"></div>
              <span style="font-size:11px;color:${s.status === 'done' ? 'var(--gray-400)' : 'var(--gray-700)'};${s.status === 'done' ? 'text-decoration:line-through' : ''}">
                ${escapeHtml(s.name)}
                ${isOverdue ? '<span style="color:var(--danger);margin-left:4px">⚠ 逾期</span>' : ''}
                ${s.status === 'pending' && s.dueAt && !isOverdue ? `<span style="color:var(--gray-400);margin-left:4px">${relativeTime(s.dueAt)}</span>` : ''}
                ${s.status === 'done' ? '<span style="color:var(--success);margin-left:4px">✓</span>' : ''}
                ${s.status === 'pending' && s.dueAt ? `<button class="sop-complete-btn" data-cid="${escapeHtml(c.customerId)}" data-step="${s.stepId}" title="完成本步骤">✓</button>` : ''}
              </span>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>`;
    }).join('');

    // 绑定"完成步骤"按钮
    container.querySelectorAll('.sop-complete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onCompleteStep(btn.dataset.cid, parseInt(btn.dataset.step));
      });
    });

    // 绑定卡片点击
    container.querySelectorAll('.customer-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.sop-complete-btn')) return;
        onCardClick(card.dataset.cid);
      });
    });
  }

  // ============================================================
  // 漏斗视图
  // ============================================================
  function renderFunnel(container, funnelData) {
    const maxCount = Math.max(...funnelData.stages.filter(s => s.stage !== 'LOST').map(s => s.count), 1);

    container.innerHTML = `
      <div style="background:white;border-radius:var(--radius-lg);padding:24px;border:1px solid var(--gray-200)">
        <div style="font-size:14px;font-weight:600;margin-bottom:20px">📊 销售漏斗 · 共 ${funnelData.total} 个客户</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${funnelData.stages.filter(s => s.stage !== 'LOST').map(s => {
            const pct = Math.round((s.count / maxCount) * 100);
            const conv = funnelData.conversions.find(c => c.from === s.stage);
            return `
              <div style="display:flex;align-items:center;gap:12px" data-stage="${s.stage}">
                <div style="width:60px;font-size:12px;color:var(--gray-500);text-align:right">
                  <span class="status-badge ${s.color}" style="font-size:10px">${s.label}</span>
                </div>
                <div style="flex:1;height:28px;background:var(--gray-100);border-radius:var(--radius-sm);position:relative;overflow:hidden">
                  <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:var(--brand);opacity:0.7;border-radius:var(--radius-sm);transition:width 0.5s"></div>
                  <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;display:flex;align-items:center;padding:0 8px">
                    <span style="font-size:12px;font-weight:600;color:${pct > 30 ? 'white' : 'var(--text-primary)'}">${s.count} 个客户</span>
                  </div>
                </div>
                ${conv ? `<div style="width:50px;font-size:11px;color:var(--gray-500);text-align:center">
                  <span style="font-weight:600;color:${conv.rate >= 60 ? 'var(--success)' : conv.rate >= 30 ? 'var(--warning)' : 'var(--danger)'}">${conv.rate}%</span>
                  <div style="font-size:10px">转化率</div>
                </div>` : '<div style="width:50px"></div>'}
              </div>`;
          }).join('')}
        </div>
      </div>
      <div style="margin-top:12px;font-size:12px;color:var(--gray-400);text-align:center">点击阶段筛选对应客户</div>
    `;

    // 点击筛选项
    container.querySelectorAll('[data-stage]').forEach(el => {
      el.addEventListener('click', () => {
        const stage = el.dataset.stage;
        const event = new CustomEvent('crm-stage-filter', { detail: { stage } });
        document.dispatchEvent(event);
      });
    });
  }

  // ============================================================
  // 看板视图（简化版：按阶段分组卡片）
  // ============================================================
  function renderKanban(container, customers, sopInstances) {
    const stageOrder = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];
    const grouped = {};
    stageOrder.forEach(s => grouped[s] = []);
    customers.forEach(c => {
      if (grouped[c.stage]) grouped[c.stage].push(c);
    });

    container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
      ${stageOrder.map(stage => {
        const list = grouped[stage] || [];
        const stageInfo = SOPEngine.STAGES[stage] || {};
        return `<div style="background:var(--gray-100);border-radius:var(--radius-lg);padding:12px;min-height:200px">
          <div style="font-size:12px;font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between">
            <span>${stageInfo.label || stage}</span>
            <span class="status-badge ${STAGE_COLORS[stage]}">${list.length}</span>
          </div>
          ${list.map(c => {
            const inst = sopInstances[c.customerId];
            const doneSteps = inst ? inst.steps.filter(s => s.status === 'done').length : 0;
            const totalSteps = inst ? inst.steps.length : 0;
            return `<div class="kanban-card" style="background:white;border-radius:var(--radius-md);padding:10px;margin-bottom:8px;border:1px solid var(--gray-200);cursor:pointer" data-cid="${escapeHtml(c.customerId)}">
              <div style="font-size:13px;font-weight:500">${escapeHtml(c.name)}</div>
              <div style="font-size:11px;color:var(--gray-500)">${escapeHtml(c.type)}${c.budget ? ' | ' + escapeHtml(c.budget) : ''}</div>
              ${totalSteps > 0 ? `<div style="font-size:10px;color:var(--gray-400);margin-top:4px">SOP: ${doneSteps}/${totalSteps}</div>` : ''}
            </div>`;
          }).join('')}
          ${list.length === 0 ? '<div style="font-size:11px;color:var(--gray-400);text-align:center;padding:20px 0">暂无客户</div>' : ''}
        </div>`;
      }).join('')}
    </div>`;

    // 看板卡片点击
    container.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('click', () => {
        const event = new CustomEvent('crm-open-detail', { detail: { customerId: card.dataset.cid } });
        document.dispatchEvent(event);
      });
    });
  }

  // ============================================================
  // 客户详情抽屉
  // ============================================================
  function renderDetailDrawer(customer, sopInstance, suggestions) {
    const autoTags = SOPEngine.computeAutoTags(customer);
    const allTags = [...new Set([...(customer.tags || []), ...autoTags])];
    const healthScore = customer.healthScore || AIHelper.computeHealthScore(customer);
    const msg = AIHelper.generateMessage(customer, sopInstance ? sopInstance.steps.find(s => s.status === 'pending') : null);
    const nextAction = AIHelper.suggestNextAction(customer);
    const sleepCheck = AIHelper.checkSleepWakeup(customer);

    return `
      <div class="drawer-overlay" onclick="CRMApp.closeDetail()"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <div>
            <div class="drawer-title">${escapeHtml(customer.name)}</div>
            <div class="drawer-subtitle">${escapeHtml(customer.company || '未关联企业')} · ${escapeHtml(customer.type)}</div>
          </div>
          <button class="drawer-close" onclick="CRMApp.closeDetail()">&times;</button>
        </div>

        <div class="drawer-body">
          <!-- 基本信息 -->
          <div class="detail-section">
            <div class="detail-section-title">📋 基本信息</div>
            <div class="detail-grid">
              <div class="detail-item"><span>阶段</span><span class="status-badge ${STAGE_COLORS[customer.stage]}">${escapeHtml(customer.stageLabel || customer.stage)}</span></div>
              <div class="detail-item"><span>健康度</span><span class="health-badge health-${healthScore >= 70 ? 'high' : healthScore >= 40 ? 'mid' : 'low'}">${healthScore}</span></div>
              <div class="detail-item"><span>预算</span><span>${escapeHtml(customer.budget || '未明确')}</span></div>
              <div class="detail-item"><span>规模</span><span>${escapeHtml(customer.size || '—')}${customer.storeCount ? ' · ' + customer.storeCount + '家门店' : ''}</span></div>
              <div class="detail-item"><span>来源</span><span>${escapeHtml(customer.source || '未知')}</span></div>
              <div class="detail-item"><span>最后联系</span><span>${relativeTime(customer.lastContact)} (${customer.lastContact})</span></div>
              <div class="detail-item"><span>决策人</span><span>${escapeHtml(customer.decisionMakerLabel || '未知')}</span></div>
              <div class="detail-item"><span>所在城市</span><span>${escapeHtml(customer.city || '—')}</span></div>
            </div>
          </div>

          <!-- 标签 -->
          <div class="detail-section">
            <div class="detail-section-title">🏷️ 标签</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${allTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>

          <!-- AI 推荐 -->
          <div class="detail-section" style="background:var(--brand-muted);border:1px solid var(--brand-border);border-radius:var(--radius-md);padding:12px">
            <div class="detail-section-title" style="color:var(--brand)">🤖 AI 建议</div>
            <div style="font-size:13px;margin-bottom:8px">
              <strong>最佳下一步：</strong>${escapeHtml(nextAction.action)}
            </div>
            <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px">${escapeHtml(nextAction.reason)}</div>
            ${sleepCheck.needed ? `<div style="font-size:12px;color:var(--danger);background:#FEF2F2;padding:8px;border-radius:var(--radius-sm);margin-bottom:8px">
              <i class="fas fa-bell"></i> ${escapeHtml(sleepCheck.message)}
            </div>` : ''}
          </div>

          <!-- 预制文案 -->
          <div class="detail-section">
            <div class="detail-section-title">💬 跟进文案</div>
            <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px">点击文案复制到剪贴板</div>
            ${['versionA', 'versionB', 'versionC'].map((v, i) => `
              <div class="message-card" data-msg="${escapeHtml(msg[v])}" onclick="CRMApp.copyMessage(this)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span class="tag" style="background:var(--brand-muted);color:var(--brand);border-color:var(--brand-border)">${['标准版', '案例驱动版', '紧迫感版'][i]}</span>
                  <span style="font-size:11px;color:var(--gray-400)">点击复制</span>
                </div>
                <div style="font-size:12px;line-height:1.5">${escapeHtml(msg[v])}</div>
              </div>
            `).join('')}
          </div>

          <!-- SOP 时间线 -->
          ${sopInstance && sopInstance.steps.length ? `<div class="detail-section">
            <div class="detail-section-title">📅 SOP 跟进时间线</div>
            <div class="sop-timeline-full">
              ${sopInstance.steps.map(s => {
                const isOverdue = s.status === 'pending' && s.dueAt && daysBetween(s.dueAt, new Date().toISOString().split('T')[0]) < 0;
                const dotClass = s.status === 'done' ? 'sop-done' : isOverdue ? 'sop-overdue' : 'sop-pending';
                return `<div class="sop-item">
                  <div class="sop-dot ${dotClass}"></div>
                  <div>
                    <div style="font-size:13px;font-weight:${s.status === 'pending' ? '500' : '400'};color:${s.status === 'done' ? 'var(--gray-400)' : 'var(--gray-700)'}">
                      ${escapeHtml(s.name)}
                      ${s.status === 'done' ? '<span style="color:var(--success);margin-left:4px">✓ 已完成</span>' : ''}
                      ${isOverdue ? '<span style="color:var(--danger);margin-left:4px">⚠ 已逾期</span>' : ''}
                    </div>
                    ${s.dueAt ? `<div style="font-size:11px;color:var(--gray-400)">${s.status === 'done' ? '完成于' : '截止'} ${s.dueAt}${s.status === 'pending' ? ' (' + relativeTime(s.dueAt) + ')' : ''}</div>` : ''}
                    ${s.status === 'pending' && s.dueAt ? `<button class="btn btn-sm btn-primary" onclick="CRMApp.completeStep('${escapeHtml(customer.customerId)}', ${s.stepId})" style="margin-top:4px;font-size:11px">标记完成</button>` : ''}
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>` : ''}

          <!-- 互动历史 -->
          <div class="detail-section">
            <div class="detail-section-title">📜 互动历史 (${customer.history ? customer.history.length : 0})</div>
            ${customer.history && customer.history.length ? customer.history.map(h => `
              <div class="history-item">
                <div style="font-size:12px;font-weight:500">${escapeHtml(h.action)}</div>
                <div style="font-size:11px;color:var(--gray-500)">${escapeHtml(h.date)} · ${escapeHtml(h.detail)}</div>
              </div>
            `).join('') : '<div style="font-size:12px;color:var(--gray-400);padding:8px 0">暂无互动记录</div>'}
          </div>

          <!-- 订单信息 -->
          ${customer.order ? `<div class="detail-section">
            <div class="detail-section-title">📦 订单信息</div>
            <div class="detail-grid">
              <div class="detail-item"><span>订单号</span><span>${escapeHtml(customer.order.id)}</span></div>
              <div class="detail-item"><span>产品</span><span>${escapeHtml(customer.order.product)}</span></div>
              <div class="detail-item"><span>金额</span><span>¥${(customer.order.amount / 10000).toFixed(2)}万</span></div>
              <div class="detail-item"><span>状态</span><span class="status-badge ${customer.order.status === '已交付' ? 'status-green' : 'status-yellow'}">${escapeHtml(customer.order.status)}</span></div>
            </div>
          </div>` : ''}
        </div>
      </div>`;
  }

  // ============================================================
  // 顶部 KPI
  // ============================================================
  function renderKPICards(container, customers) {
    const total = customers.length;
    const today = new Date().toISOString().split('T')[0];
    const active = customers.filter(c => c.status === 'active').length;
    const sleeping = customers.filter(c => c.status === 'sleeping').length;
    const closed = customers.filter(c => c.status === 'closed').length;
    // 本月新增 (简单按5月)
    const thisMonth = customers.filter(c => {
      const d = c.lastContact;
      return d && d.startsWith('2026-05');
    }).length;

    container.innerHTML = `
      <div class="kpi-card"><div class="kpi-value">${total}</div><div class="kpi-label">客户总数</div></div>
      <div class="kpi-card"><div class="kpi-value" style="color:var(--brand)">${active}</div><div class="kpi-label">跟进中</div></div>
      <div class="kpi-card"><div class="kpi-value" style="color:var(--warning)">${sleeping}</div><div class="kpi-label">沉睡客户</div></div>
      <div class="kpi-card"><div class="kpi-value" style="color:var(--success)">${closed}</div><div class="kpi-label">已闭环</div></div>
      <div class="kpi-card"><div class="kpi-value" style="color:var(--primary)">${thisMonth}</div><div class="kpi-label">本月新增</div></div>
    `;
  }

  // ============================================================
  // 待办列表
  // ============================================================
  function renderTaskList(container, tasks) {
    if (!tasks.overdue.length && !tasks.due.length && !tasks.upcoming.length) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:13px">✅ 暂无待办任务</div>';
      return;
    }

    let html = '';
    if (tasks.overdue.length) {
      html += `<div style="margin-bottom:8px">
        <div style="font-size:12px;font-weight:600;color:var(--danger);margin-bottom:6px"><i class="fas fa-exclamation-circle"></i> 逾期 (${tasks.overdue.length})</div>
        ${tasks.overdue.map(t => `
          <div class="task-item task-overdue">
            <div style="font-size:12px;font-weight:500">${escapeHtml(t.customerName)}</div>
            <div style="font-size:11px;color:var(--gray-500)">${escapeHtml(t.stepName)} · 原定 ${t.dueAt}</div>
          </div>
        `).join('')}
      </div>`;
    }
    if (tasks.due.length) {
      html += `<div style="margin-bottom:8px">
        <div style="font-size:12px;font-weight:600;color:var(--warning);margin-bottom:6px"><i class="fas fa-bell"></i> 今日待办 (${tasks.due.length})</div>
        ${tasks.due.map(t => `
          <div class="task-item">
            <div style="font-size:12px;font-weight:500">${escapeHtml(t.customerName)}</div>
            <div style="font-size:11px;color:var(--gray-500)">${escapeHtml(t.stepName)}</div>
            <button class="btn btn-sm btn-primary" onclick="CRMApp.completeStep('${escapeHtml(t.customerId)}', ${t.stepId})" style="margin-top:4px;font-size:10px">完成</button>
          </div>
        `).join('')}
      </div>`;
    }
    if (tasks.upcoming.length) {
      html += `<div>
        <div style="font-size:12px;font-weight:600;color:var(--gray-500);margin-bottom:6px">即将到期 (${tasks.upcoming.length})</div>
        ${tasks.upcoming.map(t => `
          <div class="task-item" style="opacity:0.7">
            <div style="font-size:12px">${escapeHtml(t.customerName)} · ${escapeHtml(t.stepName)}</div>
          </div>
        `).join('')}
      </div>`;
    }
    container.innerHTML = html;
  }

  // ============================================================
  // Toast
  // ============================================================
  function showToast(message, type) {
    const existing = document.querySelector('.crm-toast');
    if (existing) existing.remove();

    const colors = {
      success: { bg: '#10B981', icon: 'fa-check-circle' },
      info: { bg: '#3B82F6', icon: 'fa-info-circle' },
      warning: { bg: '#F59E0B', icon: 'fa-exclamation-triangle' },
      error: { bg: '#EF4444', icon: 'fa-times-circle' }
    };
    const cfg = colors[type] || colors.info;

    const div = document.createElement('div');
    div.className = 'crm-toast';
    div.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:${cfg.bg}; color:white; padding:10px 20px;
      border-radius:var(--radius-md); font-size:13px;
      z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.15);
      display:flex; align-items:center; gap:8px;
      animation: fadeInUp 0.3s ease;
    `;
    div.innerHTML = `<i class="fas ${cfg.icon}"></i> ${escapeHtml(message)}`;
    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.3s';
      setTimeout(() => div.remove(), 300);
    }, 2500);
  }

  // ==== 公开接口 ====
  return {
    renderCards,
    renderFunnel,
    renderKanban,
    renderDetailDrawer,
    renderKPICards,
    renderTaskList,
    showToast,
    relativeTime
  };
})();
