import logoImage from "figma:asset/75560f1730e92124453d0b37b270c7a11552a580.png";
import logoWhite from "figma:asset/5502f2a03310f58145f5272ed6138e223e54afe2.png";
import { useTheme } from '../lib/theme-context';

export function UrutiLogo({ className = "w-10 h-10", forceTheme }: { className?: string; forceTheme?: 'light' | 'dark' }) {
  let currentTheme: 'light' | 'dark';
  
  if (forceTheme) {
    currentTheme = forceTheme;
  } else {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { theme } = useTheme();
      currentTheme = theme;
    } catch {
      // If useTheme is not available (outside ThemeProvider), default to light
      currentTheme = 'light';
    }
  }

  return (
    <img 
      src={currentTheme === 'dark' ? logoWhite : logoImage}
      alt="Uruti Logo" 
      className={className}
    />
  );
}