#!/usr/bin/env python3
"""Extract full scenario data from document and generate JS"""
import re

DOC = '/Users/douba/Downloads/☆销售AI助手-功能清单-展示页面.md'

with open(DOC) as f:
    text = f.read()

lines = text.split('\n')

# Find all scenario headers
scenario_starts = []
for i, line in enumerate(lines):
    m = re.search(r'场景 (\d+)\\?[-–](\d+)', line)
    if m and line.startswith('##'):
        sid = f"{m.group(1)}-{m.group(2)}"
        scenario_starts.append((i, sid, line))

print(f"Found {len(scenario_starts)} scenario headers")

# For each scenario, extract the section until the next h2
scenarios = []
for idx, (start_line, sid, header) in enumerate(scenario_starts):
    # End: next h2 or end of file
    end_line = len(lines)
    if idx + 1 < len(scenario_starts):
        end_line = scenario_starts[idx + 1][0]
    
    scenario_text = '\n'.join(lines[start_line:end_line])
    
    # Extract name from header
    name_match = re.search(r'[：:]\s*(.+?)\*\*', header)
    name = name_match.group(1).strip() if name_match else sid
    
    # Extract pain point
    pain = ''
    pm = re.search(r'\*\*销售痛点：\*\*\n(.+?)(?=\n---|\n###|\Z)', scenario_text, re.DOTALL)
    if pm: pain = pm.group(1).strip()
    
    # Extract highlights
    highlights = []
    in_highlights = False
    for line in scenario_text.split('\n'):
        if '功能亮点：' in line:
            in_highlights = True
            continue
        if '演示目标：' in line:
            in_highlights = False
            continue
        if in_highlights and line.strip().startswith('- '):
            highlights.append(line.strip()[2:])
    
    # Extract demo goal
    goal = ''
    gm = re.search(r'\*\*演示目标：\*\*\n(.+?)(?=\n---|\n###|\Z)', scenario_text, re.DOTALL)
    if gm: goal = gm.group(1).strip()
    
    scenarios.append({
        'id': sid,
        'name': name,
        'painPoint': pain,
        'highlights': highlights,
        'demoGoal': goal,
        'start': start_line,
        'end': end_line,
    })

# Show results
for s in scenarios:
    print(f"{s['id']}: {s['name']}")
    print(f"  Pain: {s['painPoint'][:60]}...")
    print(f"  Highlights: {len(s['highlights'])}")
    print(f"  Goal: {s['demoGoal'][:60]}...")
    print()
