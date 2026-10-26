import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Star,
  CheckCircle,
  Building,
  Award,
  Search,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DOMAIN_FILTERS = [
  'All Domains',
  'AI/ML',
  'UI/UX Design',
  'Cloud Architecture',
  'IoT & Embedded',
];

export default function MentorsPage() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [searchQuery, setSearchQuery] = useState('');

  // Mentorship request modal
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.mentors
      .list({ expertise: selectedDomain !== 'All Domains' ? selectedDomain : undefined })
      .then((res) => {
        if (isMounted) {
          setMentors(res.mentors || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDomain]);

  const openRequestModal = async (mentor) => {
    setSelectedMentor(mentor);
    setErrorNotice('');
    setSuccessNotice('');
    if (user) {
      try {
        const { listings } = await api.listings.forOwner(user.id);
        const teamListings = (listings || []).filter((l) => l.mode === 'team' && l.status === 'open');
        setMyTeams(teamListings);
        if (teamListings.length > 0) {
          setSelectedTeamId(teamListings[0].id);
        }
      } catch (err) {
        // Fallback
      }
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !topic) return;
    setSubmitting(true);
    setErrorNotice('');
    try {
      await api.mentors.request({
        team_id: selectedTeamId,
        mentor_id: selectedMentor.id,
        topic,
        message,
      });
      setSuccessNotice(`Mentorship request successfully sent to ${selectedMentor.full_name}!`);
      setSelectedMentor(null);
      setTopic('');
      setMessage('');
    } catch (err) {
      setErrorNotice(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.full_name?.toLowerCase().includes(q);
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchOrg = m.organization?.toLowerCase().includes(q);
      const matchExp = (m.expertise_areas || []).some((e) => e.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchOrg && !matchExp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>HackSaath Mentorship Council</span>
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
            Expert Mentors & Faculty Advisors
          </h1>
          <p className="mt-1 text-[14px] text-slate-400 max-w-2xl leading-normal">
            Connect your hackathon squad with verified industry leaders and faculty judges for architectural reviews, pitch polish, and algorithmic validation.
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Row */}
      <div className="rounded-xl border border-slate-800 bg-[#111420] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] pl-9 pr-3.5 py-2 text-[13px] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            placeholder="Search by name, expertise, tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {DOMAIN_FILTERS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer border ${
                selectedDomain === d
                  ? 'bg-teal-500 border-teal-500 text-slate-950 font-semibold shadow-xs'
                  : 'bg-[#111a33] border-[#1e2a44] text-slate-300 hover:border-teal-500/40 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Mentor Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            Loading mentor directory...
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl">
            No mentors match your selected filters.
          </div>
        ) : (
          filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="rounded-xl border border-slate-800 bg-[#111420] p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start gap-4">
                  {mentor.avatar_url ? (
                    <img
                      src={mentor.avatar_url}
                      alt={mentor.full_name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base flex items-center justify-center shrink-0">
                      {mentor.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[16px] font-semibold text-white tracking-tight truncate">
                        {mentor.full_name}
                      </h3>
                      {mentor.is_verified && (
                        <span className="text-emerald-400 text-xs flex items-center" title="Verified Mentor">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-[13px] text-teal-400 font-medium truncate mt-0.5">
                      {mentor.title}
                    </p>

                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mt-0.5 truncate">
                      <span>{mentor.organization}</span>
                      <span className="text-slate-600">·</span>
                      <span className="truncate">{mentor.college_affiliation}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[13px] text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                  {mentor.bio}
                </p>

                {/* Metrics Row */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-white">{mentor.rating}</span>
                    <span className="text-slate-500">(Rating)</span>
                  </div>
                  <div>
                    <span className="text-slate-200 font-medium">{mentor.total_mentored_teams}</span> teams mentored
                  </div>
                </div>

                {/* Expertise Badges */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <span className="text-slate-500 font-medium text-[11px] block mb-1">Expertise:</span>
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise_areas?.map((exp) => (
                      <span
                        key={exp}
                        className="px-2 py-0.5 rounded bg-[#181c28] border border-slate-800 text-[11px] text-slate-300"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Available for Sessions
                </span>

                <button
                  type="button"
                  onClick={() => openRequestModal(mentor)}
                  className="rounded-xl bg-teal-500 hover:bg-teal-400 px-4 py-1.5 text-slate-950 text-xs font-semibold shadow-md shadow-teal-500/15 transition-all cursor-pointer"
                >
                  Request Mentorship
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mentorship Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">Request Mentorship</h3>
                <p className="text-xs text-slate-400 mt-0.5">With {selectedMentor.full_name}</p>
              </div>
              <button onClick={() => setSelectedMentor(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorNotice && (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                {errorNotice}
              </div>
            )}

            {!user ? (
              <div className="text-center py-4 text-xs text-slate-300 space-y-3">
                <p>Please log in to book a mentorship session for your hackathon squad.</p>
                <Link
                  to="/login"
                  className="inline-block px-4 py-2 rounded bg-indigo-600 text-white font-medium"
                >
                  Log In
                </Link>
              </div>
            ) : myTeams.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-300 space-y-3">
                <p>You must lead or belong to an active squad to request mentorship.</p>
                <Link
                  to="/new"
                  className="inline-block px-4 py-2 rounded bg-indigo-600 text-white font-medium"
                >
                  Create a Hackathon Squad
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Select Squad:</label>
                  <select
                    required
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {myTeams.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#0c0e16]">
                        {t.title} ({t.hackathon_name || 'Team'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Consultation Topic:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Model inference latency, SIH problem pitch validation..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Specific Questions or Blockers:</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what your squad is building and the specific technical or strategic challenges..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="py-1.5 px-3 rounded text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-1.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-md shadow-teal-500/20"
                  >
                    {submitting ? 'Sending Request...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
