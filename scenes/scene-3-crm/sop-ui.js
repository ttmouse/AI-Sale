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

  // ===== 客户阶段分布（点击横条展示客户列表）=====
  function renderKanban(container, customers) {
    const total = customers.length;
    const stageOrder = STAGE_ORDER;
    const maxCount = Math.max(...stageOrder.map(s => (customers||[]).filter(c=>c.stage===s).length), 1);
    const counts = {};
    stageOrder.forEach(s => counts[s] = (customers||[]).filter(c=>c.stage===s).length);

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem">
        <span class="section-title">客户阶段分布</span>
        <span class="section-meta">${total} 个客户</span>
      </div>
      ${total === 0
        ? '<div class="empty-state"><i class="fas fa-users"></i><p>暂无客户数据</p></div>'
        : `<div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);padding:1.25rem">
            ${stageOrder.map(stage => {
              const cnt = counts[stage] || 0;
              const pct = Math.round((cnt / maxCount) * 100);
              return `<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
                <div style="width:7rem;font-size:0.8125rem;color:var(--gray-500);text-align:right;flex-shrink:0">${STAGE_LABELS[stage]||stage}</div>
                <div style="flex:1;height:1.5rem;background:var(--gray-100);border-radius:0.25rem;position:relative;overflow:hidden;cursor:pointer" onclick="SOPApp.showCustomerList('${stage}')" title="点击查看客户列表">
                  <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:${STAGE_COLORS[stage]};border-radius:0.25rem;transition:width 0.3s;opacity:0.7"></div>
                  <div style="position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;padding:0 0.5rem">
                    <span style="font-size:0.75rem;font-weight:600;color:${pct>30?'white':'var(--text-primary)'}">${cnt} 个 →</span>
                  </div>
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

  function renderCustomerList(container, customers, stage) {
    const stageLabel = STAGE_LABELS[stage] || stage;
    const list = (customers||[]).filter(c => c.stage === stage);
    container.innerHTML = `
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm" style="background:var(--gray-100);margin-bottom:0.75rem" onclick="SOPApp.backToOverview()"><i class="fas fa-arrow-left"></i> 返回概览</button>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <span class="section-title">${stageLabel}</span>
          <span class="section-meta">${list.length} 个客户</span>
        </div>
      </div>
      <div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:0.8125rem">
          <thead>
            <tr style="background:var(--gray-50);text-align:left">
              <th style="padding:0.625rem 0.75rem;font-weight:500;color:var(--gray-500)">客户名称</th>
              <th style="padding:0.625rem 0.75rem;font-weight:500;color:var(--gray-500)">公司</th>
              <th style="padding:0.625rem 0.75rem;font-weight:500;color:var(--gray-500)">行业</th>
              <th style="padding:0.625rem 0.75rem;font-weight:500;color:var(--gray-500)">预算</th>
              <th style="padding:0.625rem 0.75rem;font-weight:500;color:var(--gray-500)">最近联系</th>
            </tr>
          </thead>
          <tbody>
            ${list.length === 0
              ? '<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--gray-400)">暂无客户</td></tr>'
              : list.map(c => `<tr style="border-top:1px solid var(--gray-100)">
                  <td style="padding:0.5rem 0.75rem;font-weight:500">${esc(c.name)}</td>
                  <td style="padding:0.5rem 0.75rem;color:var(--gray-600)">${esc(c.company||'-')}</td>
                  <td style="padding:0.5rem 0.75rem;color:var(--gray-600)">${esc(c.type||'-')}</td>
                  <td style="padding:0.5rem 0.75rem;color:var(--gray-600)">${esc(c.budget||'-')}</td>
                  <td style="padding:0.5rem 0.75rem;color:var(--gray-500);font-size:0.75rem">${c.lastContact||'-'}</td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ===== 全量客户列表（带筛选）=====
  function renderCustomerTable(container, customers, filters) {
    const f = filters || {};
    const searchKw = (f.search||'').toLowerCase();
    let filtered = (customers||[]).filter(c => {
      if (f.stage && f.stage !== 'all' && c.stage !== f.stage) return false;
      if (f.status && f.status !== 'all' && c.status !== f.status) return false;
      if (f.type && f.type !== 'all' && c.typeCode !== f.type) return false;
      if (searchKw && !(c.name||'').toLowerCase().includes(searchKw) && !(c.company||'').toLowerCase().includes(searchKw)) return false;
      return true;
    });
    const TYPE_LABELS = { STARTUP:'创业小店', FAST_CASUAL:'快餐简餐', CHAIN:'连锁品牌', CANTEEN:'食堂团餐', HOTEL:'酒店餐饮', HOTPOT:'火锅串串', CAFE_BAKERY:'咖啡茶饮', FOREIGN_CUISINE:'异国料理', CATERING:'外包团餐', CENTRAL_KITCHEN:'中央厨房', CLOUD_KITCHEN:'云厨房', INDIVIDUAL:'个体经营' };
    const types = [...new Set((customers||[]).map(c=>c.typeCode).filter(Boolean))];
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
        <span class="section-title">客户列表</span>
        <span class="section-meta">${filtered.length} 个客户</span>
      </div>
      <div style="margin-bottom:0.75rem">
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:0.5rem">
          <input id="cust-search" class="sop-input" style="width:12rem;font-size:0.8125rem" placeholder="搜索名称/公司" value="${esc(f.search||'')}" onchange="SOPApp.filterCustomers()" onkeydown="if(event.key==='Enter')SOPApp.filterCustomers()">
          <select class="sop-select" style="font-size:0.8125rem" onchange="SOPApp.setFilter('status',this.value)">
            <option value="all" ${(!f.status||f.status==='all')?'selected':''}>全部状态</option>
            <option value="active" ${f.status==='active'?'selected':''}>跟进中</option>
            <option value="sleeping" ${f.status==='sleeping'?'selected':''}>沉睡</option>
            <option value="closed" ${f.status==='closed'?'selected':''}>已闭环</option>
          </select>
          <select id="cust-type" class="sop-select" style="font-size:0.8125rem" onchange="SOPApp.filterCustomers()">
            <option value="all">全部行业</option>
            ${types.map(t => `<option value="${t}" ${f.type===t?'selected':''}>${TYPE_LABELS[t]||t}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:0;flex-wrap:wrap;border-bottom:1px solid var(--gray-200)">
          <span style="font-size:0.75rem;color:var(--gray-400);padding:0.375rem 0.5rem 0.375rem 0;flex-shrink:0">阶段</span>
          <button class="btn btn-sm" style="font-size:0.75rem;padding:0.375rem 0.625rem;border:none;background:none;cursor:pointer;color:${!f.stage||f.stage==='all'?'var(--brand)':'var(--gray-500)'};border-bottom:2px solid ${!f.stage||f.stage==='all'?'var(--gray-400)':'transparent'};border-radius:0;margin-bottom:-1px" onclick="SOPApp.setFilter('stage','all')">全部</button>
          ${STAGE_ORDER.map(s => {
            const active = f.stage === s;
            const cnt = (customers||[]).filter(c => c.stage === s).length;
            return `<button class="btn btn-sm" style="font-size:0.75rem;padding:0.375rem 0.625rem;border:none;background:none;cursor:pointer;color:${active?'var(--brand)':'var(--gray-500)'};border-bottom:2px solid ${active?STAGE_COLORS[s]:'transparent'};border-radius:0;margin-bottom:-1px" onclick="SOPApp.setFilter('stage','${s}')">${STAGE_LABELS[s]||s} <span style="font-size:0.625rem;color:${active?'var(--brand)':'var(--gray-400)'};opacity:0.7">${cnt}</span></button>`;
          }).join('')}
        </div>
      </div>
      <div style="background:white;border-radius:var(--radius-lg);border:1px solid var(--gray-200);overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.8125rem">
          <thead><tr style="background:var(--gray-50);text-align:left">
            <th style="padding:0.5rem 0.75rem;font-weight:500;color:var(--gray-500)">客户</th>
            <th style="padding:0.5rem 0.75rem;font-weight:500;color:var(--gray-500)">公司</th>
            <th style="padding:0.5rem 0.75rem;font-weight:500;color:var(--gray-500)">行业</th>
            <th style="padding:0.5rem 0.75rem;font-weight:500;color:var(--gray-500)">阶段</th>
            <th style="padding:0.5rem 0.75rem;font-weight:500;color:var(--gray-500)">预算</th>
            <th style="padding:0.5rem 0.75rem;font-weight:500;color:var(--gray-500)">最近联系</th>
          </tr></thead>
          <tbody>${filtered.length===0?'<tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--gray-400)">无匹配客户</td></tr>'
            : filtered.map(c => `<tr style="border-top:1px solid var(--gray-100)">
                <td style="padding:0.5rem 0.75rem;font-weight:500">${esc(c.name)}</td>
                <td style="padding:0.5rem 0.75rem;color:var(--gray-600)">${esc(c.company||'-')}</td>
                <td style="padding:0.5rem 0.75rem;color:var(--gray-600)">${esc(c.type||c.typeCode||'-')}</td>
                <td style="padding:0.5rem 0.75rem"><span class="tag" style="font-size:0.6875rem;padding:0.125rem 0.375rem;background:var(--gray-100)">${esc(c.stage||'-')}</span></td>
                <td style="padding:0.5rem 0.75rem;color:var(--gray-600)">${esc(c.budget||'-')}</td>
                <td style="padding:0.5rem 0.75rem;color:var(--gray-500);font-size:0.75rem">${c.lastContact||'-'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // getFilters reads from DOM for search/type, uses provided filters for stage/status
  function getFilters(existing) {
    return {
      search: (document.getElementById('cust-search')||{}).value || '',
      stage: (existing && existing.stage) || 'all',
      status: (existing && existing.status) || 'all',
      type: (document.getElementById('cust-type')||{}).value || 'all',
    };
  }

  return { renderAudiences, renderTodoConfig, renderKanban, renderMonitor, renderCustomerList, renderCustomerTable, getFilters };
})();
