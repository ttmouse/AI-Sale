import json, os

PATH = 'scenes/scene-12-workbench/scenarios/'

ALL_F = ['客户来源','沉默时长','初始意向','客户大类','细分类别','核心关注点','日单量','后厨人员','痛点','菜品结构','推荐产品','当前阶段','响应状态','客户意向','方案状态','画像完整度']

def ef():
    return {k:{'value':None,'status':'empty'} for k in ALL_F}

def ff(base, vals):
    for k,v in vals.items():
        base[k] = {'value':v,'status':'current'}
    return base

def ann(fields, progress, flows, cards, nextAction, agentLog, pc=None):
    r = {'fields':fields,'progress':progress,'flows':flows,'cards':cards,'nextAction':nextAction,'agentLog':agentLog}
    if pc: r['pendingConfirm'] = pc
    return r

# ========== 1-1 抖音线索智能开场 ==========
msg11 = [
    {'type':'system','content':'新线索：抖音私信留资\n客户备注：想了解智能炒菜机\n客户手机号：已留资\n当前状态：未建立有效沟通'},
    {'type':'ai-recommend','content':'A. 轻量破冰型 B. 需求确认型 C. 视频承接型'},
    {'type':'sales','content':'王总您好，我是优特智厨的小陈，看到您刚才在抖音上关注了智能炒菜设备。我先不打扰您太久，简单了解一下：您现在是已经有门店想升级后厨，还是正在筹备开店？','sender':'小陈'},
    {'type':'customer','content':'我们现在有个快餐店，想看看这种设备到底适不适合。','sender':'王总'},
    {'type':'ai-hint','content':'确认客户已有门店 业态为快餐 关注设备适用性'},
    {'type':'sales','content':'明白，快餐店是比较适合的。我先了解两个信息：您现在一天大概多少单？后厨有几个炒锅师傅？','sender':'小陈'},
    {'type':'customer','content':'一天200多单，两个炒锅师傅，有时候出不来。','sender':'王总'},
    {'type':'ai-hint','content':'日单量200+ 2名师傅 痛点：出餐瓶颈 画像完整度提升'},
    {'type':'sales','content':'好的。200多单两位师傅确实比较紧张。这个场景用我们的G3标准版会比较适合。要不要我给您发一份快餐门店的配置说明看看？','sender':'小陈'},
    {'type':'customer','content':'行，你先发来看看。','sender':'王总'},
    {'type':'ai-recommend','content':'客户意向正向。建议发送资料后48小时跟进反馈。'},
    {'type':'sales','content':'好的，我马上把资料发您。您看完如果有兴趣，我们可以约个时间电话聊几分钟。','sender':'小陈'},
    {'type':'customer','content':'好的，我先看看。','sender':'王总'},
]

