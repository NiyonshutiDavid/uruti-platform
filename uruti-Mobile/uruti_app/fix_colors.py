#!/usr/bin/env python3
import os
import re

ROOT = "/Users/davidniyonshutii/Documents/MissionCapstone/uruti-platform/uruti-Mobile/uruti_app"
SEARCH_DIRS = [
    os.path.join(ROOT, "lib", "screens"),
    os.path.join(ROOT, "lib", "widgets"),
]
EXTRA_FILES = [
    os.path.join(ROOT, "lib", "core", "app_router.dart"),
]

# Map of exact AppColors.X -> context.colors.X
# Only structural colours that differ between dark/light
REPLACEMENTS = [
    (r'AppColors\.background\b', 'context.colors.background'),
    (r'AppColors\.cardBackground\b', 'context.colors.card'),
    (r'AppColors\.surfaceBackground\b', 'context.colors.surface'),
    (r'AppColors\.textPrimary\b', 'context.colors.textPrimary'),
    (r'AppColors\.textSecondary\b', 'context.colors.textSecondary'),
    (r'AppColors\.textMuted\b', 'context.colors.textMuted'),
    (r'AppColors\.divider\b', 'context.colors.divider'),
    (r'AppColors\.navInactive\b', 'context.colors.navInactive'),
    (r'AppColors\.darkGreenMid\b', 'context.colors.darkGreenMid'),
    (r'AppColors\.cardBorder\b', 'context.colors.cardBorder'),
    (r'AppColors\.surfaceVariant\b', 'context.colors.surfaceVariant'),
    (r'AppColors\.shimmerBase\b', 'context.colors.shimmerBase'),
    (r'AppColors\.shimmerHighlight\b', 'context.colors.shimmerHighlight'),
    (r'AppColors\.card\b', 'context.colors.card'),
    (r'AppColors\.surface\b', 'context.colors.surface'),
]

compiled = [(re.compile(pat), repl) for pat, repl in REPLACEMENTS]

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for pattern, replacement in compiled:
        content = pattern.sub(replacement, content)
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
changed = 0
for d in SEARCH_DIRS:
    if not os.path.isdir(d):
        continue
    for root, dirs, files in os.walk(d):
        for fn in files:
            if fn.endswith('.dart'):
                fp = os.path.join(root, fn)
                count += 1
                if process_file(fp):
                    changed += 1
                    print(f"  Updated: {fp[len(ROOT)+1:]}")

for fp in EXTRA_FILES:
    if os.path.isfile(fp):
        count += 1
        if process_file(fp):
            changed += 1
            print(f"  Updated: {fp[len(ROOT)+1:]}")

print(f"\nDone. Processed {count} files, updated {changed}.")
