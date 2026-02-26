import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../screens/main_scaffold.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  final _faqs = const [
    {
      'q': 'How is my AI Readiness Score calculated?',
      'a':
          'Your score is computed from pitch performance, profile completeness, engagement, and mentor feedback — weighted by stage.',
    },
    {
      'q': 'How do I connect with investors?',
      'a':
          'Use Startup Discovery to find investors, then send a connection request. Messages unlock after both parties connect.',
    },
    {
      'q': 'How do I schedule a pitch session?',
      'a':
          'Go to Pitch Coach and tap "Go Live". Previous sessions are saved in your profile.',
    },
    {
      'q': 'Can mentors see my documents?',
      'a':
          'Only documents you explicitly share appear in your public profile. Private documents stay in your vault.',
    },
    {
      'q': 'How do I upgrade my account?',
      'a':
          'Contact our team at support@uruti.rw for premium plans and partnerships.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: context.colors.textPrimary),
          onPressed: () => MainScaffold.scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'Help & Support',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Contact card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A3A0A), Color(0xFF0D2010)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need help?',
                  style: TextStyle(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 20,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Our team is available Mon–Fri, 9am–5pm EAT',
                  style: TextStyle(
                    color: context.colors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _ContactBtn(Icons.email_outlined, 'Email Us', () {}),
                    const SizedBox(width: 12),
                    _ContactBtn(Icons.chat_outlined, 'Live Chat', () {}),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Help Center button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () async {
                final uri = Uri.parse('https://uruti.io/help');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
              icon: const Icon(Icons.open_in_new_rounded, size: 16),
              label: const Text('Visit Help Center'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: BorderSide(color: AppColors.primary, width: 1.5),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          Text(
            'Frequently Asked Questions',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),

          ..._faqs.map((f) => _FaqCard(q: f['q']!, a: f['a']!)),
          const SizedBox(height: 24),

          // Feedback
          Text(
            'Send Feedback',
            style: TextStyle(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            maxLines: 4,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Tell us how we can improve...',
              hintStyle: TextStyle(
                color: context.colors.textSecondary.withValues(alpha: 0.5),
              ),
              filled: true,
              fillColor: context.colors.card,
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
                borderSide: BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Submit Feedback'),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _ContactBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ContactBtn(this.icon, this.label, this.onTap);
  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.primary, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _FaqCard extends StatefulWidget {
  final String q, a;
  const _FaqCard({required this.q, required this.a});
  @override
  State<_FaqCard> createState() => _FaqCardState();
}

class _FaqCardState extends State<_FaqCard> {
  bool _expanded = false;
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    decoration: BoxDecoration(
      color: context.colors.card,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(
        color: _expanded
            ? AppColors.primary.withValues(alpha: 0.3)
            : context.colors.divider,
      ),
    ),
    child: ListTile(
      title: Text(
        widget.q,
        style: TextStyle(
          color: context.colors.textPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: _expanded
          ? Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                widget.a,
                style: TextStyle(
                  color: context.colors.textSecondary,
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            )
          : null,
      trailing: Icon(
        _expanded ? Icons.expand_less : Icons.expand_more,
        color: context.colors.textSecondary,
      ),
      onTap: () => setState(() => _expanded = !_expanded),
    ),
  );
}
