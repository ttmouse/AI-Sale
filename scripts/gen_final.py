import os

base = 'scenes/scene-12-workbench/scenario-data.js'

with open(base) as f:
    content = f.read()

marker = '  ];\n\n  // ===== \u5c06 annot'
idx = content.find(marker)

if idx < 0:
    print('ERROR: marker not found')
    exit(1)

# Read the JS scenarios to insert from a JS file
# Actually just write them inline as a big string
new_code = open('scripts/new_scenarios.js').read()

content = content[:idx] + new_code + '\n' + content[idx:]

with open(base, 'w') as f:
    f.write(content)

print('Done')
