with open('scenes/scene-12-workbench/scenario-data.js') as f:
    content = f.read()

# Exact markers
old = '  ];\n\n\n    // ──────────────────────────────────────────────────────────\n    // P1: 线索接入与智能破冰 (续)'
new = '\n\n  // ===== 将 annot'

idx = content.find(old)
idx2 = content.find(new)

print(f'old={idx} new={idx2}')

if idx > 0 and idx2 > idx:
    block = content[idx:idx2]
    content = content[:idx] + content[idx2:]
    
    # Find the new insertion point
    gap = '\n\n  // ===== 将 annot'
    insert = content.find(gap)
    if insert > 0:
        content = content[:insert] + block + content[insert:]
        with open('scenes/scene-12-workbench/scenario-data.js', 'w') as f:
            f.write(content)
        print('Done - inserted before converter')
    else:
        print('insert fail')
else:
    print('markers fail')
