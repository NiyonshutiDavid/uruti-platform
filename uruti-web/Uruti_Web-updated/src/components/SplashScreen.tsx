import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import urutiIconWhite from '@assets/Uruti-icon-white.png';

export function SplashScreen() {
  const navigate = useNavigate();
  const [showRing, setShowRing] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animation sequence matching mobile:
    // 200ms delay → ring + logo start → 400ms delay → text starts → ~3s hold → fade out → navigate
    const t1 = setTimeout(() => {
      setShowRing(true);
      setShowLogo(true);
    }, 200);

    const t2 = setTimeout(() => {
      setShowText(true);
    }, 600);

    // Start fade out at ~3.5s
    const t3 = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    // Navigate after fade-out completes (~4s total)
    const t4 = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [navigate]);

  return (
    <div
      className={`splash-root ${fadeOut ? 'splash-fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0D2410 0%, #000000 70%)',
        overflow: 'hidden',
        transition: 'opacity 0.5s ease-out',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Inline styles for keyframe animations */}
      <style>{`
        @keyframes splash-ring-pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes splash-logo-scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.15);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes splash-text-slide-up {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes splash-spinner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes splash-accent-line-expand {
          0% {
            width: 0;
            opacity: 0;
          }
          100% {
            width: 120px;
            opacity: 1;
          }
        }

        .splash-fade-out {
          opacity: 0 !important;
        }
      `}</style>

      {/* Main content area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          position: 'relative',
        }}
      >
        {/* Ring pulse animation */}
        {showRing && (
          <div
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '2px solid rgba(118, 185, 71, 0.4)',
              animation: 'splash-ring-pulse 2s ease-out infinite',
            }}
          />
        )}

        {/* Logo container */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: '#1A3A1A',
            border: '2px solid rgba(118, 185, 71, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'scale(1)' : 'scale(0)',
            animation: showLogo ? 'splash-logo-scale 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : 'none',
            boxShadow: '0 0 40px rgba(118, 185, 71, 0.15)',
          }}
        >
          <img
            src={urutiIconWhite}
            alt="Uruti"
            style={{
              width: 64,
              height: 64,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Text section */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* App name */}
          <h1
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 1.2,
              margin: 0,
              opacity: showText ? 1 : 0,
              transform: showText ? 'translateY(0)' : 'translateY(30px)',
              animation: showText ? 'splash-text-slide-up 0.6s ease-out forwards' : 'none',
              fontFamily: 'var(--font-heading, system-ui)',
            }}
          >
            Uruti
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: 13,
              color: '#AAAAAA',
              margin: 0,
              opacity: showText ? 1 : 0,
              transform: showText ? 'translateY(0)' : 'translateY(30px)',
              animation: showText ? 'splash-text-slide-up 0.6s ease-out 0.15s forwards' : 'none',
              animationFillMode: 'both',
              fontFamily: 'var(--font-body, system-ui)',
            }}
          >
            Digital Ecosystem for Founders &amp; Investors
          </p>

          {/* Accent decorative line with text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
              opacity: showText ? 1 : 0,
              animation: showText ? 'splash-text-slide-up 0.6s ease-out 0.3s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            <div
              style={{
                height: 1,
                backgroundColor: '#76B947',
                opacity: 0.6,
                animation: showText ? 'splash-accent-line-expand 0.8s ease-out 0.4s forwards' : 'none',
                animationFillMode: 'both',
                width: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: '#76B947',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body, system-ui)',
                letterSpacing: 0.5,
              }}
            >
              For investors and founders
            </span>
            <div
              style={{
                height: 1,
                backgroundColor: '#76B947',
                opacity: 0.6,
                animation: showText ? 'splash-accent-line-expand 0.8s ease-out 0.4s forwards' : 'none',
                animationFillMode: 'both',
                width: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom spinner */}
      <div
        style={{
          marginBottom: 60,
          opacity: showText ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: '2px solid transparent',
            borderTopColor: '#76B947',
            borderRightColor: '#76B947',
            borderRadius: '50%',
            animation: 'splash-spinner 0.8s linear infinite',
          }}
        />
      </div>
    </div>
  );
}
