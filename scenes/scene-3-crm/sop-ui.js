// ============================================================
// UI 渲染 — DESIGN-ENGINEERED VERSION
// Principles: Anti-emoji, low-card, grid layout, spring physics
// ============================================================

const SopUI = (() => {
  'use strict';

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  const STAGE_LABELS = { P1:'P1 了解信息',P2:'P2 收集需求',P3:'P3 确认合作',P4:'P4 合同签署',P5:'P5 发货',P6:'P6 已回款',P7:'P7 已交付',P0:'P0 沉睡' };
  const STAGE_COLORS = { P1:'#60A5FA',P2:'#34D399',P3:'#FBBF24',P4:'#F97316',P5:'#8B5CF6',P6:'#10B981',P7:'#6366F1',P0:'#9CA3AF' };
  const STAGE_ORDER = ['P1','P2','P3','P4','P5','P6','P7','P0'];

  // ===== 人群管理 =====
  function renderAudiences(container, audiences, customers) {
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <span class="section-title">人群管理</span>
          <span class="section-meta">${audiences.length} 个人群</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="SOPApp.createAudience()"><i class="fas fa-plus"></i>新建人群</button>
      </div>
      ${audiences.length === 0
        ? '<div class="empty-state"><i class="fas fa-users"></i><p>暂无人群，请先创建</p></div>'
        : `<div class="audience-grid">${audiences.map(a => {
            const condStr = summarizeConds(a.conditions);
            const matchCount = customers ? customers.filter(c => AudienceEngine.matchCustomer(c, a.conditions)).length : '?';
            return `<div class="audience-card">
              <div class="audience-card-name">${esc(a.name)}</div>
              <div style="font-size:0.75rem;color:var(--gray-500);margin-top:0.125rem">${matchCount} 个客户匹配</div>
              ${a.description ? `<div class="audience-card-desc">${esc(a.description)}</div>` : ''}
              <div class="audience-card-cond">${esc(condStr)}</div>
              <div class="audience-card-actions">
                <button class="btn btn-sm btn-primary" onclick="SOPApp.goToSOPConfig('${a.audienceId}')"><i class="fas fa-gear"></i>SOP 配置</button>
                <button class="btn btn-sm btn-danger" onclick="SOPApp.deleteAudience('${a.audienceId}')"><i class="fas fa-trash-can"></i>删除</button>
              </div>
            </div>`;
          }).join('')}</div>`
      }`;
  }

  const FIELD_CN = { typeCode:'行业类型', stage:'阶段', budget:'预算', status:'状态', source:'来源', tags:'标签', lastContact:'最近联系' };
  const OP_CN = { EQ:'等于', NEQ:'不等于', IN:'属于', GTE:'大于等于', LTE:'小于等于', DAYS_GT:'超过', CONTAINS:'包含' };

  function summarizeConds(c) {
    if (!c||!c.rules) return '无条件';
    return c.rules.map(r => {
      if (r.field) return `${FIELD_CN[r.field]||r.field} ${OP_CN[r.op]||r.op} ${Array.isArray(r.value)?r.value.join('|'):r.value}`;
      if (r.rules) return `(${summarizeConds(r)})`;
      return '';
    }).join(` ${c.logic==='OR'?'或':'且'} `);
  }

  // ===== 阶段待办配置（看板）=====
  function renderTodoConfig(container, audienceId) {
    const allAuds = StageTodoEngine.getAudiences();
    const aud = allAuds.find(a => a.audienceId === audienceId) || allAuds[0];
    if (!aud) { container.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><p>暂无人群</p></div>'; return; }
    const curId = aud.audienceId;
    const allTodos = StageTodoEngine.getAllTodosForAudience(curId);

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <span class="section-title">${esc(aud.name)}</span>
          <span class="section-meta">阶段待办配置</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:0.75rem;color:var(--gray-400)">切换人群</span>
          <select class="sop-select" onchange="SOPApp.editTodos(this.value)">
            ${allAuds.map(a => `<option value="${a.audienceId}" ${a.audienceId===curId?'selected':''}>${esc(a.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="kanban-grid">
        ${STAGE_ORDER.map(stage => {
          const items = (allTodos[stage] || []);
          return `<div class="kanban-col">
            <div class="kanban-col-header" style="border-bottom-color:${STAGE_COLORS[stage]}">
              <span>${STAGE_LABELS[stage]||stage}</span>
              <span class="count">${items.length}</span>
            </div>
            <div class="kanban-col-body" style="flex:1;overflow-y:auto;min-height:3rem">
              ${items.length === 0
                ? '<div style="font-size:0.75rem;color:var(--gray-300);text-align:center;padding:1rem 0">—</div>'
                : items.map(item => `<div class="card-item" style="cursor:pointer" onclick="SOPApp.openEditItem('${curId}','${stage}','${item.itemId}')" title="点击编辑">
                    <div class="card-item-header">
                      <span class="card-item-label">
                        ${esc(item.name)}
                      </span>
                      <div style="display:flex;gap:0.125rem">
                        <span style="font-size:0.625rem;color:var(--gray-300)"><i class="fas fa-pen"></i></span>
                        <button class="remove-btn" onclick="event.stopPropagation();StageTodoEngine.removeTodoItem('${curId}','${stage}','${item.itemId}');SOPApp.editTodos('${curId}')">&times;</button>
                      </div>
                    </div>
                    ${item.action && item.action.contentTemplate ? `<div style="font-size:0.625rem;color:var(--gray-400);margin-top:0.25rem;padding:0.25rem;background:var(--gray-50);border-radius:0.25rem;line-height:1.4;word-break:break-all">${esc(item.action.contentTemplate.substring(0,60))}${item.action.contentTemplate.length>60?'...':''}</div>` : ''}
                    <div class="card-item-meta"><i class="fas fa-search" style="font-size:0.5625rem"></i> 检测: ${esc(item.detectKeyword||item.name)}</div>
                  </div>`).join('')}
            </div>
            <div class="kanban-col-footer" style="flex-shrink:0;padding-top:0.375rem;border-top:1px solid var(--gray-100);margin-top:0.25rem">
              <button class="btn btn-sm" style="font-size:0.6875rem;background:transparent;color:var(--gray-400);border:none;padding:0.125rem 0.25rem" onclick="SOPApp.openNewItem('${curId}','${stage}')"><i class="fas fa-plus"></i> 新增</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ===== 客户看板 =====
  function renderKanban(container, customers) {
    const grouped = {};
    STAGE_ORDER.forEach(s => grouped[s] = []);
    (customers||[]).forEach(c => { if (grouped[c.stage]) grouped[c.stage].push(c); });

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
        <span class="section-title">客户阶段分布</span>
        <span class="section-meta">${customers.length} 个客户</span>
      </div>
      ${customers.length === 0
        ? '<div class="empty-state"><i class="fas fa-users"></i><p>暂无客户数据</p></div>'
        : `<div class="kanban-grid">
            ${STAGE_ORDER.map(stage => {
              const list = grouped[stage]||[];
              return `<div class="kanban-col">
                <div class="kanban-col-header" style="border-bottom-color:${STAGE_COLORS[stage]}">
                  <span>${STAGE_LABELS[stage]||stage}</span>
                  <span class="count">${list.length} 人</span>
                </div>
                <div class="kanban-col-body" style="flex:1;overflow-y:auto;min-height:3rem">
                  ${list.length === 0
                    ? '<div style="font-size:0.75rem;color:var(--gray-300);text-align:center;padding:1.5rem 0">—</div>'
                    : list.map(c => {
                        const pending = StageTodoEngine.getPendingItems(c);
                        return `<div class="card-item">
                          <div style="font-size:0.8125rem;font-weight:500;color:var(--text-primary)">${esc(c.name)}</div>
                          <div style="font-size:0.6875rem;color:${pending.length===0?'var(--success)':'var(--warning)'};margin-top:0.125rem">
                            ${pending.length===0 ? '∑ 全部完成' : pending.length+'项待办'}
                          </div>
                        </div>`;
                      }).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>`
      }`;
  }

  // ===== 执行日志 =====
  function renderMonitor(container, logs) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
        <span class="section-title">执行日志</span>
        <span class="section-meta">${logs.length} 项</span>
      </div>
      ${logs.length === 0
        ? '<div class="empty-state"><i class="fas fa-check-circle"></i><p>无待办执行</p></div>'
        : `<div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:0.75rem 1rem">
            ${logs.map(l => `<div class="log-item">
              <span class="log-time">${l.executedAt}</span>
              <span class="log-action">${esc(l.itemName)}</span>
              <span class="log-detail">${esc(l.customerName||'')} ${esc((l.detail||'').substring(0,60))}</span>
            </div>`).join('')}
          </div>`
      }`;
  }

  return { renderAudiences, renderTodoConfig, renderKanban, renderMonitor };
})();
