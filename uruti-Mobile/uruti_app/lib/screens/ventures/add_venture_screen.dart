import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../services/api_service.dart';

// ─── Constants ────────────────────────────────────────────────────────────────

const _stages = [
  ('ideation', 'Ideation', 'Concept phase — idea not yet validated'),
  ('validation', 'Validation', 'Testing assumptions with potential users'),
  ('mvp', 'MVP', 'Minimum viable product built or in progress'),
  ('early_traction', 'Early Traction', 'First customers / paying users'),
  ('growth', 'Growth', 'Scaling operations and user base'),
  ('scale', 'Scale', 'Expanding to new markets'),
];

const _industries = [
  ('technology', 'Technology', Icons.computer_rounded),
  ('agriculture', 'Agriculture', Icons.grass_rounded),
  ('healthcare', 'Healthcare', Icons.local_hospital_rounded),
  ('education', 'Education', Icons.school_rounded),
  ('fintech', 'Fintech', Icons.account_balance_rounded),
  ('manufacturing', 'Manufacturing', Icons.factory_rounded),
  ('services', 'Services', Icons.handshake_rounded),
  ('retail', 'Retail', Icons.storefront_rounded),
  ('other', 'Other', Icons.category_rounded),
];

// ─── Screen ───────────────────────────────────────────────────────────────────

class AddVentureScreen extends StatefulWidget {
  const AddVentureScreen({super.key});
  @override
  State<AddVentureScreen> createState() => _AddVentureScreenState();
}

class _AddVentureScreenState extends State<AddVentureScreen>
    with SingleTickerProviderStateMixin {
  int _step = 0;
  bool _submitting = false;

  // Controllers
  final _nameCtrl = TextEditingController();
  final _taglineCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _problemCtrl = TextEditingController();
  final _solutionCtrl = TextEditingController();
  final _marketCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();

  // Selections
  String _stage = 'ideation';
  String? _industry;

  // Validation
  String? _nameError;
  String? _industryError;

  late final AnimationController _progressCtrl;
  late Animation<double> _progressAnim;

  final _pageCtrl = PageController();

  @override
  void initState() {
    super.initState();
    _progressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
      value: 0,
    );
    _progressAnim = CurvedAnimation(
      parent: _progressCtrl,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _progressCtrl.dispose();
    _pageCtrl.dispose();
    for (final c in [
      _nameCtrl,
      _taglineCtrl,
      _descCtrl,
      _problemCtrl,
      _solutionCtrl,
      _marketCtrl,
      _modelCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _goTo(int step) {
    setState(() => _step = step);
    _progressCtrl.animateTo(step / 2);
    _pageCtrl.animateToPage(
      step,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  bool _validateStep0() {
    bool ok = true;
    setState(() {
      _nameError = _nameCtrl.text.trim().isEmpty
          ? 'Venture name is required'
          : null;
      _industryError = _industry == null ? 'Please select an industry' : null;
      if (_nameError != null || _industryError != null) ok = false;
    });
    return ok;
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty) {
      _goTo(0);
      return;
    }
    if (_industry == null) {
      _goTo(0);
      return;
    }

    setState(() => _submitting = true);
    try {
      await ApiService.instance.createVenture({
        'name': _nameCtrl.text.trim(),
        'tagline': _taglineCtrl.text.trim().isEmpty
            ? null
            : _taglineCtrl.text.trim(),
        'description': _descCtrl.text.trim().isEmpty
            ? null
            : _descCtrl.text.trim(),
        'problem_statement': _problemCtrl.text.trim().isEmpty
            ? null
            : _problemCtrl.text.trim(),
        'solution': _solutionCtrl.text.trim().isEmpty
            ? null
            : _solutionCtrl.text.trim(),
        'target_market': _marketCtrl.text.trim().isEmpty
            ? null
            : _marketCtrl.text.trim(),
        'business_model': _modelCtrl.text.trim().isEmpty
            ? null
            : _modelCtrl.text.trim(),
        'stage': _stage,
        'industry': _industry,
      });
      if (!mounted) return;
      _showSuccess();
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('ApiException', '').trim()),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  void _showSuccess() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: context.colors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_rounded,
                color: AppColors.primary,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Venture Added!',
              style: TextStyle(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '"${_nameCtrl.text.trim()}" has been created successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.colors.textSecondary,
                fontSize: 14,
              ),
            ),
          ],
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(160, 44),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () {
              Navigator.pop(context); // close dialog
              context.pop(); // back to profile
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: context.colors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Add Venture',
          style: TextStyle(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // ── Progress bar ──
          _ProgressBar(step: _step, anim: _progressAnim),

          // ── Step labels ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                _StepLabel(index: 0, current: _step, label: 'Essentials'),
                const Spacer(),
                _StepLabel(index: 1, current: _step, label: 'Your Story'),
                const Spacer(),
                _StepLabel(index: 2, current: _step, label: 'Market'),
              ],
            ),
          ),

          // ── Pages ──
          Expanded(
            child: PageView(
              controller: _pageCtrl,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _Step0(
                  nameCtrl: _nameCtrl,
                  taglineCtrl: _taglineCtrl,
                  stage: _stage,
                  industry: _industry,
                  nameError: _nameError,
                  industryError: _industryError,
                  onStageChanged: (v) => setState(() => _stage = v),
                  onIndustryChanged: (v) => setState(() {
                    _industry = v;
                    _industryError = null;
                  }),
                  onNameChanged: (_) => setState(() => _nameError = null),
                ),
                _Step1(
                  problemCtrl: _problemCtrl,
                  solutionCtrl: _solutionCtrl,
                  descCtrl: _descCtrl,
                ),
                _Step2(marketCtrl: _marketCtrl, modelCtrl: _modelCtrl),
              ],
            ),
          ),

          // ── Nav buttons ──
          _NavBar(
            step: _step,
            submitting: _submitting,
            onBack: () => _goTo(_step - 1),
            onNext: () {
              if (_step == 0 && !_validateStep0()) return;
              _goTo(_step + 1);
            },
            onSubmit: _submit,
          ),
        ],
      ),
    );
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

