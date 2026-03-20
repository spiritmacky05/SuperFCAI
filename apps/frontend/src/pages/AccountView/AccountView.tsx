import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { Shield, Zap, BarChart, Settings as SettingsIcon, CreditCard, Check, AlertTriangle, Send, Upload, Download } from 'lucide-react';
import { useToast } from '../../components/ToastContext';

interface AccountViewProps {
  user: User;
}

const AccountView: React.FC<AccountViewProps> = ({ user }) => {
  const ui = {
    page: 'container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl animate-fade-in-up',
    heading: 'text-xl sm:text-2xl font-display text-white mb-5 sm:mb-6 tracking-wider flex items-center gap-3',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6',
    panel: 'glass-panel p-5 sm:p-6 rounded-xl border border-glass',
    textInput: 'w-full bg-obsidian/50 border border-glass rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-cobalt outline-none',
    mutedInput: 'w-full bg-obsidian/50 border border-glass rounded-lg px-4 py-2 text-muted font-mono text-sm focus:border-cobalt outline-none cursor-not-allowed',
    upgradePanel: 'md:col-span-2 glass-panel p-5 sm:p-8 rounded-xl border border-cobalt/30 relative overflow-hidden',
    upgradeInner: 'relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8',
    upgradeActions: 'flex-shrink-0 w-full md:w-auto',
    upgradeButton: 'cyber-button-primary w-full md:w-auto px-6 sm:px-8 py-4 rounded-lg flex items-center justify-center gap-3 text-obsidian font-bold text-base sm:text-lg shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-105 transition-transform',
    reportPanel: 'md:col-span-2 glass-panel p-5 sm:p-6 rounded-xl border border-glass',
    uploadButton: 'cyber-button-secondary w-full md:w-auto mt-4 px-6 sm:px-8 py-3 rounded-lg flex items-center justify-center gap-3 font-bold text-base sm:text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100',
    fileInput: "block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cobalt/10 file:text-cobalt hover:file:bg-cobalt/20",
  };

  const [usageCount, setUsageCount] = useState(0);
  const [citedError, setCitedError] = useState('');
  const [actualCorrection, setActualCorrection] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [downloadStrategy, setDownloadStrategy] = useState<'prompt' | 'ios' | 'firefox' | null>(null);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (!isStandalone) {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) {
        setDownloadStrategy('ios');
      } else if (/Android.*Firefox/.test(navigator.userAgent)) {
        setDownloadStrategy('firefox');
      }
    }

    const handler = (e: any) => { e.preventDefault(); setDeferredInstallPrompt(e); setDownloadStrategy('prompt'); };
    const installed = () => setDownloadStrategy(null);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installed); };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') { showToast('App installed successfully!', 'success'); setDownloadStrategy(null); }
    setDeferredInstallPrompt(null);
  };

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/usage-analytics', {
          headers: storageService.getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setUsageCount(data.weeklyCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch usage analytics:', error);
      }
    };
    fetchUsage();
  }, [user.email]);

  const handleUpgrade = async () => {
    try {
      window.open('https://paymongo.page/l/superfcaiprosubs?fbclid=IwY2xjawQjWt1leHRuA2FlbQIxMQBzcnRjBmFwcF9pZAEwAAEeszKItN_oIRSjA-oEGLNbhRmFsijAbYOwrCYHBpTwQoD74VBhhiYpMmfnhp4_aem_Jdo-aYURwEtqgAtnQUUGwA', '_blank');
    } catch (error) {
      console.error('Payment error:', error);
      showToast('Failed to initiate payment.', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofOfPayment(e.target.files[0]);
    }
  };

  const handleProofUpload = async () => {
    if (!proofOfPayment) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    setIsUploadingProof(true);
    const formData = new FormData();
    formData.append('proof', proofOfPayment);
    formData.append('email', user.email); // Add for redundancy

    try {
      const response = await fetch('/api/users/upload-proof-of-payment', {
        method: 'POST',
        headers: storageService.getAuthHeaders(true), // Content-Type: multipart/form-data
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await response.json();
      showToast('Proof of payment submitted for verification.', 'success');
      setProofOfPayment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citedError.trim() || !actualCorrection.trim()) {
      showToast('Please provide both the cited error and the actual correction.', 'error');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify({
          cited_error: citedError,
          actual_correction: actualCorrection
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit report');
      }

      showToast('Report submitted successfully. Thank you for helping improve the AI!', 'success');
      setCitedError('');
      setActualCorrection('');
    } catch (error: any) {
      console.error('Report error:', error);
      showToast(error.message || 'Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    if (success && user.role !== 'pro' && user.role !== 'admin' && user.role !== 'super_admin') {
      showToast('Payment successful! Please log out and log back in to activate your Pro features.', 'success');
    }
  }, [user.role, showToast]);

  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoadingPayments(true);
      try {
        const response = await fetch('/api/me/payments', {
          headers: storageService.getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [user.email]);

  const handleDownloadInvoice = (payment: any) => {
    const invoiceContent = `
INVOICE - SUPER FC AI
---------------------
Reference: ${payment.reference_number}
Date: ${new Date(payment.created_at).toLocaleDateString()}
User: ${payment.user_email}
Amount: PHP ${payment.amount.toFixed(2)}
Status: ${payment.status.toUpperCase()}

Thank you for supporting Super FC AI!
    `;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${payment.reference_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={ui.page}>
      <h2 className={ui.heading}>
        <SettingsIcon className="text-cobalt" />
        ACCOUNT SETTINGS
      </h2>

      <div className={ui.grid}>
        
        {/* Analytics Section */}
        <div className="glass-panel p-5 sm:p-6 rounded-xl border border-glass relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart size={100} />
          </div>
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <BarChart className="text-tangerine" size={20} />
            USAGE ANALYTICS
          </h3>
          
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-mono font-bold text-white">{usageCount}</span>
            <span className="text-sm text-muted mb-2 font-mono">GENERATIONS</span>
          </div>
          <p className="text-xs text-muted font-mono">Total AI analyses initiated this week.</p>
          
          <div className="mt-6 w-full bg-glass h-2 rounded-full overflow-hidden">
            <div 
              className="bg-tangerine h-full rounded-full" 
              style={{ width: `${Math.min((usageCount / (user.role === 'pro' ? 1000 : 100)) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-right text-muted mt-1 font-mono uppercase tracking-widest">
            {user.role === 'pro' ? (
              (() => {
                const now = new Date();
                const expiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
                
                if (!expiry || isNaN(expiry.getTime())) {
                  return "30 DAYS LEFT TILL NEXT PAYMENT"; // Default fallback
                }

                const diffTime = Math.max(0, expiry.getTime() - now.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return `${diffDays} DAYS LEFT TILL NEXT PAYMENT`;
              })()
            ) : (
              'Weekly Limit: 100 (Free Tier)'
            )}
          </p>
        </div>

        {/* Profile Section */}
        <div className={ui.panel}>
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <Shield className="text-cobalt" size={20} />
            PROFILE
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted font-mono uppercase mb-1">Display Name</label>
              <input 
                type="text" 
                value={user.name} 
                readOnly 
                className={ui.textInput}
              />
            </div>
            <div>
              <label className="block text-xs text-muted font-mono uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                value={user.email} 
                readOnly 
                className={ui.mutedInput}
              />
            </div>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                user.role === 'pro' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-cobalt/10 border-cobalt/30 text-cobalt'
              }`}>
                {user.role === 'pro' ? 'SUBSCRIBED' : `${user.role} PLAN`}
              </span>
              {user.subscription_expiry && !isNaN(new Date(user.subscription_expiry).getTime()) && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tangerine/10 border border-tangerine/30 text-tangerine text-xs font-bold uppercase tracking-wider">
                  Expires: {new Date(user.subscription_expiry).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Download PWA */}
        {downloadStrategy && (
          <div className="md:col-span-2 glass-panel p-5 sm:p-6 rounded-xl border border-cobalt/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cobalt/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-display text-white mb-1 flex items-center gap-2">
                  <Download className="text-cobalt" size={20} />
                  DOWNLOAD APP
                </h3>
                {downloadStrategy === 'ios' ? (
                  <p className="text-sm text-muted font-mono">Tap the <strong>Share</strong> button and select <strong>Add to Home Screen</strong>.</p>
                ) : downloadStrategy === 'firefox' ? (
                  <p className="text-sm text-muted font-mono">Tap the browser's <strong>3 dots menu (⋮)</strong> and select <strong>Install</strong> to add this app.</p>
                ) : (
                  <p className="text-sm text-muted font-mono">Install Super FC AI on your device for faster access and offline use.</p>
                )}
              </div>
              {downloadStrategy === 'prompt' && (
                <button
                  onClick={handleInstallPWA}
                  className="flex-shrink-0 cyber-button-primary w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-obsidian font-bold text-sm shadow-[0_0_15px_rgba(0,242,255,0.3)] hover:scale-105 transition-transform"
                >
                  <Download size={18} />
                  INSTALL APP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pro Upgrade Gateway */}
        <div className={ui.upgradePanel}>
          <div className="absolute inset-0 bg-gradient-to-r from-cobalt/5 via-transparent to-transparent"></div>
          <div className={ui.upgradeInner}>
            <div className="flex-1">
              <h3 className="text-2xl font-display text-white mb-2 flex items-center gap-2">
                <Zap className="text-yellow-400 fill-yellow-400" />
                UPGRADE TO PRO
              </h3>
              <p className="text-muted mb-6">Unlock advanced features and unlimited usage for only 99 pesos per month. This support helps maintain our infrastructure and AI subscriptions.</p>
              
              <ul className="space-y-2 mb-6">
                {[
                  'Unlimited AI Generations',
                  'Advanced Fire Code References',
                  'Priority Support Access',
                  'Priority Model Access (Pro-3.1)'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-silver">
                    <Check size={16} className="text-cobalt" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className={ui.upgradeActions}>
              {user.role === 'free' || user.status === 'pending' ? (
                <div className='text-center'>
                  <button 
                    onClick={handleUpgrade}
                    className={ui.upgradeButton}
                  >
                    <CreditCard size={20} />
                    DONATE NOW
                  </button>
                  <p className="text-[10px] text-center text-muted mt-3 font-mono uppercase tracking-widest">Secure Checkout (New Tab)</p>

                  <div className='mt-8 border-t border-glass pt-6 text-left'>
                    <label className="block text-xs text-muted font-mono uppercase mb-3 tracking-widest">Manual Proof Submission</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className={ui.fileInput}
                      accept="image/png, image/jpeg, image/jpg"
                    />
                    <button
                      onClick={handleProofUpload}
                      disabled={!proofOfPayment || isUploadingProof}
                      className={ui.uploadButton}
                    >
                      {isUploadingProof ? 'UPLOADING...' : (
                        <>
                          <Upload size={20} />
                          UPLOAD RECEIPT
                        </>
                      )}
                    </button>
                    {proofOfPayment && <p className="text-[10px] text-muted mt-2 truncate font-mono">{proofOfPayment.name}</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-8 py-4 rounded-lg flex flex-col items-center gap-1 font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <div className="flex items-center gap-3">
                    <Check size={24} />
                    PRO ACCOUNT ACTIVE
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="md:col-span-2 glass-panel p-5 sm:p-6 rounded-xl border border-glass">
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <CreditCard className="text-cobalt" size={20} />
            PAYMENT HISTORY & INVOICES
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-muted border-b border-glass">
                <tr>
                  <th className="py-3 px-2 hidden sm:table-cell">REFERENCE</th>
                  <th className="py-3 px-2 hidden sm:table-cell">DATE</th>
                  <th className="py-3 px-2">AMOUNT</th>
                  <th className="py-3 px-2">STATUS</th>
                  <th className="py-3 px-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass/30">
                {isLoadingPayments ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted animate-pulse">LOADING TRANSACTION LOGS...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted">NO PAYMENT RECORDS FOUND.</td></tr>
                ) : payments.map((p, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 text-silver hidden sm:table-cell">{p.reference_number}</td>
                    <td className="py-3 px-2 text-muted hidden sm:table-cell">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-white">PHP {p.amount.toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                        p.status === 'pending' ? 'bg-tangerine/20 text-tangerine' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button 
                        onClick={() => handleDownloadInvoice(p)}
                        className="text-cobalt hover:text-white transition-colors"
                      >
                        DOWNLOAD INVOICE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Calibration & Error Reporting */}
        <div className={ui.reportPanel}>
          <h3 className="text-lg font-display text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="text-tangerine" size={20} />
            AI CALIBRATION & ERROR REPORTING
          </h3>
          <p className="text-sm text-muted mb-6">
            Help us improve Super FC AI. If you spot an error or misinformation in the generated reports, please cite the error and provide the actual correction below.
          </p>

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted font-mono uppercase mb-1">Cited Error</label>
              <input 
                type="text" 
                value={citedError}
                onChange={(e) => setCitedError(e.target.value)}
                placeholder="e.g., AI stated 1.5m egress width instead of 1.12m"
                className="w-full bg-obsidian/50 border border-glass rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-cobalt outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted font-mono uppercase mb-1">Actual Correction</label>
              <textarea 
                value={actualCorrection}
                onChange={(e) => setActualCorrection(e.target.value)}
                placeholder="Please provide the correct information, citing the specific section of RA 9514 if possible..."
                className="w-full bg-obsidian/50 border border-glass rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-cobalt outline-none transition-colors min-h-[120px] resize-y"
                required
              ></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSubmittingReport}
                className="cyber-button-primary px-6 py-2 rounded-lg flex items-center gap-2 text-obsidian font-bold text-sm shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmittingReport ? (
                  <span className="animate-pulse">SUBMITTING...</span>
                ) : (
                  <>
                    <Send size={16} />
                    SUBMIT REPORT
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AccountView;
