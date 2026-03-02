import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../core/app_constants.dart';
import '../../services/api_service.dart';
import '../../screens/main_scaffold.dart';

String? _resolveAvatarUrl(String? url) {
  if (url == null) return null;
  if (url.startsWith('http')) return url;
  return '${AppConstants.apiBaseUrl}$url';
}

// ─────────────────────────────────────────────────────────
//  Shared helpers
// ─────────────────────────────────────────────────────────
String _capitalize(String s) =>
    s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

Widget _avatar(
  BuildContext context,
  String? avatarUrl,
  String name,
  double radius,
) {
  final url = _resolveAvatarUrl(avatarUrl);
  final initials = name
      .trim()
      .split(' ')
      .map((p) => p.isNotEmpty ? p[0] : '')
      .take(2)
      .join()
      .toUpperCase();
  return CircleAvatar(
    radius: radius,
    backgroundColor: context.colors.darkGreenMid,
    backgroundImage: url != null ? NetworkImage(url) : null,
    child: url == null
        ? Text(
            initials,
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: radius * 0.55,
            ),
          )
        : null,
  );
}

// ─────────────────────────────────────────────────────────
//  Main screen
// ─────────────────────────────────────────────────────────
class ConnectionsScreen extends StatefulWidget {
  const ConnectionsScreen({super.key});
  @override
  State<ConnectionsScreen> createState() => _ConnectionsScreenState();
}

