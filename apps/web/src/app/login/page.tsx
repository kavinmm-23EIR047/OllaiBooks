'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { loginOffline, rememberOfflineIdentity, setPosOnlineSession } from '@/lib/offline-auth';
import { isNativeApp } from '@/lib/native-app';
import { DownloadAppGate } from '@/components/native/download-app-gate';

const PASSWORD_MIN = 8;

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
  const [showPassword, setShowPassword] = React.useState(false);
  const [nativeApp, setNativeApp] = React.useState(false);
  const [webOffline, setWebOffline] = React.useState(false);
  const passwordChecks = [
    { label: '8+ characters', ok: passwordInput.length >= PASSWORD_MIN },
    { label: 'A letter', ok: /[A-Za-z]/.test(passwordInput) },
    { label: 'A number', ok: /\d/.test(passwordInput) },
  ];

  React.useEffect(() => {
    const native = isNativeApp();
    setNativeApp(native);
    const update = () => setWebOffline(!native && !navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  React.useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (passwordInput.length < PASSWORD_MIN) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'register' && !passwordChecks.every((c) => c.ok)) {
      setError('Use at least 8 characters with a letter and a number.');
      return;
    }
    setBusy(true);
    try {
      if (!navigator.onLine) {
        if (mode !== 'login') throw new Error('Create your account while connected to the internet.');
        // Browser = online only. Offline sign-in is available inside the installed app.
        if (!nativeApp) { setWebOffline(true); return; }
        await loginOffline(emailInput, passwordInput);
        router.replace('/offline-pos');
        return;
      }

      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
      let response: Response;
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/+$/, '');
        response = await fetch(`${apiBase}/auth/${mode === 'login' ? 'login' : 'register'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        if (mode !== 'login') throw new Error('Could not reach the billing API. Connect to the internet and try again.');
        if (!nativeApp) throw new Error('Can’t reach ollaiBooks right now. Check your internet connection and try again.');
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
      sessionStorage.setItem('ollaibooks_account', JSON.stringify({ email: data.user?.email, name: [data.user?.firstName, data.user?.lastName].filter(Boolean).join(' '), mode: 'online' }));
      if (workspaces[0]?.tenantId) {
        await rememberOfflineIdentity({
          email: emailInput,
          password: passwordInput,
          user: data.user,
          workspace: workspaces[0],
        });
      }
      
      // Installed app opens the billing counter; the browser opens the online CRM.
      router.replace(nativeApp ? '/offline-pos' : '/dashboard');
    } catch (reason: any) {
      setError(reason.message || 'Could not reach the billing API.');
    } finally {
      setBusy(false);
    }
  }

  if (webOffline) return <DownloadAppGate reason="offline-login" />;

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

        <div className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          <label htmlFor="ob-password">Password</label>
          <div className="relative mt-1">
            <input
              id="ob-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              minLength={PASSWORD_MIN}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="At least 8 characters"
              aria-describedby="ob-password-help"
              className="w-full rounded-lg border border-slate-300 bg-transparent py-2 pl-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-slate-500 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          <div id="ob-password-help" className="mt-1.5">
            {mode === 'register' || passwordInput.length > 0 ? (
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium">
                {passwordChecks.map((c) => (
                  <li key={c.label} className={`inline-flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle2 className="h-3 w-3" /> {c.label}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[11px] font-normal text-slate-500">Your password has at least 8 characters.</span>
            )}
          </div>
        </div>

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
