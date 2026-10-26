import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, BASE_URL } from '../lib/api';
import Logo from './Logo';

/**
 * HackSaath Navigation System
 * - Desktop: Professional top navigation bar with full active-page routing,
 *   HackSaath emblem and brand name, search, live SSE notification badge, and profile menu.
 * - Mobile: Compact top bar with HackSaath icon, dynamic page title, notification shortcut,
 *   and accessible slide-out navigation drawer with keyboard support (Escape),
 *   categorized links with clean outline icons, and zero-leak layout.
 */

// Route to readable page title mapping for compact mobile top bar
const PAGE_TITLES = {
  '/': 'HackSaath',
  '/home': 'Home',
  '/team-finder': 'Team Finder',
  '/browse': 'Projects',
  '/projects': 'Projects',
  '/events': 'Events',
  '/mentors': 'Mentors',
  '/dashboard': 'Dashboard',
  '/my-teams': 'My Teams',
  '/matches': 'Matches',
  '/swap-requests': 'Requests',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/login': 'Log In',
  '/register': 'Create Account',
  '/about': 'About',
  '/support': 'Support',
  '/privacy': 'Privacy',
};

const desktopLinkClass = ({ isActive }) =>
  `rounded-lg px-2.5 py-1.5 text-xs lg:text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
    isActive
      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-xs font-semibold'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
  }`;

const drawerLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
  }`;

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const dropdownRef = useRef(null);
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Dynamic mobile header title
  const currentTitle = PAGE_TITLES[location.pathname] || 'HackSaath';

  const initials = user
    ? (user.full_name || user.email || '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Handle keyboard interaction (Escape closes drawer and profile dropdown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (drawerOpen) {
          setDrawerOpen(false);
          menuButtonRef.current?.focus();
        }
        if (dropdownOpen) {
          setDropdownOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, dropdownOpen]);

  // Live unread notification count via Server-Sent Events (SSE)
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('skillbridge.token');
    const source = new EventSource(`${BASE_URL}/api/notifications/stream?token=${token}`);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.unread_count === 'number') {
          setUnread(data.unread_count);
        }
      } catch {
        // Ignore parse errors
      }
    };

    return () => {
      source.close();
    };
  }, [user]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    setDrawerOpen(false);
    signOut();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setDrawerOpen(false);
      setMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#1a233a] bg-[#090e1d]/95 backdrop-blur-md">
      {/* ============================================================== */}
      {/* 1. DESKTOP & TABLET TOP NAVIGATION BAR                         */}
      {/* ============================================================== */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 h-16 gap-3">
        {/* Left: HackSaath Logo & Wordmark */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-0.5"
            aria-label="HackSaath Home"
          >
            <Logo size="sm" showText={true} />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          aria-label="Desktop Primary Navigation"
          className="hidden xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none"
        >
          <NavLink to="/home" className={desktopLinkClass}>
            Home
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={desktopLinkClass}>
              Dashboard
            </NavLink>
          )}
          <NavLink to="/team-finder" className={desktopLinkClass}>
            Team Finder
          </NavLink>
          <NavLink to="/browse" className={desktopLinkClass}>
            Projects
          </NavLink>
          <NavLink to="/events" className={desktopLinkClass}>
            Events
          </NavLink>
          {user && (
            <>
              <NavLink to="/my-teams" className={desktopLinkClass}>
                My Teams
              </NavLink>
              <NavLink to="/matches" className={desktopLinkClass}>
                Matches
              </NavLink>
            </>
          )}
          <NavLink to="/mentors" className={desktopLinkClass}>
            Mentors
          </NavLink>
          {user && (
            <NavLink to="/profile" className={desktopLinkClass}>
              Profile
            </NavLink>
          )}
        </nav>

        {/* Medium screens (md to xl): compact nav links */}
        <nav
          aria-label="Tablet Navigation"
          className="hidden md:flex xl:hidden items-center gap-1"
        >
          <NavLink to="/home" className={desktopLinkClass}>
            Home
          </NavLink>
          <NavLink to="/team-finder" className={desktopLinkClass}>
            Team Finder
          </NavLink>
          <NavLink to="/browse" className={desktopLinkClass}>
            Projects
          </NavLink>
          <NavLink to="/events" className={desktopLinkClass}>
            Events
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={desktopLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Center-Right: Search Input (Desktop) */}
        <div className="hidden lg:block w-48 xl:w-60">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-teal-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-[#1e2a44] bg-[#0e162c] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:bg-[#121c38] focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
              placeholder="Search teammates, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right: Actions, Notifications & User Account (Desktop) */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative inline-flex items-center justify-center rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title="Notifications"
                aria-label={`Notifications, ${unread} unread`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-slate-950 ring-2 ring-[#090e1d]">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-lg p-1.5 text-sm text-slate-200 hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  title="Account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs overflow-hidden border border-teal-500/40">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="max-w-[110px] truncate text-xs font-medium text-slate-200 hidden lg:inline">
                    {user.full_name || 'Student'}
                  </span>
                  <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#1e2a44] bg-[#0c1224] p-1.5 shadow-xl animate-fade-in z-50">
                    <div className="px-3 py-2 border-b border-[#1a233a] mb-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.full_name || 'Student Member'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      {user.college_name && (
                        <p className="text-[10px] text-teal-400 mt-0.5 truncate font-medium">
                          {user.college_name}
                        </p>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Dashboard
                    </Link>
                    <Link
                      to="/my-teams"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      My Teams
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Settings
                    </Link>

                    <div className="border-t border-[#1a233a] my-1" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg w-full text-left transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-3 py-1.5 text-xs transition shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 2. MOBILE TOP COMPACT BAR (Visible only on md:hidden)          */}
        {/* ============================================================== */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Logo Symbol + Brand */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center gap-2 focus-visible:outline-none"
            aria-label="HackSaath Home"
          >
            <Logo size="xs" variant="symbol" showText={false} />
            <span className="font-bold text-white text-base tracking-tight leading-none">
              Hack<span className="text-[#00b4d8]">Saath</span>
            </span>
          </Link>

          {/* Current Page Context Badge */}
          <span className="text-xs font-medium text-slate-400 max-w-[120px] truncate">
            {currentTitle}
          </span>

          {/* Actions: Search button, Notification bell & Hamburger Drawer toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus-visible:outline-none"
              aria-label="Toggle search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {user && (
              <Link
                to="/notifications"
                className="relative p-2 text-slate-400 hover:text-white rounded-lg focus-visible:outline-none"
                aria-label="Notifications"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-teal-400" />
                )}
              </Link>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Inline Search Bar (expands under top bar when search button clicked) */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 border-t border-[#1a233a] bg-[#090e1d] pt-2 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              autoFocus
              className="w-full rounded-lg border border-[#1e2a44] bg-[#0c1224] pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
              placeholder="Search skills, teammates, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MOBILE NAVIGATION DRAWER (Slide-out with backdrop)         */}
      {/* ============================================================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content Container */}
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="relative w-full max-w-[320px] bg-[#090e1d] border-l border-[#1a233a] h-full flex flex-col shadow-2xl z-10 overflow-y-auto animate-fade-in"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a233a]">
              <div className="flex items-center gap-2.5">
                <Logo size="sm" variant="symbol" />
                <div>
                  <span className="font-bold text-white text-lg tracking-tight block leading-none">
                    Hack<span className="text-[#00b4d8]">Saath</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Build Your Idea</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile Card (if signed in) or Welcome Sign In CTA */}
            <div className="p-4 border-b border-[#1a233a] bg-[#0c1224]/50">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 border border-teal-500/30 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.full_name || 'Student Member'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    {user.college_name && (
                      <p className="text-[11px] text-teal-400 truncate mt-0.5">
                        {user.college_name}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    Sign in to join teams, apply to hackathons, and exchange skills.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 transition"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 text-center py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Categorized Navigation Link List */}
            <nav className="flex-1 p-3 space-y-6">
              {/* Category 1: Discover & Match */}
              <div>
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Discover &amp; Match
                </p>
                <div className="space-y-0.5">
                  <NavLink to="/home" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Home
                  </NavLink>
                  <NavLink to="/team-finder" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Smart Team Finder
                  </NavLink>
                  <NavLink to="/browse" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Projects &amp; Listings
                  </NavLink>
                  <NavLink to="/events" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Hackathon Events
                  </NavLink>
                  <NavLink to="/mentors" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Mentors &amp; Advisors
                  </NavLink>
                </div>
              </div>

              {/* Category 2: Collaboration (if user) */}
              {user && (
                <div>
                  <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Collaboration
                  </p>
                  <div className="space-y-0.5">
                    <NavLink to="/dashboard" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                      <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Dashboard
                    </NavLink>
                    <NavLink to="/my-teams" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                      <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      My Teams &amp; Squads
                    </NavLink>
                    <NavLink to="/matches" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                      <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Your Matches
                    </NavLink>
                    <NavLink to="/swap-requests" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                      <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Swap Requests
                    </NavLink>
                    <NavLink to="/notifications" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                      <div className="relative">
                        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unread > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400" />}
                      </div>
                      Notifications
                    </NavLink>
                  </div>
                </div>
              )}

              {/* Category 3: Account & Information */}
              <div>
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Account &amp; Info
                </p>
                <div className="space-y-0.5">
                  {user && (
                    <>
                      <NavLink to="/profile" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        My Profile
                      </NavLink>
                      <NavLink to="/settings" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                      </NavLink>
                    </>
                  )}
                  <NavLink to="/about" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    About HackSaath
                  </NavLink>
                  <NavLink to="/support" onClick={() => setDrawerOpen(false)} className={drawerLinkClass}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Help &amp; Support
                  </NavLink>
                </div>
              </div>
            </nav>

            {/* Drawer Footer (Sign out or CTA) */}
            {user && (
              <div className="p-4 border-t border-[#1a233a]">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </header>
  );
}
