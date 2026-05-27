const fs = require('fs');
const PATH = 'scenes/scene-12-workbench/scenarios/';

// ===== Helper: build complete annotation =====
function ann(fields, progress, flows, cards, nextAction, agentLog, pendingConfirm) {
  return { fields, progress, flows, cards, nextAction, agentLog, pendingConfirm };
}
function field(key, val, status) { return { value: val, status: status || 'current' }; }

// ===== 固定字段列表 =====
const ALL_F = ['客户来源','沉默时长','初始意向','客户大类','细分类别','核心关注点','日单量','后厨人员','痛点','菜品结构','推荐产品','当前阶段','响应状态','客户意向','方案状态','画像完整度'];

function emptyFields() {
  var f = {};
  ALL_F.forEach(function(k) { f[k] = {value: null, status: 'empty'}; });
  return f;
}
function fillFields(base, vals) {
  Object.keys(vals).forEach(function(k) { base[k] = {value: vals[k], status: 'current'}; });
  return base;
}

// ================================================================
// SCENARIO 1-1: 抖音线索智能开场
// ================================================================
function build11() {
  var msgs = [
    {type:'system', content:'新线索：抖音私信留资\n客户备注：想了解智能炒菜机\n客户手机号：已留资\n当前状态：未建立有效沟通'},
    {type:'ai-recommend', content:'A\\. 轻量破冰型 B\\. 需求确认型 C\\. 视频承接型'},
    {type:'sales', content:'王总您好，我是优特智厨的小陈，看到您刚才在抖音上关注了智能炒菜设备。我先不打扰您太久，简单了解一下：您现在是已经有门店想升级后厨，还是正在筹备开店？', sender:'小陈'},
    {type:'customer', content:'我们现在有个快餐店，想看看这种设备到底适不适合。', sender:'王总'},
    {type:'ai-hint', content:'✓ 客户已有门店 ✓ 业态为快餐 ✓ 关注设备适用性'},
    {type:'sales', content:'明白，快餐店是比较适合的。我先了解两个信息：您现在一天大概多少单？后厨有几个炒锅师傅？', sender:'小陈'},
    {type:'customer', content:'一天200多单，两个炒锅师傅，有时候出不来。', sender:'王总'},
    {type:'ai-hint', content:'✓ 日单量200+ ✓ 2名师傅 ✓ 痛点：出餐瓶颈 ✓ 画像完整度提升'},
    {type:'sales', content:'好的，那我判断一下。200多单两位师傅确实比较紧张。这个场景用我们的G3标准版会比较适合——不是替代师傅，而是帮师傅分担高峰压力。要不要我给您发一份快餐门店的配置说明看看？', sender:'小陈'},
    {type:'customer', content:'行，你先发来看看，我先了解一下。', sender:'王总'},
    {type:'ai-recommend', content:'客户意向正向。建议发送资料后48小时跟进反馈，预约时间深入沟通。'},
    {type:'sales', content:'好的，我马上把资料发您。您看完如果有兴趣，我们可以约个时间电话聊几分钟，我帮您分析一下具体配置。', sender:'小陈'},
    {type:'customer', content:'好的，我先看看。', sender:'王总'},
  ];

  var anns = [null];
  // Ann 1: default - 线索初始状态
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',响应状态:'新线索',画像完整度:'10%'}),
    {currentStage:'P1',completed:['线索接收','来源识别','意向识别'],pending:['客户唤醒','业态确认','需求挖掘'],stageChange:null},
    [{label:'创建跟进任务',icon:'calendar-plus'},{label:'标记来源：抖音',icon:'tag'}],
    ['抖音线索开场话术模板','轻量破冰策略卡'],
    {suggestion:'发送轻量破冰话术，避免直接推销',reason:'抖音线索兴趣快流失也快，需低压触达'},
    {received:'新线索从抖音API接入',analysis:'新线索来源为抖音私信留资，意向为了解炒菜机。推荐使用轻量破冰型话术，先建立沟通。',updates:['来源→抖音','意向→了解炒菜机','策略→轻量破冰'],stageChange:null,recommendedAction:'发送破冰话术'}
  ));
  // Ann 2: 销售发出破冰消息
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',响应状态:'破冰话术已发送',画像完整度:'15%'}),
    {currentStage:'P1',completed:['线索接收','来源识别','话术发送'],pending:['客户回复','业态确认','需求挖掘'],stageChange:null},
    [{label:'等待客户回复',icon:'bell'}],
    [],
    {suggestion:'等待客户回复后分析',reason:'话术已发送，等待客户响应'},
    {received:'销售发出破冰话术',analysis:'销售已发送轻量破冰话术。话术以抖音关注为切入点，轻问题引导客户回复。',updates:['话术已发送 ✓','状态→等待回复'],stageChange:null,recommendedAction:'等待客户回复'}
  ));
  // Ann 3: 客户回复
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',客户大类:'社餐',细分类别:'快餐',核心关注点:'设备适用性',响应状态:'已回复 ✨',画像完整度:'35%'}),
    {currentStage:'P1',completed:['客户唤醒','业态识别','关注点识别'],pending:['日单量确认','人员确认','需求匹配'],stageChange:null},
    [{label:'更新画像',icon:'edit'},{label:'创建跟进',icon:'bell'}],
    ['快餐门店适配说明卡'],
    {suggestion:'追问日单量和后厨人员',reason:'需确认门店规模才能判断设备适用性'},
    {received:'客户回复：已有快餐店，想知道设备是否适合',analysis:'客户被成功触达。从回复提取：已有门店，业态为快餐，关注设备适用性。',updates:['大类→社餐','业态→快餐','关注→设备适用性','状态→已回复'],stageChange:null,recommendedAction:'追问日单量和人员信息'}
  ));
  // Ann 4: 销售追问信息
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',客户大类:'社餐',细分类别:'快餐',核心关注点:'设备适用性',响应状态:'需求确认中',画像完整度:'35%'}),
    {currentStage:'P1',completed:['客户唤醒','业态识别'],pending:['日单量','人员','需求匹配'],stageChange:null},
    [{label:'等待客户回复',icon:'bell'}],
    [],
    {suggestion:'等待客户提供数据',reason:'已追问信息，等待客户反馈'},
    {received:'销售追问门店运营数据',analysis:'销售按AI建议追问日单量和人员。等待客户提供门店数据。',updates:[],stageChange:null,recommendedAction:'等待客户回复'}
  ));
  // Ann 5: 客户提供数据
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',客户大类:'社餐',细分类别:'快餐',核心关注点:'出餐效率',日单量:'200+单',后厨人员:'2名炒锅师傅',痛点:'午高峰出餐瓶颈',响应状态:'需求确认中',画像完整度:'60%'}),
    {currentStage:'P1',completed:['日单量确认','人员确认','痛点识别'],pending:['产品推荐','方案发送'],stageChange:null},
    [{label:'推荐产品',icon:'file-text'},{label:'更新画像',icon:'edit'}],
    ['G3标准版产品卡','快餐门店配置方案'],
    {suggestion:'推荐G3标准版，发配置说明',reason:'200单+2名师傅场景适合G3'},
    {received:'客户回复：200多单，2个师傅，有时出不来',analysis:'客户提供了关键运营数据。日单量200+，2名师傅，高峰出餐有压力。AI匹配到G3标准版。',updates:['日单量→200+单','人员→2名师傅','痛点→出餐瓶颈','画像完整度60%'],stageChange:null,recommendedAction:'推荐G3标准版并发送方案'}
  ));
  // Ann 6: 销售推荐
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',客户大类:'社餐',细分类别:'快餐',核心关注点:'出餐效率',日单量:'200+单',后厨人员:'2名炒锅师傅',痛点:'午高峰出餐瓶颈',推荐产品:'G3标准版',响应状态:'方案已推荐',画像完整度:'65%'}),
    {currentStage:'P1',completed:['画像建设','产品匹配','方案推荐'],pending:['方案发送','客户反馈'],stageChange:null},
    [{label:'发送方案',icon:'send'}],
    ['G3标准版产品卡','快餐门店配置方案'],
    {suggestion:'客户同意后发送配置方案',reason:'客户意向正向'},
    {received:'销售推荐G3标准版并询问是否发方案',analysis:'AI匹配G3标准版给客户场景。销售按建议推荐并询问客户意向。',updates:['推荐→G3标准版 ✓','方案已就绪'],stageChange:null,recommendedAction:'客户同意后发送方案'}
  ));
  // Ann 7: 客户同意
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',客户大类:'社餐',细分类别:'快餐',核心关注点:'出餐效率',日单量:'200+单',后厨人员:'2名炒锅师傅',痛点:'午高峰出餐瓶颈',推荐产品:'G3标准版',响应状态:'方案已推荐',客户意向:'正向（同意看方案）',画像完整度:'70%'}),
    {currentStage:'P1',completed:['画像建设','产品匹配','方案推荐'],pending:['方案发送','跟进反馈'],stageChange:null},
    [{label:'发送方案',icon:'send'},{label:'设置跟进',icon:'calendar-plus'}],
    ['G3配置清单','快餐门店ROI测算'],
    {suggestion:'发送方案并设置48小时跟进',reason:'客户同意看方案，转化机会高'},
    {received:'客户同意看方案',analysis:'客户意向正向。从抖音线索到有效沟通到方案推送，AI全流程跟踪。',updates:['意向→正向','全流程完成'],stageChange:null,recommendedAction:'发送方案，48h后跟进'}
  ));
  // Ann 8: 销售发送方案并收尾
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'抖音私信',初始意向:'了解炒菜机',客户大类:'社餐',细分类别:'快餐',核心关注点:'出餐效率',日单量:'200+单',后厨人员:'2名炒锅师傅',痛点:'午高峰出餐瓶颈',推荐产品:'G3标准版',响应状态:'方案已推荐',客户意向:'正向',方案状态:'已发送',画像完整度:'75%'}),
    {currentStage:'P1',completed:['线索接入','客户唤醒','画像建设','产品推荐','方案发送'],pending:['方案反馈','深入沟通'],stageChange:null},
    [{label:'跟进方案反馈',icon:'message-square'}],
    ['G3配置清单','ROI回本测算'],
    {suggestion:'48小时后跟进方案反馈，预约电话沟通',reason:'给客户时间阅读方案'},
    {received:'销售发送方案并预约电话沟通',analysis:'从抖音线索到方案推送完成。AI完成了线索识别→话术生成→画像建设→产品匹配→方案推荐的完整链路。',updates:['方案→已发送','下一步→跟进反馈'],stageChange:null,recommendedAction:'48h后跟进反馈'}
  ));

  // Pad remaining annotations to match message count
  while (anns.length < msgs.length) anns.push(null);

  return {id:'1-1', stageId:'P1', name:'抖音线索智能开场',
    painPoint:'抖音线索往往兴趣来得快、流失也快。客户可能只是刷到视频点了咨询，并不一定有明确采购计划。销售如果一上来就发产品册或报价，很容易把客户吓跑。',
    highlights:['自动识别线索来源和兴趣点；','匹配最合适的开场破冰话术；','根据客户回复实时更新画像；','在了解需求后才进行产品推荐；','全程记录跟进节奏和状态。'],
    demoGoal:'展示 AI 如何帮助销售用正确的节奏跟进抖音线索，从破冰到方案推荐的完整链路。',
    messages: msgs, annotations: anns};
}

