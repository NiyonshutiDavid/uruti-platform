// Migrated to Zustand — backward-compatibility shim.
// All state logic lives in src/lib/stores/theme-store.ts
import type { ReactNode } from 'react';
export { useTheme, useThemeStore } from './stores/theme-store';

// No-op provider so existing `import { ThemeProvider }` statements still compile
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