class _ProgressBar extends StatelessWidget {
  final int step;
  final Animation<double> anim;
  const _ProgressBar({required this.step, required this.anim});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: anim,
      builder: (_, __) => LinearProgressIndicator(
        value: (step + 1) / 3,
        backgroundColor: context.colors.divider,
        valueColor: const AlwaysStoppedAnimation(AppColors.primary),
        minHeight: 3,
      ),
    );
  }
}

class _StepLabel extends StatelessWidget {
  final int index, current;
  final String label;
  const _StepLabel({
    required this.index,
    required this.current,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final isDone = current > index;
    final isActive = current == index;
    return Row(
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: isDone || isActive
                ? AppColors.primary
                : context.colors.divider,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check_rounded, size: 12, color: Colors.white)
                : Text(
                    '${index + 1}',
                    style: TextStyle(
                      color: isActive
                          ? Colors.white
                          : context.colors.textSecondary,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            color: isActive
                ? context.colors.textPrimary
                : context.colors.textSecondary,
            fontSize: 12,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

// ─── Step 0: Essentials ───────────────────────────────────────────────────────

class _Step0 extends StatelessWidget {
  final TextEditingController nameCtrl, taglineCtrl;
  final String stage;
  final String? industry;
  final String? nameError, industryError;
  final ValueChanged<String> onStageChanged, onIndustryChanged, onNameChanged;

  const _Step0({
    required this.nameCtrl,
    required this.taglineCtrl,
    required this.stage,
    required this.industry,
    required this.nameError,
    required this.industryError,
    required this.onStageChanged,
    required this.onIndustryChanged,
    required this.onNameChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle('What\'s your venture called?'),
          const SizedBox(height: 12),
          _Field(
            controller: nameCtrl,
            label: 'Venture Name',
            hint: 'e.g. Uruti Health',
            errorText: nameError,
            onChanged: onNameChanged,
            maxLength: 80,
          ),
          const SizedBox(height: 16),
          _Field(
            controller: taglineCtrl,
            label: 'Tagline (optional)',
            hint: 'A one-liner that captures your mission',
            maxLength: 120,
          ),
          const SizedBox(height: 24),
          _SectionTitle('Industry'),
          if (industryError != null) ...[
            const SizedBox(height: 4),
            Text(
              industryError!,
              style: TextStyle(color: Colors.red.shade400, fontSize: 12),
            ),
          ],
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.1,
            children: _industries.map((ind) {
              final selected = industry == ind.$1;
              return _IndustryTile(
                icon: ind.$3,
                label: ind.$2,
                selected: selected,
                onTap: () => onIndustryChanged(ind.$1),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          _SectionTitle('Stage'),
          const SizedBox(height: 12),
          ..._stages.map(
            (s) => _StageTile(
              value: s.$1,
              label: s.$2,
              subtitle: s.$3,
              selected: stage == s.$1,
              onTap: () => onStageChanged(s.$1),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─── Step 1: Your Story ───────────────────────────────────────────────────────

class _Step1 extends StatelessWidget {
  final TextEditingController problemCtrl, solutionCtrl, descCtrl;
  const _Step1({
    required this.problemCtrl,
    required this.solutionCtrl,
    required this.descCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle('Problem Statement'),
          const SizedBox(height: 4),
          Text(
            'What pain point are you solving?',
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 12),
          _Field(
            controller: problemCtrl,
            label: 'Problem',
            hint: 'Describe the problem your venture addresses...',
            maxLines: 4,
          ),
          const SizedBox(height: 20),
          _SectionTitle('Your Solution'),
          const SizedBox(height: 4),
          Text(
            'How does your venture solve it?',
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 12),
          _Field(
            controller: solutionCtrl,
            label: 'Solution',
            hint: 'Explain what makes your approach unique...',
            maxLines: 4,
          ),
          const SizedBox(height: 20),
          _SectionTitle('Overview (optional)'),
          const SizedBox(height: 12),
          _Field(
            controller: descCtrl,
            label: 'Full Description',
            hint: 'A broader description of your venture...',
            maxLines: 5,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─── Step 2: Market & Model ───────────────────────────────────────────────────

class _Step2 extends StatelessWidget {
  final TextEditingController marketCtrl, modelCtrl;
  const _Step2({required this.marketCtrl, required this.modelCtrl});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle('Target Market'),
          const SizedBox(height: 4),
          Text(
            'Who are your primary customers?',
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 12),
          _Field(
            controller: marketCtrl,
            label: 'Target Market',
            hint: 'e.g. SMEs in East Africa, Rural farmers in Rwanda...',
            maxLines: 3,
          ),
          const SizedBox(height: 20),
          _SectionTitle('Business Model'),
          const SizedBox(height: 4),
          Text(
            'How do you make money?',
            style: TextStyle(color: context.colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 12),
          _Field(
            controller: modelCtrl,
            label: 'Business Model',
            hint: 'e.g. SaaS subscription, freemium, marketplace commission...',
            maxLines: 3,
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'All fields on this step are optional. You can always update your venture details later.',
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─── Navigation bar ───────────────────────────────────────────────────────────

class _NavBar extends StatelessWidget {
  final int step;
  final bool submitting;
  final VoidCallback onBack, onNext, onSubmit;

  const _NavBar({
    required this.step,
    required this.submitting,
    required this.onBack,
    required this.onNext,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: context.colors.surface,
          border: Border(top: BorderSide(color: context.colors.divider)),
        ),
        child: Row(
          children: [
            if (step > 0)
              OutlinedButton(
                onPressed: submitting ? null : onBack,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: context.colors.divider),
                  foregroundColor: context.colors.textPrimary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Back'),
              ),
            if (step > 0) const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: submitting
                    ? null
                    : step < 2
                    ? onNext
                    : onSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        step < 2 ? 'Continue' : 'Create Venture',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Reusable widgets ─────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      color: context.colors.textPrimary,
      fontWeight: FontWeight.w700,
      fontSize: 15,
    ),
  );
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label, hint;
  final String? errorText;
  final int maxLines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;

  const _Field({
    required this.controller,
    required this.label,
    required this.hint,
    this.errorText,
    this.maxLines = 1,
    this.maxLength,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      maxLength: maxLength,
      onChanged: onChanged,
      style: TextStyle(color: context.colors.textPrimary, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        errorText: errorText,
        labelStyle: TextStyle(
          color: context.colors.textSecondary,
          fontSize: 13,
        ),
        hintStyle: TextStyle(
          color: context.colors.textSecondary.withValues(alpha: 0.5),
          fontSize: 13,
        ),
        filled: true,
        fillColor: context.colors.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: context.colors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: context.colors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red.shade400),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
    );
  }
}

class _IndustryTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _IndustryTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.12)
              : context.colors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppColors.primary : context.colors.divider,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: selected
                  ? AppColors.primary
                  : context.colors.textSecondary,
              size: 22,
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selected
                    ? AppColors.primary
                    : context.colors.textSecondary,
                fontSize: 11,
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StageTile extends StatelessWidget {
  final String value, label, subtitle;
  final bool selected;
  final VoidCallback onTap;
  const _StageTile({
    required this.value,
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.07)
              : context.colors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppColors.primary : context.colors.divider,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? AppColors.primary : context.colors.divider,
                  width: 2,
                ),
              ),
              child: selected
                  ? Center(
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: selected
                          ? AppColors.primary
                          : context.colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: context.colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
