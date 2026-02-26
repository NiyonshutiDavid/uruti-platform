#!/usr/bin/env python3
"""
Fix file-scope helper functions that now use context.colors.xxx but have no context param.
Strategy:
  1. Add (BuildContext context, ...) to helper definitions
  2. Update call sites to pass context as first arg
  3. Fix `const BoxDecoration` that now contains a runtime value
  4. Fix `Color get _rankColor` getter → method in leaderboard
"""
import re, os

ROOT = "/Users/davidniyonshutii/Documents/MissionCapstone/uruti-platform/uruti-Mobile/uruti_app/lib"

def patch(path, old, new):
    full = os.path.join(ROOT, path)
    with open(full, encoding='utf-8') as f:
        src = f.read()
    if old not in src:
        print(f"  WARN: pattern not found in {path}: {repr(old[:60])}")
        return
    src = src.replace(old, new, 1)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(src)
    print(f"  Patched: {path}")

# ─────────── analytics_screen.dart ────────────────────────────────────────────
ANALYTICS = "screens/analytics/analytics_screen.dart"
patch(ANALYTICS,
    "Widget _SectionTitle(String t) => Text(",
    "Widget _SectionTitle(BuildContext context, String t) => Text(")
# Call sites: replace _SectionTitle(' → _SectionTitle(context, '
with open(os.path.join(ROOT, ANALYTICS), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r'_SectionTitle\(\'', "_SectionTitle(context, '", src)
with open(os.path.join(ROOT, ANALYTICS), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {ANALYTICS}")

# ─────────── home_screen.dart ──────────────────────────────────────────────────
HOME = "screens/home/home_screen.dart"
patch(HOME,
    "Widget _SectionTitle(String title) => Text(",
    "Widget _SectionTitle(BuildContext context, String title) => Text(")
with open(os.path.join(ROOT, HOME), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_SectionTitle\('", "_SectionTitle(context, '", src)
with open(os.path.join(ROOT, HOME), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {HOME}")

# ─────────── founder_snapshot_screen.dart ─────────────────────────────────────
FOUNDER = "screens/founder/founder_snapshot_screen.dart"
patch(FOUNDER,
    "Widget _Section(String t) => Align(",
    "Widget _Section(BuildContext context, String t) => Align(")
with open(os.path.join(ROOT, FOUNDER), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_Section\('", "_Section(context, '", src)
with open(os.path.join(ROOT, FOUNDER), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {FOUNDER}")

# ─────────── deal_flow_screen.dart ─────────────────────────────────────────────
DEAL = "screens/investor/deal_flow_screen.dart"
patch(DEAL,
    "Widget _Section(String t) => Text(",
    "Widget _Section(BuildContext context, String t) => Text(")
with open(os.path.join(ROOT, DEAL), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_Section\('", "_Section(context, '", src)
with open(os.path.join(ROOT, DEAL), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {DEAL}")

# ─────────── investor_dashboard_screen.dart ────────────────────────────────────
INVESTOR = "screens/investor/investor_dashboard_screen.dart"
patch(INVESTOR,
    "Widget _Header(String t) => Text(",
    "Widget _Header(BuildContext context, String t) => Text(")
with open(os.path.join(ROOT, INVESTOR), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_Header\('", "_Header(context, '", src)
with open(os.path.join(ROOT, INVESTOR), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {INVESTOR}")

# ─────────── pitch_performance_screen.dart ─────────────────────────────────────
# _sectionTitle is a class method — also needs context param
PERF = "screens/coach/pitch_performance_screen.dart"
patch(PERF,
    "Widget _sectionTitle(String t) => Align(",
    "Widget _sectionTitle(BuildContext context, String t) => Align(")
with open(os.path.join(ROOT, PERF), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_sectionTitle\('", "_sectionTitle(context, '", src)
with open(os.path.join(ROOT, PERF), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {PERF}")

# ─────────── startup_leaderboard_screen.dart ───────────────────────────────────
# Convert `Color get _rankColor` to `Color _rankColor(BuildContext context)`
LEADER = "screens/discovery/startup_leaderboard_screen.dart"
patch(LEADER,
    "Color get _rankColor => rank == 1",
    "Color _rankColor(BuildContext context) => rank == 1")
# Update call sites inside build: _rankColor → _rankColor(context)
with open(os.path.join(ROOT, LEADER), encoding='utf-8') as f:
    src = f.read()
# Replace _rankColor. and _rankColor` (property access) with _rankColor(context)
src = src.replace('_rankColor.withOpacity', '_rankColor(context).withOpacity')
src = src.replace(': _rankColor,', ': _rankColor(context),')
with open(os.path.join(ROOT, LEADER), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {LEADER}")

# ─────────── pitch_coach_screen.dart ───────────────────────────────────────────
# Remove `const` from BoxDecoration that now contains a runtime value
COACH = "screens/coach/pitch_coach_screen.dart"
patch(COACH,
    "              decoration: const BoxDecoration(\n                gradient: RadialGradient(",
    "              decoration: BoxDecoration(\n                gradient: RadialGradient(")

# ─────────── profile_screen.dart ──────────────────────────────────────────────
PROFILE = "screens/profile/profile_screen.dart"
patch(PROFILE,
    "Widget _Section(String t) => Text(",
    "Widget _Section(BuildContext context, String t) => Text(")
with open(os.path.join(ROOT, PROFILE), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_Section\('", "_Section(context, '", src)
with open(os.path.join(ROOT, PROFILE), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {PROFILE}")

# ─────────── profile_view_screen.dart ─────────────────────────────────────────
PROFILE_VIEW = "screens/profile/profile_view_screen.dart"
patch(PROFILE_VIEW,
    "Widget _Section(String t) => Text(",
    "Widget _Section(BuildContext context, String t) => Text(")
with open(os.path.join(ROOT, PROFILE_VIEW), encoding='utf-8') as f:
    src = f.read()
src = re.sub(r"_Section\('", "_Section(context, '", src)
with open(os.path.join(ROOT, PROFILE_VIEW), 'w', encoding='utf-8') as f:
    f.write(src)
print(f"  Updated call sites: {PROFILE_VIEW}")

print("\nAll patches applied.")
