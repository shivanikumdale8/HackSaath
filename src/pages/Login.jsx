import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Logo from '../components/Logo';
import { cleanErrorMessage } from '../lib/api';

/**
 * Login Page for HackSaath
 * Tagline: "Find Your Team. Build Your Idea."
 * First page entry point for unauthenticated visitors.
 */
export default function Login() {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorObj, setErrorObj] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setErrorObj(null);
    setBusy(true);

    try {
      const { isNewUser } = await loginWithPassword(email.trim(), password);
      navigate(isNewUser ? '/profile/setup' : '/dashboard', { replace: true });
    } catch (err) {
      setErrorObj(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[440px] py-6 sm:py-12">
      {/* Brand Header with HackSaath Emblem */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link
          to="/"
          className="inline-flex flex-col items-center gap-2 mb-2 group focus-visible:outline-none"
        >
          <Logo size="md" variant="symbol" />
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[26px] sm:text-[28px] font-extrabold text-white tracking-tight leading-none">
              Hack<span className="text-[#00b4d8]">Saath</span>
            </span>
          </div>
        </Link>
        <p className="text-xs sm:text-[13px] font-medium text-teal-400 tracking-wide">
          Find Your Team. Build Your Idea.
        </p>
        <h1 className="text-[22px] sm:text-[24px] font-bold text-white tracking-tight mt-3">
          Sign in to your account
        </h1>
        <p className="text-[13px] text-slate-400 mt-0.5">
          Join hackathon teams across colleges in India
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-6 sm:p-7 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-medium text-slate-300 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your student email"
              className="w-full rounded-xl border border-[#1e2a44] bg-[#080d1a] px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-slate-300"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[12px] font-medium text-teal-400 hover:text-teal-300"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {errorObj && (
            <div
              role="alert"
              className="rounded-xl bg-red-950/40 p-3 border border-red-800/60 text-[13px] text-red-300"
            >
              <p>{cleanErrorMessage(errorObj.message)}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 py-2.5 text-[14px] font-semibold text-slate-950 shadow-md shadow-teal-500/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="pt-4 border-t border-[#1a233a] flex flex-col items-center gap-2.5 text-center text-[13px] text-slate-400">
            <div>
              <span>Don't have an account? </span>
              <Link
                to="/register"
                className="font-semibold text-teal-400 hover:text-teal-300 ml-1"
              >
                Create an account
              </Link>
            </div>

            <Link
              to="/home"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Browse Teams &amp; Hackathons as Guest →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
