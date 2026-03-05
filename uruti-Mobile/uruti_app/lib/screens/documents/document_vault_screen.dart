import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import '../../screens/main_scaffold.dart';

class DocumentVaultScreen extends StatefulWidget {
  const DocumentVaultScreen({super.key});
  @override
  State<DocumentVaultScreen> createState() => _DocumentVaultScreenState();
}

class _DocumentVaultScreenState extends State<DocumentVaultScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  final _docs = [
    {
      'name': 'Pitch Deck v2.0.pdf',
      'size': '4.2 MB',
      'date': 'Dec 20, 2024',
      'type': 'pitch',
      'icon': Icons.slideshow,
    },
    {
      'name': 'Financial Model Q4.xlsx',
      'size': '1.8 MB',
      'date': 'Dec 18, 2024',
      'type': 'finance',
      'icon': Icons.table_chart,
    },
    {
      'name': 'Cap Table 2024.pdf',
      'size': '0.5 MB',
      'date': 'Dec 15, 2024',
      'type': 'legal',
      'icon': Icons.pie_chart_outline,
    },
    {
      'name': 'Term Sheet Draft.pdf',
      'size': '0.3 MB',
      'date': 'Dec 10, 2024',
      'type': 'legal',
      'icon': Icons.description_outlined,
    },
    {
      'name': 'Team Bios.pdf',
      'size': '2.1 MB',
      'date': 'Nov 28, 2024',
      'type': 'pitch',
      'icon': Icons.people_outline,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.appBarBg,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: Colors.white),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Document Vault',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.upload_file, color: Colors.white),
            onPressed: () => ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Upload coming soon'))),
          ),
        ],
        bottom: TabBar(
          controller: _tab,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Pitch'),
            Tab(text: 'Legal'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _DocList(docs: _docs),
          _DocList(docs: _docs.where((d) => d['type'] == 'pitch').toList()),
          _DocList(docs: _docs.where((d) => d['type'] == 'legal').toList()),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: context.colors.accent,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Upload', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}

class _DocList extends StatelessWidget {
  final List docs;
  const _DocList({required this.docs});

  @override
  Widget build(BuildContext context) {
    if (docs.isEmpty) {
      return Center(
        child: Text(
          'No documents',
          style: TextStyle(color: context.colors.textSecondary),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: docs.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final d = docs[i] as Map<String, dynamic>;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.colors.divider),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: context.colors.accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  d['icon'] as IconData,
                  color: context.colors.accent,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      d['name'] as String,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${d['size']} · ${d['date']}',
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                color: context.colors.card,
                icon: Icon(
                  Icons.more_vert,
                  color: context.colors.textSecondary,
                  size: 18,
                ),
                onSelected: (value) async {
                  if (value != 'delete') return;
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Delete Document?'),
                      content: Text('Delete "${d['name']}"?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(false),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(true),
                          child: const Text('Delete'),
                        ),
                      ],
                    ),
                  );
                  if (confirmed == true && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Delete action coming soon'),
                      ),
                    );
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'view', child: Text('View')),
                  const PopupMenuItem(value: 'share', child: Text('Share')),
                  const PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
