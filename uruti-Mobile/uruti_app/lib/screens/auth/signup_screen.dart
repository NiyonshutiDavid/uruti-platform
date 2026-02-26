import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  int _currentStep = 1; // 1=role, 2=basic info, 3=profile
  String? _userType; // 'founder' or 'investor'
  bool _showPassword = false;
  bool _isSubmitting = false;
  String? _submitError;

  // Step 2 controllers
  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();

  // Step 3a – Founder
  final _bioCtrl = TextEditingController();
  final _linkedinCtrl = TextEditingController();
  final _twitterCtrl = TextEditingController();
  final _websiteCtrl = TextEditingController();
  final _skillsCtrl = TextEditingController();

  // Step 3b – Investor
  final _orgNameCtrl = TextEditingController();
  String _investorType = '';
  String _investmentRange = '';
  String _investmentStage = '';
  String _portfolioSize = '';
  final _sectorsCtrl = TextEditingController();
  final _criteriaCtrl = TextEditingController();

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _phoneCtrl.dispose();
    _locationCtrl.dispose();
    _bioCtrl.dispose();
    _linkedinCtrl.dispose();
    _twitterCtrl.dispose();
    _websiteCtrl.dispose();
    _skillsCtrl.dispose();
    _orgNameCtrl.dispose();
    _sectorsCtrl.dispose();
    _criteriaCtrl.dispose();
    super.dispose();
  }

  // ── Navigation helpers ──────────────────────────────────────────────────

  void _selectRole(String type) {
    setState(() {
      _userType = type;
      _currentStep = 2;
      _submitError = null;
    });
  }

  void _handleBack() {
    setState(() {
      _submitError = null;
      if (_currentStep == 2) {
        _currentStep = 1;
        _userType = null;
      } else {
        _currentStep--;
      }
    });
  }

  void _handleContinue() {
    setState(() => _submitError = null);
    if (_currentStep == 2 && !_validateStep2()) return;
    setState(() => _currentStep++);
  }

  // ── Validation ───────────────────────────────────────────────────────────

  bool _validateStep2() {
    if (_fullNameCtrl.text.trim().isEmpty) {
      setState(() => _submitError = 'Full name is required.');
      return false;
    }
    if (_emailCtrl.text.trim().isEmpty || !_emailCtrl.text.contains('@')) {
      setState(() => _submitError = 'A valid email address is required.');
      return false;
    }
    if (_passwordCtrl.text.length < 8) {
      setState(() => _submitError = 'Password must be at least 8 characters.');
      return false;
    }
    if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
      setState(() => _submitError = 'Passwords do not match.');
      return false;
    }
    if (_phoneCtrl.text.trim().isEmpty) {
      setState(() => _submitError = 'Phone number is required.');
      return false;
    }
    if (_locationCtrl.text.trim().isEmpty) {
      setState(() => _submitError = 'Location is required.');
      return false;
    }
    return true;
  }

  bool _validateStep3Investor() {
    if (_orgNameCtrl.text.trim().isEmpty) {
      setState(() => _submitError = 'Organization name is required.');
      return false;
    }
    if (_investorType.isEmpty) {
      setState(() => _submitError = 'Please select an investor type.');
      return false;
    }
    if (_investmentRange.isEmpty) {
      setState(() => _submitError = 'Please select an investment range.');
      return false;
    }
    if (_investmentStage.isEmpty) {
      setState(() => _submitError = 'Please select a preferred stage.');
      return false;
    }
    if (_portfolioSize.isEmpty) {
      setState(() => _submitError = 'Please select portfolio size.');
      return false;
    }
    if (_sectorsCtrl.text.trim().isEmpty) {
      setState(() => _submitError = 'Please enter your preferred sectors.');
      return false;
    }
    if (_criteriaCtrl.text.trim().isEmpty) {
      setState(() => _submitError = 'Investment criteria is required.');
      return false;
    }
    return true;
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  Future<void> _handleSubmit({bool skipProfile = false}) async {
    setState(() {
      _submitError = null;
      _isSubmitting = true;
    });

    if (!skipProfile && _userType == 'investor' && !_validateStep3Investor()) {
      setState(() => _isSubmitting = false);
      return;
    }

    final auth = context.read<AuthProvider>();
    final success = await auth.register(
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
      fullName: _fullNameCtrl.text.trim(),
      role: _userType!,
    );

    if (!mounted) return;

    if (!success) {
      setState(() {
        _submitError = auth.error ?? 'Registration failed. Please try again.';
        _isSubmitting = false;
      });
      return;
    }

    // Save optional profile details after successful registration + auto-login
    if (!skipProfile) {
      try {
        if (_userType == 'founder') {
          final Map<String, dynamic> data = {};
          if (_bioCtrl.text.isNotEmpty) data['bio'] = _bioCtrl.text.trim();
          if (_linkedinCtrl.text.isNotEmpty) {
            data['linkedin_url'] = _linkedinCtrl.text.trim();
          }
          if (_twitterCtrl.text.isNotEmpty) {
            data['twitter_url'] = _twitterCtrl.text.trim();
          }
          if (_websiteCtrl.text.isNotEmpty) {
            data['website_url'] = _websiteCtrl.text.trim();
          }
          if (_skillsCtrl.text.isNotEmpty) {
            data['skills'] = _skillsCtrl.text
                .split(',')
                .map((s) => s.trim())
                .toList();
          }
          if (data.isNotEmpty) {
            await ApiService.instance.updateProfile(data);
            await auth.refreshUser();
          }
        } else if (_userType == 'investor') {
          final Map<String, dynamic> data = {
            'phone': _phoneCtrl.text.trim(),
            'location': _locationCtrl.text.trim(),
          };
          if (_orgNameCtrl.text.isNotEmpty) {
            data['organization'] = _orgNameCtrl.text.trim();
          }
          if (_investorType.isNotEmpty) {
            data['investor_type'] = _investorType;
          }
          if (_investmentRange.isNotEmpty) {
            data['investment_range'] = _investmentRange;
          }
          if (_sectorsCtrl.text.isNotEmpty) {
            data['preferred_sectors'] = _sectorsCtrl.text
                .split(',')
                .map((s) => s.trim())
                .toList();
          }
          if (_investmentStage.isNotEmpty) {
            data['investment_stage'] = _investmentStage;
          }
          if (_portfolioSize.isNotEmpty) {
            data['portfolio_size'] = _portfolioSize;
          }
          if (_criteriaCtrl.text.isNotEmpty) {
            data['investment_thesis'] = _criteriaCtrl.text.trim();
          }
          await ApiService.instance.updateProfile(data);
          await auth.refreshUser();
        }
      } catch (_) {
        // Profile update failures are silent – account was created successfully
      }
    }

    // app_router will redirect to the correct dashboard based on auth state
  }

  // ── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  if (_currentStep > 1)
                    IconButton(
                      icon: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 20,
                      ),
                      color: AppColors.primary,
                      onPressed: _isSubmitting ? null : _handleBack,
                    )
                  else
                    const SizedBox(width: 40),
                  const Spacer(),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: context.colors.darkGreenMid,
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Image.asset(
                        'assets/images/Uruti-icon-white.png',
                        width: 26,
                        height: 26,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: Text(
                      'Sign In',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // ── Step indicator (only when role is chosen) ──
            if (_userType != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: _StepIndicator(
                  currentStep: _currentStep,
                  userType: _userType!,
                ),
              ),

            const SizedBox(height: 12),

            // ── Scrollable content ──
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Error banner
                    if (_submitError != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          border: Border.all(
                            color: AppColors.error.withValues(alpha: 0.3),
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: AppColors.error,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _submitError!,
                                style: TextStyle(
                                  color: AppColors.error,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // ── Steps ──
                    if (_currentStep == 1) _buildRoleStep(),
                    if (_currentStep == 2) _buildBasicInfoStep(),
                    if (_currentStep == 3 && _userType == 'founder')
                      _buildFounderProfileStep(),
                    if (_currentStep == 3 && _userType == 'investor')
                      _buildInvestorProfileStep(),

                    const SizedBox(height: 24),

                    // ── Navigation buttons ──
                    if (_currentStep == 2)
                      _PrimaryButton(
                        label: 'Continue',
                        icon: Icons.arrow_forward_rounded,
                        onPressed: _isSubmitting ? null : _handleContinue,
                      ),

                    if (_currentStep == 3 && _userType == 'founder') ...[
                      _PrimaryButton(
                        label: _isSubmitting
                            ? 'Creating Account…'
                            : 'Complete Registration',
                        icon: Icons.check_circle_outline_rounded,
                        onPressed: _isSubmitting ? null : () => _handleSubmit(),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _isSubmitting
                            ? null
                            : () => _handleSubmit(skipProfile: true),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: AppColors.primary),
                          foregroundColor: AppColors.primary,
                          minimumSize: const Size.fromHeight(50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Skip for Now',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],

                    if (_currentStep == 3 && _userType == 'investor')
                      _PrimaryButton(
                        label: _isSubmitting
                            ? 'Creating Account…'
                            : 'Complete Registration',
                        icon: Icons.check_circle_outline_rounded,
                        onPressed: _isSubmitting ? null : () => _handleSubmit(),
                      ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 1: Role Selection ────────────────────────────────────────────────

  Widget _buildRoleStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text(
          'Create Your Account',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: context.colors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          "Join Rwanda's leading entrepreneurship ecosystem",
          textAlign: TextAlign.center,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 28),
        Text(
          'I am a…',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: context.colors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Choose the option that best describes you',
          textAlign: TextAlign.center,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 20),

        _RoleCard(
          icon: Icons.rocket_launch_rounded,
          iconColor: Colors.deepPurple,
          iconBg: const Color(0xFFEDE7F6),
          title: 'Founder / Entrepreneur',
          subtitle:
              "I'm building a startup and need guidance, mentorship, and connections to investors",
          onTap: () => _selectRole('founder'),
        ),
        const SizedBox(height: 16),

        _RoleCard(
          icon: Icons.monetization_on_rounded,
          iconColor: AppColors.primary,
          iconBg: const Color(0xFFE8F5E9),
          title: 'Investor / VC',
          subtitle:
              "I'm looking to discover and invest in promising startups in Rwanda and East Africa",
          onTap: () => _selectRole('investor'),
        ),

        const SizedBox(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Already have an account? ',
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 14,
              ),
            ),
            GestureDetector(
              onTap: () => context.go('/login'),
              child: Text(
                'Sign In',
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Step 2: Basic Information ─────────────────────────────────────────────

  Widget _buildBasicInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          title: 'Basic Information',
          subtitle: 'Tell us about yourself',
        ),
        const SizedBox(height: 20),

        _Field(
          label: 'Full Name',
          hint: 'John Doe',
          icon: Icons.person_outline_rounded,
          controller: _fullNameCtrl,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Email Address',
          hint: 'john@example.com',
          icon: Icons.mail_outline_rounded,
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 14),

        _PasswordField(
          label: 'Password',
          hint: 'Min. 8 characters',
          controller: _passwordCtrl,
          showPassword: _showPassword,
          onToggle: () => setState(() => _showPassword = !_showPassword),
        ),
        const SizedBox(height: 14),

        _PasswordField(
          label: 'Confirm Password',
          hint: 'Re-enter password',
          controller: _confirmPasswordCtrl,
          showPassword: _showPassword,
          onToggle: () => setState(() => _showPassword = !_showPassword),
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Phone Number',
          hint: '+250 788 000 000',
          icon: Icons.phone_outlined,
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Location',
          hint: 'Kigali, Rwanda',
          icon: Icons.location_on_outlined,
          controller: _locationCtrl,
        ),
      ],
    );
  }

  // ── Step 3a: Founder Profile ──────────────────────────────────────────────

  Widget _buildFounderProfileStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          title: 'Complete Your Profile',
          subtitle:
              'Help us personalise your experience\n(Optional — you can skip this step)',
        ),
        const SizedBox(height: 20),

        _Field(
          label: 'Bio',
          hint: 'Tell us about yourself, your experience, and what drives you…',
          icon: Icons.description_outlined,
          controller: _bioCtrl,
          maxLines: 3,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'LinkedIn URL',
          hint: 'https://linkedin.com/in/yourprofile',
          icon: Icons.link_rounded,
          controller: _linkedinCtrl,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Twitter / X URL',
          hint: 'https://twitter.com/yourhandle',
          icon: Icons.alternate_email_rounded,
          controller: _twitterCtrl,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Personal Website',
          hint: 'https://yourwebsite.com',
          icon: Icons.language_rounded,
          controller: _websiteCtrl,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Skills (comma-separated)',
          hint: 'e.g., Product Management, Marketing, Software Development',
          icon: Icons.work_outline_rounded,
          controller: _skillsCtrl,
        ),
        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.info.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
          ),
          child: Text(
            '💡 You can add your startup details later in the Startup Lab module. Focus on building your profile first!',
            style: TextStyle(color: AppColors.info, fontSize: 13),
          ),
        ),
      ],
    );
  }

  // ── Step 3b: Investor Profile ─────────────────────────────────────────────

  Widget _buildInvestorProfileStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          title: 'Investment Profile',
          subtitle: 'Help us match you with relevant startups',
        ),
        const SizedBox(height: 20),

        _Field(
          label: 'Organization Name *',
          hint: 'Your fund or organisation',
          icon: Icons.business_outlined,
          controller: _orgNameCtrl,
        ),
        const SizedBox(height: 14),

        _DropdownField<String>(
          label: 'Investor Type *',
          value: _investorType.isEmpty ? null : _investorType,
          items: const [
            DropdownMenuItem(value: 'angel', child: Text('Angel Investor')),
            DropdownMenuItem(value: 'vc', child: Text('Venture Capital')),
            DropdownMenuItem(value: 'corporate', child: Text('Corporate VC')),
            DropdownMenuItem(value: 'accelerator', child: Text('Accelerator')),
            DropdownMenuItem(
              value: 'family-office',
              child: Text('Family Office'),
            ),
          ],
          onChanged: (v) => setState(() => _investorType = v ?? ''),
        ),
        const SizedBox(height: 14),

        _DropdownField<String>(
          label: 'Investment Range *',
          value: _investmentRange.isEmpty ? null : _investmentRange,
          items: const [
            DropdownMenuItem(value: '0-50k', child: Text('\$0 – \$50K')),
            DropdownMenuItem(value: '50k-250k', child: Text('\$50K – \$250K')),
            DropdownMenuItem(value: '250k-1m', child: Text('\$250K – \$1M')),
            DropdownMenuItem(value: '1m-5m', child: Text('\$1M – \$5M')),
            DropdownMenuItem(value: '5m+', child: Text('\$5M+')),
          ],
          onChanged: (v) => setState(() => _investmentRange = v ?? ''),
        ),
        const SizedBox(height: 14),

        _DropdownField<String>(
          label: 'Preferred Investment Stage *',
          value: _investmentStage.isEmpty ? null : _investmentStage,
          items: const [
            DropdownMenuItem(value: 'pre-seed', child: Text('Pre-Seed')),
            DropdownMenuItem(value: 'seed', child: Text('Seed')),
            DropdownMenuItem(value: 'series-a', child: Text('Series A')),
            DropdownMenuItem(value: 'series-b+', child: Text('Series B+')),
            DropdownMenuItem(value: 'any', child: Text('Any Stage')),
          ],
          onChanged: (v) => setState(() => _investmentStage = v ?? ''),
        ),
        const SizedBox(height: 14),

        _DropdownField<String>(
          label: 'Portfolio Size *',
          value: _portfolioSize.isEmpty ? null : _portfolioSize,
          items: const [
            DropdownMenuItem(value: '0-5', child: Text('0–5 companies')),
            DropdownMenuItem(value: '6-15', child: Text('6–15 companies')),
            DropdownMenuItem(value: '16-30', child: Text('16–30 companies')),
            DropdownMenuItem(value: '31+', child: Text('31+ companies')),
          ],
          onChanged: (v) => setState(() => _portfolioSize = v ?? ''),
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Preferred Sectors * (comma-separated)',
          hint: 'e.g., FinTech, Agriculture, Healthcare',
          icon: Icons.category_outlined,
          controller: _sectorsCtrl,
        ),
        const SizedBox(height: 14),

        _Field(
          label: 'Investment Criteria *',
          hint: 'What do you look for in a startup?',
          icon: Icons.checklist_rounded,
          controller: _criteriaCtrl,
          maxLines: 4,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  final String userType;

  const _StepIndicator({required this.currentStep, required this.userType});

  @override
  Widget build(BuildContext context) {
    final labels = [
      'Account Type',
      'Basic Info',
      userType == 'founder' ? 'Profile Details' : 'Investment Profile',
    ];
    return Column(
      children: [
        Row(
          children: List.generate(3, (i) {
            final step = i + 1;
            final done = currentStep > step;
            final active = currentStep == step;
            return Expanded(
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (done || active)
                          ? AppColors.primary
                          : Colors.grey.shade300,
                      boxShadow: active
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withValues(
                                  alpha: 0.35,
                                ),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: done
                          ? const Icon(
                              Icons.check_rounded,
                              color: Colors.white,
                              size: 18,
                            )
                          : Text(
                              '$step',
                              style: TextStyle(
                                color: active
                                    ? Colors.white
                                    : Colors.grey.shade600,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                    ),
                  ),
                  if (step < 3)
                    Expanded(
                      child: Container(
                        height: 3,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: currentStep > step
                              ? AppColors.primary
                              : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: labels
              .map(
                (l) => Text(
                  l,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _StepHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _StepHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: context.colors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
        ),
      ],
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.colors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: context.colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: context.colors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final String hint;
  final IconData icon;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final int maxLines;

  const _Field({
    required this.label,
    required this.hint,
    required this.icon,
    required this.controller,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.colors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: context.colors.textSecondary.withValues(alpha: 0.5),
              fontSize: 13,
            ),
            filled: true,
            fillColor: context.colors.card,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
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
      ],
    );
  }
}

class _PasswordField extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final bool showPassword;
  final VoidCallback onToggle;

  const _PasswordField({
    required this.label,
    required this.hint,
    required this.controller,
    required this.showPassword,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.lock_outline_rounded,
              size: 16,
              color: AppColors.primary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.colors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: !showPassword,
          style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: context.colors.textSecondary.withValues(alpha: 0.5),
              fontSize: 13,
            ),
            filled: true,
            fillColor: context.colors.card,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            suffixIcon: IconButton(
              icon: Icon(
                showPassword ? Icons.visibility_off : Icons.visibility,
                size: 20,
                color: context.colors.textSecondary,
              ),
              onPressed: onToggle,
            ),
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
      ],
    );
  }
}

class _DropdownField<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  const _DropdownField({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: context.colors.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<T>(
          value: value,
          items: items,
          onChanged: onChanged,
          dropdownColor: context.colors.card,
          style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.card,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
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
          hint: Text(
            'Select…',
            style: TextStyle(
              color: context.colors.textSecondary.withValues(alpha: 0.5),
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;

  const _PrimaryButton({
    required this.label,
    required this.icon,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 2,
      ),
    );
  }
}
