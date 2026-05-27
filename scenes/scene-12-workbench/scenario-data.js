const SCENARIO_DATA = (() => {
  'use strict';
  const SCENARIOS_P1 = globalThis.SCENARIOS_P1 || [];
  const SCENARIOS_P2 = globalThis.SCENARIOS_P2 || [];
  const SCENARIOS_P3 = globalThis.SCENARIOS_P3 || [];
  const SCENARIOS_P4 = globalThis.SCENARIOS_P4 || [];
  const SCENARIOS_P5 = globalThis.SCENARIOS_P5 || [];
  const SCENARIOS_P6 = globalThis.SCENARIOS_P6 || [];
  const SCENARIOS_P7 = globalThis.SCENARIOS_P7 || [];

  const STAGES = [{id:'P1',name:'线索接入与智能破冰',color:'#3B82F6',order:1},{id:'P2',name:'客户画像与需求洞察',color:'#10B981',order:2},{id:'P3',name:'产品匹配与方案推荐',color:'#F59E0B',order:3},{id:'P4',name:'价值证明与异议化解',color:'#EF4444',order:4},{id:'P5',name:'试菜拜访与现场推进',color:'#8B5CF6',order:5},{id:'P6',name:'报价合同与成交推进',color:'#EC4899',order:6},{id:'P7',name:'交付培训与复购经营',color:'#06B6D4',order:7},];
  function msg(t,c,e){return{type:t,content:c,...e}}
  function customer(c){return msg('customer',c,{sender:'王总'})}
  function sales(c){return msg('sales',c,{sender:'小陈'})}
  function aiHint(c){return msg('ai-hint',c)}
  function aiRecommend(c,o,s){return msg('ai-recommend',c,{options:o,selected:s})}
  function sys(c){return msg('system',c)}
  function annot(p,pr,f,ca,n,pc){return{profile:p,progress:pr,flows:f,cards:ca,nextAction:n,pendingConfirm:pc||[]}}

  
  const SCENARIOS = [].concat(
    SCENARIOS_P1,
    SCENARIOS_P2,
    SCENARIOS_P3,
    SCENARIOS_P4,
    SCENARIOS_P5,
    SCENARIOS_P6,
    SCENARIOS_P7,
  );

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
