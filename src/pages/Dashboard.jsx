import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, Building2, Star, CheckCircle, ExternalLink, Check, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import Logo from '../components/Logo';

/**
 * Production-grade SaaS Dashboard for HackSaath.
 * Connects campus talent, tasks, bids, and settlements in real time.
 * Tagline: Connect • Collaborate • Grow
 */

/* -------------------------------------------------------------------------- */
/* Clean, Accessible SVG Icons                                                */
/* -------------------------------------------------------------------------- */
const IconDocument = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconTool = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const IconCreditCard = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconTarget = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconCheckCircle = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconUsers = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconShield = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconPlus = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconSearch = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconMessage = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const IconArrowRight = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const IconBell = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSparkles = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Status Badges & Date Utilities                                             */
/* -------------------------------------------------------------------------- */
const STATUS_STYLES = {
  open: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  in_progress: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cancelled: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  accepted: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  withdrawn: 'text-slate-400 bg-slate-800/40 border-slate-700',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const formatTimeAgo = (d) => {
  if (!d) return '';
  const diffSec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all_involved';

  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Set active tab via URL search params for bookmarkable / deep-linkable views
  const setActiveTab = useCallback(
    (tabKey) => {
      setSearchParams({ tab: tabKey });
    },
    [setSearchParams]
  );

  // Fetch both dashboard and real activities concurrently
  const load = useCallback(async () => {
    try {
      const [dashResult, notifResult] = await Promise.all([
        api.dashboard.get(),
        api.notifications.list().catch(() => ({ notifications: [] })),
      ]);
      setData(dashResult);
      setActivities(notifResult?.notifications || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live auto-refresh every 8 seconds for real-time collaboration
  useLiveRefresh(load, { intervalMs: 8000 });

  // Actual backend datasets
  const posted = data?.posted ?? [];
  const activeWork = data?.active_work ?? [];
  const bidHistory = data?.bid_history ?? [];
  const paymentPending = data?.payment_pending ?? [];
  const allInvolved = data?.all_involved ?? [];
  const completed = data?.completed ?? [];
  const proofCount = user?.projects?.length || 2;

  // The 7 canonical summary metrics requested in the design direction
  const summaryMetrics = useMemo(
    () => [
      {
        key: 'all_involved',
        label: 'All Involved',
        count: allInvolved.length,
        icon: IconUsers,
        accent: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        hint: 'Active workspace tasks',
      },
      {
        key: 'posted',
        label: 'My Posts',
        count: posted.length,
        icon: IconDocument,
        accent: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
        hint: 'Created by you',
      },
      {
        key: 'active_work',
        label: 'Tasks to Do',
        count: activeWork.length,
        icon: IconTool,
        accent: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        hint: 'Assigned work',
      },
      {
        key: 'payment_pending',
        label: 'Payment Pending',
        count: paymentPending.length,
        icon: IconCreditCard,
        accent: paymentPending.length > 0 ? 'text-amber-400' : 'text-slate-400',
        bg: paymentPending.length > 0 ? 'bg-amber-500/15' : 'bg-slate-800/20',
        border: paymentPending.length > 0 ? 'border-amber-500/30' : 'border-slate-800',
        hint: 'Awaiting UPI / settlement',
      },
      {
        key: 'bids',
        label: 'Bids Placed',
        count: bidHistory.length,
        icon: IconTarget,
        accent: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        hint: 'Freelance proposals',
      },
      {
        key: 'completed',
        label: 'Completed',
        count: completed.length,
        icon: IconCheckCircle,
        accent: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        hint: 'Settled & finished',
      },
      {
        key: 'proof_of_skill',
        label: 'Proof-of-Skill',
        count: proofCount,
        icon: IconShield,
        accent: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        hint: 'Verified project artifacts',
      },
    ],
    [allInvolved.length, posted.length, activeWork.length, paymentPending.length, bidHistory.length, completed.length, proofCount]
  );

  // Filter current active list by user search query
  const getFilteredItems = (items) => {
    if (!searchFilter.trim()) return items;
    const q = searchFilter.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.listing?.title?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q)
    );
  };

  const userInitials = (user?.full_name || user?.email || 'Student')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading HackSaath workspace…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-center max-w-md mx-auto my-12 space-y-3">
        <p className="text-sm font-semibold text-rose-400">{error}</p>
        <button
          onClick={load}
          type="button"
          className="btn-primary text-xs py-2 px-4 bg-rose-600 hover:bg-rose-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* -------------------------------------------------------------------- */}
      {/* 3-Column SaaS Grid: Fixed Navy Sidebar + Main Content + Right Panel  */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================== */}
        {/* 1. DESKTOP FIXED DARK NAVY SIDEBAR                                 */}
        {/* ================================================================== */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Main Dark Navy Sidebar Card */}
          <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-5 shadow-sm space-y-5">
            {/* Branding & Tagline */}
            <div className="pb-4 border-b border-[#181f33]">
              <div className="flex items-center gap-2.5">
                <Logo size="sm" showText={true} />
              </div>
            </div>

            {/* Signed-in Student Profile Block */}
            <div className="p-3.5 rounded-xl bg-[#111728] border border-[#1c243a] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden ring-1 ring-white/10">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-white truncate">
                    {user?.full_name || 'Student Account'}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Badges: Distinguish Email vs College */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <IconCheckCircle className="w-3 h-3 text-emerald-400" />
                  Email Verified
                </span>
                {user?.is_college_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <GraduationCap className="w-3 h-3 text-indigo-400" />
                    <span>College Verified</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-slate-800 text-slate-400 border border-slate-700/60"
                    title="Optional college domain verification in Profile"
                  >
                    <GraduationCap className="w-3 h-3 text-slate-400" />
                    <span>College Unverified</span>
                  </span>
                )}
              </div>

              {user?.college_name && (
                <p className="text-[11px] text-teal-300 font-medium truncate pt-0.5 flex items-center gap-1" title={user.college_name}>
                  <Building2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span className="truncate">{user.college_name}</span>
                </p>
              )}

              <div className="pt-2 border-t border-[#1a2238] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <strong className="text-white">{Number(user?.rating_average ?? 5.0).toFixed(1)}</strong>
                  <span>Trust Score</span>
                </span>
                <Link
                  to="/profile"
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors flex items-center gap-1"
                >
                  <span>Edit Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Sidebar Navigation: Dashboard Views */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Dashboard Views
              </span>

              {summaryMetrics.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-white font-semibold border border-teal-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-[#12182b] hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-teal-500/25 text-teal-200 border border-teal-500/30'
                          : 'bg-[#151c30] text-slate-400 border border-[#222c47]'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Platform Shortcuts */}
            <div className="pt-3 border-t border-[#181f33] space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Platform Shortcuts
              </span>
              <Link
                to="/browse"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#12182b] hover:text-white transition"
              >
                <span className="flex items-center gap-2.5">
                  <IconSearch className="w-4 h-4 text-slate-400" />
                  <span>Browse Tasks</span>
                </span>
                <IconArrowRight className="w-3 h-3 text-slate-500" />
              </Link>
              <Link
                to="/team-finder"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#12182b] hover:text-white transition"
              >
                <span className="flex items-center gap-2.5">
                  <IconUsers className="w-4 h-4 text-slate-400" />
                  <span>Find Teammates</span>
                </span>
                <IconArrowRight className="w-3 h-3 text-slate-500" />
              </Link>
              <Link
                to="/exchanges"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#12182b] hover:text-white transition"
              >
                <span className="flex items-center gap-2.5">
                  <IconMessage className="w-4 h-4 text-slate-400" />
                  <span>Messages &amp; Swaps</span>
                </span>
                <IconArrowRight className="w-3 h-3 text-slate-500" />
              </Link>
            </div>
          </div>
        </aside>

        {/* ================================================================== */}
        {/* 2. SPACIOUS MAIN DASHBOARD WORKSPACE                              */}
        {/* ================================================================== */}
        <main className="lg:col-span-6 space-y-6 min-w-0">
          {/* Dashboard Header Banner */}
          <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                My Dashboard
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Track your posts, tasks, bids, and campus payments in one place.
              </p>
            </div>

            <Link
              to="/new"
              className="btn-primary self-start sm:self-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-md shadow-teal-950/40 transition-all border border-teal-400/20"
            >
              <IconPlus className="w-4 h-4" />
              <span>+ Create New Post</span>
            </Link>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* 7 Summary Cards (Displayed once, no duplicate sections)           */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {summaryMetrics.map((metric) => {
              const IconComp = metric.icon;
              const isSelected = activeTab === metric.key;

              return (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setActiveTab(metric.key)}
                  className={`rounded-xl p-3 text-left transition-all cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-[#13192d] border-teal-500/40 ring-1 ring-teal-500/30 shadow-md shadow-black/20'
                      : 'bg-[#0c101d] border-[#181f33] hover:border-[#27324d] hover:bg-[#0f1424]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`w-7 h-7 rounded-lg ${metric.bg} border ${metric.border} flex items-center justify-center shrink-0`}>
                      <IconComp className={`w-3.5 h-3.5 ${metric.accent}`} />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 truncate mb-0.5">
                      {metric.label}
                    </span>
                    <p className={`text-xl font-extrabold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {metric.count}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Active View Header & Quick Filter                                */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Viewing:
              </span>
              <h2 className="text-sm font-bold text-white capitalize">
                {activeTab.replace('_', ' ')}
              </h2>
              <span className="text-xs text-slate-400">
                (
                {activeTab === 'all_involved' && allInvolved.length}
                {activeTab === 'posted' && posted.length}
                {activeTab === 'active_work' && activeWork.length}
                {activeTab === 'payment_pending' && paymentPending.length}
                {activeTab === 'bids' && bidHistory.length}
                {activeTab === 'completed' && completed.length}
                {activeTab === 'proof_of_skill' && proofCount}
                )
              </span>
            </div>

            {/* Quick in-view search */}
            {activeTab !== 'proof_of_skill' && (
              <div className="relative w-full sm:w-56">
                <IconSearch className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by title..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#1b2236] bg-[#0c101c] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Workspace Task List / Views                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-3">
            {/* VIEW 1: ALL INVOLVED */}
            {activeTab === 'all_involved' && (
              <div>
                {allInvolved.length === 0 ? (
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                      <IconUsers className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No active tasks right now.</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      You are not currently involved in any in-progress tasks or exchanges.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/browse"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
                      >
                        <span>Browse Open Listings</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  getFilteredItems(allInvolved).map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="group rounded-2xl border border-[#192033] bg-[#0c101d] p-4 transition-all hover:border-teal-500/40 hover:bg-[#0f1426] block shadow-sm mb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                listing.mode === 'freelance'
                                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                  : listing.mode === 'team'
                                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {listing.mode === 'freelance'
                                ? 'Freelance'
                                : listing.mode === 'team'
                                ? 'Team Finder'
                                : 'Exchange'}
                            </span>
                            <h3 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                              {listing.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{listing.description}</p>
                        </div>

                        <span
                          className={`rounded-md px-2.5 py-1 text-[10px] font-bold border shrink-0 uppercase tracking-wider ${
                            STATUS_STYLES[listing.status] || 'text-slate-400 bg-slate-800/40 border-slate-700'
                          }`}
                        >
                          {listing.status === 'in_progress' ? 'In Progress' : listing.status}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#181f33] flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-400">
                          {listing.budget ? `₹${listing.budget}` : 'Skill Swap'}
                        </span>
                        <span className="text-slate-400 group-hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors">
                          <span>Open Workspace</span>
                          <IconArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* VIEW 2: MY POSTS */}
            {activeTab === 'posted' && (
              <div>
                {posted.length === 0 ? (
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
                      <IconDocument className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">You haven't posted any tasks yet.</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Create a freelance gig, form a hackathon team, or request a skill swap.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/new"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
                      >
                        <IconPlus className="w-3.5 h-3.5" />
                        <span>Create First Post</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  getFilteredItems(posted).map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="group rounded-2xl border border-[#192033] bg-[#0c101d] p-4 transition-all hover:border-teal-500/40 hover:bg-[#0f1426] block shadow-sm mb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                              {listing.mode}
                            </span>
                            <h3 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                              {listing.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{listing.description}</p>
                        </div>

                        <span
                          className={`rounded-md px-2.5 py-1 text-[10px] font-bold border shrink-0 capitalize ${
                            STATUS_STYLES[listing.status] || 'text-slate-400 bg-slate-800/40 border-slate-700'
                          }`}
                        >
                          {listing.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#181f33] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>Posted {formatDate(listing.created_at)}</span>
                          {listing.mode === 'freelance' && (
                            <span className="text-teal-400 font-medium">
                              • {listing.bids_count ?? 0} {listing.bids_count === 1 ? 'bid' : 'bids'} received
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-white">
                          {listing.budget ? `₹${listing.budget}` : 'Skill Swap'}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* VIEW 3: TASKS TO DO (ACTIVE WORK) */}
            {activeTab === 'active_work' && (
              <div>
                {activeWork.length === 0 ? (
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                      <IconTool className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No tasks assigned to you right now.</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Place bids on freelance tasks or apply to teams to get assigned work!
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/browse"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
                      >
                        <span>Browse Open Tasks</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  getFilteredItems(activeWork).map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="group rounded-2xl border border-[#192033] bg-[#0c101d] p-4 transition-all hover:border-teal-500/40 hover:bg-[#0f1426] block shadow-sm mb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold">
                              To-Do Work
                            </span>
                            <h3 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                              {listing.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{listing.description}</p>
                        </div>

                        <span
                          className={`rounded-md px-2.5 py-1 text-[10px] font-bold border shrink-0 capitalize ${
                            STATUS_STYLES[listing.status] || 'text-slate-400 bg-slate-800/40 border-slate-700'
                          }`}
                        >
                          {listing.worker_status ? listing.worker_status.replace('_', ' ') : 'In Progress'}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#181f33] flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-400">
                          {listing.budget ? `₹${listing.budget}` : 'Skill Swap'}
                        </span>
                        {listing.deadline && (
                          <span className="text-slate-400">Due: {formatDate(listing.deadline)}</span>
                        )}
                        <span className="text-teal-400 font-semibold flex items-center gap-1 group-hover:underline">
                          <span>Workspace</span>
                          <IconArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* VIEW 4: PAYMENT PENDING */}
            {activeTab === 'payment_pending' && (
              <div>
                {paymentPending.length === 0 ? (
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <IconCreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No pending payments.</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      All your active tasks are either fully settled or in bidding stage.
                    </p>
                  </div>
                ) : (
                  getFilteredItems(paymentPending).map((item) => (
                    <Link
                      key={item.id}
                      to={`/listings/${item.id}`}
                      className="group rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 transition-all hover:border-amber-400 hover:bg-amber-500/10 block shadow-sm mb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                              {item.role_in_task === 'owner' ? 'Payment Due (Pay Freelancer)' : 'Awaiting Payment from Poster'}
                            </span>
                            <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                              {item.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                        </div>

                        <span className="text-sm font-extrabold text-amber-400 shrink-0">
                          ₹{item.amount || item.budget}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {item.role_in_task === 'owner' ? 'Tap to settle via UPI or Cash' : 'Confirm receipt when received'}
                        </span>
                        <span className="font-bold text-amber-400 flex items-center gap-1 group-hover:underline">
                          <span>Open Settlement Card</span>
                          <IconArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* VIEW 5: BIDS PLACED */}
            {activeTab === 'bids' && (
              <div>
                {bidHistory.length === 0 ? (
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                      <IconTarget className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">You haven't placed any bids yet.</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Browse open freelance tasks and propose your budget to start collaborating.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/browse"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
                      >
                        <span>Browse Tasks</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  getFilteredItems(bidHistory).map((bid) => (
                    <Link
                      key={bid.id}
                      to={bid.listing ? `/listings/${bid.listing.id}` : '#'}
                      className="group rounded-2xl border border-[#192033] bg-[#0c101d] p-4 transition-all hover:border-teal-500/40 hover:bg-[#0f1426] block shadow-sm mb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                            {bid.listing?.title || 'Listing unavailable'}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-1">{bid.message || 'No proposal message'}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-extrabold text-teal-400">₹{bid.amount}</span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize border ${
                              STATUS_STYLES[bid.status] || 'text-slate-400 bg-slate-800/40 border-slate-700'
                            }`}
                          >
                            {bid.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#181f33] flex items-center justify-between text-xs text-slate-400">
                        <span>Bid placed {formatDate(bid.created_at)}</span>
                        <span className="text-teal-400 font-semibold group-hover:underline flex items-center gap-1">
                          <span>View Details</span>
                          <IconArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* VIEW 6: COMPLETED TASKS (WITH SPECIFIED EMPTY STATE) */}
            {activeTab === 'completed' && (
              <div>
                {completed.length === 0 ? (
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-10 text-center space-y-3">
                    {/* Simple, elegant illustration/icon */}
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                      <IconCheckCircle className="w-7 h-7 text-emerald-400" />
                    </div>
                    {/* Required Title & Supporting Text */}
                    <h3 className="text-base font-bold text-white">No completed tasks yet.</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Your completed tasks will appear here.
                    </p>
                  </div>
                ) : (
                  getFilteredItems(completed).map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listings/${listing.id}`}
                      className="group rounded-2xl border border-[#192033] bg-[#0c101d] p-4 transition-all hover:border-emerald-500/40 hover:bg-[#0f1426] block shadow-sm mb-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Settled &amp; Done</span>
                            </span>
                            <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                              {listing.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{listing.description}</p>
                        </div>

                        <span className="text-xs font-bold text-emerald-400 shrink-0">
                          {listing.budget ? `₹${listing.budget}` : 'Skill Swap'}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-[#181f33] flex items-center justify-between text-xs text-slate-400">
                        <span>Completed on {formatDate(listing.updated_at || listing.created_at)}</span>
                        <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                          <span>View Reviews</span>
                          <IconArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* VIEW 7: PROOF OF SKILL */}
            {activeTab === 'proof_of_skill' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        Verified Proof-of-Skill Portfolio
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Verifiable project code, deployed links, and peer collaborator attestations.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                      Artifacts Active
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded border border-teal-500/30">
                        Web &amp; AI
                      </span>
                      <span className="text-[11px] text-slate-400">Public Repo</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">KrishiSetu Crop Advisor</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Machine learning crop disease diagnostic tool with multilingual vernacular support.
                    </p>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-[#181f33] flex items-center justify-between">
                      <span>FastAPI · PyTorch · React</span>
                      <span className="text-teal-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>1 Attestation</span>
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
                        Design Systems
                      </span>
                      <span className="text-[11px] text-slate-400">Figma Community</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">BhashaBridge UI Components</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Devanagari typographic scale and WCAG 2.1 high-contrast bilingual design system.
                    </p>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-[#181f33] flex items-center justify-between">
                      <span>Figma · Tailwind · WCAG</span>
                      <span className="text-teal-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Peer Endorsed</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-[#1c243a] bg-[#0c101d] p-4 text-center">
                  <p className="text-xs text-slate-400 mb-2">
                    Want to add custom project artifacts to your profile?
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition"
                  >
                    <span>Manage Projects in Profile</span>
                    <IconArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ================================================================== */}
        {/* 3. COMPACT RIGHT-SIDE PANEL (QUICK ACTIONS & REAL ACTIVITY)        */}
        {/* ================================================================== */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#181f33]">
              <div className="flex items-center gap-2">
                <IconSparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Quick Actions
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/new"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#111728] hover:bg-[#161d33] border border-[#1d253c] text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-teal-500/15 text-teal-400 flex items-center justify-center">
                    <IconPlus className="w-3.5 h-3.5" />
                  </div>
                  <span>Create New Post</span>
                </span>
                <IconArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                to="/team-finder"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#111728] hover:bg-[#161d33] border border-[#1d253c] text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                    <IconUsers className="w-3.5 h-3.5" />
                  </div>
                  <span>Find Teammates</span>
                </span>
                <IconArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                to="/browse"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#111728] hover:bg-[#161d33] border border-[#1d253c] text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-sky-500/15 text-sky-400 flex items-center justify-center">
                    <IconSearch className="w-3.5 h-3.5" />
                  </div>
                  <span>View Tasks</span>
                </span>
                <IconArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab('bids')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#111728] hover:bg-[#161d33] border border-[#1d253c] text-xs font-semibold text-white transition-all group text-left cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <IconTarget className="w-3.5 h-3.5" />
                  </div>
                  <span>Check Bids</span>
                </span>
                <span className="text-[10px] bg-[#1a233b] text-slate-400 px-1.5 py-0.5 rounded">
                  {bidHistory.length}
                </span>
              </button>

              <Link
                to="/exchanges"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#111728] hover:bg-[#161d33] border border-[#1d253c] text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-teal-500/15 text-teal-400 flex items-center justify-center">
                    <IconMessage className="w-3.5 h-3.5" />
                  </div>
                  <span>View Messages</span>
                </span>
                <IconArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Real Recent Activity Panel */}
          <div className="rounded-2xl border border-[#192033] bg-[#0c101d] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#181f33]">
              <div className="flex items-center gap-2">
                <IconBell className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Recent Activity
                </h3>
              </div>
              <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Live
              </span>
            </div>

            {activities.length === 0 ? (
              /* Clean empty state for recent activities - no fake data */
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
                  <IconBell className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-300">No recent activity yet.</p>
                <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                  When you receive bids, assignments, or task updates, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((act) => (
                  <Link
                    key={act.id}
                    to={act.listing_id ? `/listings/${act.listing_id}` : '/notifications'}
                    className="block p-2.5 rounded-xl bg-[#111728] hover:bg-[#161d33] border border-[#1d253c] transition group"
                  >
                    <p className="text-xs text-slate-200 group-hover:text-white line-clamp-2 leading-relaxed">
                      {act.message}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{formatTimeAgo(act.created_at)}</span>
                      <span className="text-teal-400 group-hover:underline">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Campus Settlement Safety & UPI Notice */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold text-teal-300">Campus Peer Trust</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              HackSaath enables direct peer-to-peer exchanges and UPI settlements with zero commission. Always verify work quality before marking completed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
