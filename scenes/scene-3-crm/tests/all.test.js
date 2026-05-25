import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadModule(p) { let c = readFileSync(p,'utf-8'); c = c.replace(/^const (\w+) = \(\(\)/m,'globalThis.$1 = (()'); eval(c); }
const base = join(__dirname,'..');
loadModule(join(base,'audience-engine.js'));
const _store = {};
globalThis.localStorage = { getItem:k=>_store[k]||null, setItem:(k,v)=>{_store[k]=v;}, removeItem:k=>delete _store[k], clear:()=>Object.keys(_store).forEach(k=>delete _store[k]) };
eval(readFileSync(join(base,'stage-todo-engine.js'),'utf-8').replace(/^const (\w+) = \(\(\)/m,'globalThis.$1 = (()'));

const NOW = new Date().toISOString().split('T')[0];
let p=0,f=0;
function a(c,m){c?p++:f++;process.stdout.write(c?'  ✅ ':'  ❌ ');console.log(m);}
function ae(a,e,m){const o=a===e;o?p++:f++;process.stdout.write(o?'  ✅ ':'  ❌ ');console.log(`${m} (期望:${e}, 实际:${a})`);}

console.log('\n=== 人群引擎 ===');
ae(AudienceEngine.matchCustomer({typeCode:'CHAIN'},{field:'typeCode',op:'EQ',value:'CHAIN'}),true,'EQ');
ae(AudienceEngine.matchCustomer({typeCode:'CHAIN'},{field:'typeCode',op:'IN',value:['CHAIN','HOTEL']}),true,'IN');

console.log('\n=== 存储 ===');
const a1 = StageTodoEngine.createAudience({name:'\u6D4B\u8BD5\u4EBA\u7FA4',conditions:{logic:'AND',rules:[{field:'stage',op:'EQ',value:'P1'}]}});
ae(StageTodoEngine.getAudiences().length>=3,true,'\u521B\u5EFA\u4EBA\u7FA4');
StageTodoEngine.setAudienceTodos(a1.audienceId,'P1',[{name:'\u6B22\u8FCE',completionKey:'w',detectFrom:'message',detectKeyword:'\u6B22\u8FCE',action:{type:'send_message',contentTemplate:'\u60A8\u597D'}}]);
ae(StageTodoEngine.getAudienceTodos(a1.audienceId,'P1').length,1,'\u8BBE\u7F6E\u5F85\u529E');

console.log('\n=== \u68C0\u6D4B\u5B8C\u6210 ===');
const c1 = { customerId:'C1',name:'\u738B\u8001\u677F',typeCode:'CHAIN',stage:'P1',messages:[{content:'\u6B22\u8FCE\u60A8\u6765\u5230\u4F18\u7279\u667A\u53A8',status:'sent'}],activeEscalations:[],lastContact:NOW,tags:[] };
const detected = StageTodoEngine.detectCompletion(c1, {detectFrom:'message',detectKeyword:'\u4F18\u7279\u667A\u53A8'});
ae(detected,true,'\u4ECE\u6D88\u606F\u8BB0\u5F55\u68C0\u6D4B\u5230\u5B8C\u6210');

const notDetected = StageTodoEngine.detectCompletion(c1, {detectFrom:'message',detectKeyword:'\u62A5\u4EF7'});
ae(notDetected,false,'\u672A\u5339\u914D\u5173\u952E\u8BCD\u5219\u4E0D\u68C0\u6D4B');

console.log('\n=== \u5F85\u529E\u8FC7\u6EE4 ===');
// \u5BA2\u6237\u7684\u6D88\u606F\u4E2D\u5DF2\u6709\u6B22\u8FCE\u5173\u952E\u8BCD\uFF0C\u6240\u4EE5welcome\u5E94\u88AB\u81EA\u52A8\u6807\u8BB0\u5B8C\u6210\uFF0C\u4E0D\u8FDB\u5165\u5F85\u529E
StageTodoEngine.initStageState(c1);
const pending = StageTodoEngine.getPendingItems(c1);
a(pending.length > 0, '\u4ECD\u6709\u5F85\u529E\u4E8B\u9879\uFF08\u6B22\u8FCE\u88AB\u68C0\u6D4B\u5B8C\u6210\uFF0C\u5176\u4ED6\u672A\u5B8C\u6210\uFF09');
// welcome \u5E94\u5DF2\u88AB\u81EA\u52A8\u6807\u8BB0\u4E3A\u5B8C\u6210
a(StageTodoEngine.isCompleted(c1,'P1','welcome'), '\u6B22\u8FCE\u5DF2\u88AB\u68C0\u6D4B\u4E3A\u5B8C\u6210');

console.log('\n=== \u6267\u884C\u5F15\u64CE ===');
const c2 = { customerId:'C2',name:'\u674E\u603B',typeCode:'CHAIN',stage:'P1',messages:[],activeEscalations:[],lastContact:NOW,tags:[] };
const r = StageTodoEngine.scanAll([c2]);
a(r.executed > 0, '\u6709\u6267\u884C\u7ED3\u679C');
const r2 = StageTodoEngine.scanAll([c2]);
ae(r2.executed, 0, '\u7B2C\u4E8C\u6B21\u4E0D\u91CD\u590D\u6267\u884C');

console.log('\n=== \u4E0D\u540C\u4EBA\u7FA4\u4E0D\u540C\u914D\u7F6E ===');
const audChain = StageTodoEngine.getAudiences().find(a=>a.audienceId==='aud-chain');
const audCanteen = StageTodoEngine.getAudiences().find(a=>a.audienceId==='aud-canteen');
ae(StageTodoEngine.getAudienceTodos('aud-chain','P1').length, 4, '\u8FDE\u9501P1\u67094\u9879');
ae(StageTodoEngine.getAudienceTodos('aud-canteen','P1').length, 2, '\u98DF\u5802P1\u67092\u9879');

console.log('\n\u2211 '+p+'/'+(p+f)+' \u901A\u8FC7, '+(p+f>0?Math.round(p/(p+f)*100):0)+'%');
process.exit(f>0?1:0);
