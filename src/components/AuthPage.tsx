import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { apiRequest, setStoredToken } from '../lib/api';
import { BrandLogo } from './BrandLogo';
import { NetworkBackground } from './NetworkBackground';
import type { User } from '../types';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthResponse {
  token: string;
  user: User;
  onboardingCompleted: boolean;
  hasCompletedAssessment: boolean;
}

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding: () => void;
  onAuthSuccess: (res: AuthResponse) => void;
}

export function AuthPage({
  initialMode = 'login',
  onBackToLanding,
  onAuthSuccess,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          rememberMe,
        }),
      });
      setStoredToken(data.token, rememberMe);
      onAuthSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 8 || !/[A-Za-z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
      setError('Password must be at least 8 characters and include a letter and a number.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          confirmPassword,
        }),
      });
      setStoredToken(data.token, true);
      onAuthSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; verificationCode?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: resetEmail.trim() }),
        }
      );
      setSuccess(res.message);
      setGeneratedCodeHint(res.verificationCode || null);
      setResetStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (resetCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('New password must be at least 8 characters with a letter and a number.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      setSuccess(res.message);
      setResetStep('request');
      setGeneratedCodeHint(null);
      setLoginEmail(resetEmail.trim());
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const pwdHasLen = regPassword.length >= 8;
  const pwdHasLetter = /[A-Za-z]/.test(regPassword);
  const pwdHasNum = /[0-9]/.test(regPassword);

  return (
    <div className="relative min-h-screen bg-[#0B1020] text-white flex flex-col justify-between p-6">
      <NetworkBackground />

      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <BrandLogo onClick={onBackToLanding} />
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-sm text-[#C5B8FF] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto my-10">
        <div className="rounded-2xl bg-[#111A33]/90 backdrop-blur-xl border border-white/12 p-7 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create your student account'}
              {mode === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-sm text-[#C5B8FF]/80 mt-1">
              {mode === 'login' && 'Sign in to access your personalized career dashboard and AI mentor.'}
              {mode === 'register' && 'Start with onboarding and your personalized AI skill diagnostic.'}
              {mode === 'forgot' && 'Verify your email to set a new secure password.'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-start gap-2.5 text-sm text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-start gap-2.5 text-sm text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPwd ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    aria-label={showLoginPwd ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C5B8FF]/70 hover:text-white cursor-pointer"
                  >
                    {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="inline-flex items-center gap-2 text-[#C5B8FF] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/25 bg-[#0B1020] text-[#8257FF] focus:ring-[#35D6FF]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[#35D6FF] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer mt-2"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>

              <p className="text-center text-xs text-[#C5B8FF]/80 pt-3 border-t border-white/10">
                New to SkillBridge AI?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-[#35D6FF] font-semibold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showRegPwd ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPwd((v) => !v)}
                    aria-label={showRegPwd ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C5B8FF]/70 hover:text-white cursor-pointer"
                  >
                    {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  <span className={pwdHasLen ? 'text-emerald-400' : 'text-slate-400'}>
                    {pwdHasLen ? '✓' : '·'} 8+ chars
                  </span>
                  <span className={pwdHasLetter ? 'text-emerald-400' : 'text-slate-400'}>
                    {pwdHasLetter ? '✓' : '·'} Letter
                  </span>
                  <span className={pwdHasNum ? 'text-emerald-400' : 'text-slate-400'}>
                    {pwdHasNum ? '✓' : '·'} Number
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-[#C5B8FF]/80 pt-3 border-t border-white/10">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#35D6FF] font-semibold hover:underline cursor-pointer"
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {/* FORGOT / RESET PASSWORD FORM */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                      Registered Email Address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#35D6FF]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Generating code...' : 'Send Reset Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  {generatedCodeHint && (
                    <div className="rounded-xl bg-[#35D6FF]/10 border border-[#35D6FF]/30 p-3.5 text-xs text-[#C5B8FF] flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-[#35D6FF] shrink-0" />
                      <span>
                        Verification code: <strong className="font-mono text-white text-sm">{generatedCodeHint}</strong> (valid 15 min)
                      </span>
                    </div>
                  )}
                  <div>
                    <label htmlFor="reset-code" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-[#35D6FF]"
                    />
                  </div>
                  <div>
                    <label htmlFor="reset-new-pwd" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                      New Password
                    </label>
                    <input
                      id="reset-new-pwd"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                    />
                  </div>
                  <div>
                    <label htmlFor="reset-confirm-pwd" className="block text-xs font-medium text-[#C5B8FF] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      id="reset-confirm-pwd"
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-white/15 text-white text-sm focus:outline-none focus:border-[#35D6FF]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#8257FF] hover:bg-[#7142FF] disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Updating password...' : 'Update Password'}
                  </button>
                </form>
              )}

              <p className="text-center text-xs text-[#C5B8FF]/80 pt-3 border-t border-white/10">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#35D6FF] font-semibold hover:underline cursor-pointer"
                >
                  Back to Login
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 text-center text-xs text-[#C5B8FF]/60">
        SkillBridge AI · Secure Student Authentication
      </div>
    </div>
  );
}
