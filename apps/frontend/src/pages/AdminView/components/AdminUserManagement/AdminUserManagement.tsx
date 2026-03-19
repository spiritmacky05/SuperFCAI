import React, { useState, useMemo } from 'react';
import { Edit2, X, Search, Filter, Trash2 } from 'lucide-react';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { User, UserRole } from '../../../../types';

interface AdminUserManagementProps {
  users: User[];
  editingUser: string | null;
  setEditingUser: (email: string | null) => void;
  onUpdateRole: (email: string, newRole: UserRole) => Promise<void>;
  onToggleStatus: (email: string, newStatus?: 'approved' | 'rejected') => Promise<void>;
  onOpenPaymentModal: (user: User) => void;
  onSelectUser: (user: User) => void;
  onDeleteUser: (email: string) => Promise<void>;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users,
  editingUser,
  setEditingUser,
  onUpdateRole,
  onToggleStatus,
  onOpenPaymentModal,
  onSelectUser,
  onDeleteUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    variant: 'primary' | 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'primary'
  });

  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const handleStatusClick = (user: User) => {
    if (user.status === 'rejected') {
      setConfirmModal({
        isOpen: true,
        title: 'RE-APPROVE USER',
        message: `Do you want to re-approve ${user.name}? This will restore their access to the system.`,
        onConfirm: () => onToggleStatus(user.email, 'approved'),
        variant: 'primary'
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'APPROVE USER',
      message: `Do you want to approve ${user.name}?`,
      onConfirm: () => onToggleStatus(user.email, 'approved'),
      onCancel: () => onToggleStatus(user.email, 'rejected'),
      variant: 'primary'
    });
  };

  const handleEditClick = (email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'EDIT CLEARANCE',
      message: 'Are you sure you want to modify this user\'s clearance level?',
      onConfirm: () => setEditingUser(email),
      variant: 'warning'
    });
  };

  const handleDeleteClick = (email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'TERMINATE USER',
      message: 'CRITICAL: This will permanently delete the user from the database. This action cannot be undone.',
      onConfirm: () => onDeleteUser(email),
      variant: 'danger'
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (user.status || 'approved') === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filters Header */}
      <div className="glass-panel p-4 rounded-xl border border-glass flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian/50 border border-glass rounded-lg pl-10 pr-4 py-2 text-sm font-mono text-white focus:border-cobalt outline-none transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-obsidian/50 border border-glass rounded-lg pl-8 pr-2 py-2 text-xs font-mono text-white focus:border-cobalt outline-none appearance-none"
            >
              <option value="all">ALL ROLES</option>
              <option value="free">FREE</option>
              <option value="pro">PRO</option>
              <option value="admin">ADMIN</option>
              <option value="super_admin">SUPER ADMIN</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-obsidian/50 border border-glass rounded-lg pl-8 pr-2 py-2 text-xs font-mono text-white focus:border-cobalt outline-none appearance-none"
            >
              <option value="all">ALL STATUS</option>
              <option value="approved">APPROVED</option>
              <option value="pending">PENDING</option>
              <option value="rejected">REJECTED</option>
            </select>
          </div>
        </div>
        
        <div className="text-[10px] font-mono text-muted uppercase tracking-widest whitespace-nowrap">
          Showing {filteredUsers.length} of {users.length}
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl border border-glass">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-glass text-cobalt uppercase text-xs tracking-wider font-display">
              <tr>
                <th className="p-4 border-b border-glass">(RANK & FULL NAME)</th>
                <th className="p-4 border-b border-glass">Access ID (Email)</th>
                <th className="p-4 border-b border-glass">Clearance Level</th>
                <th className="p-4 border-b border-glass">Status</th>
                <th className="p-4 border-b border-glass">Subscription</th>
                <th className="p-4 border-b border-glass text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass">
              {filteredUsers.map((user) => (
                <tr key={user.email} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-silver font-mono text-sm">
                    <button 
                      onClick={() => onSelectUser(user)}
                      className="hover:text-cobalt hover:underline text-left transition-colors"
                    >
                      {user.name}
                    </button>
                  </td>
                  <td className="p-4 text-muted font-mono text-xs">{user.email}</td>
                  <td className="p-4">
                    {editingUser === user.email ? (
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateRole(user.email, e.target.value as UserRole)}
                        className="bg-obsidian border border-glass rounded px-2 py-1 text-xs font-mono text-white focus:border-cobalt outline-none"
                      >
                        <option value="free">FREE</option>
                        <option value="pro">PRO</option>
                        <option value="admin">ADMIN</option>
                        <option value="super_admin">SUPER ADMIN</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                        user.role === 'super_admin'
                          ? 'bg-red-900/20 text-red-400 border-red-500/30'
                          : user.role === 'admin' 
                            ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' 
                            : user.role === 'pro' 
                              ? 'bg-cobalt/10 text-cobalt border-cobalt/30' 
                              : 'bg-glass text-muted border-glass'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusClick(user)}
                      className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-all duration-300 hover:scale-110 hover:brightness-125 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                        user.status === 'pending'
                          ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                          : user.status === 'rejected'
                            ? 'bg-red-900/20 text-red-400 border-red-500/30'
                            : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
                      }`}
                      title={user.status === 'rejected' ? 'Click to re-approve' : 'Toggle status'}
                    >
                      {user.status || 'approved'}
                    </button>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                      user.role === 'pro' 
                        ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-glass text-muted border-glass'
                    }`}>
                      {user.role === 'pro' ? 'SUBSCRIBED' : 'FREE'}
                    </span>
                    {user.payment_status === 'pending' && (
                      <button
                        onClick={() => onOpenPaymentModal(user)}
                        className="ml-2 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors hover:brightness-110 bg-yellow-900/20 text-yellow-400 border-yellow-500/30"
                        title="Verify Payment"
                      >
                        Pending Verify
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingUser === user.email ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingUser(null)}
                          className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(user.email)}
                          className="p-1.5 text-muted hover:text-white hover:bg-white/10 hover:scale-125 transition-all duration-200 rounded"
                          title="Edit Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user.email)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:scale-125 transition-all duration-200 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted font-mono text-xs uppercase tracking-widest">
                    No agents matched your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-glass">
          {filteredUsers.map((user) => (
            <div key={user.email} className="p-4 space-y-3 hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <button 
                    onClick={() => onSelectUser(user)}
                    className="hover:text-cobalt hover:underline text-left transition-colors text-silver font-mono text-sm font-bold"
                  >
                    {user.name}
                  </button>
                  <div className="text-muted font-mono text-xs mt-1">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {editingUser === user.email ? (
                    <button 
                      onClick={() => setEditingUser(null)}
                      className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditClick(user.email)}
                        className="p-1.5 text-muted hover:text-white hover:bg-white/10 hover:scale-110 transition-all rounded"
                        title="Edit Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user.email)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:scale-110 transition-all rounded"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted uppercase font-mono tracking-wider">Role:</span>
                  {editingUser === user.email ? (
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateRole(user.email, e.target.value as UserRole)}
                      className="bg-obsidian border border-glass rounded px-2 py-1 text-xs font-mono text-white focus:border-cobalt outline-none"
                    >
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                      <option value="admin">ADMIN</option>
                      <option value="super_admin">SUPER ADMIN</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                      user.role === 'super_admin'
                        ? 'bg-red-900/20 text-red-400 border-red-500/30'
                        : user.role === 'admin' 
                          ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' 
                          : user.role === 'pro' 
                            ? 'bg-cobalt/10 text-cobalt border-cobalt/30' 
                            : 'bg-glass text-muted border-glass'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted uppercase font-mono tracking-wider">Status:</span>
                  <button
                    onClick={() => handleStatusClick(user)}
                    className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-all duration-300 hover:scale-110 ${
                      user.status === 'pending'
                        ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                        : user.status === 'rejected'
                          ? 'bg-red-900/20 text-red-400 border-red-500/30'
                          : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
                    }`}
                    title={user.status === 'rejected' ? 'Click to re-approve' : 'Toggle status'}
                  >
                    {user.status || 'approved'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted uppercase font-mono tracking-wider">Sub:</span>
                  {user.role === 'pro' ? (
                    <span className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border bg-emerald-900/20 text-emerald-400 border-emerald-500/30">
                      SUBSCRIBED
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border bg-glass text-muted border-glass">
                      FREE
                    </span>
                  )}
                  {user.payment_status === 'pending' && (
                    <button
                      onClick={() => onOpenPaymentModal(user)}
                      className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors hover:brightness-110 bg-yellow-900/20 text-yellow-400 border-yellow-500/30"
                      title="Verify Payment"
                    >
                      Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-muted font-mono text-xs uppercase tracking-widest">
              No agents found matching criteria.
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default AdminUserManagement;
