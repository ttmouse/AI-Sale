// ============================================================
// 人群引擎 — 条件匹配 + AND/OR 组合
// ============================================================

const AudienceEngine = (() => {
  'use strict';

  function parseBudget(val) {
    if (!val) return 0;
    const s = String(val).replace('¥','').replace('+','').trim();
    if (/^\d+$/.test(s)) return parseFloat(s);
    const m = s.match(/(\d+(?:\.\d+)?)\s*[~-]\s*(\d+(?:\.\d+)?)/);
    if (m) return parseFloat(m[1]) * 10000;
    const g = s.match(/>(\d+(?:\.\d+)?)/);
    if (g) return parseFloat(g[1]) * 10000;
    return parseFloat(s.replace(/[万,w,W]/g,'')) * 10000 || 0;
  }

  const OPERATORS = {
    EQ: (v,t) => String(v) === String(t),
    NEQ: (v,t) => String(v) !== String(t),
    IN: (v,t) => Array.isArray(t) && t.includes(String(v)),
    GTE: (v,t) => parseBudget(v) >= parseBudget(t),
    LTE: (v,t) => parseBudget(v) <= parseBudget(t),
    DAYS_GT: (v,t) => { const d = (new Date() - new Date(v)) / 86400000; return d > t; },
    CONTAINS: (v,t) => Array.isArray(v) && v.includes(t)
  };

  function matchCondition(c, cond) {
    const op = OPERATORS[cond.op];
    return op ? op(c[cond.field], cond.value) : false;
  }

  function matchGroup(c, group) {
    if (!group) return true;
    if (group.field) return matchCondition(c, group);
    const rules = group.rules || [];
    if (rules.length === 0) return true;
    return group.logic === 'OR' ? rules.some(r => matchGroup(c, r)) : rules.every(r => matchGroup(c, r));
  }

  function matchCustomer(customer, conditions) {
    return customer && conditions ? matchGroup(customer, conditions) : false;
  }

  function matchAll(customers, audience) {
    if (!customers || !audience || !audience.conditions) return [];
    return customers.filter(c => matchCustomer(c, audience.conditions));
  }

  return { matchCustomer, matchAll, OPERATORS, parseBudget };
})();
