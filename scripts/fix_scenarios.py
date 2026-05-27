with open('scenes/scene-12-workbench/scenario-data.js', 'r') as f:
    content = f.read()

# Find: `],\n  };\n\n\n    // P1: ... (续)` → need to move content between `];\n\n\n` and `\n\n  // ==== 将 annot`
# to BEFORE the SCENARIOS array closing `];`

marker_start = '  ];\n\n\n    // ──────────────────────────────────────────────────────────\n    // P1: 线索接入与智能破冰 (续)'
marker_end = '\n\n  // ===== 将 annot 数组转为 annotationsAt'

# Find the new scenarios block
start_idx = content.find(marker_start)
end_idx = content.find(marker_end)

if start_idx < 0:
    print("ERROR: start marker not found")
    exit(1)
if end_idx < 0:
    print("ERROR: end marker not found")
    exit(1)

# Extract the new scenarios (everything between start and end)
new_block = content[start_idx:end_idx]

# Remove the new block from its current position
content = content[:start_idx] + content[end_idx:]

# Now insert the new block BEFORE the `];` that closes SCENARIOS
# The `];` is at the end of the original SCENARIOS
# After removing the new block, the marker_start is gone, 
# so `];` should now be followed by `\n\n  // ==== 将 annot`

# Actually, after removal, content has `];\n\n  // ==== ...`
# We need to insert the new scenarios BEFORE the `];`
closing_marker = '  ];\n\n  // ===== 将 annot 数组转为 annotationsAt'
insert_idx = content.find(closing_marker)

if insert_idx < 0:
    print("ERROR: closing marker not found")
    exit(1)

# Insert before the `];`
# Remove the `];` marker temporarily
content = content[:insert_idx] + content[insert_idx + len('  ]'):]

# Insert new block + `],` (to continue the array) + then the rest
# Actually, we need a comma after the last original scenario item before `];`
# Let me just do this more carefully
# The original content before closing was `    },\n  ];`
# After our removal, we have `    },\n  ];` followed by `\n\n  // ==== ...`
# We need: `    },\n    <new_scenarios>\n  ]\n\n  // ==== ...`

# Let me re-approach - just put the new scenarios BEFORE the `];`
content_before = content[:insert_idx]  # up to `    },\n  `
content_after = content[insert_idx + len('  ]'):]  # from `\n\n  // ==== ...`

# Clean up the new_block: remove the markers
new_block_clean = new_block.replace(
    '    // ──────────────────────────────────────────────────────────\n    // P1: 线索接入与智能破冰 (续)',
    '    // ──────────────────────────────────────────────────────────\n    // P1: 线索接入与智能破冰 (续)'
)

content = content_before + '\n' + new_block_clean + '  ]' + content_after

with open('scenes/scene-12-workbench/scenario-data.js', 'w') as f:
    f.write(content)

print("Fixed successfully")
