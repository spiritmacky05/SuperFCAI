import React, { useState } from 'react';
import { X, User as UserIcon, Edit2, Save } from 'lucide-react';
import { User, UserRole } from '../../../../types';

interface AdminUserModalProps {
  user: User;
  onClose: () => void;
  onSaveProfile: (user: User) => Promise<void>;
  onApproveUser: (email: string) => Promise<void>;
  onResetWeeklyLimit: (email: string) => Promise<void>;
  onZoomImage: (url: string) => void;
}

const AdminUserModal: React.FC<AdminUserModalProps> = ({
  user,
  onClose,
  onSaveProfile,
  onApproveUser,
  onResetWeeklyLimit,
  onZoomImage
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>({ ...user });

  const handleSave = async () => {
    await onSaveProfile(editedUser);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-glass shadow-[0_0_40px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex justify-between items-center mb-4 pr-8">
          <h2 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cobalt" />
            {isEditing ? 'Edit User Profile' : 'User Profile'}
          </h2>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-cobalt hover:text-white hover:bg-cobalt/20 rounded transition-colors"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4 font-mono text-sm">
            <div>
              <label className="text-muted text-xs uppercase tracking-wider block mb-1">(RANK & FULL NAME)</label>
              <input 
                type="text" 
                value={editedUser.name}
                onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                className="w-full px-3 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              />
            </div>
            <div>
              <label className="text-muted text-xs uppercase tracking-wider block mb-1">Access ID (Email)</label>
              <input 
                type="email" 
                value={editedUser.email}
                onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                className="w-full px-3 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              />
            </div>
            <div>
              <label className="text-muted text-xs uppercase tracking-wider block mb-1">Clearance Level</label>
              <select 
                value={editedUser.role}
                onChange={(e) => setEditedUser({...editedUser, role: e.target.value as UserRole})}
                className="w-full px-3 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              >
                <option value="free" className="bg-obsidian">FREE</option>
                <option value="pro" className="bg-obsidian">PRO</option>
                <option value="admin" className="bg-obsidian">ADMIN</option>
                <option value="super_admin" className="bg-obsidian">SUPER ADMIN</option>
              </select>
            </div>
            <div>
              <label className="text-muted text-xs uppercase tracking-wider block mb-1">Status</label>
              <select 
                value={editedUser.status || 'approved'}
                onChange={(e) => setEditedUser({...editedUser, status: e.target.value})}
                className="w-full px-3 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              >
                <option value="approved" className="bg-obsidian">APPROVED</option>
                <option value="pending" className="bg-obsidian">PENDING</option>
              </select>
            </div>
            <div>
              <label className="text-muted text-xs uppercase tracking-wider block mb-1">BFP Account Number</label>
              <input 
                type="text" 
                value={editedUser.bfp_account_number || ''}
                onChange={(e) => setEditedUser({...editedUser, bfp_account_number: e.target.value})}
                className="w-full px-3 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
              />
            </div>
            
            <div className="flex gap-2 mt-6 pt-4 border-t border-glass">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 bg-glass text-muted border border-glass rounded hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-cobalt/20 text-cobalt border border-cobalt/50 rounded hover:bg-cobalt/30 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-mono text-sm">
            <div>
              <span className="text-muted text-xs uppercase tracking-wider block mb-1">(RANK & FULL NAME)</span>
              <span className="text-silver">{user.name}</span>
            </div>
            <div>
              <span className="text-muted text-xs uppercase tracking-wider block mb-1">Access ID</span>
              <span className="text-silver">{user.email}</span>
            </div>
            <div>
              <span className="text-muted text-xs uppercase tracking-wider block mb-1">Clearance Level</span>
              <span className="text-cobalt uppercase">{user.role}</span>
            </div>
            <div>
              <span className="text-muted text-xs uppercase tracking-wider block mb-1">Status</span>
              <span className={user.status === 'pending' ? 'text-yellow-400 uppercase' : 'text-emerald-400 uppercase'}>
                {user.status || 'approved'}
              </span>
            </div>
            {user.bfp_account_number && (
              <div>
                <span className="text-muted text-xs uppercase tracking-wider block mb-1">BFP Account Number</span>
                <span className="text-silver">{user.bfp_account_number}</span>
              </div>
            )}
            {user.bfp_id_url && (
              <div>
                <span className="text-muted text-xs uppercase tracking-wider block mb-2">BFP ID (Front)</span>
                <img 
                  src={user.bfp_id_url} 
                  alt="BFP ID" 
                  className="w-full rounded-lg border border-glass cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => onZoomImage(user.bfp_id_url!)}
                />
              </div>
            )}
            
            <div className="flex gap-2 mt-6 pt-4 border-t border-glass">
              {user.status === 'pending' && (
                <button
                  onClick={() => onApproveUser(user.email)}
                  className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  Approve User
                </button>
              )}
              <button
                onClick={() => onResetWeeklyLimit(user.email)}
                className="flex-1 py-2 bg-cobalt/20 text-cobalt border border-cobalt/50 rounded hover:bg-cobalt/30 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Reset Weekly Limit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserModal;
