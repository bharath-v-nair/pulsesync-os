import React, { useState } from 'react';
import { Activity, Cloud, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { loginWithGoogle } from '../../services/auth';

interface AuthGateProps {
  onLoginSuccess?: () => void;
  onContinueGuest: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onLoginSuccess,
  onContinueGuest,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        onLoginSuccess?.();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080a0f] p-4 text-slate-100 selection:bg-blue-500/30 overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#101520]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Brand Icon */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner">
          <Activity className="h-8 w-8 text-emerald-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-[#101520]" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          PulseSync <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">OS</span>
        </h1>
        <p className="text-sm text-slate-400 mb-6 max-w-xs">
          Sub-2-second micro-workout & life accountability tracker.
        </p>

        {/* Feature Pills */}
        <div className="w-full space-y-2.5 mb-6 text-left">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 text-xs text-slate-300">
            <Cloud className="h-4 w-4 text-blue-400 shrink-0" />
            <span>Instant real-time sync across your Phone & Laptop</span>
          </div>
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 text-xs text-slate-300">
            <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Sub-2s frictionless pull-up, push-up & focus logging</span>
          </div>
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Encrypted cloud storage with offline-first resilience</span>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 text-left">
            {errorMsg}
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] transition-all text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mb-3.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-800" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              {/* Google G SVG */}
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
              <ArrowRight className="h-4 w-4 text-slate-500 ml-0.5" />
            </>
          )}
        </button>

        {/* Continue as Guest option */}
        <button
          onClick={onContinueGuest}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
        >
          Continue as Guest (Local-Only Offline Mode)
        </button>
      </div>
    </div>
  );
};
