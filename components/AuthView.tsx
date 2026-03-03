import React, { useState } from 'react';
import { User } from '../types';
import Logo from './superfcai logo png 2';
import { storageService } from '../services/storageService';
import { Lock, Mail, User as UserIcon, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = storageService.login(formData.email, formData.password);
      if (user) {
        onLogin(user);
      } else {
        setError('ACCESS DENIED: Invalid credentials');
      }
    } else {
      if (!formData.name) {
        setError('IDENTITY REQUIRED: Name missing');
        return;
      }
      
      const success = storageService.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'free' // Default role
      });

      if (success) {
        // Auto login after register
        const user = storageService.login(formData.email, formData.password);
        if (user) onLogin(user);
      } else {
        setError('REGISTRATION FAILED: Email already exists');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian p-4 relative overflow-hidden google-auto-ads-ignore">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-cobalt/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-tangerine/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="glass-panel p-8 rounded-2xl w-full max-w-md relative z-10 border border-glass shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-2xl font-display text-white tracking-widest mb-1">SUPER FC AI</h1>
          <p className="text-cobalt text-xs font-mono tracking-[0.2em] uppercase">Secure Access Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Identity Name</label>
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
          )}

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

          <div>
            <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Passcode</label>
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

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg flex items-center gap-2 animate-pulse">
              <span className="block w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red]"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 cyber-button-primary rounded-lg text-sm tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isLogin ? 'INITIATE LOGIN' : 'REGISTER ID'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs text-muted hover:text-cobalt font-mono tracking-wider transition-colors uppercase border-b border-transparent hover:border-cobalt/50 pb-0.5"
          >
            {isLogin ? "Request New Access ID" : "Return to Login Terminal"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
