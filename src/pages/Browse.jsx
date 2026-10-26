import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import ModeToggle from '../components/ModeToggle';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { scoreFuzzyMatch } from '../utils/fuzzySearch';
import { useLiveRefresh } from '../hooks/useLiveRefresh';

const ROLE_FILTERS = [
  'All Roles',
  'AI/ML Engineer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Mobile Developer',
  'Cloud / DevOps Engineer',
  'Product / Pitch Lead',
];

export default function Browse() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'team';
  const [mode, setModeState] = useState(initialMode);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedHackathon, setSelectedHackathon] = useState('All Hackathons');
  const [selectedPolicy, setSelectedPolicy] = useState('All Policies');

  const setMode = (newMode) => {
    setModeState(newMode);
    setSearchParams({ mode: newMode });
  };

  const loadListings = useCallback(() => {
    api.listings
      .list(mode)
      .then((data) => {
        setListings(data.listings);
        setError('');
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    loadListings();
  }, [loadListings]);

  useLiveRefresh(loadListings, { intervalMs: 12000 });

  const filteredListings = useMemo(() => {
    let result = listings;

    // Filter by missing role for team mode
    if (mode === 'team') {
      if (selectedRole !== 'All Roles') {
        result = result.filter((l) => {
          const missing = l.gaps?.missingRoles || l.required_roles || [];
          return missing.some((r) => r.toLowerCase().includes(selectedRole.toLowerCase().replace(' developer', '').replace(' engineer', '')));
        });
      }

      if (selectedHackathon !== 'All Hackathons') {
        result = result.filter((l) =>
          (l.hackathon_name || '').toLowerCase().includes(selectedHackathon.toLowerCase())
        );
      }

      if (selectedPolicy !== 'All Policies') {
        result = result.filter((l) => l.institution_policy === selectedPolicy);
      }
    }

    if (!searchQuery.trim()) return result;

    const scored = [];
    for (const listing of result) {
      const combinedText = [
        listing.title || '',
        listing.description || '',
        listing.hackathon_name || '',
        listing.hackathon_theme || '',
        Array.isArray(listing.tags) ? listing.tags.join(' ') : '',
        Array.isArray(listing.required_roles) ? listing.required_roles.join(' ') : '',
        Array.isArray(listing.team_skills_needed) ? listing.team_skills_needed.join(' ') : '',
        listing.skill_offered || '',
        listing.skill_wanted || '',
        listing.owner?.full_name || '',
      ].join(' ');

      const score = scoreFuzzyMatch(searchQuery, combinedText);
      if (score >= 0.45) {
        scored.push({ listing, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.listing);
  }, [listings, searchQuery, mode, selectedRole]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#1e2a44]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
            Projects
          </h1>
          <p className="mt-1 text-[14px] sm:text-[15px] text-slate-400">
            {mode === 'team'
              ? 'Discover active student project teams looking for collaborators.'
              : mode === 'freelance'
              ? 'Paid tasks posted by verified student builders across campuses.'
              : 'Direct peer-to-peer knowledge sharing and complementary skill swaps.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onChange={setMode} />
          {user && (
            <Link to="/new" className="rounded-xl bg-teal-500 hover:bg-teal-400 px-4 py-2 text-[14px] font-semibold text-slate-950 shadow-md shadow-teal-500/20 transition-all">
              + {mode === 'team' ? 'Post Project' : 'New Listing'}
            </Link>
          )}
        </div>
      </div>

      {/* Role Gap & Hackathon Filters for Hackathon Teams */}
      {mode === 'team' && (
        <div className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1e2a44]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filter by Missing Role Needed:
            </span>
            <span className="text-xs text-teal-400 font-mono font-medium">
              {filteredListings.length} {filteredListings.length === 1 ? 'squad' : 'squads'} found
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer border ${
                  selectedRole === role
                    ? 'bg-teal-500 border-teal-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-[#111a33] border-[#1e2a44] text-slate-300 hover:border-teal-500/40 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Hackathon Preset and Policy Secondary Filters */}
          <div className="pt-2 border-t border-[#1e2a44] flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Tournament:</span>
              <select
                value={selectedHackathon}
                onChange={(e) => setSelectedHackathon(e.target.value)}
                className="rounded-lg border border-[#1e2a44] bg-[#070b14] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="All Hackathons">All Tournaments</option>
                <option value="Smart India Hackathon">SIH 2026</option>
                <option value="Technovanza">VJTI Technovanza</option>
                <option value="CleanTech">CleanTech Global</option>
                <option value="MindSpark">MindSpark AI</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Policy:</span>
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="rounded-lg border border-[#1e2a44] bg-[#070b14] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="All Policies">All Eligibility Policies</option>
                <option value="same_institution">Same College Only (SIH)</option>
                <option value="cross_institution">Cross-College Allowed</option>
              </select>
            </div>

            {(selectedRole !== 'All Roles' || selectedHackathon !== 'All Hackathons' || selectedPolicy !== 'All Policies') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('All Roles');
                  setSelectedHackathon('All Hackathons');
                  setSelectedPolicy('All Policies');
                }}
                className="text-teal-400 hover:text-teal-300 text-xs underline cursor-pointer ml-auto font-medium"
              >
                Reset Team Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full rounded-xl border border-[#1e2a44] bg-[#0c1224] pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          placeholder={
            mode === 'team'
              ? 'Search by hackathon name, missing role, technology (e.g. PyTorch, Figma, React)...'
              : 'Search listings by keywords or tags...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-slate-400">Loading listings…</p>}

      {error && (
        <p role="alert" className="rounded-xl bg-red-950/40 px-3 py-2 text-sm text-red-300 border border-red-800/60">
          {error}
        </p>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mx-auto mb-3 flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-cw-text-1">No listings found in this category yet</h3>
          <p className="mt-1 text-sm text-cw-text-3 max-w-sm mx-auto">
            {user ? 'Be the first to create one and invite your peers!' : 'Sign in to create the first listing.'}
          </p>
          {user && (
            <Link to="/new" className="btn-primary mt-4 inline-flex">
              Create a Listing
            </Link>
          )}
        </div>
      )}

      {!loading && !error && listings.length > 0 && filteredListings.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-sm text-cw-text-2">
            No teams match your criteria for role "{selectedRole}" and query "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setSelectedRole('All Roles');
              setSearchQuery('');
            }}
            className="btn-ghost mt-3 text-xs"
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
