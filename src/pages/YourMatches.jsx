import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import StudentCard from '../components/StudentCard';
import SendSwapModal from '../components/SendSwapModal';

/**
 * Your Matches Page
 * Computes genuine skill matches between the logged-in student and other students
 * based directly on skills_offered ("can teach") and skills_wanted ("want to learn").
 */
export default function YourMatches() {
  const [matches, setMatches] = useState([]);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'two-way' | 'one-way'
  const [selectedStudentForSwap, setSelectedStudentForSwap] = useState(null);
  const [prefilledOffer, setPrefilledOffer] = useState('');
  const [prefilledWant, setPrefilledWant] = useState('');
  const [myOffered, setMyOffered] = useState([]);
  const [myWanted, setMyWanted] = useState([]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.exchanges.peerMatches();
      setMatches(data.matches || []);
      setHint(data.hint || '');
      setMyOffered(data.myOffered || []);
      setMyWanted(data.myWanted || []);
    } catch (err) {
      setError(err.message || 'Unable to load matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleOpenSwap = (matchItem) => {
    setSelectedStudentForSwap(matchItem.student);
    setPrefilledOffer(matchItem.iCanTeachThem?.[0] || '');
    setPrefilledWant(matchItem.theyCanTeachMe?.[0] || '');
  };

  const filteredMatches = matches.filter((item) => {
    if (filterType === 'two-way') return item.matchType === 'two-way';
    if (filterType === 'one-way') return item.matchType === 'one-way';
    return true;
  });

  const twoWayCount = matches.filter((m) => m.matchType === 'two-way').length;
  const oneWayCount = matches.filter((m) => m.matchType === 'one-way').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
            Your Matches
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-400 mt-1 leading-normal max-w-2xl">
            Students whose skills line up with yours. Two-way matches indicate mutual skills to exchange directly.
          </p>
        </div>

        <Link
          to="/swap-requests"
          className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-[#121522] hover:bg-[#181c2b] px-4 py-2 text-[14px] font-medium text-slate-200 transition-colors shrink-0"
        >
          View Swap Requests
        </Link>
      </div>

      {/* Profile Skill Status Summary */}
      <div className="rounded-xl border border-slate-800 bg-[#111420] p-4 text-[13px] sm:text-[14px] flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-300">
        <div className="space-y-1">
          <div>
            <span className="text-slate-400 font-medium">Skills you can teach: </span>
            <span className="text-white">
              {myOffered.length > 0 ? myOffered.join(' · ') : 'None listed yet'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Skills you want to learn: </span>
            <span className="text-white">
              {myWanted.length > 0 ? myWanted.join(' · ') : 'None listed yet'}
            </span>
          </div>
        </div>

        <Link
          to="/profile"
          className="text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap self-start md:self-auto"
        >
          Edit Profile Skills →
        </Link>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-950/40 border border-red-850 p-4 text-[14px] text-red-300">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#111420] border border-slate-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Matches ({matches.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('two-way')}
          className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
            filterType === 'two-way'
              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Two-Way Matches ({twoWayCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('one-way')}
          className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
            filterType === 'one-way'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          One-Way Matches ({oneWayCount})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-[14px]">
          Finding matching student profiles...
        </div>
      ) : hint ? (
        <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 text-center space-y-3">
          <p className="text-[15px] text-slate-300">{hint}</p>
          <Link
            to="/profile"
            className="inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[14px] font-medium text-white transition-colors"
          >
            Update Your Skills
          </Link>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111420] p-8 text-center space-y-2">
          <p className="text-[15px] font-medium text-slate-300">
            No {filterType !== 'all' ? `${filterType} ` : ''}matches found at this moment.
          </p>
          <p className="text-[13px] text-slate-400">
            Try expanding your listed skills or browse students in Team Finder.
          </p>
          <div className="pt-2">
            <Link
              to="/team-finder"
              className="inline-block text-[14px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Open Team Finder →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredMatches.map(({ student, matchType, theyCanTeachMe, iCanTeachThem }) => (
            <div
              key={student.id}
              className="rounded-xl border border-slate-800 bg-[#111420] p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                {/* Header row with student and badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.full_name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{student.full_name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-white tracking-tight">
                        {student.full_name}
                      </h3>
                      <p className="text-[14px] text-indigo-400 font-medium">
                        {student.primary_role}
                      </p>
                      <p className="text-[13px] text-slate-400 mt-0.5">
                        {student.college_name}
                        {student.year_of_study && ` · ${student.year_of_study}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[12px] font-medium px-2.5 py-1 rounded-md border shrink-0 ${
                      matchType === 'two-way'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    {matchType === 'two-way' ? 'Two-Way Match' : 'One-Way Match'}
                  </span>
                </div>

                {/* Overlapping Skill Analysis */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2 text-[13px]">
                  {theyCanTeachMe.length > 0 && (
                    <div>
                      <span className="text-emerald-400 font-medium">They can teach you: </span>
                      <span className="text-slate-200 font-medium">
                        {theyCanTeachMe.join(' · ')}
                      </span>
                    </div>
                  )}

                  {iCanTeachThem.length > 0 && (
                    <div>
                      <span className="text-indigo-400 font-medium">They want to learn from you: </span>
                      <span className="text-slate-200 font-medium">
                        {iCanTeachThem.join(' · ')}
                      </span>
                    </div>
                  )}

                  {student.availability && (
                    <div className="text-slate-400">
                      <span>Availability: </span>
                      <span className="text-slate-300">{student.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-3">
                <Link
                  to={`/users/${student.id}`}
                  className="text-[14px] font-medium text-slate-300 hover:text-white transition-colors"
                >
                  View Profile
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenSwap({ student, matchType, theyCanTeachMe, iCanTeachThem })
                  }
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-[14px] font-medium text-white shadow-sm transition-colors cursor-pointer"
                >
                  Send Swap Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Swap Modal */}
      {selectedStudentForSwap && (
        <SendSwapModal
          recipient={selectedStudentForSwap}
          prefilledOffer={prefilledOffer}
          prefilledWant={prefilledWant}
          onClose={() => setSelectedStudentForSwap(null)}
          onSuccess={() => {
            // Optional feedback or refresh
          }}
        />
      )}
    </div>
  );
}
