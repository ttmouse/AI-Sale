import sys
with open('scenes/scene-12-workbench/workbench-engine.js') as f:
    c = f.read()

# Fix: use _messageIndex - 1 to get annotation for the CURRENT message (not the next one)
old = """  function getCurrentAnnotations() {
    return getAnnotationAtIndex(_messageIndex);
  }"""

new = """  function getCurrentAnnotations() {
    // 使用 _messageIndex - 1 获取当前已显示消息的注解，而非下一条消息
    var idx = _messageIndex > 0 ? _messageIndex - 1 : 0;
    return getAnnotationAtIndex(idx);
  }"""

c = c.replace(old, new)

with open('scenes/scene-12-workbench/workbench-engine.js', 'w') as f:
    f.write(c)
print('Fixed: getCurrentAnnotations now uses _messageIndex - 1')
