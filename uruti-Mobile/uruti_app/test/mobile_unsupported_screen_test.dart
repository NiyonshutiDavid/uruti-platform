import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:uruti/screens/auth/mobile_unsupported_screen.dart';

Widget _wrap(Widget child) {
  return MaterialApp(home: child);
}

void main() {
  testWidgets('shows admin unsupported messaging', (WidgetTester tester) async {
    await tester.pumpWidget(
      _wrap(const MobileUnsupportedScreen(reason: UnsupportedReason.admin)),
    );

    expect(find.text('Access Not Supported'), findsOneWidget);
    expect(
      find.textContaining(
        'currently supports Founder and Investor accounts only',
      ),
      findsOneWidget,
    );
    expect(find.text('Back to Login'), findsOneWidget);
    expect(find.text('Contact Support'), findsNothing);
  });

  testWidgets('shows deactivated messaging and support action', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        const MobileUnsupportedScreen(reason: UnsupportedReason.deactivated),
      ),
    );

    expect(find.text('Account Deactivated'), findsOneWidget);
    expect(find.text('Contact Support'), findsOneWidget);
    expect(find.text('Back to Login'), findsOneWidget);
  });
}
