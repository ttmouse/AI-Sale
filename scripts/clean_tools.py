import json, os

path = 'scenes/scene-12-workbench/scenarios/1-4.json'
with open(path) as f:
    d = json.load(f)

# Keep agentLog but remove 'steps' and 'tools' (engine generates these)
for ann in d['annotations']:
    if ann and 'agentLog' in ann:
        for key in ['steps', 'tools']:
            if key in ann['agentLog']:
                del ann['agentLog'][key]

with open(path, 'w') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)
print('Cleaned hardcoded tools from 1-4.json')
