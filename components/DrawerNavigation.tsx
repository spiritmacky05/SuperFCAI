import React from 'react';
import { Search, History, Settings, LogOut, Shield } from 'lucide-react';
import { User } from '../types';
import Logo from './Logo';

interface DrawerNavigationProps {
  activeView: 'main' | 'history' | 'admin';
  setView: (view: 'main' | 'history' | 'admin') => void;
  user: User;
  onLogout: () => void;
}

const DrawerNavigation: React.FC<DrawerNavigationProps> = ({ activeView, setView, user, onLogout }) => {
  const menuItems = [
    { id: 'main', label: 'New Search', icon: Search },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  return (
    <div className="hidden md:flex flex-col w-64 glass-panel h-screen fixed left-0 top-0 border-r border-glass z-50">
      <div className="p-6 border-b border-glass relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cobalt to-transparent opacity-50"></div>
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <div>
            <h1 className="text-lg font-display text-white tracking-wider">SUPER FC AI</h1>
            <p className="text-[10px] text-cobalt font-mono tracking-widest uppercase">SYS.VER.2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-4 px-4 mt-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-cobalt rounded-full animate-pulse"></span>
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-cobalt/10 text-cobalt border border-cobalt/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                  : 'hover:bg-white/5 hover:text-white text-muted border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cobalt' : 'text-muted group-hover:text-white'}`} />
              <span className="font-mono text-xs tracking-wider">{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-cobalt shadow-[0_0_10px_rgba(0,242,255,0.5)]"></div>
              )}
            </button>
          );
        })}

        {user.role === 'admin' && (
          <button
            onClick={() => setView('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
              activeView === 'admin'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                : 'hover:bg-white/5 hover:text-white text-muted border border-transparent'
            }`}
          >
            <Shield className={`w-5 h-5 ${activeView === 'admin' ? 'text-purple-400' : 'text-muted group-hover:text-white'}`} />
            <span className="font-mono text-xs tracking-wider">Admin Nexus</span>
            {activeView === 'admin' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            )}
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-glass bg-obsidian/30">
        <div className="glass-panel rounded-lg p-3 mb-4 border border-glass flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-glass flex items-center justify-center text-xs font-bold text-cobalt border border-cobalt/30 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-display text-white truncate tracking-wide">{user.name}</p>
            <p className="text-[10px] text-muted truncate font-mono uppercase">{user.role} ACCESS</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-muted hover:text-tangerine hover:bg-tangerine/10 rounded-lg transition-all text-xs font-mono tracking-wider group border border-transparent hover:border-tangerine/30"
        >
          <LogOut className="w-4 h-4 group-hover:text-tangerine transition-colors" />
          TERMINATE SESSION
        </button>
      </div>
    </div>
  );
};

export default DrawerNavigation;
