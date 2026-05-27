import sys
with open('scenes/scene-12-workbench/workbench-ui.js') as f:
    c = f.read()

step_label = '\u6b65\u9aa4 '
step_label_js = "\\u6b65\\u9aa4 "

# 1. Add step counter
c = c.replace('var _lastAnnContent', 'var _stepCounter = 0;\nvar _lastAnnContent')

# 2. Increment on each card
c = c.replace(
    '      _lastTimelineIdx = msgIdx;\n      appendTimelineCard(ann, msgIdx);',
    '      _lastTimelineIdx = msgIdx;\n      _stepCounter++;\n      appendTimelineCard(ann, _stepCounter);'
)

# 3. Fix display: use step number instead of msgIdx
c = c.replace(
    "html += '<div class=\"tl-step\">Step ' + msgIdx + '</div>';",
    "html += '<div class=\"tl-step\">" + step_label_js + "' + msgIdx + '</div>';"
)

with open('scenes/scene-12-workbench/workbench-ui.js', 'w') as f:
    f.write(c)
print('Added step counter')
