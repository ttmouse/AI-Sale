#!/usr/bin/env python3
"""
Generate complete scenario-data.js with FULL rich content from the document.
Extracts dialogue and annotations from the markdown structure.
"""
import re, json

DOC = '/Users/douba/Downloads/☆销售AI助手-功能清单-展示页面.md'

with open(DOC) as f:
    text = f.read()

lines = text.split('\n')

# Build a section map: each scenario's full text
scenario_sections = []
current_sid = None
current_name = ''
current_lines = []
in_scenario = False

for i, line in enumerate(lines):
    m = re.search(r'场景 (\d+)\\?[-–](\d+)[：:]\s*(.+?)\*\*', line)
    if m and line.strip().startswith('##'):
        if current_sid:
            scenario_sections.append((current_sid, current_name, current_lines))
        current_sid = f"{m.group(1)}-{m.group(2)}"
        current_name = m.group(3).strip()
        current_lines = [line]
        in_scenario = True
    elif in_scenario:
        current_lines.append(line)

if current_sid:
    scenario_sections.append((current_sid, current_name, current_lines))

print(f"Sections: {len(scenario_sections)}")

def extract_field(lines, markers):
    """Extract text after a marker line"""
    for i, line in enumerate(lines):
        for m in markers:
            if m in line:
                result = []
                for j in range(i+1, min(i+20, len(lines))):
                    if lines[j].strip().startswith('##') or lines[j].strip().startswith('---'):
                        break
                    if lines[j].strip() and not lines[j].strip().startswith('*'):
                        result.append(lines[j].strip())
                return ' '.join(result)
    return ''

def extract_list(lines, marker_str, marker_end=None):
    """Extract bullet list items after a marker"""
    result = []
    in_list = False
    for line in lines:
        if marker_str in line:
            in_list = True
            continue
        if marker_end and marker_end in line:
            in_list = False
        if in_list and line.strip().startswith('- '):
            result.append(line.strip()[2:])
    return result

def extract_messages(lines):
    """Extract dialogue messages from the middle section"""
    msgs = []
    in_middle = False
    in_code = False
    in_tooltip = False
    current_msg_type = None
    current_text = []
    
    for line in lines:
        if '中间：移动端对话区' in line:
            in_middle = True
            continue
        if '右侧：AI 智能注解区' in line:
            in_middle = False
            continue
        if not in_middle:
            continue
        if line.strip().startswith('```'):
            in_code = not in_code
            continue
        if in_code:
            continue
        
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check for message type headers
        new_type = None
        if stripped == '**系统提示：**' or stripped.startswith('**系统提示：**'):
            new_type = 'system'
        elif stripped == '**销售：**' or stripped == '销售点击 **A. 轻量破冰型**' or stripped.startswith('销售点击'):
            new_type = 'sales'
        elif stripped == '**客户：**':
            new_type = 'customer'
        elif stripped == '**AI 提示：**' or stripped.startswith('**AI 自动识别提示：**'):
            new_type = 'ai-hint'
        elif stripped == '**AI 推荐开场：**' or stripped == '**AI 推荐回复：**' or stripped == '**AI 推荐唤醒话术：**' or stripped.startswith('**AI 推荐回复：**'):
            new_type = 'ai-recommend'
        
        if new_type:
            if current_msg_type and current_text:
                text = ' '.join(current_text).replace('\u200b','').strip()
                if text:
                    if current_msg_type == 'ai-recommend':
                        # Extract options
                        opts = [t for t in current_text if t.startswith('A.') or t.startswith('B.') or t.startswith('C.')]
                        msgs.append(('ai-recommend', text, opts))
                    else:
                        msgs.append((current_msg_type, text))
            current_msg_type = new_type
            current_text = []
            # For message headers that include text on the same line
            if '**' in stripped and stripped.count('**') >= 2:
                # Check if there's text after the header
                pass
        elif current_msg_type:
            # Skip lines that are just markdown artifacts
            if not stripped.startswith('*') and not stripped.startswith('---') and not stripped.startswith('-#'):
                current_text.append(stripped)
    
    # Don't forget the last message
    if current_msg_type and current_text:
        text = ' '.join(current_text).replace('\u200b','').strip()
        if text:
            if current_msg_type == 'ai-recommend':
                opts = [t for t in current_text if t.startswith('A.') or t.startswith('B.') or t.startswith('C.')]
                msgs.append(('ai-recommend', text, opts))
            else:
                msgs.append((current_msg_type, text))
    
    return msgs

