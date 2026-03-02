import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UrutiLogo } from '../UrutiLogo';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

interface AdminLoginPageProps {
  onLogin: () => void;
  onNavigateHome: () => void;
}

export function AdminLoginPage({ onLogin, onNavigateHome }: AdminLoginPageProps) {
  const { login, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(formData.email, formData.password);
      const storedUser = localStorage.getItem('uruti_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user || user.role !== 'admin') {
        await logout();
        setError('This account is not an administrator account.');
        return;
      }
      onLogin();
    } catch (err) {
      setError('Invalid admin credentials. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md">
        <Card className="glass-card border-orange-500/20 dark:border-orange-500/30 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            {/* Logo and Admin Badge */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
              <UrutiLogo className="w-auto h-12" />
              <div className="flex items-center space-x-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <Shield className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-bold text-orange-500" style={{ fontFamily: 'var(--font-heading)' }}>
                  ADMIN ACCESS
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="mb-6 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  Restricted Area
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  This area is restricted to system administrators only. Unauthorized access attempts will be logged.
                </p>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Admin Sign In
              </h2>
              <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Enter your administrator credentials
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400" style={{ fontFamily: 'var(--font-body)' }}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2" style={{ fontFamily: 'var(--font-body)' }}>
                  <Mail className="h-4 w-4 text-orange-500" />
                  <span>Admin Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@uruti.rw"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="glass-card border-black/10 dark:border-white/10 h-12 focus:border-orange-500 focus:ring-orange-500"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2" style={{ fontFamily: 'var(--font-body)' }}>
                  <Lock className="h-4 w-4 text-orange-500" />
                  <span>Admin Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    className="glass-card border-black/10 dark:border-white/10 h-12 pr-12 focus:border-orange-500 focus:ring-orange-500"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 h-12 text-base"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {isLoading ? 'Verifying...' : 'Access Admin Panel'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 text-center">
              <button
                onClick={onNavigateHome}
                className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                ← Back to Home
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-gray-500/5 border border-gray-500/10 rounded-lg">
              <p className="text-xs text-center text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                🔒 All access attempts are monitored and logged for security purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
