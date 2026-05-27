#!/usr/bin/env python3
"""
Read the original document and regenerate scenario-data.js
with FULL rich content for all 27 scenarios.
"""
import re, json, os

DOC = '/Users/douba/Downloads/☆销售AI助手-功能清单-展示页面.md'

with open(DOC) as f:
    lines = f.readlines()

print(f"Document: {len(lines)} lines")

# Parse all scenarios
# Each scenario starts with ## **场景 X-Y：**
# and has sections: 左侧说明区, 中间对话区, 右侧注解区

scenarios = []
current = None
section = None  # 'left', 'middle', 'right'
subsection = None  # 'pains', 'highlights', 'goal', etc.

for i, line in enumerate(lines):
    # Detect scenario start
    m = re.match(r'^## \*\*场景 (\d+)\\-(\d+)[：:]\s*(.+?)\*\*', line)
    if m:
        if current:
            scenarios.append(current)
        current = {
            'id': m.group(1),
            'name': m.group(2).strip(),
            'painPoint': '',
            'highlights': [],
            'demoGoal': '',
            'messages': [],
            'annotations': [],
        }
        section = None
        continue
    
    if current is None:
        continue
    
    # Detect section changes
    if '左侧：场景说明区' in line:
        section = 'left'
        continue
    if '中间：移动端对话区' in line:
        section = 'middle'
        continue
    if '右侧：AI 智能注解区' in line:
        section = 'right'
        continue
    
    if section == 'left':
        if '销售痛点：' in line:
            current['painPoint'] = lines[i+1].strip() if i+1 < len(lines) else ''
        elif line.strip().startswith('- ') and '功能亮点' not in line and '演示目标' not in line:
            current['highlights'].append(line.strip()[2:])
        elif '演示目标：' in line:
            current['demoGoal'] = lines[i+1].strip() if i+1 < len(lines) else ''
    
    elif section == 'middle':
        # Detect message patterns
        stripped = line.strip()
        if stripped.startswith('**客户：**') or stripped.startswith('客户：'):
            current['messages'].append({'type': 'customer', 'text': ''})
        elif stripped.startswith('**销售：**') or stripped.startswith('销售：'):
            current['messages'].append({'type': 'sales', 'text': ''})
        elif stripped.startswith('**AI 提示：**') or stripped.startswith('AI 提示：'):
            current['messages'].append({'type': 'ai-hint', 'text': ''})
        elif stripped.startswith('**AI 推荐回复：**') or stripped.startswith('AI 推荐回复：'):
            current['messages'].append({'type': 'ai-recommend', 'text': ''})
        elif stripped.startswith('**AI 推荐开场：**') or stripped.startswith('AI 推荐开场：'):
            current['messages'].append({'type': 'ai-recommend', 'text': ''})
        elif stripped.startswith('**AI 推荐唤醒话术：**') or stripped.startswith('AI 推荐唤醒话术：'):
            current['messages'].append({'type': 'ai-recommend', 'text': ''})
        elif stripped.startswith('**AI 推荐回复：**') or stripped.startswith('AI 推荐回复：'):
            current['messages'].append({'type': 'ai-recommend', 'text': ''})
        elif stripped.startswith('**系统提示：**') or stripped.startswith('系统提示：'):
            current['messages'].append({'type': 'system', 'text': ''})
        elif current['messages'] and stripped and not stripped.startswith('*') and not stripped.startswith('A.'):
            # Append to last message
            current['messages'][-1]['text'] += '\n' + stripped

print(f"Found {len(scenarios)} scenarios")
for s in scenarios:
    print(f"  {s['id']}: {s['name']} ({len(s['messages'])} msgs)")
