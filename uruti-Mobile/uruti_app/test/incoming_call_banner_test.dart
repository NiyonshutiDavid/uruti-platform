import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:uruti/models/call_session.dart';
import 'package:uruti/widgets/incoming_call_banner.dart';

CallSession _session({bool isVideo = false}) {
  return CallSession(
    id: 'call-1',
    callerId: 'u1',
    callerName: 'Alice Doe',
    isVideo: isVideo,
    createdAt: DateTime(2026, 1, 1),
  );
}

Widget _wrap(Widget child) {
  return MaterialApp(home: Scaffold(body: child));
}

void main() {
  testWidgets('renders incoming state details and action buttons', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        IncomingCallBanner(
          session: _session(),
          isIncoming: true,
          isOutgoing: false,
          isActive: false,
          videoEnabled: false,
          activeDuration: const Duration(seconds: 0),
          onExpand: () {},
          onAccept: () {},
          onDecline: () {},
          onEnd: () {},
        ),
      ),
    );

    expect(find.text('Alice Doe'), findsOneWidget);
    expect(find.text('Incoming call'), findsOneWidget);
    expect(find.byIcon(Icons.call_rounded), findsOneWidget);
    expect(find.byIcon(Icons.call_end_rounded), findsOneWidget);
  });

  testWidgets('renders active state and triggers end callback', (
    WidgetTester tester,
  ) async {
    var ended = false;

    await tester.pumpWidget(
      _wrap(
        IncomingCallBanner(
          session: _session(),
          isIncoming: false,
          isOutgoing: false,
          isActive: true,
          videoEnabled: false,
          activeDuration: const Duration(minutes: 1, seconds: 5),
          onExpand: () {},
          onAccept: () {},
          onDecline: () {},
          onEnd: () {
            ended = true;
          },
        ),
      ),
    );

    expect(find.textContaining('On call'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.call_end_rounded));
    await tester.pump();

    expect(ended, isTrue);
    expect(find.byIcon(Icons.call_rounded), findsNothing);
  });
}
