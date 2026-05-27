#!/usr/bin/env python3
"""Rebuild scenario-data.js from original header + 14 scenarios + 13 new scenarios"""

with open('scripts/new_scenarios.js') as f:
    new_13 = f.read().strip()

# The original 14 scenarios are complex - let me extract them from the data file
# Since data file is deleted, let me reconstruct from the test output

# Actually, we need the original 14. Check git stash or /tmp
import subprocess
r = subprocess.run(['ls', '-la', '/tmp/scenario-data*'], capture_output=True, text=True)
print(r.stdout, r.stderr)

# Alternative: let me generate using Node.js to read the original module paths
# Or check if there's a backup in .reasonix/
