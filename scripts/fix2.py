import re

with open('scenes/scene-12-workbench/scenario-data.js') as f:
    content = f.read()

# Pattern: end of SCENARIOS array followed by new scenarios
old_close = '  ];\n\n\n    // ----'
new_close = '\n\n  // ===== 将 annot 数组转为 annotationsAt'

start = content.find(old_close)
end = content.find(new_close)

print(f"Start marker at {start}, End marker at {end}")

if start < 0 or end < 0:
    print("Markers not found")
    exit(1)

# Extract the new block (the scenarios that are outside the array)
new_block = content[start:end]

# Remove it
content = content[:start] + content[end:]

# Now find the `];` just before the annotation converter
insert_marker = '  ];\n\n  // ===== 将 annot 数组转为 annotationsAt'
insert_pos = content.find(insert_marker)

if insert_pos < 0:
    print("Insert marker not found")
    exit(1)

# Insert new block BEFORE the ];
content = content[:insert_pos] + new_block + content[insert_pos:]

with open('scenes/scene-12-workbench/scenario-data.js', 'w') as f:
    f.write(content)

print("Fixed successfully")
