import React from 'react';
import { Users, User as UserIcon, Shield, AlertTriangle, UserMinus, DollarSign, Download } from 'lucide-react';
import { User } from '../../../../types';

interface AdminDashboardProps {
  totalUsers: number;
  freeUsersCount: number;
  proUsersCount: number;
  stats: {
    lowWeeklyLimits: number;
    expiredSubscriptions: number;
    totalIncome: number;
  };
  onExportStats: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  totalUsers, 
  freeUsersCount, 
  proUsersCount, 
  stats, 
  onExportStats 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white tracking-widest uppercase">System Overview</h2>
        <button 
          onClick={onExportStats}
          className="flex items-center gap-2 px-4 py-2 bg-cobalt/10 text-cobalt border border-cobalt/30 rounded-lg hover:bg-cobalt/20 transition-colors text-xs font-mono uppercase tracking-wider"
        >
          <Download className="w-4 h-4" />
          Export Stats
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-lg border border-glass flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <Users className="w-4 h-4 text-cobalt" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Total Users</span>
          </div>
          <div className="text-2xl font-display text-white">{totalUsers}</div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-glass flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <UserIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Free Users</span>
          </div>
          <div className="text-2xl font-display text-white">{freeUsersCount}</div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-glass flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Pro Users</span>
          </div>
          <div className="text-2xl font-display text-white">{proUsersCount}</div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-glass flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Low Limit</span>
          </div>
          <div className="text-2xl font-display text-white">{stats.lowWeeklyLimits}</div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-glass flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <UserMinus className="w-4 h-4 text-red-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Expired Pro</span>
          </div>
          <div className="text-2xl font-display text-white">{stats.expiredSubscriptions}</div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-glass flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Income</span>
          </div>
          <div className="text-2xl font-display text-white">₱{(stats.totalIncome / 1000).toFixed(1)}k</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
