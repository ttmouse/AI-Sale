DOC = '/Users/douba/Downloads/\u2606\u9500\u552eAI\u52a9\u624b-\u529f\u80fd\u6e05\u5355-\u5c55\u793a\u9875\u9762.md'
with open(DOC) as f:
    lines = f.readlines()

# Search for literal "场景 1-1" with possible backslash
target = '\u573a\u666f 1\\-1'
for i, l in enumerate(lines):
    if '\u573a\u666f' in l and '1' in l and '\\-1' in l:
        print(f'{i}: {repr(l[:80])}')
        start = i
        break

# Find the middle section  
for i in range(start, min(start+200, len(lines))):
    if '\u4e2d\u95f4' in lines[i]:  # 中间
        print(f'Middle section at {i}')
        for j in range(i, min(i+50, len(lines))):
            print(f'  {j}: {repr(lines[j][:100])}')
        break
