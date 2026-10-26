import { Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Logo from './components/Logo';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Browse from './pages/Browse';
import CreateListing from './pages/CreateListing';
import Dashboard from './pages/Dashboard';
import Exchanges from './pages/Exchanges';
import ForgotPassword from './pages/ForgotPassword';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import PublicProfile from './pages/PublicProfile';
import Register from './pages/Register';
import SearchUsers from './pages/SearchUsers';
import About from './pages/About';
import Support from './pages/Support';
import AdminPanel from './pages/AdminPanel';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TeamFinderPage from './pages/TeamFinderPage';
import EventsPage from './pages/EventsPage';
import YourMatches from './pages/YourMatches';
import SwapRequests from './pages/SwapRequests';
import MentorsPage from './pages/MentorsPage';
import TeamWorkspace from './pages/TeamWorkspace';

/**
 * RootRoute: Initial entry point
 * Directs unauthenticated visitors to the Login account page first,
 * and authenticated members to their HackSaath home/dashboard.
 */
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Login />;
  }
  return <Home />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b16] text-slate-100 selection:bg-teal-500 selection:text-slate-950 font-sans antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 flex-1 w-full">
        <Routes>
          {/* Initial Entry Route: Login first for unauthenticated users */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/home" element={<Home />} />
          <Route path="/team-finder" element={<TeamFinderPage />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/projects" element={<Browse />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/mentors" element={<MentorsPage />} />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <TeamWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id/workspace"
            element={
              <ProtectedRoute>
                <TeamWorkspace />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="/search" element={<SearchUsers />} />
          <Route
            path="/admin-kkr"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <YourMatches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchanges"
            element={
              <ProtectedRoute>
                <Exchanges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swap-requests"
            element={
              <ProtectedRoute>
                <SwapRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-teams"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Desktop & Tablet Footer */}
      <footer className="mt-auto border-t border-[#1a233a] bg-[#080d1a] py-8 mb-16 md:mb-0">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Logo size="sm" showText={true} />
            <div className="hidden sm:block text-slate-700">|</div>
            <div>
              <p className="font-semibold text-slate-200">HackSaath · Find Your Team. Build Your Idea.</p>
              <p className="text-[11px] text-slate-400">Smart hackathon team formation across colleges in India.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/team-finder" className="hover:text-teal-400 transition-colors">Team Finder</Link>
            <Link to="/browse" className="hover:text-teal-400 transition-colors">Projects</Link>
            <Link to="/events" className="hover:text-teal-400 transition-colors">Events</Link>
            <Link to="/about" className="hover:text-teal-400 transition-colors">About</Link>
            <Link to="/support" className="hover:text-teal-400 transition-colors">Support</Link>
            <Link to="/privacy" className="hover:text-teal-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Horizontal Navigation Dock / Tab Bar */}
      <MobileBottomNav />
    </div>
  );
}
