import sys
with open('scenes/scene-12-workbench/workbench-ui.js') as f:
    c = f.read()

old = '    if (ann.profile) els.profileCard.innerHTML = _mdToHtml(ann.profile);'

new = '''    // 结构化字段面板：展示系统属性字段的增量更新
    if (ann.fields) {
      var fieldHtml = '';
      var keys = Object.keys(ann.fields);
      var order = {new:0, updated:1, current:2, confirmed:3};
      keys.sort(function(a,b) { return (order[ann.fields[a].status]||9) - (order[ann.fields[b].status]||9); });
      keys.forEach(function(key) {
        var f = ann.fields[key];
        var st = f.status || 'current';
        var cls = 'sf-row';
        var badge = '';
        if (st === 'new') { cls += ' sf-new'; badge = '<span class="sf-badge sf-badge-new">✦</span>'; }
        else if (st === 'updated') { cls += ' sf-updated'; badge = '<span class="sf-badge sf-badge-upd">←</span>'; }
        else if (st === 'confirmed') { cls += ' sf-confirmed'; badge = '<span class="sf-badge sf-badge-conf">✓</span>'; }
        fieldHtml += '<div class="' + cls + '"><span class="sf-key">' + key + '</span><span class="sf-val">' + f.value + '</span>' + badge + '</div>';
      });
      els.profileCard.innerHTML = fieldHtml || '暂无字段';
    } else if (ann.profile) {
      els.profileCard.innerHTML = _mdToHtml(ann.profile);
    }'''

if old in c:
    c = c.replace(old, new)
    with open('scenes/scene-12-workbench/workbench-ui.js', 'w') as f:
        f.write(c)
    print('Updated profile card rendering')
else:
    print('Pattern not found')
