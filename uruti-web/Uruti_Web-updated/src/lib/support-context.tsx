// Migrated to Zustand — backward-compatibility shim.
// All state logic lives in src/lib/stores/support-store.ts
import type { ReactNode } from 'react';
export { useSupport, useSupportStore } from './stores/support-store';
export type { SupportMessage } from './stores/support-store';

// No-op provider so existing `import { SupportProvider }` statements still compile
export function SupportProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
