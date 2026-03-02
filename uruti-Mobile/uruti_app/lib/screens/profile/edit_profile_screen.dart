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
  bool _uploadingCover = false;
  File? _localAvatar;
  File? _localCover;

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
    final auth = context.read<AuthProvider>();
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
      await auth.updateUserLocally(updated);
      if (!mounted) return;
      await auth.refreshUser();
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

  Future<void> _pickAndUploadCover() async {
    final auth = context.read<AuthProvider>();
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1600,
    );
    if (picked == null) return;

    setState(() {
      _localCover = File(picked.path);
      _uploadingCover = true;
    });

    try {
      final updated = await ApiService.instance.uploadCoverImage(picked.path);
      if (!mounted) return;
      await auth.updateUserLocally(updated);
      if (!mounted) return;
      await auth.refreshUser();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Cover upload failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploadingCover = false);
    }
  }

  Future<void> _removeProfilePhoto() async {
    final auth = context.read<AuthProvider>();
    setState(() => _uploadingPhoto = true);
    try {
      final updated = await ApiService.instance.updateProfile({
        'avatar_url': null,
      });
      if (!mounted) return;
      setState(() => _localAvatar = null);
      await auth.updateUserLocally(updated);
      if (!mounted) return;
      await auth.refreshUser();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to remove photo: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _removeCoverPhoto() async {
    final auth = context.read<AuthProvider>();
    setState(() => _uploadingCover = true);
    try {
      final updated = await ApiService.instance.updateProfile({
        'cover_image_url': null,
      });
      if (!mounted) return;
      setState(() => _localCover = null);
      await auth.updateUserLocally(updated);
      if (!mounted) return;
      await auth.refreshUser();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to remove cover: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploadingCover = false);
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
      await auth.updateUserLocally(updated);
      if (!mounted) return;
      await auth.refreshUser();
      if (!mounted) return;
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
    final coverUrl = user?.resolvedCoverImageUrl;

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
                  if (_localAvatar != null || avatarUrl != null)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _uploadingPhoto ? null : _removeProfilePhoto,
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: context.colors.background,
                              width: 2,
                            ),
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 14,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // ── Cover photo ────────────────────────────────────────────
            _sectionLabel('Cover Photo'),
            Container(
              height: 140,
              decoration: BoxDecoration(
                color: context.colors.card,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: context.colors.divider),
                image: (_localCover != null || coverUrl != null)
                    ? DecorationImage(
                        image: _localCover != null
                            ? FileImage(_localCover!) as ImageProvider
                            : NetworkImage(coverUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
                gradient: (_localCover == null && coverUrl == null)
                    ? LinearGradient(
                        colors: [const Color(0xFF1A3A0A), context.colors.card],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
              ),
              child: Stack(
                children: [
                  Positioned(
                    right: 10,
                    bottom: 10,
                    child: ElevatedButton.icon(
                      onPressed: _uploadingCover ? null : _pickAndUploadCover,
                      icon: _uploadingCover
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.upload_rounded, size: 16),
                      label: const Text('Upload'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        textStyle: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  if (_localCover != null || coverUrl != null)
                    Positioned(
                      right: 10,
                      top: 10,
                      child: GestureDetector(
                        onTap: _uploadingCover ? null : _removeCoverPhoto,
                        child: Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.delete_outline,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

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