ann11 = [None]
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','响应状态':'新线索','画像完整度':'10%'}),
    {'currentStage':'P1','completed':['线索接收','来源识别','意向识别'],'pending':['客户唤醒','业态确认','需求挖掘'],'stageChange':None},
    [{'label':'创建跟进任务','icon':'calendar-plus'},{'label':'标记来源：抖音','icon':'tag'}],
    ['抖音线索开场话术模板','轻量破冰策略卡'],
    {'suggestion':'发送轻量破冰话术','reason':'抖音线索兴趣快流失也快'},
    {'received':'新线索从抖音API接入','analysis':'新线索来源为抖音私信留资，意向为了解炒菜机。推荐轻量破冰。','updates':['来源→抖音','意向→了解炒菜机'],'stageChange':None,'recommendedAction':'发送破冰话术'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','响应状态':'破冰话术已发送','画像完整度':'15%'}),
    {'currentStage':'P1','completed':['线索接收','来源识别','话术发送'],'pending':['客户回复','业态确认','需求挖掘'],'stageChange':None},
    [{'label':'等待客户回复','icon':'bell'}],[],{'suggestion':'等待客户回复后分析','reason':'话术已发送'},
    {'received':'销售发出破冰话术','analysis':'销售已发送轻量破冰话术。','updates':['话术已发送'],'stageChange':None,'recommendedAction':'等待客户回复'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','客户大类':'社餐','细分类别':'快餐','核心关注点':'设备适用性','响应状态':'已回复','画像完整度':'35%'}),
    {'currentStage':'P1','completed':['客户唤醒','业态识别','关注点识别'],'pending':['日单量确认','人员确认'],'stageChange':None},
    [{'label':'更新画像','icon':'edit'},{'label':'创建跟进','icon':'bell'}],['快餐门店适配说明卡'],
    {'suggestion':'追问日单量和后厨人员','reason':'需确认门店规模'},
    {'received':'客户回复：已有快餐店，想知道设备是否适合','analysis':'客户被成功触达。提取：已有门店，业态快餐，关注适用性。','updates':['大类→社餐','业态→快餐','关注→设备适用性'],'stageChange':None,'recommendedAction':'追问日单量和人员'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','客户大类':'社餐','细分类别':'快餐','核心关注点':'设备适用性','响应状态':'需求确认中','画像完整度':'35%'}),
    {'currentStage':'P1','completed':['客户唤醒','业态识别'],'pending':['日单量','人员','需求匹配'],'stageChange':None},
    [{'label':'等待客户回复','icon':'bell'}],[],{'suggestion':'等待客户提供数据','reason':'已追问信息'},
    {'received':'销售追问门店运营数据','analysis':'销售按AI建议追问。等待客户反馈。','updates':[],'stageChange':None,'recommendedAction':'等待客户回复'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','客户大类':'社餐','细分类别':'快餐','核心关注点':'出餐效率','日单量':'200+单','后厨人员':'2名炒锅师傅','痛点':'午高峰出餐瓶颈','响应状态':'需求确认中','画像完整度':'60%'}),
    {'currentStage':'P1','completed':['日单量确认','人员确认','痛点识别'],'pending':['产品推荐','方案发送'],'stageChange':None},
    [{'label':'推荐产品','icon':'file-text'},{'label':'更新画像','icon':'edit'}],['G3标准版产品卡','快餐门店配置方案'],
    {'suggestion':'推荐G3标准版，发配置说明','reason':'200单+2名师傅场景适合G3'},
    {'received':'客户回复：200多单，2个师傅，出不来','analysis':'客户提供运营数据。AI匹配G3标准版。','updates':['日单量→200+','人员→2名','痛点→出餐瓶颈','完整度60%'],'stageChange':None,'recommendedAction':'推荐G3并发送方案'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','客户大类':'社餐','细分类别':'快餐','核心关注点':'出餐效率','日单量':'200+单','后厨人员':'2名炒锅师傅','痛点':'午高峰出餐瓶颈','推荐产品':'G3标准版','响应状态':'方案已推荐','画像完整度':'65%'}),
    {'currentStage':'P1','completed':['画像建设','产品匹配','方案推荐'],'pending':['方案发送','客户反馈'],'stageChange':None},
    [{'label':'发送方案','icon':'send'}],['G3标准版产品卡'],
    {'suggestion':'客户同意后发送配置方案','reason':'客户意向正向'},
    {'received':'销售推荐G3标准版','analysis':'AI匹配G3标准版。销售按建议推荐。','updates':['推荐→G3标准版'],'stageChange':None,'recommendedAction':'客户同意后发送方案'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','客户大类':'社餐','细分类别':'快餐','核心关注点':'出餐效率','日单量':'200+单','后厨人员':'2名炒锅师傅','痛点':'午高峰出餐瓶颈','推荐产品':'G3标准版','响应状态':'方案已推荐','客户意向':'正向','画像完整度':'70%'}),
    {'currentStage':'P1','completed':['画像建设','产品匹配','方案推荐'],'pending':['方案发送','跟进反馈'],'stageChange':None},
    [{'label':'发送方案','icon':'send'},{'label':'设置跟进','icon':'calendar-plus'}],['G3配置清单','快餐门店ROI测算'],
    {'suggestion':'发送方案并设置48小时跟进','reason':'客户同意看方案'},
    {'received':'客户同意看方案','analysis':'客户意向正向。从抖音线索到方案推送完成。','updates':['意向→正向'],'stageChange':None,'recommendedAction':'发送方案，48h后跟进'}))
ann11.append(ann(ff(ef(),{'客户来源':'抖音私信','初始意向':'了解炒菜机','客户大类':'社餐','细分类别':'快餐','核心关注点':'出餐效率','日单量':'200+单','后厨人员':'2名炒锅师傅','痛点':'午高峰出餐瓶颈','推荐产品':'G3标准版','响应状态':'方案已推荐','客户意向':'正向','方案状态':'已发送','画像完整度':'75%'}),
    {'currentStage':'P1','completed':['线索接入','客户唤醒','画像建设','产品推荐','方案发送'],'pending':['方案反馈','深入沟通'],'stageChange':None},
    [{'label':'跟进方案反馈','icon':'message-square'}],['G3配置清单','ROI回本测算'],
    {'suggestion':'48小时后跟进方案反馈','reason':'给客户时间阅读方案'},
    {'received':'销售发送方案','analysis':'从抖音线索到方案推送完成。AI完成线索识别→话术生成→画像建设→产品匹配→方案推荐完整链路。','updates':['方案→已发送'],'stageChange':None,'recommendedAction':'48h后跟进反馈'}))
while len(ann11) < len(msg11): ann11.append(None)

# ========== 4-1 价格异议化解 ==========
msg41 = [
    {'type':'customer','content':'你们这个价格有点贵啊，我看别家好像便宜不少。','sender':'王总'},
    {'type':'ai-hint','content':'检测到异议类型：价格异议 + 竞品价格比较。不建议直接降价。建议策略：认可顾虑→转向长期成本→ROI测算。'},
    {'type':'ai-recommend','content':'A. ROI算账型 B. 竞品差异型 C. 试菜验证型'},
    {'type':'sales','content':'王总，您觉得贵是正常的，设备采购确实不能只看一次性价格。我们可以按您现在的人工成本算一笔账，您看方便吗？','sender':'小陈'},
    {'type':'customer','content':'那你怎么算？我们一个炒锅师傅差不多9000一个月。','sender':'王总'},
    {'type':'ai-hint','content':'已获得人工成本参数：9000元/月。客户愿意算账。进入ROI测算阶段。'},
    {'type':'sales','content':'一个师傅9000×12=10.8万/年。G3标准版如果能帮您分担一个师傅的工作量，一年就能省出大半台设备的钱。要不要我发一份详细的ROI测算表给您？','sender':'小陈'},
    {'type':'customer','content':'你这个算的都是理想状态吧？万一达不到呢？','sender':'王总'},
    {'type':'ai-hint','content':'检测到信任疑虑：可靠性顾虑。建议策略：案例验证 + 试菜邀约。'},
    {'type':'sales','content':'理解您的顾虑，我给您发几个实际案例——都是快餐店的，规模和您差不多。看完有兴趣欢迎来我们体验店现场试菜。','sender':'小陈'},
    {'type':'customer','content':'好，案例发来我先看看。','sender':'王总'},
    {'type':'ai-hint','content':'客户同意看案例。异议化解进展正向。可跟进试菜邀约。'},
    {'type':'sales','content':'好的，案例马上发您。另外方便的话可以约个时间来实际试菜，到时候您可以自带食材来测。','sender':'小陈'},
    {'type':'customer','content':'行，我先看案例，看完再说试菜的事。','sender':'王总'},
]

ann41 = [None]
ann41.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P3','核心关注点':'价格','响应状态':'异议处理中','画像完整度':'70%'}),
    {'currentStage':'P3','completed':['异议检测','竞品识别','策略匹配'],'pending':['成本数据获取','ROI计算','价值证明'],'stageChange':None},
    [{'label':'识别异议类型','icon':'check-square'},{'label':'匹配应对策略','icon':'file-text'}],['价格异议应对策略卡','竞品差异话术'],
    {'suggestion':'不要直接降价，先了解客户真实顾虑','reason':'价格异议可能是对价值认知不足'},
    {'received':'客户反馈：价格贵，别家便宜','analysis':'检测到价格异议+竞品比较。推荐ROI算账策略。','updates':['关注→价格','策略→ROI算账'],'stageChange':None,'recommendedAction':'用ROI算账回应'},
    [{'id':'price','label':'应对策略','oldValue':'直接降价','newValue':'ROI算账型','type':'fieldUpdate','action':'采纳','desc':'适合理性异议'}]))
ann41.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P3','核心关注点':'长期成本','响应状态':'ROI算账中','画像完整度':'72%'}),
    {'currentStage':'P3','completed':['异议识别','策略选择','ROI引导'],'pending':['人工成本获取','ROI计算','试菜邀约'],'stageChange':None},
    [{'label':'准备ROI测算','icon':'file-text'},{'label':'标记异议类型','icon':'tag'}],['快餐门店ROI算账模板'],
    {'suggestion':'获取人工成本数据后算出具体ROI','reason':'客户愿意对话'},
    {'received':'销售引导客户算ROI账','analysis':'销售按AI建议引导客户算账。需获取人工成本参数。','updates':['关注→长期成本'],'stageChange':None,'recommendedAction':'获取人工成本后计算ROI'}))
ann41.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P3','核心关注点':'ROI回报','痛点':'人工成本9000元/月','响应状态':'ROI计算中','画像完整度':'80%'}),
    {'currentStage':'P3','completed':['成本数据获取','ROI计算','价值量化'],'pending':['案例验证','信任建立','试菜邀约'],'stageChange':None},
    [{'label':'生成ROI表','icon':'file-text'},{'label':'更新画像','icon':'edit'}],['ROI回本测算卡','人工成本对比表'],
    {'suggestion':'展示ROI计算后提供案例验证','reason':'客户已提供数据'},
    {'received':'客户提供人工成本：9000元/月','analysis':'客户愿意提供成本数据。年人工成本10.8万。','updates':['痛点→人工成本9000/月','完整度80%'],'stageChange':None,'recommendedAction':'展示ROI结果+案例验证'}))
ann41.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P3','核心关注点':'可靠性','痛点':'人工成本9000元/月','响应状态':'信任建设中','画像完整度':'80%'}),
    {'currentStage':'P3','completed':['ROI展示','信任疑虑识别'],'pending':['案例提供','试菜邀约','再次跟进'],'stageChange':None},
    [{'label':'准备案例','icon':'file-text'},{'label':'邀约试菜','icon':'calendar-plus'}],['快餐门店成功案例集','试菜邀约话术模板'],
    {'suggestion':'提供同规模案例验证，邀约试菜','reason':'客户对理论计算有疑虑'},
    {'received':'客户质疑：理想状态，万一达不到？','analysis':'检测到信任疑虑。需要案例验证+体验邀约双重背书。','updates':['关注→可靠性'],'stageChange':None,'recommendedAction':'提供案例+邀约试菜'}))
