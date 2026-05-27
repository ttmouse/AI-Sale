// 阶段 P1 场景数据 - 自动生成
globalThis.SCENARIOS_P1 = [
{
      id: '1-1',
      stageId: 'P1',
      name: '抖音线索智能开场',
      painPoint: '抖音线索往往兴趣来得快、流失也快。客户可能只是刷到视频点了咨询，并不一定有明确采购计划。销售如果一上来发产品册或报价，很容易把客户聊死。 ',
      highlights: ["\u81ea\u52a8\u8bc6\u522b\u7ebf\u7d22\u6765\u6e90\uff1a\u6296\u97f3\uff1b", "\u5224\u65ad\u5ba2\u6237\u5c5e\u4e8e\u201c\u8f7b\u5174\u8da3\u7ebf\u7d22\u201d\uff1b", "\u63a8\u8350\u8f7b\u91cf\u3001\u4e0d\u538b\u8feb\u7684\u5f00\u573a\u8bdd\u672f\uff1b", "\u5f15\u5bfc\u5ba2\u6237\u5148\u8bf4\u95e8\u5e97\u72b6\u6001\uff1b", "\u81ea\u52a8\u521b\u5efa\u5ba2\u6237\u521d\u59cb\u6863\u6848\uff1b", "\u6807\u8bb0\u5ba2\u6237\u6765\u6e90\u4e3a\u201c\u77ed\u89c6\u9891\u7ebf\u7d22\u201d\u3002"],
      demoGoal: '让客户看到：销售刚拿到一个抖音线索，AI 能帮助销售用更自然的方式开场，而不是直接推销。 ',
      messages: [
        sys('新线索：抖音私信留资 客户备注：想了解智能炒菜机 客户手机号：已留资 当前状态：未建立有效沟通'),
        aiRecommend('A\\. 轻量破冰型 B\\. 需求确认型 C\\. 视频承接型',[],0),
        sales('王总您好，我是优特智厨的小陈，看到您刚才在抖音上关注了智能炒菜设备。我先不打扰您太久，想简单了解一下，您现在是已经有门店想升级后厨，还是正在筹备新店？'),
        customer('我们现在有个快餐店，想看看这种设备到底适不适合。'),
        aiRecommend('可以继续追问门店类型、日单量、后厨人员，不建议马上报价。 销售点击推荐话术。',[],0),
        sales('明白，快餐店是比较适合这类设备的。我先了解两个信息，方便判断是否适合您：您现在一天大概多少单？后厨有几个炒锅师傅？ ---'),
      ],
      annotations: [
        null,
        annot('客户画像已创建\n\n客户来源：抖音线索\n客户大类：餐饮客户\n细分类别：社餐 / 快餐简餐\n门店状态：已有门店\n关注产品：智能炒菜设备\n当前意向：初步了解\n画像完整度：10% → 30%',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('当前销售阶段：P1 线索接入\n\n已完成：\n√ 识别客户来源\n√ 完成初次破冰\n√ 初步确认客户为快餐门店\n\n待确认：\n□ 日单量\n□ 后厨人员\n□ 预算区间\n□ 决策角色\n□ 采购周期\n\n建议阶段：\n继续停留在 P1/P2 之间，先完成需求确认。',{currentStage:'P1',completed:["\u8bc6\u522b\u5ba2\u6237\u6765\u6e90", "\u5b8c\u6210\u521d\u6b21\u7834\u51b0", "\u521d\u6b65\u786e\u8ba4\u5ba2\u6237\u4e3a\u5feb\u9910\u95e8\u5e97"],pending:["\u65e5\u5355\u91cf", "\u540e\u53a8\u4eba\u5458", "\u9884\u7b97\u533a\u95f4", "\u51b3\u7b56\u89d2\u8272", "\u91c7\u8d2d\u5468\u671f"],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('可创建动作：\n[创建客户档案]\n[创建首次跟进任务]\n[标记线索来源：抖音]',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('推荐资料：\n1. 快餐门店智能炒菜机应用案例\n2. G3 产品简版介绍\n3. 快餐店后厨降本场景卡',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('建议下一步：\n继续追问日单量和后厨人员。\n\n推荐原因：\n目前客户只是表达“想看看是否适合”，还不能直接进入报价或方案阶段。',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
      ],
    },,
{
      id: '1-2',
      stageId: 'P1',
      name: '展会客户回访破冰',
      painPoint: '展会客户通常一天接触很多供应商，回访时客户可能已经记不清具体沟通内容。销售需要快速唤醒客户记忆，并把展会上的短暂沟通转化为后续销售机会。 ',
      highlights: ["\u8bc6\u522b\u7ebf\u7d22\u6765\u6e90\uff1a\u5c55\u4f1a\uff1b", "\u5173\u8054\u5c55\u4f1a\u6c9f\u901a\u5907\u6ce8\uff1b", "\u81ea\u52a8\u751f\u6210\u56de\u8bbf\u8bdd\u672f\uff1b", "\u63d0\u9192\u9500\u552e\u627f\u63a5\u73b0\u573a\u4ea4\u6d41\u5185\u5bb9\uff1b", "\u63a8\u8350\u53d1\u9001\u73b0\u573a\u6f14\u793a\u89c6\u9891\u6216\u4ea7\u54c1\u8d44\u6599\uff1b", "\u521b\u5efa\u5c55\u4f1a\u5ba2\u6237\u8ddf\u8fdb\u4efb\u52a1\u3002"],
      demoGoal: '展示 AI 能帮助销售把“展会名片”转化为有效客户跟进。 ',
      messages: [
        sys('线索来源：上海餐饮设备展 展会备注：客户现场关注 G3 炒菜机，提到自己有 3 家快餐门店。 建议今天完成首次回访。'),
        aiRecommend('A\\. 展会记忆唤醒型 B\\. 直接需求确认型 C\\. 资料跟进型',[],0),
        sales('李总您好，我是优特智厨的小陈。昨天在上海餐饮设备展上我们聊过 G3 炒菜机，您当时提到现在有 3 家快餐门店，想看看能不能降低后厨对炒锅师傅的依赖。我今天跟您简单回访一下，看是否方便继续了解？'),
        customer('哦，有印象。你们那个设备能做哪些菜？'),
        aiRecommend('客户开始关注产品适配性，可先回答菜品范围，再反问客户门店主力菜品。',[],0),
        sales('我们这类设备更适合标准化程度比较高的快餐、小炒、盖饭类菜品。比如宫保鸡丁、鱼香肉丝、青椒肉丝、番茄炒蛋这类都比较常见。您现在门店主力菜品大概是哪几类？'),
        customer('主要是盖饭和小炒，出餐要快。 ---'),
      ],
      annotations: [
        null,
        annot('客户来源：餐饮设备展\n客户大类：社餐\n细分类别：快餐 / 盖饭 / 小炒\n门店数量：3 家\n关注点：菜品适配、出餐速度、降低厨师依赖\n当前意向：较高\n画像完整度：20% → 45%',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('当前阶段：P1 线索接入 → P2 需求确认\n\n阶段变化原因：\n客户已确认门店数量、业态、主力菜品和初步关注点。\n\n待确认：\n□ 日单量\n□ 后厨人员数量\n□ 是否有扩店计划\n□ 决策人是否本人',{currentStage:'P1',completed:[],pending:["\u65e5\u5355\u91cf", "\u540e\u53a8\u4eba\u5458\u6570\u91cf", "\u662f\u5426\u6709\u6269\u5e97\u8ba1\u5212", "\u51b3\u7b56\u4eba\u662f\u5426\u672c\u4eba"],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('可创建动作：\n[创建展会客户跟进任务]\n[关联展会备注]\n[生成客户需求摘要]',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('推荐知识卡：\n1. G3 适配菜品清单\n2. 快餐盖饭客户案例\n3. 标准菜谱库介绍\n4. 高峰期出餐效率说明卡',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('建议动作：\n继续追问日单量、门店出餐高峰、现有炒锅师傅数量。\n\n推荐话术：\n李总，您这类盖饭和小炒门店，关键要看高峰期出餐压力。我想了解一下，您单店一天大概多少单？午晚高峰一般会不会压单？',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        null,
      ],
    },,
{
      id: '1-3',
      stageId: 'P1',
      name: '老客户转介绍开场',
      painPoint: '转介绍客户有一定信任基础，但销售如果处理不好，容易浪费熟人背书。开场既要承接介绍人信任，又不能显得过度销售。 ',
      highlights: ["\u8bc6\u522b\u5ba2\u6237\u6765\u6e90\uff1a\u8001\u5ba2\u6237\u8f6c\u4ecb\u7ecd\uff1b", "\u81ea\u52a8\u5f15\u7528\u4ecb\u7ecd\u4eba\u5173\u7cfb\uff1b", "\u751f\u6210\u4fe1\u4efb\u578b\u5f00\u573a\u8bdd\u672f\uff1b", "\u63d0\u9192\u9500\u552e\u4e0d\u8981\u9a6c\u4e0a\u62a5\u4ef7\uff1b", "\u81ea\u52a8\u5efa\u7acb\u5ba2\u6237\u5173\u8054\u5173\u7cfb\uff1b", "\u63a8\u8350\u53d1\u9001\u76f8\u4f3c\u5ba2\u6237\u6848\u4f8b\u3002"],
      demoGoal: '展示 AI 如何帮助销售利用老客户背书，提高新客户破冰成功率。 ',
      messages: [
        sys('新客户来源：老客户张总推荐 张总备注：客户王总准备开一家社区快餐店，想了解炒菜机。 推荐策略：信任承接 \\+ 轻需求确认。'),
        sales('王总您好，我是优特智厨的小陈，是张总推荐我联系您的。张总说您这边准备做一个社区快餐店，想提前了解一下智能炒菜设备。我先简单跟您对接一下，看看您这个店型适不适合。'),
        customer('对，我还在筹备，主要是想看看这种设备能不能少请一个厨师。'),
        aiRecommend('客户已表达核心痛点：减少厨师。建议进入筹备店需求确认。',[],0),
        sales('明白，您这个关注点很关键。筹备期提前规划后厨设备是比较合适的。我先了解一下，您预计门店面积多大？主要卖快餐套餐，还是小炒现炒？ ---'),
      ],
      annotations: [
        null,
        annot('客户来源：老客户转介绍\n介绍人：张总\n客户大类：社餐\n细分类别：社区快餐 / 新店筹备\n门店状态：筹备中\n核心关注：减少厨师配置\n当前信任基础：较高\n画像完整度：15% → 40%',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('当前阶段：P1 线索接入 → P2 需求确认\n\n阶段判断：\n客户已明确筹备状态和初步痛点，可进入需求确认。\n\n待确认：\n□ 门店面积\n□ 主营品类\n□ 预计日单量\n□ 预算区间\n□ 开业时间',{currentStage:'P1',completed:[],pending:["\u95e8\u5e97\u9762\u79ef", "\u4e3b\u8425\u54c1\u7c7b", "\u9884\u8ba1\u65e5\u5355\u91cf", "\u9884\u7b97\u533a\u95f4", "\u5f00\u4e1a\u65f6\u95f4"],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('可创建动作：\n[创建客户档案]\n[关联介绍人]\n[创建筹备期客户跟进任务]',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('推荐知识卡：\n1. 新店筹备后厨设备规划卡\n2. 社区快餐门店案例\n3. 单店少人化配置方案',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
        annot('建议下一步：\n确认门店面积、主营品类、预计开业时间。\n\n推荐原因：\n筹备期客户还未形成明确采购方案，需要先帮助其建立后厨配置思路。',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'}),
      ],
    },,
{
      id: '1-4',
      stageId: 'P1',
      name: '客户沉默后的智能唤醒',
      painPoint: '很多客户加了微信后不回复，销售不知道什么时候再跟、用什么理由跟、发什么内容才不显得打扰。 ',
      highlights: ["\u81ea\u52a8\u8bc6\u522b\u5ba2\u6237\u6c89\u9ed8\u65f6\u957f\uff1b", "\u6839\u636e\u5ba2\u6237\u6765\u6e90\u63a8\u8350\u5524\u9192\u65b9\u5f0f\uff1b", "\u751f\u6210\u4f4e\u538b\u8ddf\u8fdb\u8bdd\u672f\uff1b", "\u63a8\u8350\u5408\u9002\u8d44\u6599\uff1b", "\u521b\u5efa\u540e\u7eed\u8ddf\u8fdb\u8282\u594f\uff1b", "\u6807\u8bb0\u5ba2\u6237\u54cd\u5e94\u72b6\u6001\u3002"],
      demoGoal: '展示 AI 能帮助销售有节奏地唤醒客户，而不是盲目追问。 ',
      messages: [
        sys('客户已 48 小时未回复 客户来源：官网留资 留资内容：想了解炒菜机价格 建议：不要直接催促，可用“资料补充 \\+ 轻问题”唤醒。'),
        aiRecommend('A\\. 资料补充型 B\\. 案例唤醒型 C\\. 价格澄清型',[],0),
        sales('王总您好，我把您之前关注的炒菜机资料简单整理了一下。不同门店适合的型号差异比较大，如果您方便的话，我可以按您的门店类型给您发对应版本，避免资料太多看起来费时间。'),
        customer('我是做快餐的，主要想知道大概多少钱。'),
        aiRecommend('客户被唤醒，并明确关注价格。建议先确认门店情况，再进入价格区间解释。',[],0),
        sales('明白，快餐店适配度比较高。价格主要和型号、配置、菜品需求有关。我先了解一下您一天大概多少单、后厨现在几个人，我再给您一个更接近实际的配置范围。 ---'),
      ],
      annotations: [
        null,
        annot('客户状态：已唤醒\n客户来源：官网留资\n客户大类：社餐\n细分类别：快餐\n关注点：价格\n响应状态：48小时沉默后重新互动\n画像完整度：10% → 30%',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'},[
          {id:'tag_silent',type:'newTag',label:'打标建议',value:'沉默客户',desc:'系统识别：客户已48小时未回复，建议标记为「沉默客户」',action:'标记'}
        ]),
        annot('当前阶段：P1 线索接入\n状态变化：沉默客户 → 有效对话恢复\n\n待确认：\n□ 日单量\n□ 后厨人员\n□ 预算\n□ 是否已有门店',{currentStage:'P1',completed:[],pending:["\u65e5\u5355\u91cf","\u540e\u53a8\u4eba\u5458","\u9884\u7b97","\u662f\u5426\u5df2\u6709\u95e8\u5e97"],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'},[
          {id:'source_confirm',type:'fieldUpdate',label:'来源确认',oldValue:'官网留资',newValue:'官网留资·价格敏感型',desc:'根据客户首句「想知道多少钱」，AI推断客户属于价格敏感型，建议合并标注',action:'采纳'}
        ]),
        annot('可创建动作：\n[更新客户响应状态]\n[创建下一次跟进提醒]\n[标记客户关注点：价格]',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'},[
          {id:'field_daily',type:'newField',label:'预估日单量',value:'待询问',desc:'客户未直接回答日单量，AI根据「快餐+价格敏感」特征预估为150-300单/天，待销售确认',action:'确认'}
        ]),
        annot('推荐资料：\n1. 快餐门店基础配置价格说明\n2. 价格与配置关系说明卡\n3. ROI 回本测算卡',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'},[]),
        annot('建议：\n不要直接给最低价或笼统报价。\n先确认门店规模和需求，再给价格区间，避免客户只按价格做判断。',{currentStage:'P1',completed:[],pending:[],stageChange:null},[],[],{suggestion:'继续推进',reason:'按流程'},[
          {id:'tag_price_sensitive',type:'newTag',label:'打标建议',value:'价格敏感型',desc:'客户首句即问价格，建议标记为「价格敏感型」以便后续差异化跟进',action:'标记'}
        ]),
      ],
    },,
];
