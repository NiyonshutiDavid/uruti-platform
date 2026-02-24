import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import apiClient from '@/services/api';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordDialog({
  isOpen,
  onClose,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.forgotPassword(email);
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
          <AlertDialogDescription>
            {submitted
              ? 'Check your email for password reset instructions'
              : 'Enter your email address to receive a password reset link'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <AlertDialogCancel onClick={handleClose}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </AlertDialogAction>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </div>
            <div className="text-sm text-gray-500">
              The link will expire in 1 hour. Check your spam folder if you don't see the email.
            </div>
            <AlertDialogCancel onClick={handleClose} className="w-full">
              Done
            </AlertDialogCancel>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
