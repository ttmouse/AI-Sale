// ============================================================
// CRM 主应用 — 状态管理 + 事件绑定 + 初始化
// ============================================================

const CRMApp = (() => {
  'use strict';

  // ---- 状态 ----
  const state = {
    customers: [],
    filteredCustomers: [],
    activeView: 'card',      // card | funnel | kanban
    activeCustomerId: null,
    filters: {
      stage: 'all',
      status: 'all',
      search: '',
      budget: 'all'
    },
    sopInstances: {},        // customerId → SOPInstance
    tasks: {
      due: [],
      overdue: [],
      upcoming: []
    }
  };

  // ---- 初始化 ----
  async function init() {
    try {
      // 1. 加载客户数据
      const data = await loadCustomers();
      state.customers = data;

      // 2. 构建 SOP 实例 + 计算健康度
      state.customers.forEach(c => {
        const template = SOPEngine.matchTemplate(c);
        if (template) {
          state.sopInstances[c.customerId] = SOPEngine.buildInstance(c, template);
        }
        c.healthScore = AIHelper.computeHealthScore(c);
      });

      // 3. 初始化过滤
      applyFilters();

      // 4. 刷新待办
      refreshTasks();

      // 5. 渲染
      renderAll();

      // 6. 绑定事件
      bindEvents();

    } catch (e) {
      console.error('CRM 初始化失败:', e);
      document.getElementById('crm-grid').innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--danger)"><i class="fas fa-exclamation-triangle" style="font-size:24px;margin-bottom:8px"></i><br>数据加载失败，请刷新重试</div>';
    }
  }

  async function loadCustomers() {
    const resp = await fetch('../../data/customers.json');
    const json = await resp.json();
    // 添加 size 字段（从 customers.json 的字段推导）
    return (json.customers || []).map(c => ({
      ...c,
      // 从 type 或 history 推断 size 显示
      size: c.storeCount ? (c.storeCount >= 10 ? '连锁' : c.storeCount >= 3 ? '中型连锁' : '单店') : '—',
      // 确保 tags 是数组
      tags: c.tags || [],
      history: c.history || []
    }));
  }

  // ---- 筛选 ----
  function applyFilters() {
    state.filteredCustomers = SOPEngine.filterCustomers(state.customers, state.filters);
    document.getElementById('customer-count').textContent = state.filteredCustomers.length;
  }

  // ---- 待办刷新 ----
  function refreshTasks() {
    const due = [];
    const overdue = [];
    const upcoming = [];

    state.customers.forEach(c => {
      const inst = state.sopInstances[c.customerId];
      if (!inst) return;
      const items = SOPEngine.checkDueItems(inst);
      items.due.forEach(s => due.push({ ...s, customerId: c.customerId, customerName: c.name }));
      items.overdue.forEach(s => overdue.push({ ...s, customerId: c.customerId, customerName: c.name }));
      items.upcoming.forEach(s => upcoming.push({ ...s, customerId: c.customerId, customerName: c.name }));
    });

    state.tasks = { due, overdue, upcoming };
  }

  // ---- 渲染 ----
  function renderAll() {
    const grid = document.getElementById('crm-grid');
    const kpiContainer = document.getElementById('kpi-cards');
    const taskContainer = document.getElementById('task-list');
    const viewBtns = document.querySelectorAll('.view-btn');

    // 更新视图按钮状态
    viewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === state.activeView);
    });

    // 渲染 KPI
    if (kpiContainer) {
      CRMRenderer.renderKPICards(kpiContainer, state.filteredCustomers);
    }

    // 隐藏所有视图
    grid.querySelectorAll('.view-wrapper').forEach(el => el.style.display = 'none');

    // 显示当前视图
    let viewWrapper = grid.querySelector(`.view-wrapper-${state.activeView}`);
    if (!viewWrapper) {
      viewWrapper = document.createElement('div');
      viewWrapper.className = `view-wrapper view-wrapper-${state.activeView}`;
      grid.appendChild(viewWrapper);
    }
    viewWrapper.style.display = 'block';

    switch (state.activeView) {
      case 'card':
        CRMRenderer.renderCards(viewWrapper, state.filteredCustomers, state.sopInstances, {
          onCardClick: openDetail,
          onCompleteStep: completeStep
        });
        break;
      case 'funnel':
        const funnel = SOPEngine.computeFunnel(state.filteredCustomers);
        CRMRenderer.renderFunnel(viewWrapper, funnel);
        break;
      case 'kanban':
        CRMRenderer.renderKanban(viewWrapper, state.filteredCustomers, state.sopInstances);
        break;
    }

    // 渲染待办
    if (taskContainer) {
      CRMRenderer.renderTaskList(taskContainer, state.tasks);
    }

    // 更新待办徽标
    const totalPending = state.tasks.overdue.length + state.tasks.due.length;
    const badge = document.getElementById('task-badge');
    if (badge) {
      badge.textContent = totalPending;
      badge.style.display = totalPending > 0 ? 'inline' : 'none';
    }
  }

  // ---- 视图切换 ----
  function switchView(view) {
    state.activeView = view;
    renderAll();
  }

  // ---- 筛选更新 ----
  function updateFilter(key, value) {
    state.filters[key] = value;
    // 高亮筛选按钮
    document.querySelectorAll(`.filter-btn[data-filter="${key}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
    applyFilters();
    renderAll();
  }

  // ---- 详情抽屉 ----
  function openDetail(customerId) {
    state.activeCustomerId = customerId;
    const customer = state.customers.find(c => c.customerId === customerId);
    if (!customer) return;

    const inst = state.sopInstances[customerId];
    const drawerHtml = CRMRenderer.renderDetailDrawer(customer, inst);
    const container = document.getElementById('detail-drawer');
    container.innerHTML = drawerHtml;
    container.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    state.activeCustomerId = null;
    const container = document.getElementById('detail-drawer');
    container.innerHTML = '';
    container.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ---- 完成 SOP 步骤 ----
  function completeStep(customerId, stepId) {
    const inst = state.sopInstances[customerId];
    if (!inst) return;

    const step = inst.steps.find(s => s.stepId === stepId);
    if (!step || step.status === 'done') return;

    step.status = 'done';
    step.completedAt = new Date().toISOString().split('T')[0];
    step.completedBy = 'sales';

    // 更新客户最后联系时间
    const customer = state.customers.find(c => c.customerId === customerId);
    if (customer) {
      customer.lastContact = step.completedAt;
      customer.healthScore = AIHelper.computeHealthScore(customer);
    }

    refreshTasks();
    renderAll();

    // Toast 反馈
    if (state.activeCustomerId === customerId) {
      // 如果详情开着，刷新它
      openDetail(customerId);
    }

    CRMRenderer.showToast(`✓ 已完成「${step.name}」`, 'success');
  }

  // ---- 复制文案 ----
  function copyMessage(el) {
    const msg = el.dataset.msg;
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      CRMRenderer.showToast('✂️ 文案已复制到剪贴板', 'info');
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      CRMRenderer.showToast('✂️ 文案已复制', 'info');
    });
  }

  // ---- 事件绑定 ----
  function bindEvents() {
    // 视图切换
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => updateFilter(btn.dataset.filter, btn.dataset.value));
    });

    // 搜索框（防抖）
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        updateFilter('search', searchInput.value);
      }, 300));
    }

    // 漏斗筛选事件
    document.addEventListener('crm-stage-filter', (e) => {
      updateFilter('stage', e.detail.stage);
      switchView('card');
    });

    // 详情打开事件（看板视图）
    document.addEventListener('crm-open-detail', (e) => {
      openDetail(e.detail.customerId);
    });

    // ESC 关闭抽屉
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDetail();
    });

    // 窗口点击关闭抽屉（点击遮罩）
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('drawer-overlay')) closeDetail();
    });
  }

  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  // ---- 对外暴露供 HTML onclick 调用 ----
  window.CRMApp = {
    init,
    openDetail,
    closeDetail,
    completeStep,
    copyMessage,
    switchView,
    updateFilter
  };

  return window.CRMApp;
})();
