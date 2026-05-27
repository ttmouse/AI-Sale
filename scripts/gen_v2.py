#!/usr/bin/env python3
"""Generate scenario-data.js using proper dialogue extraction"""
import json

DOC = '/Users/douba/Downloads/☆销售AI助手-功能清单-展示页面.md'

with open(DOC) as f:
    lines = f.readlines()

# Find all scenario boundaries
scenario_starts = []
for i, line in enumerate(lines):
    if line.startswith('## **场景') and '\\' in line:
        parts = line.replace('**', '').replace('\\', '').split('：')
        sid = parts[0].replace('## ', '').replace('场景 ', '')
        name = parts[1].strip() if len(parts) > 1 else ''
        scenario_starts.append((i, sid, name))

scenario_starts.append((len(lines), '', ''))
print(f"Scenarios: {len(scenario_starts)-1}")

# Message type headers to recognize
MSG_HEADERS = {
    '**系统提示：**': 'system',
    '**客户：**': 'customer',
    '**销售：**': 'sales',
    '**AI 提示：**': 'ai-hint',
    '**AI 自动识别提示：**': 'ai-hint',
    '**AI 推荐开场：**': 'ai-recommend',
    '**AI 推荐回复：**': 'ai-recommend',
    '**AI 推荐唤醒话术：**': 'ai-recommend',
}

def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'").replace('\n', '\\n').replace('\r', '')

def extract_msgs(block):
    """Extract dialogue messages"""
    msgs = []
    in_middle = False
    in_code = False
    current_type = None
    current_text = []
    
    for line in block:
        if '中间：移动端对话区' in line:
            in_middle = True
            continue
        if '右侧：AI 智能注解区' in line:
            in_middle = False
            # Flush last message
            if current_type and current_text:
                text = ' '.join(current_text).strip()
                if text:
                    msgs.append((current_type, text, []))
            break
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
        
        # Check for message headers
        new_type = MSG_HEADERS.get(stripped)
        if new_type:
            if current_type and current_text:
                text = ' '.join(current_text).strip()
                if text:
                    msgs.append((current_type, text, []))
            current_type = new_type
            current_text = []
            continue
        
        # "销售点击" lines count as sales messages
        if stripped.startswith('销售点击') and '**' in stripped:
            if current_type and current_text:
                text = ' '.join(current_text).strip()
                if text:
                    msgs.append((current_type, text, []))
            current_type = 'sales'
            current_text = []
            continue
        
        if current_type:
            if not stripped.startswith('*') and not stripped.startswith('#'):
                current_text.append(stripped)
    
    return msgs

def extract_ann(block):
    """Extract annotation data"""
    anns = []
    in_right = False
    in_code = False
    code_content = ''
    code_type = ''
    
    for line in block:
        if '右侧：AI 智能注解区' in line:
            in_right = True
            continue
        if not in_right:
            continue
        if line.strip().startswith('```'):
            if in_code:
                if code_content.strip():
                    anns.append((code_type, code_content.strip()))
                in_code = False
                code_content = ''
            else:
                in_code = True
                code_content = ''
            continue
        if in_code:
            code_content += line
        elif line.strip().startswith('####'):
            code_type = line.strip().replace('####', '').replace('**', '').strip()
    
    return anns

