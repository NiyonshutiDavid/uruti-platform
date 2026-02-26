#!/bin/bash
set -e
ROOT="/Users/davidniyonshutii/Documents/MissionCapstone/uruti-platform/uruti-Mobile/uruti_app"
TARGET_DIRS="$ROOT/lib/screens $ROOT/lib/widgets $ROOT/lib/core/app_router.dart"

echo "Finding dart files..."
FILES=$(find $ROOT/lib/screens $ROOT/lib/widgets -name "*.dart" 2>/dev/null)
FILES="$FILES $ROOT/lib/core/app_router.dart"

COUNT=0
for f in $FILES; do
  [ -f "$f" ] || continue
  sed -i '' \
    -e 's/AppColors\.background\b/context.colors.background/g' \
    -e 's/AppColors\.cardBackground\b/context.colors.card/g' \
    -e 's/AppColors\.surfaceBackground\b/context.colors.surface/g' \
    -e 's/AppColors\.textPrimary\b/context.colors.textPrimary/g' \
    -e 's/AppColors\.textSecondary\b/context.colors.textSecondary/g' \
    -e 's/AppColors\.textMuted\b/context.colors.textMuted/g' \
    -e 's/AppColors\.divider\b/context.colors.divider/g' \
    -e 's/AppColors\.navInactive\b/context.colors.navInactive/g' \
    -e 's/AppColors\.darkGreenMid\b/context.colors.darkGreenMid/g' \
    -e 's/AppColors\.cardBorder\b/context.colors.cardBorder/g' \
    -e 's/AppColors\.surfaceVariant\b/context.colors.surfaceVariant/g' \
    -e 's/AppColors\.shimmerBase\b/context.colors.shimmerBase/g' \
    -e 's/AppColors\.shimmerHighlight\b/context.colors.shimmerHighlight/g' \
    -e 's/AppColors\.card\b/context.colors.card/g' \
    -e 's/AppColors\.surface\b/context.colors.surface/g' \
    "$f"
  COUNT=$((COUNT+1))
done
echo "Processed $COUNT files."
