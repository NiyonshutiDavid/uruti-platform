// Migrated to Zustand — backward-compatibility shim.
// All state logic lives in src/lib/stores/auth-store.ts
import type { ReactNode } from 'react';
export { useAuth, useAuthStore } from './stores/auth-store';
export type { User, UserRole } from './stores/auth-store';

// No-op provider so existing `import { AuthProvider }` statements still compile
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
