import json

path = 'scenes/scene-12-workbench/scenarios/1-4.json'
with open(path) as f:
    data = json.load(f)

# Update pendingConfirm items with action field
data['annotations'][1]['pendingConfirm'] = [
    {
        'id': 'source',
        'label': '客户来源',
        'value': '官网留资',
        'type': 'field',
        'action': '确认',
        'desc': 'AI根据留资信息判断，请确认是否正确'
    },
    {
        'id': 'silence',
        'label': '沉默时长',
        'value': '48小时',
        'type': 'field',
        'action': '确认',
        'desc': '最后一条消息距今48小时未回复'
    },
    {
        'id': 'intent',
        'label': '初始意向',
        'value': '想了解炒菜机价格',
        'type': 'field',
        'action': '确认',
        'desc': '客户官网留资时填写的需求'
    }
]

data['annotations'][2]['pendingConfirm'] = [
    {
        'id': 'type',
        'label': '客户大类',
        'value': '社餐',
        'type': 'tag',
        'action': '标记',
        'desc': 'AI根据客户回复"我是做快餐的"判断'
    },
    {
        'id': 'subtype',
        'label': '细分类别',
        'value': '快餐',
        'type': 'tag',
        'action': '标记',
        'desc': 'AI从"快餐"关键词识别'
    },
    {
        'id': 'focus',
        'label': '核心关注点',
        'value': '价格',
        'type': 'tag',
        'action': '标记',
        'desc': '客户第一条回复即询问价格'
    }
]

with open(path, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated with action and desc fields")