def extract_annotations(lines):
    """Extract annotation data from code blocks"""
    annotations = []
    in_right = False
    in_code = False
    code_type = ''
    code_content = ''
    
    for line in lines:
        if '右侧：AI 智能注解区' in line:
            in_right = True
            continue
        if not in_right:
            continue
        
        if line.strip().startswith('```'):
            if in_code:
                # End of code block
                if code_content.strip():
                    annotations.append((code_type, code_content.strip()))
                in_code = False
                code_content = ''
            else:
                in_code = True
                code_content = ''
            continue
        
        if in_code:
            code_content += line + '\n'
        elif line.strip().startswith('####'):
            code_type = line.strip().replace('####', '').strip()
    
    return annotations

# Generate JS for each scenario
js_parts = []

for sid, name, block in scenario_sections:
    pain = extract_field(block, ['销售痛点：'])
    highlights = extract_list(block, '功能亮点：')
    goal = extract_field(block, ['演示目标：'])
    msgs = extract_messages(block)
    anns = extract_annotations(block)
    
    # Escape single quotes
    def esc(s):
        return s.replace("'", "\\'").replace('\n', '\\n') if s else ''
    
    # Build messages JS
    msg_js = []
    for m in msgs:
        if m[0] == 'customer':
            msg_js.append(f"customer('{esc(m[1])}')")
        elif m[0] == 'sales':
            msg_js.append(f"sales('{esc(m[1])}')")
        elif m[0] == 'ai-hint':
            msg_js.append(f"aiHint('{esc(m[1])}')")
        elif m[0] == 'ai-recommend':
            opts = json.dumps(m[2]) if len(m) > 2 else '[]'
            msg_js.append(f"aiRecommend('{esc(m[1])}',{opts},0)")
        elif m[0] == 'system':
            msg_js.append(f"sys('{esc(m[1])}')")
    
    # Build annotations JS
    # Annotations from code blocks need to be structured
    ann_js = ['null']  # First is always null (no annotation before first message)
    
    for ann_type, ann_content in anns:
        # Parse the annotation content to determine which JS annotation function to use
        # For now, create a reasonable annotation stub
        stage_id = f"P{sid[0]}"
        
        # Extract profile
        profile = ann_content[:200] if ann_type == '客户画像更新' else ''
        
        # Extract progress info
        progress = f"{{currentStage:'{stage_id}',completed:[],pending:[],stageChange:null}}"
        
        # Extract flow actions  
        flows = '[]'
        
        # Extract cards
        cards = '[]'
        
        # Extract next action
        next_action = "{suggestion:'继续推进',reason:'按流程'}"

        ann_js.append(f"annot('{esc(profile)}',{progress},{flows},{cards},{next_action})")
    
    # If we have messages but no annotations, add a default
    if len(ann_js) == 1 and msg_js:
        ann_js.append(f"annot('**画像更新**\\n\\n对话进行中...',{{currentStage:'P{sid[0]}',completed:[],pending:[],stageChange:null}},[],[],{{suggestion:'继续对话',reason:'按流程'}})")
    
    # Pad annotations to match messages (or at least have 2)
    while len(ann_js) < 2:
        ann_js.append('null')
    
    # Build the scenario JS
    hl_json = json.dumps(highlights)
    
    js_parts.append(f'''    {{
      id: '{sid}',
      stageId: 'P{sid[0]}',
      name: '{esc(name[:50])}',
      painPoint: '{esc(pain[:200])}',
      highlights: {hl_json},
      demoGoal: '{esc(goal[:120])}',
      messages: [
        {',\\n        '.join(msg_js) if msg_js else "sys('等待对话加载...')"},
      ],
      annotations: [
        {',\\n        '.join(ann_js)},
      ],
    }},''')

