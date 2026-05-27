#!/usr/bin/env python3
"""Split per-stage JS files into individual scenario JSON files."""
import json, re, os, glob

SRC_DIR = 'scenes/scene-12-workbench'
OUT_DIR = os.path.join(SRC_DIR, 'scenarios')

os.makedirs(OUT_DIR, exist_ok=True)

# Read each per-stage JS file and extract scenarios
for fpath in sorted(glob.glob(os.path.join(SRC_DIR, 'scenarios-p*.js'))):
    with open(fpath) as f:
        content = f.read()
    
    # Find each scenario object by matching top-level braces
    scenarios = []
    depth = 0
    start = -1
    in_string = False
    string_char = None
    
    for i, ch in enumerate(content):
        if in_string:
            if ch == string_char and (i == 0 or content[i-1] != '\\'):
                in_string = False
        elif ch in ("'", '"'):
            in_string = True
            string_char = ch
        elif ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start >= 0:
                # Check if this is a scenario object (has "id" and "stageId" fields)
                obj_text = content[start:i+1]
                if '"id"' in obj_text or "'id'" in obj_text:
                    scenarios.append(obj_text)
                start = -1
    
    # Parse each scenario and write to individual JSON files
    for s_text in scenarios:
        # Convert JS object literal to JSON
        # First, try to eval it (requires Node.js-like environment)
        # Since we're in Python, let's do a rough conversion
        
        # Replace JS comments
        s_text_clean = re.sub(r'//.*', '', s_text)
        
        # Replace single quotes with double quotes (but careful with escaped quotes)
        # Replace 'key': → "key":
        s_text_clean = re.sub(r"'([^']+)':", r'"\1":', s_text_clean)
        # Replace :'value', → :"value",
        s_text_clean = re.sub(r":\s*'([^']*)'", r':"\1"', s_text_clean)
        
        # Handle arrays and nested objects - single quotes inside arrays
        s_text_clean = re.sub(r"\[\s*'", r'["', s_text_clean)
        s_text_clean = re.sub(r"'\s*\]", r'"]', s_text_clean)
        s_text_clean = re.sub(r"'\s*,\s*'", r'","', s_text_clean)
        
        # Clean up: JS allows trailing commas, JSON doesn't
        s_text_clean = re.sub(r',\s*}', r'}', s_text_clean)
        s_text_clean = re.sub(r',\s*]', r']', s_text_clean)
        
        # Fix escaped backslash-n → actual \n in JSON strings
        s_text_clean = s_text_clean.replace('\\n', '\\\\n')
        
        try:
            obj = json.loads(s_text_clean)
        except json.JSONDecodeError as e:
            print(f"  FAILED to parse: {s_text[:60]} - {e}")
            continue
        
        scenario_id = obj.get('id', 'unknown')
        filename = f"{scenario_id}.json"
        filepath = os.path.join(OUT_DIR, filename)
        
        # Write formatted JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
        
        print(f"  {filename}")

print(f"\nDone. Scenarios written to {OUT_DIR}/")
