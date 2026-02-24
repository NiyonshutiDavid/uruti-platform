STUN/TURN guidance
===================

For WebRTC media in production you should run or use a TURN server (and optionally STUN).

Recommended quick options:

- Use a managed TURN provider (e.g., Twilio, Xirsys) and set their `urls`, `username`, and `credential` on the frontend when creating RTCPeerConnection's `iceServers`.
- Run `coturn` yourself and expose it on UDP/TCP ports 3478/5349. Example minimal coturn config:

```
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=<YOUR_SECRET>
realm=your.domain
total-quota=100
user-quota=50
no-stdout-log
```

- On the frontend pass the TURN/STUN config into RTCPeerConnection:

```js
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.your.domain:3478', username: 'user', credential: 'pass' }
  ]
});
```

Store TURN credentials in env vars and never commit them.