# Generate JS
js_parts = []
for idx in range(len(scenario_starts)-1):
    sid = scenario_starts[idx][1]
    name = scenario_starts[idx][2]
    start = scenario_starts[idx][0]
    end = scenario_starts[idx+1][0]
    block = lines[start:end]
    
    # Extract pain point
    pain = ''
    for i, line in enumerate(block):
        if '销售痛点：' in line:
            for j in range(i+1, min(i+20, len(block))):
                if block[j].strip().startswith('##') or block[j].strip().startswith('---') or '功能亮点：' in block[j]:
                    break
                if block[j].strip() and not block[j].strip().startswith('*'):
                    pain += block[j].strip() + ' '
            break
    
    # Extract highlights
    highlights = []
    in_hl = False
    for line in block:
        if '功能亮点：' in line:
            in_hl = True
            continue
        if in_hl and line.strip().startswith('- '):
            highlights.append(line.strip()[2:])
        if in_hl and '演示目标：' in line:
            break
    
    # Extract demo goal
    goal = ''
    for i, line in enumerate(block):
        if '演示目标：' in line:
            for j in range(i+1, min(i+15, len(block))):
                if block[j].strip().startswith('##') or block[j].strip().startswith('---'):
                    break
                if block[j].strip():
                    goal += block[j].strip() + ' '
            break
    
    msgs = extract_msgs(block)
    anns = extract_ann(block)
    
    # Build messages JS
    msg_js = []
    for mtype, text, opts in msgs:
        if mtype == 'customer':
            msg_js.append(f"customer('{esc(text)}')")
        elif mtype == 'sales':
            msg_js.append(f"sales('{esc(text)}')")
        elif mtype == 'ai-hint':
            msg_js.append(f"aiHint('{esc(text)}')")
        elif mtype == 'ai-recommend':
            msg_js.append(f"aiRecommend('{esc(text)}',[],0)")
        elif mtype == 'system':
            msg_js.append(f"sys('{esc(text)}')")
    
    # Build annotations JS
    ann_js = ['null']
    stage_id = f"P{sid[0]}"
    
    for atype, acontent in anns:
        # Always use the full annotation content as profile (with escape)
        profile = esc(acontent[:300])
        if not profile:
            profile = f'**{atype}**\\n\\n对话进行中...'
        
        completed = []
        pending = []
        stage_change = 'null'
        for aline in acontent.split('\n'):
            al = aline.strip()
            if al.startswith('√') or al.startswith('✓'):
                completed.append(al.lstrip('√✓ '))
            elif al.startswith('□') or al.startswith('- ') or al.startswith('•'):
                pending.append(al.lstrip('□-• '))
        
        c = json.dumps(completed[:5])
        p = json.dumps(pending[:5])
        progress = f"{{currentStage:'{stage_id}',completed:{c},pending:{p},stageChange:{stage_change}}}"
        
        ann_js.append(f"annot('{profile}',{progress},[],[],{{suggestion:'继续推进',reason:'按流程'}})")
    
    if len(ann_js) == 1 and msg_js:
        ann_js.append(f"annot('**对话进行中**',{{currentStage:'{stage_id}',completed:[],pending:[],stageChange:null}},[],[],{{suggestion:'继续推进',reason:'按流程'}})")
    
    while len(ann_js) < len(msg_js):
        ann_js.append('null')
    
    # Highlight actions from code blocks
    flow_actions = []
    for atype, acontent in anns:
        if '流程动作' in atype or '可创建动作' in atype:
            for aline in acontent.split('\n'):
                if aline.strip().startswith('[') and ']' in aline:
                    action = aline.strip().strip('[]')
                    flow_actions.append(action)
    
    hls = json.dumps(highlights)
    pain_e = esc(pain[:200])
    goal_e = esc(goal[:150])
    
    js_parts.append(f'''    {{
      id: '{sid}',
      stageId: '{stage_id}',
      name: '{esc(name[:50])}',
      painPoint: '{pain_e}',
      highlights: {hls},
      demoGoal: '{goal_e}',
      messages: [
        {',\n        '.join(msg_js) if msg_js else "sys('等待对话加载...')"},
      ],
      annotations: [
        {',\n        '.join(ann_js)},
      ],
    }},''')
    
    print(f"  {sid}: {len(msg_js)} msgs, {len(anns)} ann blocks")

# Write complete file
header = '''const SCENARIO_DATA = (() => {
  'use strict';
  const STAGES = [{id:'P1',name:'线索接入与智能破冰',color:'#3B82F6',order:1},{id:'P2',name:'客户画像与需求洞察',color:'#10B981',order:2},{id:'P3',name:'产品匹配与方案推荐',color:'#F59E0B',order:3},{id:'P4',name:'价值证明与异议化解',color:'#EF4444',order:4},{id:'P5',name:'试菜拜访与现场推进',color:'#8B5CF6',order:5},{id:'P6',name:'报价合同与成交推进',color:'#EC4899',order:6},{id:'P7',name:'交付培训与复购经营',color:'#06B6D4',order:7},];
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
    const e=[];const si=new Set(STAGES.map(function(s){return s.id}));
    SCENARIOS.forEach(function(s){
      if(!s.id)e.push(s.id);if(!si.has(s.stageId))e.push(s.id);
      if(!s.messages||s.messages.length===0)e.push(s.id);
      if(!s.defaultAnnotations)e.push(s.id);
    });
    return{valid:e.length===0,errors:e};
  }
  const v=validate();if(!v.valid)console.log('Warnings:',v.errors);
  globalThis.SCENARIOS=SCENARIOS;
  return{STAGES,SCENARIOS,validate};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={SCENARIO_DATA:SCENARIO_DATA};
'''

with open('scenes/scene-12-workbench/scenario-data.js', 'w') as f:
    f.write(header + '\n'.join(js_parts) + '\n' + footer)

print(f"\nTotal: {len(js_parts)} scenarios")
