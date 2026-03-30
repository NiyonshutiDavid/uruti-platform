import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

function applyTheme(theme: Theme) {
  localStorage.setItem('uruti-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

const initialTheme = (localStorage.getItem('uruti-theme') as Theme) || 'light';
applyTheme(initialTheme);

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    }),
}));

// Backward-compatible hook — same API as the old useTheme() from theme-context
export function useTheme() {
  return useThemeStore();
}
