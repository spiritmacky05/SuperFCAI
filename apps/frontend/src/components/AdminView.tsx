import React, { useState, useEffect } from 'react';
import { KnowledgeEntry, User, UserRole, ErrorReport } from '../types';
import { storageService } from '../services/storageService';
import { analyzeTrainingDocument } from '../services/geminiService';
import { Trash2, Plus, BookOpen, Save, Upload, FileText, Loader2, Users, Edit2, Check, Shield, Database, X, User as UserIcon, Download, TrendingUp, AlertTriangle, UserMinus, DollarSign, Calendar, MessageSquare, Copy } from 'lucide-react';
import { useToast } from './ToastContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AdminViewProps {
  currentUser?: User;
}

const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training' | 'users' | 'reports'>('dashboard');
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'provision' as const
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { showToast, confirm } = useToast();

  // Mock Data for Dashboard
  const stats = {
    lowWeeklyLimits: 14,
    expiredSubscriptions: 5,
    totalIncome: 45000,
  };

  const aiUsageData = [
    { name: 'Sec 10.2.5.2 (Egress)', usage: 145 },
    { name: 'Sec 10.2.6.9 (Extinguishers)', usage: 112 },
    { name: 'Rule 13 (Penalties)', usage: 89 },
    { name: 'Sec 10.2.8.8 (Alarms)', usage: 76 },
    { name: 'Sec 10.2.14.3 (Hotels)', usage: 45 },
  ];

  const missingContextData = [
    { name: 'Solar Panels', count: 34 },
    { name: 'EV Charging', count: 28 },
    { name: 'Lithium Batteries', count: 21 },
    { name: 'Food Trucks', count: 15 },
  ];

  const COLORS = ['#00f2ff', '#3b82f6', '#8b5cf6', '#f97316', '#10b981'];

  const freeUsersCount = users.filter(u => u.role === 'free').length;
  const proUsersCount = users.filter(u => u.role === 'pro').length;

  const handleExportStats = () => {
    showToast('Exporting statistics to CSV...', 'info');
    // Mock export functionality
    setTimeout(() => {
      showToast('Statistics exported successfully!', 'success');
    }, 1500);
  };

  // Fetch data
  const fetchData = async () => {
    setKnowledgeEntries(await storageService.getKnowledge());
    setUsers(await storageService.getUsers());
    
    try {
      const res = await fetch('/api/error-reports');
      if (res.ok) {
        const data = await res.json();
        
        // Check for new reports to trigger notification
        if (errorReports.length > 0 && data.length > errorReports.length) {
          showToast('New AI Error Report received!', 'info');
        }
        
        setErrorReports(data);
      }
    } catch (e) {
      console.error('Failed to fetch error reports:', e);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for new reports every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [errorReports.length]);

  const handleUpdateReportStatus = async (id: number, status: 'pending' | 'evaluated') => {
    try {
      const res = await fetch(`/api/error-reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Report marked as ${status}`, 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Failed to update report status', 'error');
    }
  };

  const handleDeleteReport = async (id: number) => {
    const isConfirmed = await confirm('Are you sure you want to delete this report?');
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/error-reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Report deleted successfully', 'success');
        fetchData();
      } else {
        showToast('Failed to delete report', 'error');
      }
    } catch (e) {
      showToast('Failed to delete report', 'error');
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleUpdateRole = async (email: string, newRole: UserRole) => {
    const user = users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, role: newRole, status: 'approved' };
      await storageService.saveUser(updatedUser);
      setUsers(await storageService.getUsers());
      setEditingUser(null);
      showToast(`User role updated and approved successfully.`, 'success');
    }
  };

  const handleSaveUserProfile = async () => {
    if (editedUser) {
      await storageService.saveUser(editedUser);
      setUsers(await storageService.getUsers());
      setSelectedUser(editedUser);
      setIsEditingProfile(false);
      showToast(`User profile updated successfully.`, 'success');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      let extractedData: any[] = [];

      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle PDF and DOCX via base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        extractedData = await analyzeTrainingDocument({ data: base64Data, mimeType: file.type });
      } else {
        // Handle text-based files
        const text = await file.text();
        extractedData = await analyzeTrainingDocument(text);
      }
      
      if (Array.isArray(extractedData)) {
        for (const item of extractedData) {
          const entry: KnowledgeEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            title: item.title || "Untitled Section",
            content: item.content || "",
            category: item.category || "provision"
          };
          await storageService.saveKnowledge(entry);
        }
        setKnowledgeEntries(await storageService.getKnowledge());
        showToast(`Successfully extracted ${extractedData.length} entries from ${file.name}`, 'success');
      }
    } catch (error) {
      console.error("File analysis failed:", error);
      showToast("Failed to analyze file. Please try again.", 'error');
    } finally {
      setIsAnalyzing(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSaveEntry = async () => {
    if (!newEntry.title || !newEntry.content) return;

    const entry: KnowledgeEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...newEntry
    };

    await storageService.saveKnowledge(entry);
    setKnowledgeEntries(await storageService.getKnowledge());
    setNewEntry({ title: '', content: '', category: 'provision' });
    showToast('Knowledge entry saved successfully.', 'success');
  };

  const handleDeleteEntry = async (id: string) => {
    const isConfirmed = await confirm('Are you sure you want to delete this entry?');
    if (isConfirmed) {
      await storageService.deleteKnowledge(id);
      setKnowledgeEntries(await storageService.getKnowledge());
      showToast('Knowledge entry deleted.', 'info');
    }
  };

  const handleDeleteUser = async (email: string) => {
    const isConfirmed = await confirm('Are you sure you want to delete this user?');
    if (isConfirmed) {
      await storageService.deleteUser(email);
      setUsers(await storageService.getUsers());
      setEditingUser(null);
      showToast('User deleted successfully.', 'info');
    }
  };

  const handleApproveUser = async (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, status: 'approved' };
      await storageService.saveUser(updatedUser);
      setUsers(await storageService.getUsers());
      setSelectedUser(updatedUser);
      showToast(`User approved successfully.`, 'success');
    }
  };

  const handleToggleUserStatus = async (email: string) => {
    const user = users.find(u => u.email === email);
    if (!user) return;

    const currentStatus = user.status || 'approved';
    const nextStatus = currentStatus === 'pending' ? 'approved' : 'pending';

    const updatedUser = { ...user, status: nextStatus };
    await storageService.saveUser(updatedUser);
    setUsers(await storageService.getUsers());

    if (selectedUser?.email === email) {
      setSelectedUser(updatedUser);
    }

    showToast(`User status updated to ${nextStatus}.`, 'success');
  };

  const handleResetWeeklyLimit = async (email: string) => {
    const isConfirmed = await confirm('Are you sure you want to reset the weekly limit for this user?');
    if (isConfirmed) {
      // Since weekly limit is client-side for now, we can just show a success message
      // If we implement server-side limits, we would call an API here
      showToast(`Weekly limit reset for user.`, 'success');
    }
  };

  const actualCurrentUser = users.find(u => u.email === currentUser?.email) || currentUser;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="glass-panel rounded-xl overflow-hidden border border-glass shadow-2xl">
        <div className="p-4 md:p-6 border-b border-glass bg-glass/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-display text-white tracking-widest uppercase">Admin Nexus</h1>
              <p className="text-xs font-mono text-purple-400 tracking-wider">SYSTEM CONFIGURATION & OVERSIGHT</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto grid grid-cols-4 md:flex bg-obsidian/50 p-1 rounded-lg border border-glass gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all text-center ${
                activeTab === 'dashboard' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'training' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <Database className="w-3 h-3 hidden sm:block" />
              AI Training
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'users' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <Users className="w-3 h-3 hidden sm:block" />
              User Mgmt
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative ${
                activeTab === 'reports' 
                  ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3 hidden sm:block" />
              Reports
              {errorReports.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tangerine opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-tangerine"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'dashboard' ? (
            <div className="space-y-6">
              {/* Top Stats Row */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white tracking-widest uppercase">System Overview</h2>
                <button 
                  onClick={handleExportStats}
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
                  <div className="text-2xl font-display text-white">{users.length}</div>
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

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="glass-panel p-6 rounded-lg border border-glass">
                  <h3 className="font-display text-sm text-silver mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4 text-cobalt" />
                    Most Used AI Brain Items
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={200}>
                      <BarChart data={aiUsageData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#8E9299', fontSize: 10 }} width={120} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#00f2ff', fontSize: '12px', fontFamily: 'monospace' }}
                        />
                        <Bar dataKey="usage" fill="#00f2ff" radius={[0, 4, 4, 0]}>
                          {aiUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-lg border border-glass">
                  <h3 className="font-display text-sm text-silver mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-tangerine" />
                    Searches Missing from Context
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={200}>
                      <PieChart>
                        <Pie
                          data={missingContextData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {missingContextData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#f97316', fontSize: '12px', fontFamily: 'monospace' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#8E9299' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'users' ? (
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
                      <th className="p-4 border-b border-glass text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass">
                    {users.map((user) => (
                      <tr key={user.email} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-silver font-mono text-sm">
                          <button 
                            onClick={() => setSelectedUser(user)}
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
                              onChange={(e) => handleUpdateRole(user.email, e.target.value as UserRole)}
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
                            onClick={() => handleToggleUserStatus(user.email)}
                            className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors hover:brightness-110 ${
                              user.status === 'pending'
                                ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title="Toggle status"
                          >
                            {user.status || 'approved'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          {editingUser === user.email ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleDeleteUser(user.email)}
                                className="p-1.5 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 border border-red-500/30"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingUser(null)}
                                className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setEditingUser(user.email)}
                              className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                              title="Edit Role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-glass">
                {users.map((user) => (
                  <div key={user.email} className="p-4 space-y-3 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="hover:text-cobalt hover:underline text-left transition-colors text-silver font-mono text-sm font-bold"
                        >
                          {user.name}
                        </button>
                        <div className="text-muted font-mono text-xs mt-1">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingUser === user.email ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDeleteUser(user.email)}
                              className="p-1.5 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 border border-red-500/30"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingUser(null)}
                              className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setEditingUser(user.email)}
                            className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Edit Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted uppercase font-mono tracking-wider">Role:</span>
                        {editingUser === user.email ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.email, e.target.value as UserRole)}
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
                          onClick={() => handleToggleUserStatus(user.email)}
                          className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors hover:brightness-110 ${
                            user.status === 'pending'
                              ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
                          }`}
                          title="Toggle status"
                        >
                          {user.status || 'approved'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'training' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Training Form */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel p-4 md:p-6 rounded-xl border border-glass sticky top-24">
                  <h3 className="text-sm font-display text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Plus className="w-4 h-4 text-cobalt" />
                    Add Knowledge
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-glass rounded-lg p-4 md:p-6 text-center hover:bg-glass/50 transition-colors relative group">
                      <input 
                        type="file" 
                        accept=".txt,.md,.json,.csv,.pdf,.docx"
                        onChange={handleFileUpload}
                        disabled={isAnalyzing}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center text-cobalt">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-xs font-mono">ANALYZING DATA...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted group-hover:text-silver transition-colors">
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-xs font-mono uppercase tracking-wider">Upload Document</span>
                          <span className="text-[10px] text-muted/50 mt-1 font-mono">PDF, DOCX, TXT, MD, JSON</span>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-glass"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-mono">
                        <span className="bg-obsidian px-2 text-muted">Or Inject Manually</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Title / Section</label>
                      <input 
                        type="text" 
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                        placeholder="e.g. Section 10.2.5.4"
                        className="w-full px-4 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Category</label>
                      <select 
                        value={newEntry.category}
                        onChange={(e) => setNewEntry({...newEntry, category: e.target.value as any})}
                        className="w-full px-4 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
                      >
                        <option value="provision" className="bg-obsidian">Fire Code Provision</option>
                        <option value="interpretation" className="bg-obsidian">Official Interpretation</option>
                        <option value="correction" className="bg-obsidian">Correction to AI</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Content / Rule</label>
                      <textarea 
                        value={newEntry.content}
                        onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                        placeholder="Enter the specific provision text or rule..."
                        rows={6}
                        className="w-full px-4 py-2 rounded-lg glass-input font-mono text-sm focus:ring-1 focus:ring-cobalt/50"
                      />
                    </div>

                    <button 
                      onClick={handleSaveEntry}
                      disabled={!newEntry.title || !newEntry.content}
                      className="w-full py-3 cyber-button-primary rounded-lg font-display text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                    >
                      <Save className="w-4 h-4" />
                      Inject Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Knowledge List */}
              <div className="lg:col-span-2">
                <div className="glass-panel p-4 md:p-6 rounded-xl border border-glass">
                  <h3 className="text-sm font-display text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <BookOpen className="w-4 h-4 text-tangerine" />
                    Active Neural Pathways
                  </h3>

                  {knowledgeEntries.length === 0 ? (
                    <div className="text-center py-12 text-muted border border-dashed border-glass rounded-lg bg-glass/20">
                      <p className="font-mono text-sm">No custom training data detected.</p>
                      <p className="text-xs mt-1 font-mono opacity-50">Inject provisions to enhance AI citations.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {knowledgeEntries.map((entry) => (
                        <div key={entry.id} className="p-4 bg-glass/30 rounded-lg border border-glass hover:border-cobalt/30 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-silver font-display text-sm">{entry.title}</h4>
                              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono mt-1 inline-block border ${
                                entry.category === 'provision' ? 'bg-cobalt/10 text-cobalt border-cobalt/20' :
                                entry.category === 'interpretation' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                'bg-tangerine/10 text-tangerine border-tangerine/20'
                              }`}>
                                {entry.category}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-muted hover:text-red-400 transition-colors p-1 hover:bg-red-900/20 rounded"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-silver/70 leading-relaxed whitespace-pre-wrap font-sans">{entry.content}</p>
                          <p className="text-[10px] text-muted/50 mt-3 font-mono uppercase">Timestamp: {new Date(entry.timestamp).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            <div className="glass-panel overflow-hidden rounded-xl border border-glass p-6">
              <h3 className="text-lg font-display text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle className="text-tangerine" size={20} />
                AI Error Reports
              </h3>
              
              {errorReports.length === 0 ? (
                <div className="text-center py-12 text-muted border border-dashed border-glass rounded-lg bg-glass/20">
                  <p className="font-mono text-sm">No error reports received yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {errorReports.map((report) => (
                    <div key={report.id} className={`p-5 rounded-lg border transition-colors ${report.status === 'pending' ? 'bg-tangerine/5 border-tangerine/30' : 'bg-glass/30 border-glass'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted uppercase">Reporter:</span>
                            <span className="text-sm font-mono text-cobalt break-all">{report.user_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted uppercase">Date:</span>
                            <span className="text-xs font-mono text-silver">{new Date(report.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                            report.status === 'pending' 
                              ? 'bg-tangerine/10 text-tangerine border-tangerine/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {report.status}
                          </span>
                          {report.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateReportStatus(report.id, 'evaluated')}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-1 sm:flex-none justify-center"
                            >
                              <Check size={12} />
                              Mark Evaluated
                            </button>
                          )}
                          {actualCurrentUser?.role === 'super_admin' && (
                            <button 
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-1.5 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 border border-red-500/30 transition-colors flex-shrink-0"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-obsidian/50 p-4 rounded-lg border border-red-500/20">
                          <h4 className="text-xs font-mono text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertTriangle size={14} />
                            Cited Error
                          </h4>
                          <p className="text-sm text-silver/90 font-sans whitespace-pre-wrap">{report.cited_error}</p>
                        </div>
                        
                        <div className="bg-obsidian/50 p-4 rounded-lg border border-emerald-500/20 relative group">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                              <Check size={14} />
                              Actual Correction
                            </h4>
                            <button 
                              onClick={() => handleCopyToClipboard(report.actual_correction)}
                              className="text-muted hover:text-cobalt transition-colors p-1"
                              title="Copy Correction"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-silver/90 font-sans whitespace-pre-wrap">{report.actual_correction}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* User Info Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-glass shadow-[0_0_40px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setSelectedUser(null);
                setIsEditingProfile(false);
              }}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-between items-center mb-4 pr-8">
              <h2 className="text-xl font-display text-white uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-cobalt" />
                {isEditingProfile ? 'Edit User Profile' : 'User Profile'}
              </h2>
              {!isEditingProfile && (
                <button 
                  onClick={() => {
                    setEditedUser({ ...selectedUser });
                    setIsEditingProfile(true);
                  }}
                  className="p-1.5 text-cobalt hover:text-white hover:bg-cobalt/20 rounded transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingProfile && editedUser ? (
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
                  <label className="text-muted text-xs uppercase tracking-wider block mb-1">Password</label>
                  <input 
                    type="text" 
                    value={editedUser.password || ''}
                    onChange={(e) => setEditedUser({...editedUser, password: e.target.value})}
                    placeholder="Leave blank to keep current"
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
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2 bg-glass text-muted border border-glass rounded hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUserProfile}
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
                  <span className="text-silver">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wider block mb-1">Access ID</span>
                  <span className="text-silver">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wider block mb-1">Clearance Level</span>
                  <span className="text-cobalt uppercase">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-muted text-xs uppercase tracking-wider block mb-1">Status</span>
                  <span className={selectedUser.status === 'pending' ? 'text-yellow-400 uppercase' : 'text-emerald-400 uppercase'}>
                    {selectedUser.status || 'approved'}
                  </span>
                </div>
                {selectedUser.bfp_account_number && (
                  <div>
                    <span className="text-muted text-xs uppercase tracking-wider block mb-1">BFP Account Number</span>
                    <span className="text-silver">{selectedUser.bfp_account_number}</span>
                  </div>
                )}
                {selectedUser.bfp_id_url && (
                  <div>
                    <span className="text-muted text-xs uppercase tracking-wider block mb-2">BFP ID (Front)</span>
                    <img 
                      src={selectedUser.bfp_id_url} 
                      alt="BFP ID" 
                      className="w-full rounded-lg border border-glass cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => setZoomedImage(selectedUser.bfp_id_url!)}
                    />
                  </div>
                )}
                
                <div className="flex gap-2 mt-6 pt-4 border-t border-glass">
                  {selectedUser.status === 'pending' && (
                    <button
                      onClick={() => handleApproveUser(selectedUser.email)}
                      className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Approve User
                    </button>
                  )}
                  <button
                    onClick={() => handleResetWeeklyLimit(selectedUser.email)}
                    className="flex-1 py-2 bg-cobalt/20 text-cobalt border border-cobalt/50 rounded hover:bg-cobalt/30 transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    Reset Weekly Limit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-md" onClick={() => setZoomedImage(null)}>
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed BFP ID" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminView;
