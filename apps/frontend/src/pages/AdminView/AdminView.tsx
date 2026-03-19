import React, { useState, useEffect } from 'react';
import { Shield, Database, Users, MessageSquare, X } from 'lucide-react';
import { KnowledgeEntry, User, UserRole, ErrorReport } from '../../types';
import { storageService } from '../../services/storageService';
import { analyzeTrainingDocument } from '../../services/geminiService';
import { useToast } from '../../components/ToastContext';

// Modular Components
import AdminDashboard from './components/AdminDashboard';
import AdminKnowledgeBase from './components/AdminKnowledgeBase';
import AdminUserManagement from './components/AdminUserManagement';
import AdminErrorReports from './components/AdminErrorReports';
import AdminUserModal from './components/AdminUserModal';
import AdminPaymentModal from './components/AdminPaymentModal';
import LoadingScreen from '../../components/LoadingScreen';

interface AdminViewProps {
  currentUser?: User;
}

const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training' | 'users' | 'reports'>('dashboard');
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { showToast, confirm } = useToast();

  // Mock Data for Dashboard
  const stats = {
    lowWeeklyLimits: 14,
    expiredSubscriptions: 5,
    totalIncome: 45000,
  };

  const freeUsersCount = users.filter(u => u.role === 'free').length;
  const proUsersCount = users.filter(u => u.role === 'pro').length;

  const handleExportStats = () => {
    showToast('Exporting statistics to CSV...', 'info');
    setTimeout(() => {
      showToast('Statistics exported successfully!', 'success');
    }, 1500);
  };

  const fetchData = async () => {
    try {
      if (users.length === 0) setIsLoading(true);
      setKnowledgeEntries(await storageService.getKnowledge());
      const fetchedUsers = await storageService.getUsers();
      setUsers(fetchedUsers.sort((a, b) => (a.name > b.name ? 1 : -1)));
      
      const data = await storageService.getErrorReports();
      if (errorReports.length > 0 && data.length > errorReports.length) {
        showToast('New AI Error Report received!', 'info');
      }
      setErrorReports(data);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [errorReports.length]);

  const handleOpenPaymentModal = (user: User) => {
    setVerifyingUser(user);
    setIsPaymentModalOpen(true);
  };

  const handleApprovePayment = async () => {
    if (!verifyingUser) return;
    const updatedUser: User = { 
      ...verifyingUser, 
      role: 'pro', 
      payment_status: 'approved',
      status: 'approved' 
    };
    await storageService.saveUser(updatedUser);
    showToast(`Payment approved. ${verifyingUser.name} is now PRO.`, 'success');
    setIsPaymentModalOpen(false);
    setVerifyingUser(null);
    fetchData();
  };

  const handleDisapprovePayment = async () => {
    if (!verifyingUser) return;
    const updatedUser: User = { ...verifyingUser, payment_status: 'rejected' };
    await storageService.saveUser(updatedUser);
    showToast(`Payment rejected for ${verifyingUser.email}`, 'info');
    setIsPaymentModalOpen(false);
    setVerifyingUser(null);
    fetchData();
  };

  const handleUpdateReportStatus = async (id: number, status: 'pending' | 'evaluated') => {
    try {
      await storageService.updateErrorReportStatus(id, status);
      showToast(`Report marked as ${status}`, 'success');
      fetchData();
    } catch (e) {
      showToast('Failed to update report status', 'error');
    }
  };

  const handleDeleteReport = async (id: number) => {
    const isConfirmed = await confirm('Are you sure you want to delete this report?');
    if (!isConfirmed) return;
    try {
      await storageService.deleteErrorReport(id);
      showToast('Report deleted successfully', 'success');
      fetchData();
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
      const updatedUser: User = { ...user, role: newRole, status: 'approved' };
      await storageService.saveUser(updatedUser);
      setUsers(await storageService.getUsers());
      setEditingUser(null);
      showToast(`User role updated and approved successfully.`, 'success');
    }
  };

  const handleSaveUserProfile = async (user: User) => {
    await storageService.saveUser(user);
    setUsers(await storageService.getUsers());
    setSelectedUser(user);
    showToast(`User profile updated successfully.`, 'success');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      let extractedData: any[] = [];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        extractedData = await analyzeTrainingDocument({ data: base64Data, mimeType: file.type });
      } else {
        extractedData = await analyzeTrainingDocument(await file.text());
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
      showToast("Failed to analyze file.", 'error');
    } finally {
      setIsAnalyzing(false);
      event.target.value = '';
    }
  };

  const handleSaveEntry = async (entry: { title: string, content: string, category: any }) => {
    const newKnowledgeEntry: KnowledgeEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...entry
    };
    await storageService.saveKnowledge(newKnowledgeEntry);
    setKnowledgeEntries(await storageService.getKnowledge());
    showToast('Knowledge entry saved successfully.', 'success');
  };

  const handleDeleteEntry = async (id: string) => {
    if (await confirm('Are you sure you want to delete this entry?')) {
      await storageService.deleteKnowledge(id);
      setKnowledgeEntries(await storageService.getKnowledge());
      showToast('Knowledge entry deleted.', 'info');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (await confirm('Are you sure you want to delete this user?')) {
      await storageService.deleteUser(email);
      setUsers(await storageService.getUsers());
      setEditingUser(null);
      showToast('User deleted successfully.', 'info');
    }
  };

  const handleApproveUser = async (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      const updatedUser: User = { ...user, status: 'approved' };
      await storageService.saveUser(updatedUser);
      setUsers(await storageService.getUsers());
      setSelectedUser(updatedUser);
      showToast(`User approved successfully.`, 'success');
    }
  };

  const handleToggleUserStatus = async (email: string, nextStatus?: 'approved' | 'rejected') => {
    const user = users.find(u => u.email === email);
    if (!user) return;
    
    // If no explicit status provided, do a default toggle
    const targetStatus = nextStatus || 
      ((user.status || 'approved') === 'pending' || (user.status || 'approved') === 'rejected' ? 'approved' : 'pending');
    
    const updatedUser: User = { ...user, status: targetStatus };
    await storageService.saveUser(updatedUser);
    setUsers(await storageService.getUsers());
    if (selectedUser?.email === email) setSelectedUser(updatedUser);
    showToast(`User status updated to ${targetStatus.toUpperCase()}.`, 'success');
  };

  const handleResetWeeklyLimit = async (email: string) => {
    if (await confirm('Reset weekly limit for this user?')) {
      showToast(`Weekly limit reset for user.`, 'success');
    }
  };

  const actualCurrentUser = users.find(u => u.email === currentUser?.email) || currentUser;

  if (isLoading) {
    return (
      <LoadingScreen 
        message="ACCESSING NEXUS TERMINAL..." 
        subMessage="AUTHORIZING ADMIN CLEARANCE" 
      />
    );
  }

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
            {[
              { id: 'dashboard', label: 'Dashboard', icon: null },
              { id: 'training', label: 'AI Training', icon: Database },
              { id: 'users', label: 'User Mgmt', icon: Users },
              { id: 'reports', label: 'Reports', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative ${
                  activeTab === tab.id 
                    ? 'bg-cobalt/20 text-cobalt shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                    : 'text-muted hover:text-white'
                }`}
              >
                {tab.icon && <tab.icon className="w-3 h-3 hidden sm:block" />}
                {tab.label}
                {tab.id === 'reports' && errorReports.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tangerine opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-tangerine"></span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'dashboard' && (
            <AdminDashboard 
              users={users} 
              freeUsersCount={freeUsersCount} 
              proUsersCount={proUsersCount} 
              stats={stats} 
              onExportStats={handleExportStats} 
            />
          )}
          {activeTab === 'training' && (
            <AdminKnowledgeBase 
              knowledgeEntries={knowledgeEntries} 
              onFileUpload={handleFileUpload} 
              isAnalyzing={isAnalyzing} 
              onSaveEntry={handleSaveEntry} 
              onDeleteEntry={handleDeleteEntry} 
            />
          )}
          {activeTab === 'users' && (
            <AdminUserManagement 
              users={users} 
              editingUser={editingUser} 
              setEditingUser={setEditingUser} 
              onUpdateRole={handleUpdateRole} 
              onToggleStatus={handleToggleUserStatus} 
              onOpenPaymentModal={handleOpenPaymentModal} 
              onSelectUser={setSelectedUser} 
              onDeleteUser={handleDeleteUser} 
            />
          )}
          {activeTab === 'reports' && (
            <AdminErrorReports 
              errorReports={errorReports} 
              currentUser={actualCurrentUser} 
              onUpdateReportStatus={handleUpdateReportStatus} 
              onDeleteReport={handleDeleteReport} 
              onCopyToClipboard={handleCopyToClipboard} 
            />
          )}
        </div>
      </div>

      {selectedUser && (
        <AdminUserModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onSaveProfile={handleSaveUserProfile} 
          onApproveUser={handleApproveUser} 
          onResetWeeklyLimit={handleResetWeeklyLimit} 
          onZoomImage={setZoomedImage} 
        />
      )}

      {isPaymentModalOpen && verifyingUser && (
        <AdminPaymentModal 
          user={verifyingUser} 
          onClose={() => setIsPaymentModalOpen(false)} 
          onApprove={handleApprovePayment} 
          onDisapprove={handleDisapprovePayment} 
          onZoomImage={setZoomedImage} 
        />
      )}

      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-md" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-4 right-4 text-muted hover:text-white p-2 z-10" onClick={() => setZoomedImage(null)}><X className="w-8 h-8" /></button>
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default AdminView;
