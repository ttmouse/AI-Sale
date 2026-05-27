import sys
with open('scenes/scene-12-workbench/workbench-ui.js') as f:
    c = f.read()

# 1. Step history
c = c.replace('var _stepCounter = 0;', 'var _stepCounter = 0;\n  var _stepHistory = [0];')

# 2. Record history
old_upd = '      _lastTimelineIdx = msgIdx;\n      _stepCounter++;\n      appendTimelineCard(ann, _stepCounter);'
new_upd = '      _lastTimelineIdx = msgIdx;\n      _stepCounter++;\n      _stepHistory.push(WorkbenchEngine.getCurrentMessageIndex());\n      appendTimelineCard(ann, _stepCounter);'
c = c.replace(old_upd, new_upd)

# 3. Replace goReset with goBack + keep goReset
old_reset = 'function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ""; _stepCounter = 0; _stepHistory = [0]; _pendingConfirmState = {}; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }'

# First remove the old goReset to add both goBack and goReset
c = c.replace(
    'function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ""; _pendingConfirmState = {}; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }',
    'function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ""; _stepCounter = 0; _stepHistory = [0]; _pendingConfirmState = {}; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }'
)

# 4. Add goBack function before goReset
c = c.replace(
    'function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ""; _stepCounter = 0; _stepHistory = [0]; _pendingConfirmState = {}; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }',
    '''function goBack() {
    if (_stepHistory.length <= 1) return;
    _stepHistory.pop();
    var sceneId = WorkbenchEngine.getCurrentScenario() ? WorkbenchEngine.getCurrentScenario().id : null;
    if (!sceneId) return;
    var targetSteps = _stepHistory.length - 1;
    loadScenario(sceneId);
    if (targetSteps > 0) {
      setTimeout(function() {
        for (var i = 0; i < targetSteps; i++) {
          if (WorkbenchEngine.hasNextMessage()) {
            var m = WorkbenchEngine.advanceMessage();
            var safety = 0;
            while (m && (m.type === 'system' || m.type === 'ai-hint' || m.type === 'ai-recommend') && WorkbenchEngine.hasNextMessage() && safety < 10) {
              safety++; m = WorkbenchEngine.advanceMessage();
            }
            if (m) { renderMessage(m); updateAnnotations(); updateProgress(); }
          }
        }
      }, 400);
    }
  }
  function goReset() { _lastTimelineIdx = -1; _lastAnnContent = ""; _stepCounter = 0; _stepHistory = [0]; _pendingConfirmState = {}; var c = WorkbenchEngine.getCurrentScenario(); if (c) loadScenario(c.id); }'''
)

# 5. Keyboard
c = c.replace("else if (e.key === 'ArrowLeft') goReset();", "else if (e.key === 'ArrowLeft') goBack();")

# 6. Button binding
c = c.replace("if (els.stepBtn) els.stepBtn.addEventListener('click', stepForward);\n    if (els.backBtn) els.backBtn.addEventListener('click', goBack);",
              "if (els.stepBtn) els.stepBtn.addEventListener('click', stepForward);")

with open('scenes/scene-12-workbench/workbench-ui.js', 'w') as f:
    f.write(c)
print('Done')
