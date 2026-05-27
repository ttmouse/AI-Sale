#!/usr/bin/env python3
"""Convert scenario data files from helper-function calls to plain JS objects.
This decouples data from code - no dependency on sys/customer/sales/etc functions."""
import re, glob, os

BASE = 'scenes/scene-12-workbench'

def convert_file(path):
    with open(path) as f:
        content = f.read()
    
    original = content
    
    # Replace annot(...) calls with plain objects
    # annot('profile', {progress}, [flows], [cards], {nextAction})
    # → {profile:'profile', progress:{progress}, flows:[flows], cards:[cards], nextAction:{nextAction}}
    
    # Simple approach: inline replacement of annot() calls
    # Match: annot('...' , {...} , [...] , [...] , {...})
    # Replace with: {profile:'...', progress:{...}, flows:[...], cards:[...], nextAction:{...}}
    
    def replace_annot(match):
        full = match.group(0)
        # Parse the 5 arguments
        # Profile string
        profile = extract_arg(full, 1)
        progress = extract_arg(full, 2)
        flows = extract_arg(full, 3)
        cards = extract_arg(full, 4)
        next_action = extract_arg(full, 5)
        
        if profile is None:
            return full
        
        result = f"{{profile:{profile},progress:{progress},flows:{flows},cards:{cards},nextAction:{next_action}}}"
        return result
    
    # This regex tries to match annot('...',{...},[...],[...],{...})
    # It's complex because of nested brackets
    # Let me use a simpler iterative approach
    
    lines = content.split('\n')
    new_lines = []
    in_annot = False
    annot_depth = 0
    annot_parts = []
    
    for line in lines:
        stripped = line.strip()
        
        if stripped.startswith('annot(') and not in_annot:
            in_annot = True
            annot_parts = [line]
            annot_depth = 1
            # Count parens
            for ch in line:
                if ch == '(':
                    annot_depth += 1
                elif ch == ')':
                    annot_depth -= 1
            if annot_depth <= 0:
                # Single line annot
                in_annot = False
                new_lines.append(convert_annot_line(line))
            continue
        
        if in_annot:
            annot_parts.append(line)
            for ch in line:
                if ch == '(':
                    annot_depth += 1
                elif ch == ')':
                    annot_depth -= 1
            if annot_depth <= 0:
                in_annot = False
                joined = '\n'.join(annot_parts)
                new_lines.append(convert_annot_line(joined))
            continue
        
        # Replace sys(), customer(), sales(), aiHint(), aiRecommend()
        line = re.sub(r'\bsys\(', 'SYSCALL(', line)
        line = re.sub(r'\bcustomer\(', 'CUSTCALL(', line)
        line = re.sub(r'\bsales\(', 'SALESCALL(', line)
        line = re.sub(r'\baiHint\(', 'AIHINTCALL(', line)
        line = re.sub(r'\baiRecommend\(', 'AIRECCALL(', line)
        
        # Now replace function-call lines with object literals
        if 'SYSCALL(' in line:
            line = line.replace('SYSCALL(', '').rstrip(',')
            line = re.sub(r"\)$", '', line)
            # Extract content and wrap
            m = re.match(r"(\s*)('.*')(\s*)\)?", line)
            if m:
                ws = m.group(1)
                content_val = m.group(2)
                line = ws + "{type:'system', content:" + content_val + "},"
            elif re.match(r"\s*'", line.strip()):
                # Already have the content
                ws = re.match(r'(\s*)', line).group(1)
                val = line.strip().rstrip(',)')
                line = ws + "{type:'system', content:" + val + "},"
                
        # Similar for other types
        # Actually this is getting complex. Let me do it more carefully.
        
        new_lines.append(line)
    
    # Actually, let me take a cleaner approach. Write the whole thing differently.
    return content  # Placeholder - will implement properly

# Let me just do it with sed-like replacements
def convert_annot_line(line):
    """Convert annot('p',{pr},[f],[c],{n}) to {profile:'p',progress:{pr},flows:[f],cards:[c],nextAction:{n}}"""
    # Extract the content between annot( and the last )
    m = re.match(r'(\s*)annot\((.*)\)(\s*),?$', line, re.DOTALL)
    if not m:
        return line
    ws = m.group(1)
    args = m.group(2)
    
    # Split by top-level commas (not inside nested brackets)
    parts = split_top_level(args, ',')
    if len(parts) < 5:
        return line
    
    profile = parts[0].strip()
    progress = parts[1].strip()
    flows = parts[2].strip()
    cards = parts[3].strip()
    next_action = parts[4].strip()
    
    result = f"{ws}{{profile:{profile},progress:{progress},flows:{flows},cards:{cards},nextAction:{next_action}}},"
    return result

