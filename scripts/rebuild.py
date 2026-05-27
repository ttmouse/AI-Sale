#!/usr/bin/env python3
"""Regenerate scenario-data.js with all 27 scenarios"""
import re

base = 'scenes/scene-12-workbench/scenario-data.js'

with open(base) as f:
    c = f.read()

# Find where SCENARIOS array ends
# The pattern is: last scenario }) followed by ]; close
close = c.rfind('    },\n  ]')
if close < 0:
    print("Can't find array close")
    exit(1)

print(f"Found array close at {close}")
print(repr(c[close-30:close+50]))

# Find the converter function start
converter = c.find('\n  // ===== \u5c06 annot')
if converter < 0:
    print("Converter not found")
    exit(1)

# Extract the original scenarios between array start and close
array_start = c.find('  const SCENARIOS = [')
array_close = c.rfind('  ];', 0, converter)

print(f"Array: {array_start} -> {array_close}")
orig_scenarios = c[array_start:array_close+3]
print(f"Original array length: {len(orig_scenarios)}")

# Now read new scenarios file
with open('scripts/new_scenarios.js') as f2:
    new_s = f2.read().strip()

# Build new array: remove trailing ]; from original, add new, add ];
new_array = orig_scenarios.rstrip()  # remove trailing whitespace
# Remove the trailing ];
if new_array.endswith('];'):
    new_array = new_array[:-2]
# Add comma and new scenarios
new_array += ',\n' + new_s + '\n  ];'

# Rebuild file
rest = c[array_close+3:]  # everything after the original close

new_content = c[:array_start] + '\n' + new_array + '\n' + rest

with open(base, 'w') as f:
    f.write(new_content)

print(f"Done! Old size: {len(c)}, New size: {len(new_content)}")