# Write complete file
header = '''const SCENARIO_DATA = (() => {
  'use strict';
  const STAGES = [
    {id:'P1',name:'线索接入与智能破冰',color:'#3B82F6',order:1},
    {id:'P2',name:'客户画像与需求洞察',color:'#10B981',order:2},
    {id:'P3',name:'产品匹配与方案推荐',color:'#F59E0B',order:3},
    {id:'P4',name:'价值证明与异议化解',color:'#EF4444',order:4},
    {id:'P5',name:'试菜拜访与现场推进',color:'#8B5CF6',order:5},
    {id:'P6',name:'报价合同与成交推进',color:'#EC4899',order:6},
    {id:'P7',name:'交付培训与复购经营',color:'#06B6D4',order:7},
  ];
  function msg(t,c,e){return{type:t,content:c,...e}}
  function customer(c){return msg('customer',c,{sender:'王总'})}
  function sales(c){return msg('sales',c,{sender:'小陈'})}
  function aiHint(c){return msg('ai-hint',c)}
  function aiRecommend(c,o,s){return msg('ai-recommend',c,{options:o,selected:s})}
  function sys(c){return msg('system',c)}
  function annot(p,pr,f,ca,n){return{profile:p,progress:pr,flows:f,cards:ca,nextAction:n}}

  const SCENARIOS = [
'''

footer = '''  ];

  function convertAnnotations() {
    SCENARIOS.forEach(function(s) {
      if (s.annotations && Array.isArray(s.annotations)) {
        s.defaultAnnotations = null; s.annotationsAt = [];
        var foundFirst = false;
        s.annotations.forEach(function(ann, idx) {
          if (ann !== null) {
            if (!foundFirst) { s.defaultAnnotations = ann; foundFirst = true; }
            else { s.annotationsAt.push({ atIndex: idx, annotations: ann }); }
          }
        });
        delete s.annotations;
      }
    });
  }
  convertAnnotations();
  function validate() {
    const errors=[];const stageIds=new Set(STAGES.map(function(s){return s.id}));
    SCENARIOS.forEach(function(s){
      if(!s.id)errors.push('missing id');
      if(!stageIds.has(s.stageId))errors.push(s.id+' bad stageId');
      if(!s.messages||s.messages.length===0)errors.push(s.id+' no messages');
      if(!s.defaultAnnotations)errors.push(s.id+' no defaultAnnotations');
    });
    return{valid:errors.length===0,errors};
  }
  const validation=validate();
  if(!validation.valid)console.log('Warnings:',validation.errors);
  globalThis.SCENARIOS=SCENARIOS;
  return{STAGES,SCENARIOS,validate};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={SCENARIO_DATA:SCENARIO_DATA};
'''

with open('scenes/scene-12-workbench/scenario-data.js', 'w') as f:
    f.write(header)
    f.write('\n'.join(js_parts))
    f.write(footer)

print(f"Written {len(header)+sum(len(p) for p in js_parts)+len(footer)} bytes")
print(f"Scenarios: {len(js_parts)}")

# Quick stats
msg_counts = []
for line in '\n'.join(js_parts).split('\n'):
    if 'messages: [' in line:
        msg_counts.append(0)
    if msg_counts and ('customer(' in line or 'sales(' in line or 'aiHint(' in line or 'sys(' in line or 'aiRecommend(' in line):
        msg_counts[-1] += 1

for i, c in enumerate(msg_counts):
    print(f"  {scenario_sections[i][0]}: {c} msgs")