// ================================================================
// SCENARIO 4-1: 价格异议化解（关键决策时刻）
// ================================================================
function build41() {
  var msgs = [
    {type:'customer', content:'你们这个价格有点贵啊，我看别家好像便宜不少。', sender:'王总'},
    {type:'ai-hint', content:'检测到异议类型：价格异议 + 竞品价格比较。\n不建议直接降价。\n建议策略：认可顾虑 → 转向长期成本 → ROI 测算。'},
    {type:'ai-recommend', content:'A\\. ROI 算账型 B\\. 竞品差异型 C\\. 试菜验证型'},
    {type:'sales', content:'王总，您觉得贵是正常的，设备采购确实不能只看一次性价格。更关键的是它能不能帮您减少人工、稳定出餐、提升效率。我们可以按您现在的人工成本算一笔账，您看方便吗？', sender:'小陈'},
    {type:'customer', content:'那你怎么算？我们一个炒锅师傅差不多9000一个月。', sender:'王总'},
    {type:'ai-hint', content:'✓ 已获得人工成本参数：9000元/月 ✓ 客户愿意算账 ✓ 进入ROI测算阶段'},
    {type:'sales', content:'一个师傅9000×12=10.8万/年。G3标准版如果帮您分担一个师傅的工作量，一年就能省出大半台设备的钱。而且设备能稳定出餐、减少投诉、延长营业时长。要不要我帮您发一份详细的ROI测算表？', sender:'小陈'},
    {type:'customer', content:'你这个算的都是理想状态吧？万一达不到呢？', sender:'王总'},
    {type:'ai-hint', content:'检测到信任疑虑：可靠性顾虑。建议：提供案例验证 + 试菜邀约。'},
    {type:'sales', content:'理解您的顾虑，我给您发几个实际案例——都是快餐店的，规模和您差不多。看完如果有兴趣，欢迎来我们体验店现场试菜，眼见为实。', sender:'小陈'},
    {type:'customer', content:'好，案例发来我先看看。', sender:'王总'},
    {type:'ai-hint', content:'✓ 客户同意看案例 ✓ 异议化解进展正向 ✓ 可跟进试菜邀约'},
    {type:'sales', content:'好的，案例马上发您。另外如果方便的话，可以约个时间来我们体验店实际试菜，到时候您可以自带食材来测，看看效果是不是跟案例说的一样。', sender:'小陈'},
    {type:'customer', content:'行，我先看案例，看完再说试菜的事。', sender:'王总'},
  ];

  var anns = [null];
  // Ann 1: 客户提出价格异议
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P3',核心关注点:'价格',响应状态:'异议处理中',画像完整度:'70%'}),
    {currentStage:'P3',completed:['异议检测','竞品识别','策略匹配'],pending:['成本数据获取','ROI计算','价值证明'],stageChange:null},
    [{label:'识别异议类型',icon:'check-square'},{label:'匹配应对策略',icon:'file-text'}],
    ['价格异议应对策略卡','竞品差异话术'],
    {suggestion:'不要直接降价，先了解客户真实顾虑',reason:'价格异议可能是对价值认知不足'},
    {received:'客户反馈：价格贵，别家便宜',analysis:'检测到典型价格异议+竞品比较。不建议直接降价。推荐ROI算账策略，将价格问题转化为长期成本问题。',updates:['核心关注→价格','状态→异议处理中','策略→ROI算账'],stageChange:null,recommendedAction:'用ROI算账回应价格异议'},
    [{id:'price-conflict',label:'应对策略',oldValue:'直接降价/解释成本',newValue:'ROI算账型（转换视角到长期成本）',type:'fieldUpdate',action:'采纳策略',desc:'AI分析：客户说贵但愿意沟通，属理性异议，适合算账型回应'}]
  ));
  // Ann 2: 销售用ROI算账回应
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P3',核心关注点:'长期成本',响应状态:'ROI算账中',画像完整度:'72%'}),
    {currentStage:'P3',completed:['异议识别','策略选择','ROI引导'],pending:['人工成本获取','ROI计算','试菜邀约'],stageChange:null},
    [{label:'准备ROI测算',icon:'file-text'},{label:'标记异议类型',icon:'tag'}],
    ['快餐门店ROI算账模板','人工成本vs设备成本对比表'],
    {suggestion:'获取客户人工成本数据后算出具体ROI',reason:'客户愿意对话，说明价格不是唯一因素'},
    {received:'销售引导客户算ROI账',analysis:'销售已按AI建议引导客户算账。需要获取客户人工成本参数才能计算具体ROI。',updates:['关注→长期成本','状态→ROI算账中'],stageChange:null,recommendedAction:'获取人工成本后计算ROI'}
  ));
  // Ann 3: 客户提供成本参数
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P3',核心关注点:'ROI回报',痛点:'人工成本9000元/月',响应状态:'ROI计算中',画像完整度:'80%'}),
    {currentStage:'P3',completed:['成本数据获取','ROI计算','价值量化'],pending:['案例验证','信任建立','试菜邀约'],stageChange:null},
    [{label:'生成ROI表',icon:'file-text'},{label:'更新画像',icon:'edit'}],
    ['ROI回本测算卡','人工成本对分析表'],
    {suggestion:'展示ROI计算后提供案例验证',reason:'客户已提供数据，需要量化价值回报'},
    {received:'客户提供人工成本：9000元/月',analysis:'客户愿意提供成本数据，说明对ROI算账方式认可。年人工成本10.8万，约等于设备价格的XX%。',updates:['痛点→人工成本9000/月','画像完整度80%','ROI计算完成'],stageChange:null,recommendedAction:'展示ROI结果，提供案例验证'}
  ));
  // Ann 4: 客户对ROI表示质疑
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P3',核心关注点:'可靠性',痛点:'人工成本9000元/月',响应状态:'信任建设中',画像完整度:'80%'}),
    {currentStage:'P3',completed:['ROI展示','信任疑虑识别'],pending:['案例提供','试菜邀约','再次跟进'],stageChange:null},
    [{label:'准备案例',icon:'file-text'},{label:'邀约试菜',icon:'calendar-plus'}],
    ['快餐门店成功案例集','试菜邀约话术模板'],
    {suggestion:'提供同规模案例验证，邀约试菜',reason:'客户对理论计算有疑虑，需要实际案例支撑'},
    {received:'客户质疑：理想状态，万一达不到？',analysis:'检测到信任疑虑。客户不是拒绝产品，而是对承诺的确定性有顾虑。需要案例验证+体验邀约双重背书。',updates:['关注→可靠性','状态→信任建设'],stageChange:null,recommendedAction:'提供案例+邀约试菜'}
  ));
  // Ann 5: 销售提供案例并邀约试菜
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P3',核心关注点:'可靠性',痛点:'人工成本9000元/月',客户意向:'正向（愿意看案例）',响应状态:'跟进中',画像完整度:'85%'}),
    {currentStage:'P3',completed:['ROI展示','案例提供','试菜邀约'],pending:['案例反馈','试菜确认'],stageChange:null},
    [{label:'发送案例',icon:'send'},{label:'跟进试菜',icon:'calendar-plus'}],
    ['快餐门店成功案例','试菜邀约模板'],
    {suggestion:'客户同意看案例后跟进试菜邀约',reason:'案例+体验双重验证最有效'},
    {received:'客户同意看案例',analysis:'异议化解取得进展。客户从\'太贵了\'到愿意看案例，说明ROI算账策略有效。下一步推进试菜邀约。',updates:['意向→正向','案例已发送'],stageChange:null,recommendedAction:'跟进案例反馈，推进试菜邀约'}
  ));
  // Ann 6: 结尾
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P3',核心关注点:'可靠性',痛点:'人工成本9000元/月',客户意向:'正向',方案状态:'案例已发+试菜邀约',响应状态:'跟进中',画像完整度:'85%'}),
    {currentStage:'P3',completed:['异议识别','ROI算账','案例提供','试菜邀约'],pending:['案例反馈','试菜确认','报价'],stageChange:null},
    [{label:'跟进反馈',icon:'message-square'},{label:'准备报价',icon:'file-text'}],
    ['ROI回本测算表','试菜体验邀约'],
    {suggestion:'等待客户看完案例后跟进，准备试菜预约',reason:'异议化解进入收尾阶段，下一步是体验转化'},
    {received:'客户同意看案例并考虑试菜',analysis:'异议化解全流程：价格异议→ROI算账→案例验证→试菜邀约。客户从\'太贵了\'转向愿意深入了解价值。',updates:['全流程→价格→ROI→案例→试菜','状态→待跟进反馈'],stageChange:null,recommendedAction:'跟进案例反馈，推进试菜'}
  ));

  while (anns.length < msgs.length) anns.push(null);
  return {id:'4-1', stageId:'P4', name:'价格异议化解',
    painPoint:'客户说"太贵了"时，新销售容易直接降价或解释成本，反而削弱价格锚点。需要先识别客户说贵的真实原因。',
    highlights:['自动识别异议类型（价格/竞品/信任）；','推荐最优应对话术策略；','引导客户从价格转向长期成本视角；','实时ROI测算支持；','提供案例验证和试菜邀约双重背书。'],
    demoGoal:'展示 AI 如何帮助销售科学应对价格异议——不是降价，而是转换价值认知。',
    messages: msgs, annotations: anns};
}

