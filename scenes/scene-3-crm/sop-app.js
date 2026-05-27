const SOPApp = (() => {
  'use strict';
  const state = { customers: [], activeTab: 'kanban', _modalContext: null };

  async function init() {
    try {
      const r = await fetch('../../data/customers.json');
      const j = await r.json();
      state.customers = (j.customers||[]).map(c => ({...c, messages:c.messages||[], activeEscalations:c.activeEscalations||[], tags:c.tags||[], history:c.history||[]}));
      StageTodoEngine.init();
      renderAll();
    } catch(e) { console.error(e); }
  }

  function renderAll() {
    const c = document.getElementById('main-content');
    document.querySelectorAll('.sop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.activeTab));
    switch (state.activeTab) {
      case 'kanban': SopUI.renderKanban(c, state.customers); break;
      case 'audiences': SopUI.renderAudiences(c, StageTodoEngine.getAudiences(), state.customers); break;
      case 'sop':
        const all = StageTodoEngine.getAudiences();
        SopUI.renderTodoConfig(c, state._sopAudienceId || (all.length?all[0].audienceId:null));
        break;
      case 'customers':
        SopUI.renderCustomerTable(c, state.customers, state._customerFilter || {});
        break;
      case 'monitor':
        const r = StageTodoEngine.scanAll(state.customers);
        SopUI.renderMonitor(c, r.logs);
        break;
    }
  }

  function switchTab(tab) { state.activeTab = tab; state._listStage = null; renderAll(); }

  function showCustomerList(stage) {
    state._customerFilter = { stage };
    state.activeTab = 'customers';
    SopUI.renderCustomerTable(document.getElementById('main-content'), state.customers, state._customerFilter);
    document.querySelectorAll('.sop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'customers'));
  }

  function filterCustomers() {
    state._customerFilter = SopUI.getFilters(state._customerFilter);
    SopUI.renderCustomerTable(document.getElementById('main-content'), state.customers, state._customerFilter);
  }

  function setFilter(key, val) {
    if (!state._customerFilter) state._customerFilter = {};
    state._customerFilter[key] = val;
    SopUI.renderCustomerTable(document.getElementById('main-content'), state.customers, state._customerFilter);
  }

  function backToOverview() { switchTab('kanban'); }

  function editTodos(audienceId) { SopUI.renderTodoConfig(document.getElementById('main-content'), audienceId); }

  function goToSOPConfig(id) { state._sopAudienceId = id; state.activeTab = 'sop'; editTodos(id); document.querySelectorAll('.sop-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='sop')); }

  function deleteAudience(id) { if(confirm('确定删除？')){ StageTodoEngine.deleteAudience(id); renderAll(); } }
  function createAudience() { const n = prompt('输入人群名称：'); if(!n)return; StageTodoEngine.createAudience({name:n,conditions:{logic:'AND',rules:[{field:'typeCode',op:'EQ',value:'CHAIN'}]}}); renderAll(); }

  // ---- 浮窗 ----
  function openNewItem(audienceId, stage) {
    state._modalContext = { audienceId, stage, editId: null };
    document.getElementById('modal-title').textContent = '新增待办';
    document.getElementById('modal-save-btn').textContent = '确定添加';
    document.getElementById('modal-name').value = '';
    document.getElementById('modal-kw').value = '';
    document.getElementById('modal-msg').value = '';
    const m = document.getElementById('todo-modal');
    m.style.cssText = 'display:flex;position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.25);align-items:center;justify-content:center';
  }

  function openEditItem(audienceId, stage, itemId) {
    state._modalContext = { audienceId, stage, editId: itemId };
    const items = StageTodoEngine.getAudienceTodos(audienceId, stage);
    const item = items.find(i => i.itemId === itemId);
    if (!item) return;
    document.getElementById('modal-title').textContent = '编辑待办';
    document.getElementById('modal-save-btn').textContent = '保存修改';
    document.getElementById('modal-name').value = item.name || '';
    document.getElementById('modal-kw').value = item.detectKeyword || '';
    document.getElementById('modal-msg').value = (item.action && item.action.contentTemplate) || '';
    const m = document.getElementById('todo-modal');
    m.style.cssText = 'display:flex;position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.25);align-items:center;justify-content:center';
  }

  function closeModal() { document.getElementById('todo-modal').style.display = 'none'; state._modalContext = null; }

  function saveModal() {
    const ctx = state._modalContext;
    if (!ctx) return;
    const name = document.getElementById('modal-name').value;
    if (!name) return;
    const kw = document.getElementById('modal-kw').value.trim();
    const msg = document.getElementById('modal-msg').value.trim();
    const dk = kw || name;
    const ct = msg || '请联系{customerName}。';
    if (ctx.editId) {
      StageTodoEngine.updateTodoItem(ctx.audienceId, ctx.stage, ctx.editId, { name, detectKeyword: dk, action: { type:'send_message', channel:'wecom', contentTemplate: ct } });
    } else {
      StageTodoEngine.addTodoItem(ctx.audienceId, ctx.stage, { name, completionKey:'i-'+Date.now(), detectFrom:'message', detectKeyword: dk, action: { type:'send_message', channel:'wecom', contentTemplate: ct } });
    }
    closeModal();
    SOPApp.editTodos(ctx.audienceId);
  }

  window.SOPApp = { init, switchTab, editTodos, openNewItem, openEditItem, closeModal, saveModal, deleteAudience, createAudience, goToSOPConfig, showCustomerList, filterCustomers, setFilter, backToOverview };
  return window.SOPApp;
})();
