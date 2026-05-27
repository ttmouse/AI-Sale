#!/usr/bin/env python3
"""Split scenario-data.js into per-stage files for maintainability."""
import re, os

SRC = 'scenes/scene-12-workbench/scenario-data.js'
OUT_DIR = 'scenes/scene-12-workbench'

with open(SRC) as f:
    content = f.read()

# Split into parts:
# 1. Header with helpers (up to 'const SCENARIOS = [')
# 2. Scenarios (each scenario object)
# 3. Footer (from '];' + converter + validate + export)

header_end = content.find('const SCENARIOS = [\n')
footer_start = content.rfind('\n  ];\n\n  function convertAnnotations')

if header_end < 0 or footer_start < 0:
    print("ERROR: can't find boundaries")
    exit(1)

header = content[:header_end]  # up to and including 'const SCENARIOS = ['
scenarios_text = content[header_end + len('const SCENARIOS = ['):footer_start]
footer = content[footer_start:]

# Parse individual scenarios by finding each '{' that starts a scenario
# Strategy: use the pattern ',// P' to find boundaries between stages
# Actually, simpler: split by '  {\n      id:' to get individual scenarios

scenarios_raw = re.split(r'(?=\n    {\n      id:)', scenarios_text)
scenarios_raw = [s.strip() for s in scenarios_raw if s.strip()]

print(f"Found {len(scenarios_raw)} scenarios")

# Group by stage
stages = {'P1':[],'P2':[],'P3':[],'P4':[],'P5':[],'P6':[],'P7':[]}

for s in scenarios_raw:
    # Extract stage from id or stageId
    m = re.search(r"stageId: '([^']+)'", s)
    if m:
        stage = m.group(1)
        if stage in stages:
            stages[stage].append(s)
        else:
            print(f"Unknown stage: {stage}")
    else:
        print(f"Can't find stageId in: {s[:80]}")

for k, v in stages.items():
    print(f"  {k}: {len(v)} scenarios")

# Write per-stage files
for stage_id, scenarios in stages.items():
    if not scenarios:
        continue
    filename = f'scenarios-{stage_id.lower()}.js'
    # Generate comma-separated list with proper indentation
    body = ',\n'.join(scenarios)
    file_content = f'// 阶段 {stage_id} 场景数据 - 自动生成\n'
    file_content += f'const SCENARIOS_{stage_id} = [\n{body},\n];\n'
    
    with open(os.path.join(OUT_DIR, filename), 'w') as f:
        f.write(file_content)
    print(f"  Written {filename}")

# Rewrite main scenario-data.js to import from stage files
new_main = header + '\n'

# Add concatenation of all stages
concat = '  const SCENARIOS = [].concat(\n'
for stage_id in ['P1','P2','P3','P4','P5','P6','P7']:
    concat += f'    SCENARIOS_{stage_id},\n'
concat += '  );\n'

new_main += concat
new_main += footer

# Add global variable declarations at the top of the IIFE
# The SCENARIOS_P1, etc. need to be assigned from globals
var_decl = ''
for stage_id in ['P1','P2','P3','P4','P5','P6','P7']:
    var_decl += f'  const SCENARIOS_{stage_id} = globalThis.SCENARIOS_{stage_id} || [];\n'

# Insert after 'use strict'
new_main = new_main.replace(
    "'use strict';",
    "'use strict';\n" + var_decl
)

with open(SRC, 'w') as f:
    f.write(new_main)

print(f"\nMain file rewritten: {os.path.getsize(SRC)} bytes")
print("Now update index.html to load per-stage scripts")
