#!/usr/bin/env python3
"""Undo bad curly-brace wrapping that split multi-line widget bodies."""
import re, os

ROOT = "/Users/davidniyonshutii/Documents/MissionCapstone/uruti-platform/uruti-Mobile/uruti_app/lib"

AFFECTED = [
    "screens/advisory/advisory_tracks_screen.dart",
    "screens/calendar/readiness_calendar_screen.dart",
    "screens/connections/connections_screen.dart",
    "screens/discovery/startup_discovery_screen.dart",
    "screens/notifications/notifications_screen.dart",
    "screens/documents/document_vault_screen.dart",
    "screens/profile/profile_view_screen.dart",
]

def undo_bad_curly(src):
    """
    Undo the bad wrapping pattern:
      if (COND)
      {
        BODY_FIRST_LINE
      }
        BODY_REST...
      CLOSING_PAREN,   ← or };
    
    This was caused by the fixer seeing `if (COND)\n  MULTILINE_THING(` 
    (where MULTILINE_THING ends on later lines) and wrapping just the first line.
    
    Reverse: remove the inserted `{` and `}` lines that appear as standalone
    lines matching exactly `\s*{$` and `\s*}$` ONLY when:
    - preceded by an `if/while` line
    - the `{` is on its own line (inserted by the fixer)
    """
    lines = src.split('\n')
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Detect: control flow line ...
        is_ctrl = re.match(r'^(\s*)(if\s*\(|else\s*if\s*\(|else\s*$|while\s*\()', line)
        if is_ctrl and i + 1 < len(lines):
            next_line = lines[i + 1]
            # Did fixer insert a lone `{` ?
            if re.match(r'^\s*\{\s*$', next_line):
                # Look ahead for the matching lone `}`
                # Find the `}` that closes this inserted block
                j = i + 2
                content_lines = []
                found_close = -1
                while j < len(lines):
                    cl = lines[j]
                    if re.match(r'^\s*\}\s*$', cl):
                        found_close = j
                        break
                    content_lines.append(cl)
                    j += 1
                
                if found_close >= 0:
                    # Check: is what follows the `}` a continuation of the body?
                    # i.e. the content_lines are NOT a complete statement (no `;)`
                    # We'll use a heuristic: if content_lines count == 1 and it
                    # contains an opening paren without closing, it was split
                    body_first = content_lines[0].rstrip() if content_lines else ''
                    # Heuristic: the lone { } pair was inserted wrongly if the
                    # content between them is just the opening of a call
                    # (ends with `(`, or is just `setState(`, `{` etc.)
                    is_bad_wrap = (
                        len(content_lines) == 1 and
                        (body_first.rstrip().endswith('(') or
                         body_first.rstrip().endswith('=>') or
                         re.search(r'\w+\s*\($', body_first.rstrip()))
                    )
                    if is_bad_wrap:
                        # Emit: control flow line, then continuation without braces
                        result.append(line)
                        result.extend(content_lines)
                        # skip the `}` line  
                        i = found_close + 1
                        continue
        result.append(line)
        i += 1
    return '\n'.join(result)

count = 0
for rel in AFFECTED:
    full = os.path.join(ROOT, rel)
    if not os.path.exists(full):
        continue
    with open(full, encoding='utf-8') as f:
        src = f.read()
    fixed = undo_bad_curly(src)
    if fixed != src:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(fixed)
        count += 1
        print(f"  Reverted curly wrap: {rel}")
    else:
        print(f"  No change: {rel}")

print(f"\nDone. Fixed {count} files.")
