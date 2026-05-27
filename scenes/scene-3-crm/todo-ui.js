// ============================================================
// UI 渲染 — 阶段待办清单看板 + 执行日志 + 配置
// ============================================================

const TodoUI = (() => {
  'use strict';

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  const STAGE_LABELS = { P1:'P1 了解信息',P2:'P2 收集需求',P3:'P3 确认合作',P4:'P4 合同签署',P5:'P5 发货',P6:'P6 已回款',P7:'P7 已交付',P0:'P0 沉睡' };
  const STAGE_COLORS = { P1:'#60A5FA',P2:'#34D399',P3:'#FBBF24',P4:'#F97316',P5:'#8B5CF6',P6:'#10B981',P7:'#6366F1',P0:'#9CA3AF' };

  // ===== 待办清单配置视图 =====
  function renderConfig(container) {
    const stageOrder = ['P1','P2','P3','P4','P5','P6','P7','P0'];
    container.innerHTML = `
      <div style="font-size:16px;font-weight:600;margin-bottom:16px">阶段待办清单配置</div>
      <div style="display:flex;flex-direction:column;gap:16px">
        ${stageOrder.map(stage => {
          const items = StageTodoEngine.getStageTodos(stage);
          const autoItems = items.filter(i => i.autoExec);
          const manualItems = items.filter(i => !i.autoExec);
          return `<div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid ${STAGE_COLORS[stage]}">
              <span style="font-weight:600;font-size:14px">${STAGE_LABELS[stage] || stage}</span>
              <span style="font-size:11px;color:var(--gray-400)">${items.length} 项（自动${autoItems.length} · 人工${manualItems.length}）</span>
            </div>
            ${items.map(item => `
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:13px">
                <span style="color:${item.autoExec ? 'var(--success)' : 'var(--warning)'}">${item.autoExec ? '🤖' : '👤'}</span>
                <span style="flex:1">${esc(item.name)}</span>
                <span style="font-size:11px;color:var(--gray-400)">自动推送</span>
              </div>
            `).join('')}
          </div>`;
        }).join('')}
      </div>`;
  }

  // ===== 执行监控 =====
  function renderMonitor(container, logs) {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.executedAt === today);

    container.innerHTML = `
      <div style="margin-bottom:16px">
        <span style="font-size:16px;font-weight:600">执行监控</span>
        <span style="font-size:12px;color:var(--gray-400);margin-left:8px">本次扫描执行 ${logs.length} 项</span>
      </div>
      <div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:16px">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">执行日志</div>
        ${todayLogs.length === 0 ? '<div style="font-size:12px;color:var(--gray-400);text-align:center;padding:20px">本次扫描无待办执行</div>' :
          todayLogs.map(l => `
            <div style="padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:12px;display:flex;gap:8px">
              <span style="color:var(--gray-400);width:70px;flex-shrink:0">${l.executedAt}</span>
              <span style="font-weight:500;width:100px;flex-shrink:0">${esc(l.itemName || l.action)}</span>
              <span style="color:var(--gray-600);flex:1">${esc(l.customerName || '')} ${esc((l.detail||'').substring(0,50))}</span>
            </div>
          `).join('')}
      </div>`;
  }

  // ===== 看板概览 =====
  function renderOverview(container, customers) {
    const stageOrder = ['P1','P2','P3','P4','P5','P6','P7','P0'];
    const grouped = {};
    stageOrder.forEach(s => grouped[s] = []);
    (customers || []).forEach(c => {
      if (grouped[c.stage]) grouped[c.stage].push(c);
    });

    container.innerHTML = `
      <div style="font-size:16px;font-weight:600;margin-bottom:16px">客户阶段分布 · ${customers.length} 个客户</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${stageOrder.map(stage => {
          const list = grouped[stage] || [];
          return `<div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:12px;min-height:100px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid ${STAGE_COLORS[stage]}">
              <span style="font-weight:600;font-size:12px">${STAGE_LABELS[stage] || stage}</span>
              <span style="font-size:10px;color:var(--gray-400)">${list.length} 人</span>
            </div>
            ${list.map(c => {
              const pending = StageTodoEngine.getPendingItems(c);
              return `<div style="padding:4px 0;font-size:11px;border-bottom:1px solid var(--gray-50)">
                <span>${esc(c.name)}</span>
                <span style="float:right;color:${pending.length === 0 ? 'var(--success)' : 'var(--warning)'}">${pending.length === 0 ? '✅' : pending.length + '待办'}</span>
              </div>`;
            }).join('')}
            ${list.length === 0 ? '<div style="font-size:11px;color:var(--gray-300);text-align:center;padding:12px 0">—</div>' : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  return { renderConfig, renderMonitor, renderOverview, STAGE_LABELS, STAGE_COLORS };
})();
