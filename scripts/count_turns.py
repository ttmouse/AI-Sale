#!/usr/bin/env python3
"""
Quick-and-dirty document parser that extracts scenario dialogues.
"""
DOC = '/Users/douba/Downloads/☆销售AI助手-功能清单-展示页面.md'

with open(DOC) as f:
    text = f.read()

lines = text.split('\n')

# Find all scenario boundaries
scenario_starts = []
for i, line in enumerate(lines):
    if line.startswith('## **场景') and '\\' in line:
        # Extract ID: e.g. "## **场景 1\-1：抖音线索智能开场**"
        parts = line.replace('**', '').replace('\\', '').split('：')
        sid_part = parts[0].replace('## ', '').replace('场景 ', '')
        name = parts[1] if len(parts) > 1 else ''
        scenario_starts.append((i, sid_part.strip(), name.strip()))

scenario_starts.append((len(lines), '', ''))

print(f"Found {len(scenario_starts)-1} scenarios")

for idx in range(len(scenario_starts)-1):
    sid, name = scenario_starts[idx][1], scenario_starts[idx][2]
    start = scenario_starts[idx][0]
    end = scenario_starts[idx+1][0]
    block = lines[start:end]
    
    # Find middle section
    in_middle = False
    dialogue_lines = []
    for line in block:
        if '中间：移动端对话区' in line:
            in_middle = True
            continue
        if '右侧：AI 智能注解区' in line:
            in_middle = False
            continue
        if in_middle:
            dialogue_lines.append(line)
    
    # Count dialogue turns
    turns = 0
    for line in dialogue_lines:
        s = line.strip()
        if s in ('**客户：**', '**销售：**', '**AI 提示：**', '**AI 推荐开场：**', '**AI 推荐回复：**', '**系统提示：**', '**AI 推荐唤醒话术：**'):
            turns += 1
    
    print(f"  {sid}: {name[:20]} ({turns} turns)")
