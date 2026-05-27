with open('scenes/scene-12-workbench/scenario-data.js') as f:
    content = f.read()

old = '  ]' + ';' + '\n' + '\n' + '\n' + '    // ' + '-' * 58 + '\n    // P1: 线索接入与智能破冰 (续)'
idx = content.find(old)

new = '\n\n  // ===== ' + chr(0x5c06) + ' annot'
# Use the actual character
new = chr(10) + chr(10) + '  // ===== \u5c06 annot'
idx2 = content.find(new)

print(f'old at {idx}, new at {idx2}')

if idx > 0 and idx2 > idx:
    block = content[idx:idx2]
    content = content[:idx] + content[idx2:]
    remaining = chr(10) + chr(10) + '  // ===== \u5c06 annot'
    insert = content.find(remaining)
    print(f'insert at {insert}')
    if insert > 0:
        content = content[:insert] + block + content[insert:]
        with open('scenes/scene-12-workbench/scenario-data.js', 'w') as f:
            f.write(content)
        print('Done')
    else:
        print('insert fail')
else:
    print('markers fail')