// ================================================================
// SCENARIO 6-1: 智能报价与成交推进
// ================================================================
function build61() {
  var msgs = [
    {type:'customer', content:'那你给我报个正式价格吧。', sender:'王总'},
    {type:'ai-hint', content:'检测到报价请求。\n报价前缺失字段：配置版本、数量、收货城市、是否含安装培训、是否需要发票。'},
    {type:'sales', content:'好的王总，我给您出正式报价前，先确认几个信息，避免报价后反复调整：第一，您目前先按一台G3标准版考虑对吗？第二，收货地址是在杭州这边吗？第三，安装培训要不要包含？发票是开公司还是个人？', sender:'小陈'},
    {type:'customer', content:'对，先按一台。地址杭州，安装培训要包含，发票也要。', sender:'王总'},
    {type:'ai-hint', content:'✓ 报价字段已补全 ✓ 可以创建报价申请 ✓ 建议：准备报价+备选方案'},
    {type:'sales', content:'好的，我整理一下正式报价发给您。G3标准版加安装培训，总计X万。另外如果预算考虑，也可以看看G2基础版，核心功能一样，功率小一些，适合200单左右的场景。', sender:'小陈'},
    {type:'customer', content:'G2和G3差多少钱？', sender:'王总'},
    {type:'ai-hint', content:'✓ 客户在比价不同配置 ✓ 建议：价格阶梯展示+贷款方案'},
    {type:'sales', content:'G2基础版比G3标准版便宜约Y万，主要区别是炒锅容量和出餐速度。按您200多单的量，G3的产能余量会更从容一些。另外我们也有分期方案，首付Z万起。', sender:'小陈'},
    {type:'customer', content:'分期怎么算？首付多少？', sender:'王总'},
    {type:'ai-hint', content:'✓ 客户对分期有兴趣 ✓ 建议：提供2-3种分期方案 ✓ 准备促成'},
    {type:'sales', content:'我们和几家银行有合作，一般首付30%起，分12或24期。我算两套方案一起发给您——一个是全款价，一个是分期价，您对比一下。另外方便的话，可以约个时间来试菜，实际感受一下设备的出餐效果。', sender:'小陈'},
    {type:'customer', content:'好，你把方案都发来，我看看。', sender:'王总'},
  ];

  var anns = [null];
  // Ann 1: 客户要求报价
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P5→P6',客户意向:'正向',响应状态:'报价请求',画像完整度:'80%'}),
    {currentStage:'P5→P6',completed:['报价请求识别','缺失字段检测'],pending:['配置确认','数量确认','收货信息','其他需求'],stageChange:'P5→P6'},
    [{label:'检查报价条件',icon:'check-square'},{label:'准备报价模板',icon:'file-text'}],
    ['报价前检查清单','G3标准版报价模板'],
    {suggestion:'先确认报价所需全部字段再出价',reason:'避免报价后反复调整影响专业度'},
    {received:'客户要求正式报价',analysis:'检测到报价请求。报价前缺失关键字段：配置版本、数量、收货城市、安装培训、发票。需要先补全这些信息。',updates:['状态→报价请求','阶段→P5→P6'],stageChange:'P5→P6',recommendedAction:'确认报价所需字段后再出价'}
  ));
  // Ann 2: 销售确认报价字段
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P6',客户意向:'正向',响应状态:'报价字段确认中',画像完整度:'85%'}),
    {currentStage:'P6',completed:['字段确认','配置确认','地址确认'],pending:['报价生成','备选方案','分期方案'],stageChange:null},
    [{label:'等待客户回复',icon:'bell'}],
    [],
    {suggestion:'等待客户确认报价信息后生成报价',reason:'已问清需求，等待客户补充完整'},
    {received:'销售确认报价所需信息',analysis:'销售已按AI建议确认了配置版本、数量、地址、安装培训、发票等关键字段。等待客户回复。',updates:['待补全→配置/数量/地址/安装/发票','状态→字段确认中'],stageChange:null,recommendedAction:'获取完整信息后生成报价'}
  ));
  // Ann 3: 客户补充了信息
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P6',客户意向:'正向',响应状态:'报价准备就绪',画像完整度:'88%'}),
    {currentStage:'P6',completed:['报价字段补全','配置确认','收货确认'],pending:['报价生成','备选方案','分期方案'],stageChange:null},
    [{label:'生成报价',icon:'file-text'},{label:'准备备选方案',icon:'list'}],
    ['G3标准版报价模板','G2基础版备选方案'],
    {suggestion:'生成正式报价+备选方案',reason:'字段已齐全，准备报价'},
    {received:'客户确认报价信息',analysis:'报价字段已全部获取。配置G3标准版×1台，安装培训含，发票需提供，收货杭州。可以生成正式报价和建议备选方案。',updates:['配置→G3×1台','地址→杭州','安装培训→含','发票→需'],stageChange:null,recommendedAction:'生成报价+备选方案'}
  ));
  // Ann 4: 客户对比配置
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P6',客户意向:'正向（比价中）',响应状态:'配置对比中',画像完整度:'90%'}),
    {currentStage:'P6',completed:['报价字段','报价生成','备选方案提供'],pending:['配置决策','分期方案','促成'],stageChange:null},
    [{label:'对比分析',icon:'bar-chart'},{label:'准备分期方案',icon:'file-text'}],
    ['G2 vs G3对比表','分期方案说明'],
    {suggestion:'展示价格阶梯+分期方案，帮客户决策',reason:'客户在比价，说明有购买意向'},
    {received:'客户询问G2和G3差价',analysis:'客户在比价不同配置，这是积极信号——说明客户在认真考虑购买。建议提供价格阶梯对比+分期方案。',updates:['意向→比价中（正向）','推荐→G3+备选G2'],stageChange:null,recommendedAction:'展示价格阶梯+分期方案'}
  ));
  // Ann 5: 客户问分期
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P6',客户意向:'正向（分期有兴趣）',响应状态:'促成中',画像完整度:'92%'}),
    {currentStage:'P6',completed:['报价生成','备选方案','分期方案准备'],pending:['方案发送','决策跟进','试菜邀约'],stageChange:null},
    [{label:'发送报价',icon:'send'},{label:'邀约试菜',icon:'calendar-plus'}],
    ['G3全款vs分期对比','快餐门店ROI测算'],
    {suggestion:'发送全款+分期两套方案，同时邀约试菜',reason:'客户对分期感兴趣，是成交信号'},
    {received:'客户询问分期方案',analysis:'客户询问分期首付和方案，这是强烈购买信号。建议提供2-3种方案（全款/分期），同时推进试菜邀约。',updates:['意向→分期有兴趣','状态→促成阶段'],stageChange:null,recommendedAction:'发送多套方案+试菜邀约'}
  ));
  // Ann 6: 结尾
  anns.push(ann(
    fillFields(emptyFields(), {客户来源:'官网留资',细分类别:'快餐',日单量:'200-300单',推荐产品:'G3标准版',当前阶段:'P6',客户意向:'正向（方案已发）',响应状态:'等待决策',方案状态:'全款+分期方案已发',画像完整度:'95%'}),
    {currentStage:'P6',completed:['报价请求','字段确认','报价生成','备选方案','分期方案','方案发送'],pending:['客户决策','试菜确认','合同'],stageChange:null},
    [{label:'跟进决策',icon:'message-square'},{label:'准备合同',icon:'file-text'}],
    ['G3全款vs分期方案','试菜体验邀约'],
    {suggestion:'48小时后跟进客户决策，推进试菜',reason:'多套方案已发，给客户决策时间'},
    {received:'销售发送全款+分期两套方案',analysis:'从报价请求→字段确认→报价生成→备选方案→分期方案→方案发送，AI完成全流程报价支撑。客户从模糊的\'报个价\'到明确的多方案对比。',updates:['方案→已发送','意向→正向','全流程→报价→方案→分期'],stageChange:null,recommendedAction:'48h后跟进决策，推进试菜'}
  ));

  while (anns.length < msgs.length) anns.push(null);
  return {id:'6-1', stageId:'P6', name:'智能报价与成交推进',
    painPoint:'客户说"给我报个价"，但如果配置、地址、服务范围不清楚，报价容易反复修改，影响专业度。',
    highlights:['自动检测报价前缺失字段；','提醒销售补全信息后再报价；','自动推荐备选方案和分期方案；','实时分析客户决策信号；','推进试菜体验加速成交。'],
    demoGoal:'展示 AI 如何帮助销售科学应对报价请求——不是盲目出价，而是有策略地推进成交。',
    messages: msgs, annotations: anns};
}

// ===== WRITE =====
var scenarios = [build11(), build41(), build61()];
scenarios.forEach(function(s) {
  fs.writeFileSync(PATH + s.id + '.json', JSON.stringify(s, null, 2));
  console.log('Written: ' + s.id + '.json (' + s.messages.length + ' msgs, ' + s.annotations.filter(Boolean).length + ' anns)');
});

// ===== UPDATE MANIFEST =====
var manifest = JSON.parse(fs.readFileSync(PATH + 'manifest.json', 'utf-8'));
scenarios.forEach(function(s) {
  if (manifest.ids.indexOf(s.id) < 0) manifest.ids.push(s.id);
});
manifest.ids.sort();
fs.writeFileSync(PATH + 'manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest updated: ' + manifest.ids.length + ' scenarios total');
