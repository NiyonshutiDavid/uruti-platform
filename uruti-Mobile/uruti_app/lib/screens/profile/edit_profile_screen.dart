import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  // Basic
  late TextEditingController _nameCtrl;
  late TextEditingController _bioCtrl;
  late TextEditingController _titleCtrl;
  late TextEditingController _companyCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _linkedinCtrl;
  late TextEditingController _websiteCtrl;
  late TextEditingController _twitterCtrl;

  // Professional
  late TextEditingController _industryCtrl;
  late TextEditingController _expertiseCtrl; // comma-separated
  late TextEditingController _yearsCtrl;

  // Founder-specific
  late TextEditingController _fundingCtrl;
  String? _selectedStage;

  // Investor-specific
  late TextEditingController _investmentFocusCtrl; // comma-separated
  late TextEditingController _sectorsCtrl; // comma-separated

  bool _saving = false;
  bool _uploadingPhoto = false;
  File? _localAvatar;

  static const _stages = ['idea', 'pre-seed', 'seed', 'series-a', 'growth'];

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthProvider>().user!;
    _nameCtrl = TextEditingController(text: u.fullName);
    _bioCtrl = TextEditingController(text: u.bio ?? '');
    _titleCtrl = TextEditingController(text: u.title ?? '');
    _companyCtrl = TextEditingController(text: u.company ?? '');
    _locationCtrl = TextEditingController(text: u.location ?? '');
    _phoneCtrl = TextEditingController(text: u.phone ?? '');
    _linkedinCtrl = TextEditingController(text: u.linkedinUrl ?? '');
    _websiteCtrl = TextEditingController(text: u.websiteUrl ?? '');
    _twitterCtrl = TextEditingController(text: u.twitterUrl ?? '');
    _industryCtrl = TextEditingController(text: u.industry ?? '');
    _expertiseCtrl = TextEditingController(
      text: (u.expertise ?? []).join(', '),
    );
    _yearsCtrl = TextEditingController(
      text: u.yearsOfExperience != null ? '${u.yearsOfExperience}' : '',
    );
    _fundingCtrl = TextEditingController(text: u.fundingAmount ?? '');
    _selectedStage = u.stage;
    _investmentFocusCtrl = TextEditingController(
      text: (u.investmentFocus ?? []).join(', '),
    );
    _sectorsCtrl = TextEditingController(
      text: (u.preferredSectors ?? []).join(', '),
    );
  }

  @override
  void dispose() {
    for (final c in [
      _nameCtrl,
      _bioCtrl,
      _titleCtrl,
      _companyCtrl,
      _locationCtrl,
      _phoneCtrl,
      _linkedinCtrl,
      _websiteCtrl,
      _twitterCtrl,
      _industryCtrl,
      _expertiseCtrl,
      _yearsCtrl,
      _fundingCtrl,
      _investmentFocusCtrl,
      _sectorsCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  List<String> _splitTags(String raw) =>
      raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();

  Future<void> _pickAndUploadPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 512,
    );
    if (picked == null) return;
    setState(() {
      _localAvatar = File(picked.path);
      _uploadingPhoto = true;
    });
    try {
      final updated = await ApiService.instance.uploadAvatar(picked.path);
      if (!mounted) return;
      context.read<AuthProvider>().updateUserLocally(updated);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Photo upload failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'full_name': _nameCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
        'title': _titleCtrl.text.trim(),
        'company': _companyCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'linkedin_url': _linkedinCtrl.text.trim(),
        'website_url': _websiteCtrl.text.trim(),
        'twitter_url': _twitterCtrl.text.trim(),
        'industry': _industryCtrl.text.trim(),
        'expertise': _splitTags(_expertiseCtrl.text),
      };
      final years = int.tryParse(_yearsCtrl.text.trim());
      if (years != null) payload['years_of_experience'] = years;

      final auth = context.read<AuthProvider>();
      final role = auth.user?.role ?? '';
      if (role == 'founder') {
        payload['stage'] = _selectedStage;
        payload['funding_amount'] = _fundingCtrl.text.trim();
      } else if (role == 'investor') {
        payload['investment_focus'] = _splitTags(_investmentFocusCtrl.text);
        payload['preferred_sectors'] = _splitTags(_sectorsCtrl.text);
      }

      final updated = await ApiService.instance.updateProfile(payload);
      if (!mounted) return;
      auth.updateUserLocally(updated);
      context.canPop() ? context.pop() : context.go('/profile');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final role = user?.role ?? '';
    final avatarUrl = user?.resolvedAvatarUrl;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: context.colors.textPrimary),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/profile'),
        ),
        title: Text(
          'Edit Profile',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  )
                : Text(
                    'Save',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Profile photo ──────────────────────────────────────────
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: context.colors.darkGreenMid,
                    backgroundImage: _localAvatar != null
                        ? FileImage(_localAvatar!) as ImageProvider
                        : (avatarUrl != null ? NetworkImage(avatarUrl) : null),
                    child: (_localAvatar == null && avatarUrl == null)
                        ? Text(
                            (user?.fullName ?? 'U').isNotEmpty
                                ? (user!.fullName[0]).toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: _uploadingPhoto ? null : _pickAndUploadPhoto,
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: context.colors.background,
                            width: 2,
                          ),
                        ),
                        child: _uploadingPhoto
                            ? const Padding(
                                padding: EdgeInsets.all(6),
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(
                                Icons.camera_alt,
                                color: Colors.white,
                                size: 16,
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // ── Basic info ─────────────────────────────────────────────
            _sectionLabel('Basic Info'),
            _f(
              'Full Name',
              _nameCtrl,
              validator: (v) => v!.trim().isEmpty ? 'Required' : null,
            ),
            _f(
              'Bio',
              _bioCtrl,
              maxLines: 4,
              hint: 'Tell people about yourself...',
            ),
            _f('Job Title', _titleCtrl, hint: 'e.g. CEO & Co-Founder'),
            _f('Company / Startup', _companyCtrl),
            _f('Location', _locationCtrl, hint: 'City, Country'),
            _f('Phone', _phoneCtrl, keyboard: TextInputType.phone),
            const SizedBox(height: 8),

            // ── Online presence ────────────────────────────────────────
            _sectionLabel('Online Presence'),
            _f(
              'LinkedIn URL',
              _linkedinCtrl,
              keyboard: TextInputType.url,
              hint: 'https://linkedin.com/in/',
            ),
            _f(
              'Website',
              _websiteCtrl,
              keyboard: TextInputType.url,
              hint: 'https://',
            ),
            _f(
              'Twitter / X',
              _twitterCtrl,
              hint: 'https://twitter.com/yourhandle',
            ),
            const SizedBox(height: 8),

            // ── Professional ───────────────────────────────────────────
            _sectionLabel('Professional'),
            _f(
              'Industry',
              _industryCtrl,
              hint: 'e.g. Fintech, HealthTech, AgriTech',
            ),
            _f(
              'Expertise',
              _expertiseCtrl,
              hint: 'Comma-separated: e.g. ML, Product, Finance',
            ),
            _f(
              'Years of Experience',
              _yearsCtrl,
              keyboard: TextInputType.number,
            ),
            const SizedBox(height: 8),

            // ── Founder-specific ───────────────────────────────────────
            if (role == 'founder') ...[
              _sectionLabel('Startup Details'),
              _dropdownField(
                'Funding Stage',
                _stages,
                _selectedStage,
                (v) => setState(() => _selectedStage = v),
              ),
              _f(
                'Funding Amount',
                _fundingCtrl,
                hint: 'e.g. \$500K, Series Seed',
              ),
              const SizedBox(height: 8),
            ],

            // ── Investor-specific ──────────────────────────────────────
            if (role == 'investor') ...[
              _sectionLabel('Investment Profile'),
              _f(
                'Investment Focus',
                _investmentFocusCtrl,
                hint: 'Comma-separated: e.g. SaaS, Impact, Deep Tech',
              ),
              _f(
                'Preferred Sectors',
                _sectorsCtrl,
                hint: 'Comma-separated: e.g. Health, Energy, Education',
              ),
              const SizedBox(height: 8),
            ],

            const SizedBox(height: 60),
          ],
        ),
      ),
    );
  }

  // ── Section header
  Widget _sectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Text(
        label,
        style: TextStyle(
          color: AppColors.primary,
          fontSize: 13,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  // ── Dropdown field
  Widget _dropdownField(
    String label,
    List<String> options,
    String? value,
    ValueChanged<String?> onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: context.colors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: value,
            onChanged: onChanged,
            dropdownColor: context.colors.card,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
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
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
            items: options
                .map(
                  (s) => DropdownMenuItem(
                    value: s,
                    child: Text(
                      s,
                      style: TextStyle(color: context.colors.textPrimary),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  // ── Text field helper
  Widget _f(
    String label,
    TextEditingController ctrl, {
    int maxLines = 1,
    TextInputType keyboard = TextInputType.text,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: context.colors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: ctrl,
            maxLines: maxLines,
            keyboardType: keyboard,
            validator: validator,
            style: TextStyle(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: hint,
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
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.red),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
