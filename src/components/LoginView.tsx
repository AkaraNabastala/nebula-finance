import React, { useState } from 'react';
import { Lock, User, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { UserProfile } from '../types/finance';
import { INITIAL_USERS } from '../utils/storage';
import { toast } from 'sonner';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Try Electron IPC
      if (typeof window !== 'undefined' && (window as any).electronAPI?.login) {
        try {
          const res = await (window as any).electronAPI.login({ username, password });
          if (res && res.success && res.user) {
            onLogin(res.user);
            return;
          } else if (res && res.error) {
            setError(res.error);
            toast.error(res.error);
            setIsLoading(false);
            return;
          }
        } catch (ipcErr) {
          console.warn('Electron IPC login failed, trying REST API:', ipcErr);
        }
      }

      // 2. Try REST API
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            onLogin(data.user);
            return;
          }
        } else if (response.status === 401) {
          const data = await response.json();
          setError(data.error || 'Username atau password salah.');
          toast.error(data.error || 'Username atau password salah.');
          setIsLoading(false);
          return;
        }
      } catch (fetchErr) {
        console.warn('Backend REST API offline, falling back to local verification.');
      }

      // 3. Fallback: Local match against INITIAL_USERS / roleMap
      const roleMap: Record<string, string> = {
        'admin': 'super_admin',
        'manager': 'finance_manager',
        'accounting': 'accounting',
        'staff': 'finance_staff',
        'viewer': 'viewer',
      };

      const targetRole = roleMap[username.toLowerCase()];
      if (targetRole && password === `${username.toLowerCase()}123`) {
        const user = INITIAL_USERS.find((u) => u.role === targetRole);
        if (user) {
          onLogin(user);
          return;
        }
      }

      setError('Username atau password salah.');
      toast.error('Username atau password salah.');
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 font-sans text-slate-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md p-8 bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2 flex items-center justify-center shadow-xl shadow-indigo-500/20 backdrop-blur-md">
            <img src="/logonabastala.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
          NEBULA FINANCE
        </h2>
        <p className="text-center text-slate-400 text-xs mb-6 tracking-wide">Sistem Keuangan Perusahaan &bull; PT Nabastala</p>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                placeholder="admin / manager / staff"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-mono"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-xs text-slate-500 text-center mb-2.5">Pilih Akun Demo Cepat:</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[
              { label: 'Admin', u: 'admin', p: 'admin123' },
              { label: 'Manager', u: 'manager', p: 'manager123' },
              { label: 'Accounting', u: 'accounting', p: 'accounting123' },
              { label: 'Staff', u: 'staff', p: 'staff123' },
              { label: 'Auditor', u: 'viewer', p: 'viewer123' },
            ].map((acc) => (
              <button
                key={acc.u}
                type="button"
                onClick={() => setQuickUser(acc.u, acc.p)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
