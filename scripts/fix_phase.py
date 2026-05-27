with open('scenes/scene-12-workbench/workbench-ui.js') as f:
    c = f.read()
old = "{read:'\U0001F4CB \u8BFB\u53D6', think:'\U0001F9E0 \u5206\u6790', execute:'\u2699\uFE0F \u6267\u884C', output:'\U0001F4A1 \u8F93\u51FA'}"
new = "{read:'READ', think:'THINK', execute:'EXEC', output:'OUT'}"
if old in c:
    c = c.replace(old, new)
    with open('scenes/scene-12-workbench/workbench-ui.js', 'w') as f:
        f.write(c)
    print('Fixed')
else:
    print('Not found')
    idx = c.find('read')
    if idx > 0:
        print(repr(c[idx:idx+100]))
