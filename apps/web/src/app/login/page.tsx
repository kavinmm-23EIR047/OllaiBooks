'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { ArrowLeft, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginOffline, rememberOfflineIdentity, setPosOnlineSession } from '@/lib/offline-auth';

type Workspace = { tenantId: string; tenantName: string; tenantSlug: string; subscriptionEndsAt?: string };

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [passwordInput, setPasswordInput] = React.useState('');

  React.useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!navigator.onLine) {
        if (mode !== 'login') throw new Error('Create your account while connected to the internet.');
        await loginOffline(emailInput, passwordInput);
        router.replace('/offline-pos');
        return;
      }

      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
      let response: Response;
      try {
        response = await fetch('/api/v1/auth/' + (mode === 'login' ? 'login' : 'register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        if (mode !== 'login') throw new Error('Could not reach the billing API. Connect to the internet and try again.');
        await loginOffline(emailInput, passwordInput);
        router.replace('/offline-pos');
        return;
      }
      const responseText = await response.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        if (!response.ok) {
          throw new Error(`The login service returned an error (${response.status}). Check that the API and database are running, then try again.`);
        }
        throw new Error('The login service returned an unreadable response. Please try again.');
      }
      if (!response.ok) throw new Error(data.message || 'Could not authenticate.');

      const token = data.token as string;
      const workspaces: Workspace[] =
        mode === 'register'
          ? [{ tenantId: data.tenant.id, tenantName: data.tenant.name, tenantSlug: data.tenant.slug, subscriptionEndsAt: data.tenant.subscriptionEndsAt }]
          : data.workspaces;

      if (!token || !Array.isArray(workspaces) || workspaces.length === 0) {
        throw new Error('This account has no business workspace yet. Contact your administrator.');
      }

      sessionStorage.setItem('billpilot_jwt_token', token);
      sessionStorage.setItem('billpilot_workspaces', JSON.stringify(workspaces));
      sessionStorage.setItem('billpilot_active_tenant_id', workspaces[0].tenantId);
      setPosOnlineSession();
      if (workspaces[0]?.tenantId) {
        await rememberOfflineIdentity({
          email: emailInput,
          password: passwordInput,
          user: data.user,
          workspace: workspaces[0],
        });
      }
      
      router.replace(data.user?.isPlatformAdmin ? '/admin' : searchParams.get('next') === '/offline-pos' ? '/offline-pos' : '/dashboard');
    } catch (reason: any) {
      setError(reason.message || 'Could not reach the billing API.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Top Back Link */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Homepage</span>
        </Link>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          CRM Live
        </span>
      </div>

      {/* Brand Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white shadow-xs">
            <AiSymbol className="h-4.5 w-4.5 fill-white" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
            ollaiBooks CRM
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {mode === 'login' ? 'Sign in to your CRM' : 'Create a business workspace'}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login'
            ? 'Access your sales pipeline, autonomous billing & AI telephonic agents.'
            : 'Create your business account with a business name, email, and password. Your administrator manages subscription access.'}
        </p>
      </div>

      {/* Auth Form */}
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Business Legal Name
              <input
                name="businessName"
                required
                minLength={2}
                maxLength={160}
                placeholder="e.g. Apex Global Traders Ltd"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:text-white"
              />
            </label>
          </>
        )}

        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Email Address
          <input
            name="email"
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            autoComplete="email"
            placeholder="you@business.in"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:text-white"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Password
          <input
            name="password"
            type="password"
            required
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            minLength={mode === 'register' ? 12 : 1}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••••••"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:text-white"
          />
          {mode === 'register' && (
            <span className="mt-1 block text-[11px] text-slate-500">
              Use at least 12 characters. After your first online sign-in, this device can sign in offline for up to 7 days, subject to your subscription.
            </span>
          )}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {busy
            ? 'Authenticating Workspace…'
            : mode === 'login'
            ? 'Sign in to CRM Workspace'
            : 'Create Workspace & Launch CRM'}
        </button>
      </form>

      {/* Switch Mode Toggle */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {mode === 'login'
            ? "Don't have a workspace? Create a new business account"
            : 'Already have an account? Sign in to existing workspace'}
        </button>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <React.Suspense fallback={<div className="text-sm text-slate-500">Loading ollaiBooks Portal…</div>}>
        <LoginFormContent />
      </React.Suspense>
    </main>
  );
}