ann41.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P3','核心关注点':'可靠性','痛点':'人工成本9000元/月','客户意向':'正向','响应状态':'跟进中','画像完整度':'85%'}),
    {'currentStage':'P3','completed':['ROI展示','案例提供','试菜邀约'],'pending':['案例反馈','试菜确认'],'stageChange':None},
    [{'label':'发送案例','icon':'send'},{'label':'跟进试菜','icon':'calendar-plus'}],['快餐门店成功案例','试菜邀约模板'],
    {'suggestion':'客户同意看案例后跟进试菜邀约','reason':'案例+体验双重验证最有效'},
    {'received':'客户同意看案例','analysis':'异议化解取得进展。从\u201c太贵了\u201d到愿意看案例。','updates':['意向→正向'],'stageChange':None,'recommendedAction':'跟进案例反馈，推进试菜'}))
ann41.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P3','核心关注点':'可靠性','痛点':'人工成本9000元/月','客户意向':'正向','方案状态':'案例已发+试菜邀约','响应状态':'跟进中','画像完整度':'85%'}),
    {'currentStage':'P3','completed':['异议识别','ROI算账','案例提供','试菜邀约'],'pending':['案例反馈','试菜确认','报价'],'stageChange':None},
    [{'label':'跟进反馈','icon':'message-square'},{'label':'准备报价','icon':'file-text'}],['ROI回本测算表','试菜体验邀约'],
    {'suggestion':'等待客户看完案例后跟进','reason':'异议化解进入收尾阶段'},
    {'received':'客户同意看案例并考虑试菜','analysis':'异议化解全流程：价格异议→ROI算账→案例验证→试菜邀约。','updates':['全流程→价格→ROI→案例→试菜'],'stageChange':None,'recommendedAction':'跟进案例反馈，推进试菜'}))
while len(ann41) < len(msg41): ann41.append(None)

