#!/usr/bin/env python3
"""Update 1-4.json with pendingConfirm data and clean annotation structure"""
import json

path = 'scenes/scene-12-workbench/scenarios/1-4.json'
with open(path) as f:
    data = json.load(f)

# Each annotation can have pendingConfirm items
# pendingConfirm: [{id, label, value, oldValue?, type: 'tag'|'field'|'fieldUpdate'}]

# Annotation 1: after system message identifying the silent customer → AI flags what it detected
data['annotations'][1]['pendingConfirm'] = [
    {
        'id': 'source',
        'label': '客户来源',
        'value': '官网留资',
        'type': 'field'
    },
    {
        'id': 'silence',
        'label': '沉默时长',
        'value': '48小时',
        'type': 'field'
    },
    {
        'id': 'intent',
        'label': '初始意向',
        'value': '想了解炒菜机价格',
        'type': 'field'
    }
]

# Annotation 2: after customer responds "我是做快餐的" → AI updates fields, needs confirmation
data['annotations'][2]['pendingConfirm'] = [
    {
        'id': 'type',
        'label': '客户大类',
        'value': '社餐',
        'type': 'tag'
    },
    {
        'id': 'subtype',
        'label': '细分类别',
        'value': '快餐',
        'type': 'tag'
    },
    {
        'id': 'focus',
        'label': '核心关注点',
        'value': '价格',
        'type': 'tag'
    }
]

with open(path, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated 1-4.json with pendingConfirm data")
