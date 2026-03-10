import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Search, UserPlus, Trash2, Users, Pencil, UserX, UserCheck, Wifi } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useLocation, useNavigate } from 'react-router-dom';

type AdminUserRole = 'founder' | 'investor' | 'admin';

export function AdminUserManagementModule() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const addUserSectionRef = useRef<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<any | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const [userStats, setUserStats] = useState({
    total: 0,
    founders: 0,
    investors: 0,
    admins: 0,
  });
  const pageSize = 10;
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'founder' as AdminUserRole,
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: 'founder' as AdminUserRole,
    is_active: true,
    password: '',
  });

  const currentParams = new URLSearchParams(location.search);
  const cameFromDashboard = currentParams.get('from') === 'admin-dashboard';
  const returnTabParam = currentParams.get('tab');
  const returnTab =
    returnTabParam === 'overview' ||
    returnTabParam === 'users' ||
    returnTabParam === 'ventures' ||
    returnTabParam === 'model-metrics' ||
    returnTabParam === 'support'
      ? returnTabParam
      : 'users';
  const returnSearch = currentParams.get('search') ?? '';

  const loadUsers = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const limit = pageSize + 1;
      const data = searchTerm.trim()
        ? await apiClient.searchUsers(searchTerm.trim(), skip, limit)
        : await apiClient.getUsers(skip, limit);

      setHasNextPage(data.length > pageSize);
      setUsers(data.slice(0, pageSize));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchOnlineIds = async () => {
    try {
      const ids = await apiClient.getOnlineUserIds();
      setOnlineIds(new Set(ids));
    } catch {
      // silently ignore — non-critical
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await apiClient.getUserStats();
      setUserStats(stats);
    } catch {
      // silently ignore - table data still renders
    }
  };

  useEffect(() => {
    loadUsers(currentPage);
    fetchOnlineIds();
    fetchUserStats();
  }, []);

  // Poll online status every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOnlineIds, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      loadUsers(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    loadUsers(currentPage);
  }, [currentPage]);

  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setIsCreating(true);
      await apiClient.createUserAsAdmin(newUser);
      toast.success('User created successfully');
      setNewUser({ full_name: '', email: '', password: '', role: 'founder' });
      setSearchTerm('');
      setCurrentPage(1);
      await loadUsers(1);
      await fetchUserStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (!targetUser?.id) return;
    if (targetUser.id === user?.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }

    try {
      await apiClient.deleteUserAsAdmin(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      toast.success(`Deleted ${targetUser.full_name || targetUser.email}`);
      loadUsers(currentPage);
      fetchUserStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (targetUser: any) => {
    if (!targetUser?.id) return;
    if (targetUser.id === user?.id) {
      toast.error('You cannot deactivate your own admin account');
      return;
    }

    const nextState = !targetUser.is_active;

    try {
      await apiClient.updateUserAsAdmin(targetUser.id, { is_active: nextState });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextState } : u)));
      toast.success(`${targetUser.full_name || targetUser.email} ${nextState ? 'activated' : 'deactivated'}`);
      fetchUserStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account status');
    }
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;
    await handleDeleteUser(pendingDeleteUser);
    setPendingDeleteUser(null);
  };

  const openEditUser = (targetUser: any) => {
    setEditingUser(targetUser);
    setEditForm({
      full_name: targetUser.full_name || '',
      email: targetUser.email || '',
      role: (targetUser.role || 'founder') as AdminUserRole,
      is_active: !!targetUser.is_active,
      password: '',
    });
    setIsEditOpen(true);
  };

  useEffect(() => {
    if (location.hash !== '#add-user') return;
    const timeout = window.setTimeout(() => {
      addUserSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [location.hash]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawEditUserId = params.get('editUserId');
    if (!rawEditUserId) return;

    const editUserId = Number(rawEditUserId);
    if (!Number.isFinite(editUserId)) {
      params.delete('editUserId');
      navigate({ search: params.toString() ? `?${params.toString()}` : '', hash: location.hash }, { replace: true });
      return;
    }

    let cancelled = false;

    const openRequestedUser = async () => {
      try {
        const existingUser = users.find((candidate) => Number(candidate.id) === editUserId);
        const targetUser = existingUser ?? (await apiClient.getUserById(editUserId));
        if (!cancelled && targetUser) {
          openEditUser(targetUser);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.message || 'Failed to open selected user');
        }
      } finally {
        if (!cancelled) {
          params.delete('editUserId');
          navigate({ search: params.toString() ? `?${params.toString()}` : '', hash: location.hash }, { replace: true });
        }
      }
    };

    openRequestedUser();

    return () => {
      cancelled = true;
    };
  }, [location.hash, location.search, navigate, users]);

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await apiClient.updateUserAsAdmin(editingUser.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
        password: editForm.password || undefined,
      });
      toast.success('User updated successfully');
      setIsEditOpen(false);
      setEditingUser(null);
      await loadUsers(currentPage);
      await fetchUserStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            User Management
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
            Add, search, and delete platform users
          </p>
        </div>
        {cameFromDashboard && (
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              params.set('tab', returnTab);
              if (returnSearch.trim()) {
                params.set('search', returnSearch);
              }
              navigate(`/dashboard/admin-dashboard?${params.toString()}`);
            }}
            className="shrink-0"
          >
            Back to Dashboard
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="glass-card border-black/10 dark:border-white/10 h-full">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold dark:text-white">{userStats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/10 dark:border-white/10 h-full">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <p className="text-sm text-muted-foreground">Founders</p>
            <p className="text-2xl font-bold dark:text-white">{userStats.founders}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/10 dark:border-white/10 h-full">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <p className="text-sm text-muted-foreground">Investors</p>
            <p className="text-2xl font-bold dark:text-white">{userStats.investors}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/10 dark:border-white/10 h-full">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold dark:text-white">{userStats.admins}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/10 dark:border-white/10 h-full">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Online Now</p>
            </div>
            <p className="text-2xl font-bold text-green-500">{onlineIds.size}</p>
          </CardContent>
        </Card>
      </div>

      <div id="add-user" ref={addUserSectionRef}>
        <Card className="glass-card border-black/10 dark:border-white/10">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Add New User</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Create a new account directly as admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label>Full Name</Label>
              <Input
                name="new_user_full_name"
                autoComplete="off"
                value={newUser.full_name}
                onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="new_user_email"
                autoComplete="off"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                name="new_user_password"
                autoComplete="new-password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value: AdminUserRole) => setNewUser((p) => ({ ...p, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" onClick={handleCreateUser} disabled={isCreating} className="bg-[#76B947] text-white hover:bg-[#76B947]/90">
            <UserPlus className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Add User'}
          </Button>
        </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-black/10 dark:border-white/10">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Users</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>Search and manage existing accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[420px]">
            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-muted-foreground py-8 text-center">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">No users found</div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold dark:text-white">
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                            onlineIds.has(u.id) ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                          title={onlineIds.has(u.id) ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold dark:text-white truncate">{u.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="bg-[#76B947]/10 text-[#76B947] border-[#76B947]/20">{u.role}</Badge>
                      <Badge
                        variant="outline"
                        className={onlineIds.has(u.id)
                          ? 'bg-green-500/10 text-green-600 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                        }
                      >
                        {onlineIds.has(u.id) ? 'Online' : 'Offline'}
                      </Badge>
                      <Badge variant="outline" className={u.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-500/10 text-gray-600 border-gray-500/20'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditUser(u)}
                        className="text-[#76B947] border-[#76B947]/40 hover:bg-[#76B947]/10"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                        disabled={u.id === user?.id}
                        className={u.is_active ? 'text-amber-700 border-amber-300 hover:bg-amber-50' : 'text-green-700 border-green-300 hover:bg-green-50'}
                      >
                        {u.is_active ? <UserX className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingDeleteUser(u)}
                        disabled={u.id === user?.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">Page {currentPage}</p>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDeleteUser} onOpenChange={(open: boolean) => !open && setPendingDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteUser
                ? `This will permanently delete ${pendingDeleteUser.full_name || pendingDeleteUser.email} and related records.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass-card border-black/10 dark:border-white/10">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="edit_user_email"
                autoComplete="off"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(value: AdminUserRole) => setEditForm((p) => ({ ...p, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.is_active ? 'active' : 'inactive'} onValueChange={(value: 'active' | 'inactive') => setEditForm((p) => ({ ...p, is_active: value === 'active' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reset Password (Optional)</Label>
              <Input
                type="password"
                name="edit_user_password"
                autoComplete="new-password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Leave empty to keep current password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateUser} className="bg-[#76B947] text-white hover:bg-[#76B947]/90">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