# ========== 6-1 智能报价与成交推进 ==========
msg61 = [
    {'type':'customer','content':'那你给我报个正式价格吧。','sender':'王总'},
    {'type':'ai-hint','content':'检测到报价请求。报价前缺失字段：配置版本、数量、收货城市、安装培训、发票。'},
    {'type':'sales','content':'好的王总，出报价前先确认几个信息：第一，先按一台G3标准版对吗？第二，收货地址在杭州？第三，安装培训要不要包含？发票开公司还是个人？','sender':'小陈'},
    {'type':'customer','content':'对，先按一台。地址杭州，安装培训要包含，发票也要。','sender':'王总'},
    {'type':'ai-hint','content':'报价字段已补全。可创建报价申请。建议：准备报价+备选方案。'},
    {'type':'sales','content':'好的，我整理正式报价。G3标准版加安装培训，总计X万。另外如果预算考虑，也可以看看G2基础版。','sender':'小陈'},
    {'type':'customer','content':'G2和G3差多少钱？','sender':'王总'},
    {'type':'ai-hint','content':'客户在比价不同配置。建议：价格阶梯展示+分期方案。'},
    {'type':'sales','content':'G2比G3便宜约Y万，主要区别是炒锅容量和出餐速度。按您200多单的量，G3更从容。另外我们也有分期方案，首付Z万起。','sender':'小陈'},
    {'type':'customer','content':'分期怎么算？首付多少？','sender':'王总'},
    {'type':'ai-hint','content':'客户对分期有兴趣。建议：提供2-3种分期方案。准备促成。'},
    {'type':'sales','content':'一般首付30%起，分12或24期。我算两套方案一起发给您——全款和分期。另外方便的话可以约个时间来试菜。','sender':'小陈'},
    {'type':'customer','content':'好，你把方案都发来，我看看。','sender':'王总'},
]

ann61 = [None]
ann61.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P5','客户意向':'正向','响应状态':'报价请求','画像完整度':'80%'}),
    {'currentStage':'P5','completed':['报价请求识别','缺失字段检测'],'pending':['配置确认','数量确认','收货信息'],'stageChange':None},
    [{'label':'检查报价条件','icon':'check-square'},{'label':'准备报价模板','icon':'file-text'}],['报价前检查清单','G3标准版报价模板'],
    {'suggestion':'先确认报价所需全部字段再出价','reason':'避免反复调整影响专业度'},
    {'received':'客户要求正式报价','analysis':'检测到报价请求。缺失关键字段：配置、数量、地址、安装培训、发票。','updates':['状态→报价请求'],'stageChange':None,'recommendedAction':'确认报价字段后再出价'}))
ann61.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P6','客户意向':'正向','响应状态':'报价字段确认中','画像完整度':'85%'}),
    {'currentStage':'P6','completed':['字段确认','配置确认','地址确认'],'pending':['报价生成','备选方案','分期方案'],'stageChange':None},
    [{'label':'等待客户回复','icon':'bell'}],[],{'suggestion':'等待客户确认报价信息','reason':'已问清需求'},
    {'received':'销售确认报价所需信息','analysis':'销售已确认配置、数量、地址、安装培训、发票等字段。','updates':['待补全→配置/数量/地址/安装/发票'],'stageChange':None,'recommendedAction':'获取完整信息后生成报价'}))
ann61.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P6','客户意向':'正向','响应状态':'报价准备就绪','画像完整度':'88%'}),
    {'currentStage':'P6','completed':['报价字段补全','配置确认','收货确认'],'pending':['报价生成','备选方案','分期方案'],'stageChange':None},
    [{'label':'生成报价','icon':'file-text'},{'label':'准备备选方案','icon':'list'}],['G3标准版报价模板','G2基础版备选方案'],
    {'suggestion':'生成正式报价+备选方案','reason':'字段已齐全'},
    {'received':'客户确认报价信息','analysis':'报价字段已全部获取。配置G3×1台，安装培训含，发票需，收货杭州。','updates':['配置→G3×1台','地址→杭州'],'stageChange':None,'recommendedAction':'生成报价+备选方案'}))
ann61.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P6','客户意向':'正向','响应状态':'配置对比中','画像完整度':'90%'}),
    {'currentStage':'P6','completed':['报价字段','报价生成','备选方案提供'],'pending':['配置决策','分期方案','促成'],'stageChange':None},
    [{'label':'对比分析','icon':'bar-chart'},{'label':'准备分期方案','icon':'file-text'}],['G2 vs G3对比表','分期方案说明'],
    {'suggestion':'展示价格阶梯+分期方案','reason':'客户在比价说明有购买意向'},
    {'received':'客户询问G2和G3差价','analysis':'客户在比价不同配置，积极信号。建议提供价格阶梯+分期方案。','updates':['意向→比价中（正向）'],'stageChange':None,'recommendedAction':'展示价格阶梯+分期方案'}))
