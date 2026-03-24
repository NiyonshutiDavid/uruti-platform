import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

import 'package:uruti/widgets/top_notification.dart';

void main() {
  testWidgets('TopNotification shows and auto-dismisses', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) {
              return Center(
                child: ElevatedButton(
                  onPressed: () {
                    TopNotification.show(
                      context,
                      title: 'Info',
                      message: 'Saved successfully',
                      duration: const Duration(milliseconds: 800),
                    );
                  },
                  child: const Text('Show'),
                ),
              );
            },
          ),
        ),
      ),
    );

    await tester.tap(find.text('Show'));
    await tester.pump();

    expect(find.text('Info'), findsOneWidget);
    expect(find.text('Saved successfully'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1000));
    expect(find.text('Saved successfully'), findsNothing);
  });

  testWidgets('TopNotification error variant can be dismissed by tap', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) {
              return Center(
                child: ElevatedButton(
                  onPressed: () {
                    TopNotification.show(
                      context,
                      title: 'Error',
                      message: 'Failed to save profile',
                      isError: true,
                      duration: const Duration(seconds: 5),
                    );
                  },
                  child: const Text('Show Error'),
                ),
              );
            },
          ),
        ),
      ),
    );

    await tester.tap(find.text('Show Error'));
    await tester.pump();

    expect(find.text('Failed to save profile'), findsOneWidget);
    expect(find.byIcon(Icons.error_outline_rounded), findsOneWidget);

    await tester.tap(find.text('Failed to save profile'));
    await tester.pump();

    expect(find.text('Failed to save profile'), findsNothing);
  });
}
