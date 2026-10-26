import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Logo from '../components/Logo';

/**
 * Register Page
 * Aligned with Section 4 specifications:
 * - HackSaath brand name (22-24px, semibold)
 * - Heading: "Create your account"
 * - Name placeholder: "Enter your full name"
 * - Email placeholder: "Enter your email"
 * - Password placeholder: "Create a password"
 * - Primary action: "Create account"
 * - Link: "Already have an account? Log in"
 * - Real email OTP verification step preserved without bypassing security
 */
export default function Register() {
  const { requestOtp, register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      const result = await requestOtp(email.trim());
      if (result.code) {
        setDevCode(result.code);
      }
      setCooldown(60);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await register(email.trim(), password, code.trim(), '', '', fullName.trim());
      navigate('/profile/setup', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="mx-auto max-w-[420px] py-10 sm:py-16">
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <Logo size="sm" showText={true} />
          </Link>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight">
            Verify your email
          </h1>
          <p className="text-[14px] text-slate-400 mt-1">
            Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 sm:p-7 shadow-lg">
          {devCode && (
            <div className="mb-4 rounded-lg bg-indigo-950/40 border border-indigo-500/30 p-3 text-[13px] text-slate-300">
              <span className="text-indigo-400 font-medium">Verification Code: </span>
              <strong className="font-mono text-white text-[15px] ml-1">{devCode}</strong>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-[13px] font-medium text-slate-300 mb-1.5"
              >
                6-digit code
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3.5 py-2.5 text-center text-xl font-mono tracking-[0.4em] text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-950/40 p-3 text-[13px] text-red-300 border border-red-800/60"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-[14px] font-medium text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Verifying...' : 'Create account'}
            </button>

            <div className="flex items-center justify-between text-[13px] pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back to signup
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={busy || cooldown > 0}
                className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors cursor-pointer"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[420px] py-10 sm:py-16">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
          <Logo size="sm" showText={true} />
        </Link>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight">
          Create your account
        </h1>
        <p className="text-[14px] text-slate-400 mt-1">
          Join India's student hackathon network
        </p>
      </div>

      {/* Registration Card */}
      <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 sm:p-7 shadow-lg">
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block text-[13px] font-medium text-slate-300 mb-1.5"
            >
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-[13px] font-medium text-slate-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-[13px] font-medium text-slate-300 mb-1.5"
            >
              Password
            </label>
            <PasswordInput
              id="reg-password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-950/40 p-3 border border-red-800/60 text-[13px] text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || cooldown > 0}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-[14px] font-medium text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Sending verification code...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Create account'}
          </button>

          <div className="pt-4 border-t border-slate-800 text-center text-[13px] text-slate-400">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 ml-1"
            >
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