ann61.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P6','客户意向':'正向','响应状态':'促成中','画像完整度':'92%'}),
    {'currentStage':'P6','completed':['报价生成','备选方案','分期方案准备'],'pending':['方案发送','决策跟进','试菜邀约'],'stageChange':None},
    [{'label':'发送报价','icon':'send'},{'label':'邀约试菜','icon':'calendar-plus'}],['G3全款vs分期对比','快餐门店ROI测算'],
    {'suggestion':'发送全款+分期两套方案','reason':'客户对分期感兴趣是成交信号'},
    {'received':'客户询问分期方案','analysis':'客户询问分期首付，强烈购买信号。建议提供多套方案+试菜邀约。','updates':['意向→分期有兴趣'],'stageChange':None,'recommendedAction':'发送多套方案+试菜邀约'}))
ann61.append(ann(ff(ef(),{'客户来源':'官网留资','细分类别':'快餐','日单量':'200-300单','推荐产品':'G3标准版','当前阶段':'P6','客户意向':'正向','响应状态':'等待决策','方案状态':'全款+分期方案已发','画像完整度':'95%'}),
    {'currentStage':'P6','completed':['报价请求','字段确认','报价生成','备选方案','分期方案','方案发送'],'pending':['客户决策','试菜确认','合同'],'stageChange':None},
    [{'label':'跟进决策','icon':'message-square'},{'label':'准备合同','icon':'file-text'}],['G3全款vs分期方案','试菜体验邀约'],
    {'suggestion':'48小时后跟进客户决策','reason':'多套方案已发'},
    {'received':'销售发送全款+分期两套方案','analysis':'从报价请求→字段确认→报价生成→备选方案→分期方案→方案发送，AI完成全流程报价支撑。','updates':['方案→已发送','全流程→报价→方案→分期'],'stageChange':None,'recommendedAction':'48h后跟进决策，推进试菜'}))
while len(ann61) < len(msg61): ann61.append(None)

# ===== WRITE =====
scenarios = [
    {'id':'1-1','stageId':'P1','name':'抖音线索智能开场',
     'painPoint':'抖音线索往往兴趣来得快、流失也快。客户可能只是刷到视频点了咨询，并不一定有明确采购计划。销售如果一上来就发产品册或报价，很容易把客户吓跑。',
     'highlights':['自动识别线索来源和兴趣点；','匹配最合适的开场破冰话术；','根据客户回复实时更新画像；','在了解需求后才进行产品推荐；','全程记录跟进节奏和状态。'],
     'demoGoal':'展示 AI 如何帮助销售用正确的节奏跟进抖音线索，从破冰到方案推荐的完整链路。',
     'messages':msg11,'annotations':ann11},
    {'id':'4-1','stageId':'P4','name':'价格异议化解',
     'painPoint':'客户说\u201c太贵了\u201d时，新销售容易直接降价或解释成本，反而削弱价格锚点。需要先识别客户说贵的真实原因，再把价格问题转化为价值认知问题。',
     'highlights':['自动识别异议类型（价格/竞品/信任）；','推荐最优应对话术策略；','引导客户从价格转向长期成本视角；','实时ROI测算支持；','提供案例验证和试菜邀约双重背书。'],
     'demoGoal':'展示 AI 如何帮助销售科学应对价格异议——不是降价，而是转换价值认知。',
     'messages':msg41,'annotations':ann41},
    {'id':'6-1','stageId':'P6','name':'智能报价与成交推进',
     'painPoint':'客户说\u201c给我报个价\u201d，但如果配置、地址、服务范围不清楚，报价容易反复修改，影响专业度和推进效率。',
     'highlights':['自动检测报价前缺失字段；','提醒销售补全信息后再报价；','自动推荐备选方案和分期方案；','实时分析客户决策信号；','推进试菜体验加速成交。'],
     'demoGoal':'展示 AI 如何帮助销售科学应对报价请求——不是盲目出价，而是有策略地推进成交。',
     'messages':msg61,'annotations':ann61},
]

for s in scenarios:
    fpath = PATH + s['id'] + '.json'
    with open(fpath, 'w') as f:
        json.dump(s, f, ensure_ascii=False, indent=2)
    print(f'Written: {s["id"]}.json ({len(s["messages"])} msgs, {len([a for a in s["annotations"] if a])} anns)')

# Update manifest
with open(PATH + 'manifest.json') as f:
    manifest = json.load(f)
for s in scenarios:
    if s['id'] not in manifest['ids']:
        manifest['ids'].append(s['id'])
manifest['ids'].sort()
with open(PATH + 'manifest.json', 'w') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f'Manifest: {len(manifest["ids"])} scenarios')