class _ConnectionsScreenState extends State<ConnectionsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  List<Map<String, dynamic>> _connections = [];
  List<Map<String, dynamic>> _pending = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final conns = await ApiService.instance.getConnections();
      final pends = await ApiService.instance.getPendingRequests();
      if (!mounted) return;
      setState(() {
        _connections = List<Map<String, dynamic>>.from(conns);
        _pending = List<Map<String, dynamic>>.from(pends);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'My Network',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: context.colors.textSecondary),
            onPressed: _load,
          ),
        ],
        bottom: TabBar(
          controller: _tab,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: context.colors.textSecondary,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
          tabs: [
            Tab(text: 'Connected (${_connections.length})'),
            Tab(text: 'Pending (${_pending.length})'),
            const Tab(text: 'Discover'),
          ],
        ),
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: AppColors.primary))
          : TabBarView(
              controller: _tab,
              children: [
                _ConnectedTab(connections: _connections, onRefresh: _load),
                _PendingTab(pending: _pending, onRefresh: _load),
                _DiscoverTab(onRefresh: _load),
              ],
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────
//  CONNECTED TAB
// ─────────────────────────────────────────────────────────
class _ConnectedTab extends StatefulWidget {
  final List<Map<String, dynamic>> connections;
  final VoidCallback onRefresh;
  const _ConnectedTab({required this.connections, required this.onRefresh});
  @override
  State<_ConnectedTab> createState() => _ConnectedTabState();
}

class _ConnectedTabState extends State<_ConnectedTab> {
  String _search = '';
  String _roleFilter = 'All';
  static const _roles = ['All', 'founder', 'investor', 'mentor'];

  List<Map<String, dynamic>> get _filtered {
    return widget.connections.where((c) {
      final name = (c['full_name'] as String? ?? '').toLowerCase();
      final role = (c['role'] as String? ?? '').toLowerCase();
      final company = (c['company'] as String? ?? '').toLowerCase();
      final bio = (c['bio'] as String? ?? '').toLowerCase();
      final q = _search.toLowerCase();
      final matchSearch =
          q.isEmpty ||
          name.contains(q) ||
          role.contains(q) ||
          company.contains(q) ||
          bio.contains(q);
      final matchRole =
          _roleFilter == 'All' || role == _roleFilter.toLowerCase();
      return matchSearch && matchRole;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: TextField(
            onChanged: (v) => setState(() => _search = v),
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Search connections...',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              prefixIcon: Icon(
                Icons.search,
                color: context.colors.textSecondary,
              ),
              filled: true,
              fillColor: context.colors.card,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.divider),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.divider),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
            ),
          ),
        ),
        // Role filter chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: _roles.map((r) {
              final sel = _roleFilter == r;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _roleFilter = r),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : context.colors.card,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: sel ? AppColors.primary : context.colors.divider,
                      ),
                    ),
                    child: Text(
                      _capitalize(r),
                      style: TextStyle(
                        color: sel
                            ? Colors.white
                            : context.colors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: list.isEmpty
              ? Center(
                  child: Text(
                    _search.isNotEmpty || _roleFilter != 'All'
                        ? 'No results found'
                        : 'No connections yet',
                    style: TextStyle(color: context.colors.textSecondary),
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () async => widget.onRefresh(),
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          mainAxisExtent: 270,
                        ),
                    itemCount: list.length,
                    itemBuilder: (_, i) => _ConnectedCard(
                      conn: list[i],
                      onRefresh: widget.onRefresh,
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}

class _ConnectedCard extends StatefulWidget {
  final Map<String, dynamic> conn;
  final VoidCallback onRefresh;
  const _ConnectedCard({required this.conn, required this.onRefresh});
  @override
  State<_ConnectedCard> createState() => _ConnectedCardState();
}

class _ConnectedCardState extends State<_ConnectedCard> {
  bool _removing = false;

  Future<void> _remove() async {
    final connId = widget.conn['connection_id'] as int? ?? 0;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: context.colors.card,
        title: Text(
          'Remove Connection',
          style: TextStyle(color: context.colors.textPrimary),
        ),
        content: Text(
          'Remove ${widget.conn['full_name'] ?? 'this person'} from your network?',
          style: TextStyle(color: context.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: context.colors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _removing = true);
    try {
      await ApiService.instance.removeConnection(connId);
      widget.onRefresh();
    } catch (_) {
      if (!mounted) return;
      setState(() => _removing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not remove connection')),
      );
    }
  }

  void _bookSession(BuildContext ctx) {
    final uid = widget.conn['id'] as int? ?? 0;
    final name = widget.conn['full_name'] as String? ?? 'User';
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.86,
        alignment: Alignment.bottomCenter,
        child: _BookSessionSheet(userId: uid, userName: name),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.conn;
    final uid = c['id'] as int? ?? 0;
    final name = c['full_name'] as String? ?? 'User';
    final role = c['role'] as String? ?? '';
    final title = c['title'] as String? ?? '';
    final company = c['company'] as String? ?? '';
    final bio = c['bio'] as String? ?? '';
    final avatarUrl = c['avatar_url'] as String?;
    final subtitle = [title, company].where((s) => s.isNotEmpty).join(' @ ');

    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.divider),
      ),
      child: Column(
        children: [
          // Top section – tappable for profile
          Expanded(
            child: GestureDetector(
              onTap: () => context.go('/profile/view/$uid'),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                child: Column(
                  children: [
                    _avatar(context, avatarUrl, name, 28),
                    const SizedBox(height: 8),
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 10,
                        ),
                      ),
                    ],
                    if (bio.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        bio,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: context.colors.textSecondary,
                          fontSize: 10,
                          height: 1.3,
                        ),
                      ),
                    ],
                    if (role.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _capitalize(role),
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          // Actions row
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
            child: Column(
              children: [
                // Message + Book Session
                Row(
                  children: [
                    Expanded(
                      child: _SmallBtn(
                        icon: Icons.message_outlined,
                        label: 'Msg',
                        color: AppColors.primary,
                        onTap: () => context.push('/messages/$uid'),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _SmallBtn(
                        icon: Icons.event_outlined,
                        label: 'Book',
                        color: const Color(0xFF3B82F6),
                        onTap: () => _bookSession(context),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // Remove / loading
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    onPressed: _removing ? null : _remove,
                    icon: _removing
                        ? const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(
                              strokeWidth: 1.5,
                              color: Colors.red,
                            ),
                          )
                        : const Icon(
                            Icons.person_remove_outlined,
                            size: 13,
                            color: Colors.red,
                          ),
                    label: Text(
                      _removing ? '...' : 'Remove',
                      style: const TextStyle(color: Colors.red, fontSize: 11),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────
//  PENDING TAB
// ─────────────────────────────────────────────────────────
class _PendingTab extends StatefulWidget {
  final List<Map<String, dynamic>> pending;
  final VoidCallback onRefresh;
  const _PendingTab({required this.pending, required this.onRefresh});
  @override
  State<_PendingTab> createState() => _PendingTabState();
}

class _PendingTabState extends State<_PendingTab> {
  String _search = '';
  String _direction = 'All'; // All / Received / Sent
  final Set<int> _actedIds = {};

  static const _dirs = ['All', 'Received', 'Sent'];

  List<Map<String, dynamic>> get _filtered {
    return widget.pending.where((p) {
      if (_actedIds.contains(p['id'])) return false;
      final counterpart = p['counterpart'] as Map<String, dynamic>? ?? {};
      final name = (counterpart['full_name'] as String? ?? '').toLowerCase();
      final role = (counterpart['role'] as String? ?? '').toLowerCase();
      final q = _search.toLowerCase();
      final matchSearch = q.isEmpty || name.contains(q) || role.contains(q);
      final dir = p['direction'] as String? ?? '';
      final matchDir =
          _direction == 'All' ||
          (_direction == 'Received' && dir == 'received') ||
          (_direction == 'Sent' && dir == 'sent');
      return matchSearch && matchDir;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: TextField(
            onChanged: (v) => setState(() => _search = v),
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Search pending requests...',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              prefixIcon: Icon(
                Icons.search,
                color: context.colors.textSecondary,
              ),
              filled: true,
              fillColor: context.colors.card,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.divider),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.divider),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
            ),
          ),
        ),
        // Direction filter chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: _dirs.map((d) {
              final sel = _direction == d;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _direction = d),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : context.colors.card,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: sel ? AppColors.primary : context.colors.divider,
                      ),
                    ),
                    child: Text(
                      d,
                      style: TextStyle(
                        color: sel
                            ? Colors.white
                            : context.colors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: list.isEmpty
              ? Center(
                  child: Text(
                    'No pending requests',
                    style: TextStyle(color: context.colors.textSecondary),
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () async => widget.onRefresh(),
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          mainAxisExtent: 270,
                        ),
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final p = list[i];
                      final reqId = p['id'] as int? ?? 0;
                      final direction = p['direction'] as String? ?? '';
                      final cp =
                          p['counterpart'] as Map<String, dynamic>? ?? {};
                      final uid = cp['id'] as int? ?? 0;
                      final name = cp['full_name'] as String? ?? 'User';
                      final role = cp['role'] as String? ?? '';
                      final company = cp['company'] as String? ?? '';
                      final avatarUrl = cp['avatar_url'] as String?;
                      final subtitle = [
                        cp['title'] as String? ?? '',
                        company,
                      ].where((s) => s.isNotEmpty).join(' @ ');

                      return _PendingCard(
                        uid: uid,
                        name: name,
                        role: role,
                        subtitle: subtitle,
                        avatarUrl: avatarUrl,
                        direction: direction,
                        onAccept: () async {
                          try {
                            await ApiService.instance.respondToConnection(
                              reqId,
                              'accept',
                            );
                            setState(() => _actedIds.add(reqId));
                            widget.onRefresh();
                          } catch (_) {}
                        },
                        onDecline: () async {
                          try {
                            await ApiService.instance.respondToConnection(
                              reqId,
                              'reject',
                            );
                            setState(() => _actedIds.add(reqId));
                            widget.onRefresh();
                          } catch (_) {}
                        },
                        onCancel: () async {
                          try {
                            await ApiService.instance.cancelConnectionRequest(
                              reqId,
                            );
                            setState(() => _actedIds.add(reqId));
                            widget.onRefresh();
                          } catch (_) {}
                        },
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────
//  DISCOVER TAB
// ─────────────────────────────────────────────────────────
class _DiscoverTab extends StatefulWidget {
  final VoidCallback onRefresh;
  const _DiscoverTab({required this.onRefresh});
  @override
  State<_DiscoverTab> createState() => _DiscoverTabState();
}

class _DiscoverTabState extends State<_DiscoverTab> {
  List<Map<String, dynamic>> _users = [];
  bool _loading = true;
  String _error = '';
  final Set<int> _pendingIds = {};
  final Set<int> _connectedIds = {};
  String _selectedRole = 'All';
  String _search = '';

  static const _roles = ['All', 'founder', 'investor'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final me = context.read<AuthProvider>().user?.id;
      final role = _selectedRole == 'All' ? null : _selectedRole;
      final results = await Future.wait([
        ApiService.instance.getDiscoverUsers(null, role: role),
        ApiService.instance.getConnections(),
        ApiService.instance.getPendingRequests(),
      ]);
      final data = results[0];
      final conns = List<Map<String, dynamic>>.from(results[1]);
      final pends = List<Map<String, dynamic>>.from(results[2]);

      final connectedIds = <int>{};
      final pendingIds = <int>{};

      for (final conn in conns) {
        final id = (conn['id'] as num?)?.toInt();
        if (id != null) connectedIds.add(id);
      }

      for (final req in pends) {
        final counterpart = req['counterpart'];
        final counterpartId = counterpart is Map
            ? (counterpart['id'] as num?)?.toInt()
            : null;
        if (counterpartId != null) pendingIds.add(counterpartId);
      }

      if (!mounted) return;
      setState(() {
        _users = List<Map<String, dynamic>>.from(data)
            .where(
              (u) =>
                  u['id'] != me &&
                  u['role'] != 'mentor' &&
                  u['role'] != 'admin',
            )
            .toList();
        _connectedIds
          ..clear()
          ..addAll(connectedIds);
        _pendingIds
          ..clear()
          ..addAll(pendingIds);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _users;
    final q = _search.toLowerCase();
    return _users.where((u) {
      final name = (u['full_name'] as String? ?? '').toLowerCase();
      final role = (u['role'] as String? ?? '').toLowerCase();
      final bio = (u['bio'] as String? ?? '').toLowerCase();
      final company = (u['company'] as String? ?? '').toLowerCase();
      return name.contains(q) ||
          role.contains(q) ||
          bio.contains(q) ||
          company.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: TextField(
            onChanged: (v) => setState(() => _search = v),
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Search people...',
              hintStyle: TextStyle(color: context.colors.textSecondary),
              prefixIcon: Icon(
                Icons.search,
                color: context.colors.textSecondary,
              ),
              filled: true,
              fillColor: context.colors.card,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.divider),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.divider),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
            ),
          ),
        ),
        // Role filter chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: _roles.map((r) {
              final sel = _selectedRole == r;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    setState(() => _selectedRole = r);
                    _load();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : context.colors.card,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: sel ? AppColors.primary : context.colors.divider,
                      ),
                    ),
                    child: Text(
                      _capitalize(r),
                      style: TextStyle(
                        color: sel
                            ? Colors.white
                            : context.colors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: _loading
              ? Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                )
              : _error.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        color: context.colors.textSecondary,
                        size: 40,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Could not load users',
                        style: TextStyle(color: context.colors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _load,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : list.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.explore_outlined,
                        color: context.colors.textSecondary,
                        size: 48,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _search.isNotEmpty
                            ? 'No results for "$_search"'
                            : 'No new people to discover',
                        style: TextStyle(color: context.colors.textSecondary),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _load,
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          mainAxisExtent: 270,
                        ),
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final u = list[i];
                      final uid = u['id'] as int? ?? 0;
                      final name = u['full_name'] as String? ?? 'User';
                      final role = u['role'] as String? ?? '';
                      final bio = u['bio'] as String? ?? '';
                      final title = u['title'] as String? ?? '';
                      final company = u['company'] as String? ?? '';
                      final avatarUrl = u['avatar_url'] as String?;
                      final subtitle = [
                        title,
                        company,
                      ].where((s) => s.isNotEmpty).join(' @ ');
                      final isConnected = _connectedIds.contains(uid);
                      final isPending = _pendingIds.contains(uid);

                      return _DiscoverCard(
                        uid: uid,
                        name: name,
                        role: role,
                        bio: bio,
                        subtitle: subtitle,
                        avatarUrl: avatarUrl,
                        connectionState: isConnected
                            ? 'connected'
                            : (isPending ? 'pending' : 'none'),
                        onMessage: () => context.go('/messages/$uid'),
                        onConnect: () async {
                          if (isConnected || isPending) return;
                          final messenger = ScaffoldMessenger.of(context);
                          try {
                            await ApiService.instance.sendConnectionRequest(
                              uid,
                            );
                            if (!context.mounted) return;
                            setState(() => _pendingIds.add(uid));
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text('Request sent to $name!'),
                                backgroundColor: AppColors.primary,
                              ),
                            );
                          } catch (_) {
                            if (!context.mounted) return;
                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('Could not send request.'),
                              ),
                            );
                          }
                        },
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

class _PendingCard extends StatelessWidget {
  final int uid;
  final String name;
  final String role;
  final String subtitle;
  final String? avatarUrl;
  final String direction;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onCancel;

  const _PendingCard({
    required this.uid,
    required this.name,
    required this.role,
    required this.subtitle,
    required this.avatarUrl,
    required this.direction,
    required this.onAccept,
    required this.onDecline,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final incoming = direction == 'received';
    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.divider),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            GestureDetector(
              onTap: () => context.go('/profile/view/$uid'),
              child: _avatar(context, avatarUrl, name, 28),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            if (subtitle.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ] else if (role.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                _capitalize(role),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ],
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: incoming
                    ? AppColors.primary.withValues(alpha: 0.12)
                    : Colors.orange.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                incoming ? 'Incoming' : 'Outgoing',
                style: TextStyle(
                  color: incoming ? AppColors.primary : Colors.orange,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const Spacer(),
            if (incoming)
              Row(
                children: [
                  Expanded(
                    child: _SmallBtn(
                      icon: Icons.check_rounded,
                      label: 'Accept',
                      color: AppColors.primary,
                      onTap: onAccept,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _SmallBtn(
                      icon: Icons.close_rounded,
                      label: 'Decline',
                      color: Colors.red,
                      onTap: onDecline,
                    ),
                  ),
                ],
              )
            else
              SizedBox(
                width: double.infinity,
                child: _SmallBtn(
                  icon: Icons.cancel_outlined,
                  label: 'Cancel',
                  color: Colors.orange,
                  onTap: onCancel,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DiscoverCard extends StatelessWidget {
  final int uid;
  final String name;
  final String role;
  final String bio;
  final String subtitle;
  final String? avatarUrl;
  final String connectionState;
  final VoidCallback onMessage;
  final VoidCallback onConnect;

  const _DiscoverCard({
    required this.uid,
    required this.name,
    required this.role,
    required this.bio,
    required this.subtitle,
    required this.avatarUrl,
    required this.connectionState,
    required this.onMessage,
    required this.onConnect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.divider),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            GestureDetector(
              onTap: () => context.go('/profile/view/$uid'),
              child: _avatar(context, avatarUrl, name, 28),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            if (role.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                _capitalize(role),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ],
            if (subtitle.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ],
            if (bio.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                bio,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 10,
                  height: 1.25,
                ),
              ),
            ],
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: _SmallBtn(
                icon: connectionState == 'connected'
                    ? Icons.message_outlined
                    : connectionState == 'pending'
                    ? Icons.hourglass_top_rounded
                    : Icons.person_add_alt_1,
                label: connectionState == 'connected'
                    ? 'Message'
                    : connectionState == 'pending'
                    ? 'Pending'
                    : 'Connect',
                color: connectionState == 'connected'
                    ? const Color(0xFF3B82F6)
                    : connectionState == 'pending'
                    ? context.colors.textSecondary
                    : AppColors.primary,
                onTap: connectionState == 'connected'
                    ? onMessage
                    : connectionState == 'pending'
                    ? () {}
                    : onConnect,
              ),
            ),
            const SizedBox(height: 6),
            GestureDetector(
              onTap: () => context.go('/profile/view/$uid'),
              child: Text(
                'View Profile',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────
//  BOOK SESSION SHEET
// ─────────────────────────────────────────────────────────
class _BookSessionSheet extends StatefulWidget {
  final int userId;
  final String userName;
  const _BookSessionSheet({required this.userId, required this.userName});
  @override
  State<_BookSessionSheet> createState() => _BookSessionSheetState();
}

class _BookSessionSheetState extends State<_BookSessionSheet> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _linkCtrl = TextEditingController();
  String _type = 'general_meeting';
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _time = const TimeOfDay(hour: 10, minute: 0);
  int _duration = 60;
  bool _submitting = false;
  bool _loadingAvailability = true;
  int _weekOffset = 0;
  List<Map<String, dynamic>> _availability = [];
  DateTime? _selectedDay;
  Map<String, dynamic>? _selectedSlot;

  static const _types = [
    ('general_meeting', 'General Meeting'),
    ('pitch', 'Pitch Session'),
    ('mentor_session', 'Mentor Session'),
    ('workshop', 'Workshop'),
  ];

  @override
  void initState() {
    super.initState();
    _titleCtrl.text = 'Session with ${widget.userName}';
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    setState(() => _loadingAvailability = true);
    try {
      final slots = await ApiService.instance.getUserAvailability(
        widget.userId,
      );
      if (!mounted) return;
      setState(() {
        _availability = List<Map<String, dynamic>>.from(
          slots,
        ).where((slot) => slot['is_available'] == true).toList();
        _loadingAvailability = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _availability = [];
        _loadingAvailability = false;
      });
    }
  }

  DateTime _startOfWeek(DateTime date) {
    final normalized = DateTime(date.year, date.month, date.day);
    final mondayOffset = (normalized.weekday + 6) % 7;
    return normalized.subtract(Duration(days: mondayOffset));
  }

  List<DateTime> get _visibleWeekDays {
    final base = _startOfWeek(
      DateTime.now(),
    ).add(Duration(days: _weekOffset * 7));
    return List.generate(7, (index) => base.add(Duration(days: index)));
  }

  int _dayOfWeekIndex(DateTime day) => day.weekday - 1;

  List<Map<String, dynamic>> _slotsForDay(DateTime day) {
    final expected = _dayOfWeekIndex(day);
    final slots = _availability
        .where((slot) => (slot['day_of_week'] as int?) == expected)
        .toList();
    slots.sort(
      (a, b) => (a['start_time'] as String? ?? '').compareTo(
        b['start_time'] as String? ?? '',
      ),
    );
    return slots;
  }

  String _formatShortDate(DateTime d) => '${d.day}/${d.month}';

  String _formatDayName(DateTime d) {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return names[d.weekday - 1];
  }

  String _timeRangeLabel(Map<String, dynamic> slot) {
    final start = (slot['start_time'] as String? ?? '00:00').split(':');
    final end = (slot['end_time'] as String? ?? '00:00').split(':');
    return '${start[0]}:${start[1]} - ${end[0]}:${end[1]}';
  }

  TimeOfDay _timeFromSlotValue(String value) {
    final pieces = value.split(':');
    final hour = int.tryParse(pieces.isNotEmpty ? pieces[0] : '0') ?? 0;
    final minute = int.tryParse(pieces.length > 1 ? pieces[1] : '0') ?? 0;
    return TimeOfDay(hour: hour, minute: minute);
  }

  int _durationFromSlot(Map<String, dynamic> slot) {
    final start = _timeFromSlotValue(slot['start_time'] as String? ?? '00:00');
    final end = _timeFromSlotValue(slot['end_time'] as String? ?? '00:00');
    final startMinutes = start.hour * 60 + start.minute;
    final endMinutes = end.hour * 60 + end.minute;
    final delta = endMinutes - startMinutes;
    return delta > 0 ? delta : 60;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.colors.textSecondary.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Book Session with ${widget.userName}',
                      style: TextStyle(
                        color: context.colors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: Icon(
                      Icons.close_rounded,
                      color: context.colors.textSecondary,
                    ),
                    tooltip: 'Close',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _label('Available Slots (Week View)', context),
              const SizedBox(height: 8),
              Row(
                children: [
                  IconButton(
                    onPressed: _weekOffset > 0
                        ? () => setState(() => _weekOffset -= 1)
                        : null,
                    icon: const Icon(Icons.chevron_left),
                    color: context.colors.textPrimary,
                  ),
                  Expanded(
                    child: Text(
                      '${_formatShortDate(_visibleWeekDays.first)} - ${_formatShortDate(_visibleWeekDays.last)}',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _weekOffset += 1),
                    icon: const Icon(Icons.chevron_right),
                    color: context.colors.textPrimary,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 70,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _visibleWeekDays.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, index) {
                    final day = _visibleWeekDays[index];
                    final selected =
                        _selectedDay != null &&
                        _selectedDay!.year == day.year &&
                        _selectedDay!.month == day.month &&
                        _selectedDay!.day == day.day;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedDay = day;
                          _selectedSlot = null;
                        });
                      },
                      child: Container(
                        width: 74,
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primary.withValues(alpha: 0.16)
                              : context.colors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : context.colors.textSecondary.withValues(
                                    alpha: 0.25,
                                  ),
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 8,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _formatDayName(day),
                              style: TextStyle(
                                color: context.colors.textSecondary,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatShortDate(day),
                              style: TextStyle(
                                color: context.colors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              if (_loadingAvailability)
                Row(
                  children: [
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Loading available slots...',
                      style: TextStyle(
                        color: context.colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                )
              else if (_availability.isEmpty)
                Text(
                  'No availability has been set yet for this user.',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                )
              else if (_selectedDay != null)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _slotsForDay(_selectedDay!).map((slot) {
                    final selected =
                        identical(_selectedSlot, slot) ||
                        (_selectedSlot != null &&
                            _selectedSlot!['id'] == slot['id']);
                    return ChoiceChip(
                      selected: selected,
                      onSelected: (_) {
                        setState(() {
                          _selectedSlot = slot;
                          _date = _selectedDay!;
                          _time = _timeFromSlotValue(
                            slot['start_time'] as String? ?? '09:00',
                          );
                          _duration = _durationFromSlot(slot);
                        });
                      },
                      label: Text(_timeRangeLabel(slot)),
                      selectedColor: AppColors.primary.withValues(alpha: 0.18),
                      labelStyle: TextStyle(
                        color: selected
                            ? AppColors.primary
                            : context.colors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      side: BorderSide(
                        color: selected
                            ? AppColors.primary
                            : context.colors.textSecondary.withValues(
                                alpha: 0.25,
                              ),
                      ),
                      backgroundColor: context.colors.background,
                    );
                  }).toList(),
                )
              else
                Text(
                  'Select a day to view slots.',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 12,
                  ),
                ),

              const SizedBox(height: 14),
              _label('Title', context),
              const SizedBox(height: 6),
              _field(
                controller: _titleCtrl,
                hint: 'e.g. Strategy discussion',
                context: context,
              ),
              const SizedBox(height: 14),
              _label('Session Type', context),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _type,
                dropdownColor: context.colors.card,
                style: TextStyle(color: context.colors.textPrimary),
                decoration: _inputDecoration(null, context),
                items: _types
                    .map(
                      (t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _type = v!),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Date', context),
                        const SizedBox(height: 6),
                        _datePicker(context),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Time', context),
                        const SizedBox(height: 6),
                        _timePicker(context),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _label('Duration', context),
              const SizedBox(height: 6),
              DropdownButtonFormField<int>(
                value: _duration,
                dropdownColor: context.colors.card,
                style: TextStyle(color: context.colors.textPrimary),
                decoration: _inputDecoration(null, context),
                items: [30, 60, 90, 120]
                    .map(
                      (d) => DropdownMenuItem(
                        value: d,
                        child: Text(
                          d < 60
                              ? '$d min'
                              : '${d ~/ 60}h${d % 60 > 0 ? " ${d % 60}min" : ""}',
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _duration = v!),
              ),
              const SizedBox(height: 14),
              _label('Meeting Link (optional)', context),
              const SizedBox(height: 6),
              _field(
                controller: _linkCtrl,
                hint: 'https://meet.google.com/...',
                context: context,
              ),
              const SizedBox(height: 14),
              _label('Notes (optional)', context),
              const SizedBox(height: 6),
              _field(
                controller: _descCtrl,
                hint: 'Agenda or notes...',
                context: context,
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Book Session',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final title = _titleCtrl.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter a title')));
      return;
    }

    final hasAvailability = _availability.isNotEmpty;
    if (hasAvailability && (_selectedDay == null || _selectedSlot == null)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select one available slot from the week view'),
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      DateTime startDt;
      DateTime endDt;

      if (hasAvailability && _selectedDay != null && _selectedSlot != null) {
        final start = _timeFromSlotValue(
          _selectedSlot!['start_time'] as String? ?? '09:00',
        );
        final end = _timeFromSlotValue(
          _selectedSlot!['end_time'] as String? ?? '10:00',
        );
        startDt = DateTime(
          _selectedDay!.year,
          _selectedDay!.month,
          _selectedDay!.day,
          start.hour,
          start.minute,
        );
        endDt = DateTime(
          _selectedDay!.year,
          _selectedDay!.month,
          _selectedDay!.day,
          end.hour,
          end.minute,
        );
      } else {
        startDt = DateTime(
          _date.year,
          _date.month,
          _date.day,
          _time.hour,
          _time.minute,
        );
        endDt = startDt.add(Duration(minutes: _duration));
      }

      if (startDt.isBefore(DateTime.now())) {
        throw Exception('Please choose a future slot');
      }

      await ApiService.instance.createMeeting({
        'participant_id': widget.userId,
        'title': title,
        'meeting_type': _type,
        'start_time': startDt.toUtc().toIso8601String(),
        'end_time': endDt.toUtc().toIso8601String(),
        'timezone': 'Africa/Kigali',
        if (_linkCtrl.text.trim().isNotEmpty)
          'meeting_url': _linkCtrl.text.trim(),
        if (_descCtrl.text.trim().isNotEmpty)
          'description': _descCtrl.text.trim(),
      });
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Session booked successfully!'),
          backgroundColor: AppColors.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Widget _datePicker(BuildContext ctx) {
    return GestureDetector(
      onTap: () async {
        final d = await showDatePicker(
          context: ctx,
          initialDate: _date,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (d != null) setState(() => _date = d);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          border: Border.all(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              Icons.calendar_today,
              size: 14,
              color: ctx.colors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              '${_date.day}/${_date.month}/${_date.year}',
              style: TextStyle(color: ctx.colors.textPrimary, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _timePicker(BuildContext ctx) {
    return GestureDetector(
      onTap: () async {
        final t = await showTimePicker(context: ctx, initialTime: _time);
        if (t != null) setState(() => _time = t);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          border: Border.all(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.access_time, size: 14, color: ctx.colors.textSecondary),
            const SizedBox(width: 6),
            Text(
              _time.format(ctx),
              style: TextStyle(color: ctx.colors.textPrimary, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text, BuildContext ctx) => Text(
    text,
    style: TextStyle(
      color: ctx.colors.textSecondary,
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
  );

  Widget _field({
    required TextEditingController controller,
    required String hint,
    required BuildContext context,
    int maxLines = 1,
  }) => TextField(
    controller: controller,
    maxLines: maxLines,
    style: TextStyle(color: context.colors.textPrimary),
    decoration: _inputDecoration(hint, context),
  );

  InputDecoration _inputDecoration(String? hint, BuildContext ctx) =>
      InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: ctx.colors.textSecondary),
        filled: true,
        fillColor: ctx.colors.background,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 13,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: ctx.colors.textSecondary.withValues(alpha: 0.3),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      );
}

// ─────────────────────────────────────────────────────────
//  Shared small widgets
// ─────────────────────────────────────────────────────────
class _SmallBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _SmallBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    ),
  );
}
