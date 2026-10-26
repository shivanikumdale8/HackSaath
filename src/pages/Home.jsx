import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SmartTeamFinder from '../components/SmartTeamFinder';
import ListingCard from '../components/ListingCard';
import { api } from '../lib/api';

/**
 * Home Page for HackSaath
 * Brand: HackSaath — The Student Collaboration Bridge
 * Tagline: "Connect with students, exchange skills, and build projects together."
 */
export default function Home() {
  const { user } = useAuth();
  const [recentListings, setRecentListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    api.listings
      .list()
      .then((data) => {
        setRecentListings((data.listings || []).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, []);

  return (
    <div className="space-y-12 pb-12 max-w-6xl mx-auto">
      {/* 1. Hero Section with Full HackSaath Logo */}
      <section className="text-center py-8 sm:py-14 border-b border-[#1a233a]">
        {/* Full Logo Presentation */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-2 sm:p-3 bg-white rounded-2xl shadow-xl shadow-teal-950/20 border border-slate-200/40 inline-flex items-center justify-center">
            <img
              src="/assets/hacksaath-logo.png"
              alt="HackSaath — Find Your Team. Build Your Idea."
              className="h-28 sm:h-36 w-auto object-contain rounded-xl"
              loading="eager"
            />
          </div>
        </div>

        <h1 className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight">
          <span>Hack<span className="text-[#00b4d8]">Saath</span></span>
          <span className="block text-[18px] sm:text-[22px] font-semibold text-teal-300 mt-2">
            Find Your Team. Build Your Idea.
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-[14px] sm:text-[16px] text-slate-300 leading-normal">
          Smart hackathon team formation &amp; student project matching across colleges in India. Verify eligibility, discover cross-college builders, and turn ideas into winning prototypes.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/team-finder"
            className="rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-2.5 text-[14px] font-semibold text-slate-950 shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02]"
          >
            Find Teammates
          </Link>
          <Link
            to="/browse"
            className="rounded-xl border border-[#1e2a44] bg-[#0c1224] hover:bg-[#121a32] px-5 py-2.5 text-[14px] font-medium text-slate-200 transition-colors"
          >
            Explore Projects
          </Link>
          <Link
            to="/events"
            className="rounded-xl border border-teal-500/30 bg-teal-950/30 hover:bg-teal-950/50 px-5 py-2.5 text-[14px] font-medium text-teal-300 transition-colors"
          >
            Hackathon Events
          </Link>
          {!user && (
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-[14px] font-medium text-white transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </section>

      {/* 2. Smart Team Finder Section */}
      <section>
        <SmartTeamFinder />
      </section>

      {/* 3. Active Projects Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#1e2a44]">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">
              Active Projects
            </h2>
            <p className="text-[14px] text-slate-400 mt-0.5">
              Current campus teams and projects looking for student contributors.
            </p>
          </div>
          <Link
            to="/browse"
            className="text-[13px] font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            View all projects →
          </Link>
        </div>

        {loadingListings ? (
          <div className="py-8 text-center text-slate-400 text-[14px]">
            Loading active projects...
          </div>
        ) : recentListings.length === 0 ? (
          <div className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-6 text-center text-slate-400 text-[14px]">
            No open projects found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Practical How It Works Section */}
      <section className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-6 sm:p-8 shadow-sm">
        <h2 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight mb-6">
          How Collaboration Works
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="text-[14px] font-bold text-teal-400">
              01. Discover Teammates
            </div>
            <h3 className="text-[16px] font-medium text-white">
              Skill and Availability Matching
            </h3>
            <p className="text-[13px] text-slate-300 leading-normal">
              Filter by specific technical skills, domain expertise, and project availability to find ideal peers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[14px] font-bold text-teal-400">
              02. Exchange Skills
            </div>
            <h3 className="text-[16px] font-medium text-white">
              Two-Way Skill Exchanges
            </h3>
            <p className="text-[13px] text-slate-300 leading-normal">
              Directly exchange knowledge with peers who teach what you want to learn and want what you can teach.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-[14px] font-bold text-teal-400">
              03. Build Together
            </div>
            <h3 className="text-[16px] font-medium text-white">
              Structured Project Squads
            </h3>
            <p className="text-[13px] text-slate-300 leading-normal">
              Join or create project squads with clear roles, shared progress updates, and verified student profiles.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
