import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * MobileBottomNav component for HackSaath
 * Provides a sleek, fixed horizontal navigation dock/tab bar on mobile devices (md:hidden)
 * allowing users to switch directly between the 5 primary actions:
 * Home/Login, Team Finder, Post / Create, Events, and Dashboard.
 */
export default function MobileBottomNav() {
  const { user } = useAuth();

  const navItemClass = (isActive) =>
    `flex flex-col items-center justify-center flex-1 py-1 px-1 relative transition-all duration-200 select-none group active:scale-95 ${
      isActive
        ? 'text-teal-400 font-semibold'
        : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <nav
      aria-label="Mobile Bottom Navigation Bar"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#090e1d]/95 backdrop-blur-md border-t border-[#1a233a] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-14 px-2">
        {/* 1. HOME / ENTRY TAB */}
        <NavLink
          to={user ? '/home' : '/login'}
          className={({ isActive }) => navItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal-400 shadow-sm" />
              )}
              <div className="relative mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-teal-400' : 'group-hover:scale-105'
                  }`}
                  fill={isActive ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={isActive ? '1.5' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight mt-1 tracking-tight">
                {user ? 'Home' : 'Sign In'}
              </span>
            </>
          )}
        </NavLink>

        {/* 2. TEAM FINDER TAB */}
        <NavLink
          to="/team-finder"
          className={({ isActive }) => navItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal-400 shadow-sm" />
              )}
              <div className="relative mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-teal-400' : 'group-hover:scale-105'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight mt-1 tracking-tight">Team Finder</span>
            </>
          )}
        </NavLink>

        {/* 3. POST / CREATE (+ Center highlighted button) */}
        <NavLink
          to={user ? '/new' : '/login'}
          className="flex flex-col items-center justify-center flex-1 py-0.5 px-1 relative transition-all duration-200 select-none group -mt-4 active:scale-95"
          title="Create Team Listing or Hackathon Squad"
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 border-2 border-[#090e1d] ${
                  isActive
                    ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-500/30'
                    : 'bg-gradient-to-tr from-[#0c1836] to-teal-600 text-white shadow-teal-500/20 hover:scale-105'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight mt-1 font-semibold text-teal-400 tracking-tight">
                Post Team
              </span>
            </>
          )}
        </NavLink>

        {/* 4. EVENTS TAB */}
        <NavLink
          to="/events"
          className={({ isActive }) => navItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal-400 shadow-sm" />
              )}
              <div className="relative mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-teal-400' : 'group-hover:scale-105'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight mt-1 tracking-tight">Events</span>
            </>
          )}
        </NavLink>

        {/* 5. DASHBOARD / BROWSE TAB */}
        <NavLink
          to={user ? '/dashboard' : '/browse'}
          className={({ isActive }) => navItemClass(isActive)}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal-400 shadow-sm" />
              )}
              <div className="relative mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-teal-400' : 'group-hover:scale-105'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight mt-1 tracking-tight">
                {user ? 'Dashboard' : 'Projects'}
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
