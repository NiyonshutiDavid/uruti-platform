import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';

export function AdminCredentialsModule() {
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please complete all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setSaving(true);
      const updated = await apiClient.updateAdminCredentials({
        email,
        current_password: currentPassword,
        new_password: newPassword,
      });

      updateUser({ email: updated.email, full_name: updated.full_name, display_name: updated.display_name });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Admin credentials updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Admin Credentials
        </h1>
        <p className="text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          Only administrator email and password can be updated here
        </p>
      </div>

      <Card className="glass-card border-black/10 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Shield className="h-5 w-5 text-[#76B947]" />
            Credential Security
          </CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
            Update your admin login credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Admin Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-[#76B947] text-white hover:bg-[#76B947]/90">
            <Lock className="h-4 w-4 mr-2" />
            {saving ? 'Updating...' : 'Update Admin Credentials'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
