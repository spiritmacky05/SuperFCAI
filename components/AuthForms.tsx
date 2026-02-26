import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface AuthFormsProps {
  onLogin: (user: User) => void;
}

type ViewState = 'login' | 'signup' | 'forgot';

const AuthForms: React.FC<AuthFormsProps> = ({ onLogin }) => {
  const [view, setView] = useState<ViewState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccess('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageService.login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }
    const success = storageService.register({ name, email, password, role: 'free' });
    if (success) {
      setSuccess('Account created! Please log in.');
      setTimeout(() => {
        resetForm();
        setView('login');
      }, 1500);
    } else {
      setError('Email already registered.');
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation
    if (email) {
      setSuccess(`If an account exists for ${email}, a reset link has been sent.`);
    } else {
      setError('Please enter your email.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transform transition hover:scale-105">🔥</div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
            {view === 'login' && 'Sign in to Super FC AI'}
            {view === 'signup' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {view === 'login' && 'Access your inspection history and tools'}
            {view === 'signup' && 'Get started with AI-assisted inspections'}
            {view === 'forgot' && 'Enter your email to recover access'}
          </p>
        </div>

        {(error || success) && (
          <div className={`p-4 rounded-lg text-sm font-medium flex items-center ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            {error ? (
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ) : (
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            )}
            {error || success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={view === 'login' ? handleLogin : view === 'signup' ? handleSignup : handleForgot}>
          <div className="space-y-5">
            {view === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium bg-white"
                  placeholder="e.g. Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium bg-white"
                placeholder="inspector@bfp.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {view !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all transform active:scale-95"
            >
              {view === 'login' && 'Sign in'}
              {view === 'signup' && 'Create Account'}
              {view === 'forgot' && 'Send Reset Link'}
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center justify-between text-sm pt-2 space-y-4">
          <div className="flex w-full justify-between">
            {view === 'login' ? (
              <>
                <button onClick={() => { resetForm(); setView('signup'); }} className="font-semibold text-blue-700 hover:text-blue-500 transition-colors">
                  Create an account
                </button>
                <button onClick={() => { resetForm(); setView('forgot'); }} className="font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                  Forgot password?
                </button>
              </>
            ) : (
              <button onClick={() => { resetForm(); setView('login'); }} className="font-semibold text-blue-700 hover:text-blue-500 w-full text-center transition-colors">
                ← Back to Sign in
              </button>
            )}
          </div>
          
          {view === 'login' && (
             <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
               Testing? Use: <strong>inspector@bfp.gov.ph</strong> / <strong>admin</strong>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForms;