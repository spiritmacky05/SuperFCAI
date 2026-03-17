import React, { useState } from 'react';
import { User } from '../../types';
import Logo from '../../components/Logo';
import { storageService } from '../../services/storageService';
import { Lock, Mail, User as UserIcon, LogIn, UserPlus, Eye, EyeOff, Upload, Hash } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    bfp_id_url: '',
    bfp_account_number: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for reset token in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setToken(resetToken);
      setMode('reset');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = await storageService.login(formData.email, formData.password);
        if (user) {
          onLogin(user);
        } else {
          setError('ACCESS DENIED: Invalid credentials');
        }
      } else if (mode === 'register') {
        if (!formData.name || !formData.bfp_id_url || !formData.bfp_account_number) {
          setError('IDENTITY REQUIRED: Missing required fields');
          setIsLoading(false);
          return;
        }
        
        const result = await storageService.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'free',
          bfp_id_url: formData.bfp_id_url,
          bfp_account_number: formData.bfp_account_number
        });

        if (result.success) {
          setSuccess('REGISTRATION SUCCESSFUL: Pending admin approval');
          setMode('login');
        } else {
          setError(`REGISTRATION FAILED: ${result.error || 'Check details and try again'}`);
        }
      } else if (mode === 'forgot') {
        const result = await storageService.forgotPassword(formData.email);
        if (result.success) {
          setSuccess(result.message || 'If an account exists, a reset link has been sent.');
        } else {
          setError(result.error || 'Failed to send reset link.');
        }
      } else if (mode === 'reset') {
        const result = await storageService.resetPassword(token, formData.password);
        if (result.success) {
          setSuccess(result.message || 'Password reset successfully. Initiating login terminal...');
          setTimeout(() => {
            setMode('login');
            setSuccess('');
          }, 2000);
        } else {
          setError(result.error || 'Failed to reset password.');
        }
      }
    } catch (err: any) {
      setError(`CRITICAL ERROR: ${err.message || 'System failure'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('FILE TOO LARGE: Max 5MB allowed');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, bfp_id_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian p-4 relative overflow-hidden google-auto-ads-ignore">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-cobalt/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-tangerine/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial-[ellipse_at_top,rgba(255,255,255,0.06),transparent_60%] opacity-30 pointer-events-none"></div>

      <div className="glass-panel p-8 rounded-2xl w-full max-w-md relative z-10 border border-glass shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-2xl font-display text-white tracking-widest mb-1">SUPER FC AI</h1>
          <p className="text-cobalt text-xs font-mono tracking-[0.2em] uppercase">
            {mode === 'login' && 'Secure Access Terminal'}
            {mode === 'register' && 'New ID Registration'}
            {mode === 'forgot' && 'Credential Recovery'}
            {mode === 'reset' && 'Password Override'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">RANK & FULL NAME</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 placeholder-muted/30 font-mono text-sm"
                    placeholder="OFFICER NAME"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">BFP ID (Front Only)</label>
                <div className="relative group">
                  <Upload className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 placeholder-muted/30 font-mono text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cobalt/20 file:text-cobalt hover:file:bg-cobalt/30"
                  />
                </div>
                {formData.bfp_id_url && (
                  <div className="mt-2 text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <span className="block w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></span>
                    ID Uploaded Successfully
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">BFP Account Number</label>
                <div className="relative group">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 placeholder-muted/30 font-mono text-sm"
                    placeholder="BFP ACCOUNT NUMBER"
                    value={formData.bfp_account_number}
                    onChange={e => setFormData({...formData, bfp_account_number: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'reset' && (
            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Security Token</label>
              <div className="relative group">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 placeholder-muted/30 font-mono text-sm"
                  placeholder="PASTE TOKEN HERE"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Access ID (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 placeholder-muted/30 font-mono text-sm"
                  placeholder="ID@BFP.GOV.PH"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">
                {mode === 'reset' ? 'New Passcode' : 'Passcode'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted group-focus-within:text-cobalt transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg glass-input focus:ring-1 focus:ring-cobalt/50 placeholder-muted/30 font-mono text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted hover:text-white focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg flex items-center gap-2 animate-pulse">
              <span className="block w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red]"></span>
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-lg flex items-center gap-2">
              <span className="block w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></span>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 cyber-button-primary rounded-lg text-sm tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.2)] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-cobalt border-t-transparent rounded-full animate-spin"></span>
                PROCESSING...
              </span>
            ) : (
              <>
                {mode === 'login' && <><LogIn className="w-4 h-4" /> INITIATE LOGIN</>}
                {mode === 'register' && <><UserPlus className="w-4 h-4" /> REGISTER ID</>}
                {mode === 'forgot' && 'REQUEST RESET LINK'}
                {mode === 'reset' && 'OVERRIDE PASSCODE'}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          {mode === 'login' ? (
            <div className="w-full flex items-center justify-between px-1">
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="text-xs text-muted hover:text-cobalt font-mono tracking-wider transition-colors uppercase border-b border-transparent hover:border-cobalt/50"
              >
                Request Access ID
              </button>
              <button
                onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                className="text-xs text-muted hover:text-tangerine font-mono tracking-wider transition-colors uppercase border-b border-transparent hover:border-tangerine/50"
              >
                Forgot Passcode?
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-xs text-muted hover:text-cobalt font-mono tracking-wider transition-colors uppercase border-b border-transparent hover:border-cobalt/50 pb-0.5"
            >
              Return to Login Terminal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
