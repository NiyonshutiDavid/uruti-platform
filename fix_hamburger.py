import re

base = '/Users/davidniyonshutii/Documents/MissionCapstone/uruti-platform/uruti-Mobile/uruti_app/lib/screens'

screens = [
    'profile/profile_screen.dart',
    'connections/connections_screen.dart',
    'discovery/startup_discovery_screen.dart',
    'settings/settings_screen.dart',
    'notifications/notifications_screen.dart',
    'calendar/readiness_calendar_screen.dart',
    'profile/availability_screen.dart',
    'ventures/venture_hub_screen.dart',
    'meetings/meetings_screen.dart',
    'investor/deal_flow_screen.dart',
    'investor/investor_dashboard_screen.dart',
    'documents/document_vault_screen.dart',
    'analytics/analytics_screen.dart',
    'support/help_support_screen.dart',
    'founder/founder_snapshot_screen.dart',
]

IMPORT_LINE = "import '../../screens/main_scaffold.dart';"
MENU_REPLACED = False

for rel in screens:
    path = f'{base}/{rel}'
    try:
        with open(path, 'r') as f:
            content = f.read()

        # Add main_scaffold import if missing
        if 'main_scaffold' not in content:
            lines = content.split('\n')
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    last_import_idx = i
            if last_import_idx >= 0:
                lines.insert(last_import_idx + 1, IMPORT_LINE)
                content = '\n'.join(lines)
            import_msg = 'import_added'
        else:
            import_msg = 'import_ok'

        # Replace leading: IconButton( with arrow_back icons
        # Use a broad regex to catch all variations
        pattern = re.compile(
            r'(leading:\s*IconButton\(\s*\n\s*icon:\s*(?:const\s+)?Icon\(Icons\.arrow_back(?:_ios_new_rounded)?,(?:[^)]+)?\),\s*\n\s*onPressed:[^\n]+\n\s*\),)',
            re.MULTILINE
        )

        def replacer(m):
            return ('leading: IconButton(\n'
                    '          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),\n'
                    '          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),\n'
                    '        ),')

        new_content = pattern.sub(replacer, content)
        changed = new_content != content

        with open(path, 'w') as f:
            f.write(new_content)

        still_has_back = 'Icons.arrow_back' in new_content
        print(f'{"✅" if changed else "⚠️"} {rel}: {import_msg} | changed={changed} | arrow_back_remaining={still_has_back}')

    except Exception as e:
        print(f'❌ {rel}: {e}')
