import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    navigate(isAuthenticated ? '/dashboard' : '/home');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-md">
        {/* 404 visual */}
        <div className="space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <span
              className="text-[120px] font-bold leading-none select-none"
              style={{
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #76B947 0%, #5a9035 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              Page not found
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1
            className="text-2xl font-semibold dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Oops, this page doesn&apos;t exist
          </h1>
          <p
            className="text-muted-foreground"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            The page you&apos;re looking for may have been moved, deleted, or never
            existed. Double-check the URL and try again.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={handleGoHome}
            className="bg-[#76B947] hover:bg-[#5a9035] text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          </Button>
        </div>
      </div>
    </div>
  );
}
