
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './ui/Button';
import authService from '../services/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

const mockUsers: User[] = [
  { id: 1, name: 'Alex (CEO)', email: 'alex@promo-efect.md', role: UserRole.SUPER_ADMIN },
  { id: 2, name: 'Admin User', email: 'admin@promo-efect.md', role: UserRole.ADMIN },
  { id: 3, name: 'Manager User', email: 'manager@promo-efect.md', role: UserRole.MANAGER },
  { id: 4, name: 'Client User', email: 'client@example.com', role: UserRole.CLIENT },
];

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.login({ email, password });
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Email sau parolă invalidă');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (user: User) => {
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center">
              <svg className="h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 003.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125H12m6 6v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H9.75" />
              </svg>
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl">Promo-Efect</h1>
              <p className="text-white/60 text-sm">Logistics Platform</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-4xl font-heading font-bold leading-tight">
            Simplificăm logistica<br />
            <span className="text-accent-400">China → Moldova</span>
          </h2>
          <p className="text-white/70 text-lg max-w-md">
            Platforma completă pentru gestionarea transportului maritim de containere. Prețuri transparente, urmărire în timp real.
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold text-accent-400">500+</p>
              <p className="text-white/60 text-sm">Containere/An</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent-400">6</p>
              <p className="text-white/60 text-sm">Linii Maritime</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent-400">98%</p>
              <p className="text-white/60 text-sm">Livrări la Timp</p>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-sm">
          © 2025 Promo-Efect. Toate drepturile rezervate.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-neutral-900">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 003.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125H12m6 6v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H9.75" />
                </svg>
              </div>
              <span className="font-heading font-bold text-xl text-primary-800 dark:text-white">Promo-Efect</span>
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-2xl font-bold text-primary-800 dark:text-white font-heading">
              Bine ai revenit!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">
              Autentifică-te pentru a accesa platforma
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-primary-800 dark:text-neutral-200">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nume@companie.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-primary-800 dark:text-neutral-200">
                  Parolă
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs text-accent-600 dark:text-accent-400 hover:underline"
                >
                  Ai uitat parola?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-error-50 dark:bg-error-500/20 border border-error-200 dark:border-error-500/30 rounded-lg">
                <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Se autentifică...' : 'Autentificare'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500">sau demo rapid</span>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {mockUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => quickLogin(user)}
                  className="px-4 py-3 text-sm font-medium text-primary-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-all border border-neutral-200 dark:border-neutral-700 text-left"
                >
                  <span className="block font-semibold">{user.name}</span>
                  <span className="text-xs text-neutral-500">{user.role.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 text-center">
              Demo: parola este "password"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
