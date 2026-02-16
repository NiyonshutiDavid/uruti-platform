import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UrutiLogo, UrutiLogoText } from '../UrutiLogo';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically validate credentials
    console.log('Login attempt:', formData);
    onLogin();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#76B947]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col space-y-8">
          <div className="flex items-center space-x-3">
            <UrutiLogo className="w-auto h-16" />
          </div>
          
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 dark:text-white leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome Back to
              <br />
              <span className="text-[#76B947]">Your Journey</span>
            </h1>
            <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Continue building your investment-ready venture with AI-powered guidance and expert mentorship.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#76B947] font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  AI-Powered Advisory
                </p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Get personalized guidance 24/7
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#76B947] font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Investor Network
                </p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Connect with active investors
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#76B947]/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-[#76B947] font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Track Your Progress
                </p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Monitor your Uruti Score
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="glass-card border-black/5 dark:border-white/10 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <UrutiLogo className="w-auto h-12" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Sign In
              </h2>
              <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2" style={{ fontFamily: 'var(--font-body)' }}>
                  <Mail className="h-4 w-4 text-[#76B947]" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="founder@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="glass-card border-black/10 dark:border-white/10 h-12"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2" style={{ fontFamily: 'var(--font-body)' }}>
                  <Lock className="h-4 w-4 text-[#76B947]" />
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    className="glass-card border-black/10 dark:border-white/10 h-12 pr-12"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#76B947] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-black/10 dark:border-white/10 text-[#76B947] focus:ring-[#76B947]"
                  />
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-[#76B947] hover:text-[#76B947]/80 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90 h-12 text-base"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                Don't have an account?
              </p>
              <Button
                variant="outline"
                onClick={() => onNavigate('signup')}
                className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Create Account
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
              <button
                onClick={() => onNavigate('home')}
                className="text-sm text-muted-foreground hover:text-[#76B947] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                ← Back to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}