def split_top_level(text, sep=','):
    """Split text by separator, respecting nested brackets"""
    result = []
    depth = 0
    current = ''
    in_string = False
    string_char = None
    
    for ch in text:
        if in_string:
            current += ch
            if ch == string_char and (len(current) < 2 or current[-2] != '\\'):
                in_string = False
        elif ch in ("'", '"'):
            in_string = True
            string_char = ch
            current += ch
        elif ch in '({[':
            depth += 1
            current += ch
        elif ch in ')}]':
            depth -= 1
            current += ch
        elif ch == sep and depth == 0:
            result.append(current.strip())
            current = ''
        else:
            current += ch
    
    if current.strip():
        result.append(current.strip())
    
    return result

def convert_messages(text):
    """Replace sys/customer/sales/aiHint/aiRecommend calls with plain objects"""
    
    def repl_sys(m):
        ws = m.group(1)
        content = m.group(2)
        return f"{ws}{{type:'system', content:{content}}},"
    
    def repl_cust(m):
        ws = m.group(1)
        content = m.group(2)
        return f"{ws}{{type:'customer', content:{content}, sender:'王总'}},"
    
    def repl_sales(m):
        ws = m.group(1)
        content = m.group(2)
        return f"{ws}{{type:'sales', content:{content}, sender:'小陈'}},"
    
    def repl_hint(m):
        ws = m.group(1)
        content = m.group(2)
        return f"{ws}{{type:'ai-hint', content:{content}}},"
    
    def repl_rec(m):
        ws = m.group(1)
        # Extract content, options, selected
        args = m.group(2)
        parts = split_top_level(args, ',')
        content = parts[0].strip() if len(parts) > 0 else "''"
        opts = parts[1].strip() if len(parts) > 1 else '[]'
        sel = parts[2].strip() if len(parts) > 2 else '0'
        return f"{ws}{{type:'ai-recommend', content:{content}, options:{opts}, selected:{sel}}},"
    
    # Process multiline
    # Simple approach: inline replacements
    result = text
    result = re.sub(r'(\s*)sys\(([^)]*)\)', repl_sys, result)
    result = re.sub(r'(\s*)customer\(([^)]*)\)', repl_cust, result)
    result = re.sub(r'(\s*)sales\(([^)]*)\)', repl_sales, result)
    result = re.sub(r'(\s*)aiHint\(([^)]*)\)', repl_hint, result)
    # aiRecommend needs to handle up to 3 args
    result = re.sub(r'(\s*)aiRecommend\(([^)]*)\)', repl_rec, result)
    
    return result

# Process all per-stage files
for fpath in sorted(glob.glob(os.path.join(BASE, 'scenarios-p*.js'))):
    with open(fpath) as f:
        content = f.read()
    
    # Step 1: Convert annot() calls to plain objects
    lines = content.split('\n')
    new_lines = []
    in_annot = False
    annot_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        if not in_annot and stripped.startswith('annot('):
            in_annot = True
            annot_lines = [line]
            if stripped.endswith('),') or stripped.endswith(')'):
                # Single line
                in_annot = False
                new_lines.append(convert_annot_line('\n'.join(annot_lines)))
                annot_lines = []
            continue
        
        if in_annot:
            annot_lines.append(line)
            # Check if annotation ends (unbalanced parens resolved)
            # Simple check: last line ends with ), or )
            ls = line.strip()
            if ls.endswith('),') or ls.endswith(')'):
                in_annot = False
                joined = '\n'.join(annot_lines)
                new_lines.append(convert_annot_line(joined))
                annot_lines = []
            continue
        
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # Step 2: Convert sys/customer/sales/aiHint/aiRecommend to plain objects
    content = convert_messages(content)
    
    # Step 3: Clean up any double commas
    content = content.replace(',,\n', ',\n')
    content = content.replace(',,\n', ',\n')
    
    with open(fpath, 'w') as f:
        f.write(content)
    
    print(f"Converted {os.path.basename(fpath)}")

print("\nDone. Now remove global helpers from index.html and scenario-data.js")
