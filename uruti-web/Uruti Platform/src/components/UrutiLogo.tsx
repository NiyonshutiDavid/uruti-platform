import logoImage from "figma:asset/75560f1730e92124453d0b37b270c7a11552a580.png";

export function UrutiLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img 
      src={logoImage} 
      alt="Uruti Logo" 
      className={className}
    />
  );
}

export function UrutiLogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold text-xl sm:text-2xl dark:text-white ${className}`} style={{ fontFamily: 'var(--font-heading)' }}>
      Uruti
    </span>
  );
}