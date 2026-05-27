// ============================================================
// 场景 agentLog 补充脚本
// 为所有缺少 agentLog 的 annotation 生成 AI 执行记录
// ============================================================
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'scenes', 'scene-12-workbench', 'scenarios');

const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

// 消息类型映射（用于生成 received 描述）
const TRIGGER_LABELS = {
  system: '系统事件',
  'ai-recommend': 'AI 生成建议',
  'ai-hint': 'AI 提取关键信息',
  sales: '销售发送消息',
  customer: '客户回复',
};

function getTriggerMessage(messages, annIdx) {
  // 这个 annotation 对应的消息索引：annIdx-1（因为有 null 打头）
  // annotation 的索引对应 messages 的索引偏移
  // ann[1] -> messages[0]... 实际上比较复杂，要看具体数据
  // 简单策略：取 messages 中最近的非 annotation 消息
  if (!messages || messages.length === 0) return '';
  // 每个 annotation 大致对应一个消息步骤
  // annotation[1] 分析 system[0]
  // annotation[2] 分析 sales[2]
  // 等
  return '';
}

function generateAnalysis(fields, progress, prevFields, flows, stageId, prevProgress, nextAction) {
  const parts = [];
  const hasChanges = fields && prevFields;

  if (progress && progress.stageChange) {
    parts.push('阶段推进至' + progress.currentStage + '：' + progress.stageChange);
    return parts.join('。') + '。';
  }

  // 字段变化
  if (hasChanges) {
    const keyFields = ['客户来源', '初始意向', '客户大类', '细分类别', '日单量', '后厨人员', '核心关注点', '痛点', '推荐产品', '客户意向', '方案状态'];
    const changed = Object.entries(fields).filter(([k, v]) => {
      if (!v || !v.value || v.status === 'empty') return false;
      if (!keyFields.includes(k)) return false;
      const pv = prevFields[k];
      return pv && (pv.status === 'empty' || pv.value !== v.value);
    });
    if (changed.length > 0) {
      parts.push(changed.map(([k, v]) => k + '：' + v.value).join('；'));
    }
  }

  // 待确认项变化（pending 消失 = 已处理）
  if (prevProgress && progress) {
    const prevP = prevProgress.pending || [];
    const currP = progress.pending || [];
    const doneP = prevP.filter(function(p) { return currP.indexOf(p) === -1; });
    if (doneP.length > 0) {
      parts.push('已处理：' + doneP.join('、'));
    }
  }

  // 完成项
  if (progress && progress.completed && progress.completed.length > 0) {
    parts.push('已完成：' + progress.completed.join('、'));
  }

  // 当前待确认
  if (progress && progress.pending && progress.pending.length > 0) {
    const show = progress.pending.slice(0, 2);
    parts.push('待确认：' + show.join('、') + (progress.pending.length > 2 ? '等' + progress.pending.length + '项' : ''));
  }

  // 如果没有变化，使用 nextAction
  if (parts.length === 0 && nextAction && nextAction.suggestion && nextAction.suggestion !== '继续推进') {
    parts.push(nextAction.suggestion);
  }

  return parts.length > 0 ? parts.join('。') + '。' : 'AI 持续分析对话状态。';
}

function generateUpdates(fields, prevFields) {
  const updates = [];
  if (!fields) return updates;

  const keyFields = ['客户来源', '初始意向', '客户大类', '细分类别', '日单量', '后厨人员', '核心关注点', '痛点', '推荐产品', '客户意向', '方案状态', '当前阶段', '响应状态'];

  Object.entries(fields).forEach(([key, val]) => {
    if (!val || !val.value || val.status === 'empty') return;
    if (!prevFields) {
      // 首次只显示关键字段
      if (keyFields.includes(key)) updates.push(key + '→' + val.value);
    } else {
      const pv = prevFields[key];
      if (!pv || pv.status === 'empty' || pv.value !== val.value) {
        updates.push(key + '→' + val.value);
      }
    }
  });

  return updates;
}

let updated = 0;

files.forEach(f => {
  const fp = join(DIR, f);
  const data = JSON.parse(readFileSync(fp, 'utf-8'));
  const msgs = data.messages || [];
  let changed = false;

  let prevFields = null;
  let prevProgress = null;

  data.annotations.forEach((ann, idx) => {
    if (!ann) {
      prevFields = null;
      return;
    }

    if (ann.agentLog) {
      // 已经有 agentLog，但更新 prevFields 用于后续对比
      if (ann.fields) prevFields = JSON.parse(JSON.stringify(ann.fields));
      return;
    }

    const fields = ann.fields || null;
    const progress = ann.progress || null;
    const flows = ann.flows || null;
    const nextAction = ann.nextAction || null;

    // 构建 received
    let received = '';
    if (msgs[idx] && msgs[idx].content) {
      const type = msgs[idx].type || '';
      const label = TRIGGER_LABELS[type] || '消息';
      const content = msgs[idx].content.replace(/\n/g, ' ').substring(0, 40);
      received = `${label}：${content}`;
    } else if (idx === 1) {
      received = `系统事件：新场景「${data.name}」加载`;
    } else {
      received = `AI 持续分析对话状态`;
    }

    // 构建 analysis
    const analysis = generateAnalysis(fields, progress, prevFields, flows, data.stageId, prevProgress, nextAction);

    // 构建 updates
    const updates = generateUpdates(fields, prevFields);

    // stageChange
    const stageChange = progress ? (progress.stageChange || null) : null;

    // recommendedAction
    let recommendedAction = '';
    if (nextAction && nextAction.suggestion) {
      recommendedAction = nextAction.suggestion;
    } else if (progress && progress.pending && progress.pending.length > 0) {
      recommendedAction = '推进待确认项';
    } else {
      recommendedAction = '等待下一步消息';
    }

    ann.agentLog = {
      received,
      analysis,
      updates,
      stageChange,
      recommendedAction,
    };
    changed = true;

    if (fields) prevFields = JSON.parse(JSON.stringify(fields));
    if (progress) prevProgress = JSON.parse(JSON.stringify(progress));
  });

  if (changed) {
    writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    updated++;
    const logCount = data.annotations.filter(a => a && a.agentLog).length;
    console.log(`  ${f.padEnd(10)} ${data.stageId}  agentLog: ${logCount}`);
  }
});

console.log(`\nDone. Updated ${updated} files.`);
