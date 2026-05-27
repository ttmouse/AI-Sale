import os

path = 'scenes/scene-12-workbench/scenario-data.js'

with open(path) as f:
    content = f.read()

# Find the last scenario end
marker_before = '联系转介绍客户，利用推荐人背书破冰。'
marker_after = '});\n  }\n  convertAnnotations();'

pos_before = content.rfind(marker_before)
pos_after = content.find(marker_after, pos_before)

if pos_before > 0 and pos_after > 0:
    # Everything between the markers
    segment = content[pos_before:pos_after + len(marker_after)]
    print(f'Segment:\n{repr(segment)}\n')
    
    # Check what's after
    after_marker = content[pos_after + len(marker_after):pos_after + len(marker_after) + 100]
    print(f'After marker: {repr(after_marker)}')

# Count the file length  
print(f'File size: {len(content)} bytes')
