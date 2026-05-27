#!/usr/bin/env python3
"""Generate complete scenario-data.js from document data for all scenarios"""
import re, json

DOC = '/Users/douba/Downloads/☆销售AI助手-功能清单-展示页面.md'

with open(DOC) as f:
    lines = f.readlines()

# Extract scenario sections
scenario_starts = []
for i, line in enumerate(lines):
    m = re.search(r'场景 (\d+)\\?[-–](\d+)', line)
    if m and line.strip().startswith('##'):
        sid = f"{m.group(1)}-{m.group(2)}"
        scenario_starts.append((i, sid))

# Extract text sections  
scenarios = []
for idx, (start, sid) in enumerate(scenario_starts):
    end = scenario_starts[idx+1][0] if idx+1 < len(scenario_starts) else len(lines)
    block = lines[start:end]
    
    # Name
    name = ''
    nm = re.search(r'[：:]\s*(.+?)\*\*', lines[start])
    if nm: name = nm.group(1).strip()
    
    # Pain
    pain = ''
    in_pain = False
    for line in block:
        if '销售痛点：' in line:
            in_pain = True
            continue
        if '功能亮点：' in line:
            in_pain = False
        if in_pain and line.strip():
            pain += line.strip() + ' '
    pain = pain.strip()
    
    # Highlights
    highlights = []
    in_hl = False
    for line in block:
        if '功能亮点：' in line:
            in_hl = True
            continue
        if '演示目标：' in line:
            in_hl = False
        if in_hl and line.strip().startswith('- '):
            highlights.append(line.strip()[2:])
    
    # Demo goal
    goal = ''
    in_goal = False
    for line in block:
        if '演示目标：' in line:
            in_goal = True
            continue
        if in_goal and line.strip().startswith('##'):
            in_goal = False
        if in_goal and line.strip():
            goal += line.strip() + ' '
    goal = goal.strip()
    
    scenarios.append({
        'id': sid, 'name': name, 'painPoint': pain,
        'highlights': highlights, 'demoGoal': goal,
    })

print(f"Extracted {len(scenarios)} scenarios")

# Generate JS
def esc(s):
    return s.replace("'", "\\'").replace('\n', '\\n')

js = '''
const SCENARIO_DATA = (() => {
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

for s in scenarios:
    js += f'''    {{
      id: '{s["id"]}', stageId: 'P{s["id"][0]}',
      name: '{esc(s["name"][:40])}',
      painPoint: '{esc(s["painPoint"][:150])}',
      highlights: {json.dumps(s["highlights"])},
      demoGoal: '{esc(s["demoGoal"][:100])}',
      messages: [
        sys('等待对话数据加载...'),
        customer('您好，我想了解一下智能炒菜设备。'),
        aiHint('已识别客户意向，建议进一步了解门店情况。'),
        sales('您好！感谢关注，请问您目前是已有门店还是正在筹备？'),
        customer('已有门店，快餐店，想看看能不能提高效率。'),
        aiHint('客户为快餐门店，关注效率提升，建议进入需求确认。'),
        sales('明白，方便了解一下您门店的日单量和后厨人员配置吗？'),
      ],
      annotations: [
        null,
        annot('**客户画像已创建**\\n\\n- 来源：文档生成\\n- 类型：{s["highlights"][0] if s["highlights"] else "待确认"}\\n\\n**画像完整度：10% → 30%**',{{currentStage:'P{s["id"][0]}',completed:[],pending:[],stageChange:null}},[],[],{{suggestion:'继续对话推进，了解客户具体情况。',reason:'按流程推进'}}),
        null,
        annot('**画像更新**\\n\\n- 客户类型：快餐门店\\n- 关注点：效率提升\\n\\n**画像完整度：30% → 50%**',{{currentStage:'P{s["id"][0]}',completed:[],pending:[],stageChange:null}},[],[],{{suggestion:'继续确认日单量和人员配置。',reason:'需要更多信息才能推荐方案'}}),
        null,
        annot('**信息收集完成**\\n\\n**画像完整度：50% → 70%**',{{currentStage:'P{s["id"][0]}',completed:[],pending:[],stageChange:null}},[],[],{{suggestion:'信息基本完善，可进入下一阶段。',reason:'信息完整度足够'}}),
      ],
    }},
'''

js += '''
  ];
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
    f.write(js)

print(f"Written {len(js)} bytes")
