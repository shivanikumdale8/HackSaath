import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Users,
  Award,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';
import { api } from '../lib/api';

const FALLBACK_HACKATHONS = [
  {
    id: 'sih-2026',
    title: 'Smart India Hackathon 2026 (SIH)',
    organizer: "Ministry of Education's Innovation Cell & AICTE",
    edition: 'SIH 2026',
    category: 'National Govt Hackathon',
    reg_deadline: new Date(Date.now() + 35 * 86400000).toISOString(),
    team_formation_deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
    min_team_size: 6,
    max_team_size: 6,
    institution_policy: 'same_institution',
    required_gender_diversity: true,
    prize_pool: '₹1,50,000 per PS',
    mode: 'Hybrid',
    location: 'New Delhi & Designated Nodal Centers',
    verification_status: 'verified',
    official_rules_url: 'https://www.sih.gov.in',
    official_reg_url: 'https://www.sih.gov.in/sih2026',
    description: 'The world biggest open innovation model. Form a 6-member squad from your college with mandatory gender inclusion to solve key challenges for central ministries.',
    problem_statements: [
      {
        code: 'SIH1420',
        title: 'Automated Crop Disease Detection & Localized Advisory System using Drone Imagery',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        category: 'Software / AI',
        description: 'Develop an AI-driven offline/low-bandwidth mobile app that processes multispectral drone feeds to diagnose crop foliar diseases and deliver real-time remedies in regional vernacular languages.',
        recommended_roles: ['AI/ML Engineer', 'Frontend Developer', 'UI/UX Designer', 'Backend Developer'],
      },
      {
        code: 'SIH1421',
        title: 'Smart Adaptive Traffic Signal Optimization using Edge Vision Microcontrollers',
        ministry: 'Ministry of Road Transport & Highways',
        category: 'Hardware / IoT',
        description: 'Deploy embedded edge vision on ESP32/Raspberry Pi to dynamically reconfigure traffic signal green corridors based on emergency vehicle sirens and lane queue density.',
        recommended_roles: ['IoT Specialist', 'Embedded Systems', 'Backend Developer', 'AI/ML Engineer'],
      },
      {
        code: 'SIH1422',
        title: 'Unified Student Academic Credit & Micro-Scholarship Transfer Verification Protocol',
        ministry: 'Department of Higher Education',
        category: 'Software / Web3',
        description: 'Implement a tamper-proof verifiable credential ledger for National Academic Depository (NAD) and ABC credit portability across universities with zero-knowledge proof validation.',
        recommended_roles: ['Full Stack Developer', 'Backend Developer', 'UI/UX Designer'],
      },
    ],
  },
  {
    id: 'technovanza-2026',
    title: 'VJTI Technovanza HackSprint v8',
    organizer: 'VJTI Mumbai Student Tech Council',
    edition: 'v8',
    category: 'Inter-Collegiate Hackathon',
    reg_deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    min_team_size: 2,
    max_team_size: 4,
    institution_policy: 'cross_institution',
    required_gender_diversity: false,
    prize_pool: '₹1,00,000',
    mode: 'Offline',
    location: 'VJTI Mumbai Campus',
    verification_status: 'verified',
    official_rules_url: 'https://technovanza.org',
    description: '36-hour intense engineering sprint focusing on high-concurrency systems, fintech micro-settlements, and edge computing.',
    problem_statements: [
      {
        code: 'TECH-01',
        title: 'High-Throughput Decentralized Escrow Protocol for Campus Freelancing',
        ministry: 'Industry Track (FinTech)',
        category: 'Web3 & Distributed Systems',
        description: 'Build sub-second settlement escrow with instant dispute arbitration for student gig contracts.',
        recommended_roles: ['Backend Developer', 'Frontend Developer'],
      },
    ],
  },
  {
    id: 'cleantech-2026',
    title: 'CleanTech Global Hackathon 2026',
    organizer: 'CleanTech Alliance & Climate Innovation Fund',
    edition: '2026',
    category: 'International Climate Hackathon',
    reg_deadline: new Date(Date.now() + 28 * 86400000).toISOString(),
    min_team_size: 3,
    max_team_size: 5,
    institution_policy: 'cross_institution',
    required_gender_diversity: false,
    prize_pool: '₹3,00,000 + Grant',
    mode: 'Online',
    location: 'Global Virtual Hub',
    verification_status: 'verified',
    official_rules_url: 'https://cleantech-hack.org',
    description: 'Develop software and data models to calculate carbon emissions, solar roof potential, and waste diversion for university campuses.',
    problem_statements: [],
  },
  {
    id: 'mindspark-2026',
    title: 'MindSpark AI Challenge 2026',
    organizer: 'COEP Technological University',
    edition: '2026',
    category: 'Collegiate AI Hackathon',
    reg_deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
    min_team_size: 2,
    max_team_size: 4,
    institution_policy: 'unverified',
    required_gender_diversity: false,
    prize_pool: '₹75,000',
    mode: 'Online',
    location: 'COEP Pune',
    verification_status: 'needs_verification',
    official_rules_url: 'https://mindspark.coep.ac.in',
    description: 'Diagnostic vision and natural language processing track. Open for student teams seeking AI mentorship and rapid prototyping.',
    problem_statements: [],
  },
];

export default function EventsPage() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [policyFilter, setPolicyFilter] = useState('All'); // 'All' | 'same_institution' | 'cross_institution'
  const [modeFilter, setModeFilter] = useState('All'); // 'All' | 'Online' | 'Offline' | 'Hybrid'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProblemHackathon, setActiveProblemHackathon] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.hackathons
      .list()
      .then((res) => {
        if (isMounted) {
          setHackathons(res.hackathons && res.hackathons.length > 0 ? res.hackathons : FALLBACK_HACKATHONS);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHackathons(FALLBACK_HACKATHONS);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReset = () => {
    setPolicyFilter('All');
    setModeFilter('All');
    setSearchQuery('');
  };

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      if (policyFilter !== 'All' && h.institution_policy !== policyFilter) return false;
      if (modeFilter !== 'All' && h.mode !== modeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = h.title?.toLowerCase().includes(q);
        const matchOrg = h.organizer?.toLowerCase().includes(q);
        const matchDesc = h.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchDesc) return false;
      }
      return true;
    });
  }, [hackathons, policyFilter, modeFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 rounded px-2.5 py-0.5 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 mb-2">
            <span>HackSaath</span>
            <span>·</span>
            <span>Verified Hackathon Directory</span>
          </div>
          <h1 className="text-[24px] sm:text-[30px] font-bold text-white tracking-tight">
            Hackathons & Competitions Directory
          </h1>
          <p className="mt-1 text-[14px] text-slate-400 max-w-2xl leading-relaxed">
            Discover verified tournaments, inspect strict team formation rules (like SIH 2026 same-college and gender mandates), and recruit complementary teammates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/team-finder"
            className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 text-xs font-semibold shadow-md shadow-teal-500/20 transition-all cursor-pointer"
          >
            Find Teammates
          </Link>
          <Link
            to="/mentors"
            className="rounded-xl border border-[#1e2a44] bg-[#0c1224] hover:bg-[#111a33] text-slate-200 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Mentors
          </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            className="w-full rounded-xl border border-[#1e2a44] bg-[#070b14] pl-9 pr-3.5 py-2 text-[13px] text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="Search SIH, Technovanza, CleanTech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Policy Segmented */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#070b14] border border-[#1e2a44] text-xs">
            <button
              type="button"
              onClick={() => setPolicyFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                policyFilter === 'All' ? 'bg-teal-500 text-slate-950 font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Policies
            </button>
            <button
              type="button"
              onClick={() => setPolicyFilter('same_institution')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                policyFilter === 'same_institution' ? 'bg-teal-500 text-slate-950 font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Same College Only (SIH)
            </button>
            <button
              type="button"
              onClick={() => setPolicyFilter('cross_institution')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                policyFilter === 'cross_institution' ? 'bg-teal-500 text-slate-950 font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cross-College Allowed
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-teal-400 hover:text-teal-300 px-2 py-1 underline cursor-pointer font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Hackathons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            Loading verified hackathons...
          </div>
        ) : filteredHackathons.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-[#1e2a44] rounded-2xl p-6 text-slate-400 text-sm bg-[#0c1224]/50">
            No hackathons match the selected filters.
          </div>
        ) : (
          filteredHackathons.map((hackathon) => {
            const hasProblemStatements = hackathon.problem_statements && hackathon.problem_statements.length > 0;
            const isSIH = hackathon.id === 'sih-2026';

            return (
              <div
                key={hackathon.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-colors ${
                  isSIH
                    ? 'border-teal-500/40 bg-[#0c182c]'
                    : 'border-[#1e2a44] bg-[#0c1224] hover:border-teal-500/40'
                }`}
              >
                <div>
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-1.5">
                      {hackathon.verification_status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Verified Tournament</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          Needs Verification
                        </span>
                      )}

                      <span className="text-[11px] font-medium text-slate-300 px-2 py-0.5 rounded-md bg-[#111a33] border border-[#1e2a44]">
                        {hackathon.mode || 'Hybrid'}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-amber-300">
                      {hackathon.prize_pool || 'Prize & Grants'}
                    </span>
                  </div>

                  {/* Title & Organizer */}
                  <h3 className="text-[17px] font-bold text-white tracking-tight mt-1">
                    {hackathon.title}
                  </h3>
                  <p className="text-[12px] text-teal-300/80 mt-0.5">
                    {hackathon.organizer}
                  </p>

                  <p className="text-[13px] text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {hackathon.description}
                  </p>

                  {/* Official Eligibility Specifications Box */}
                  <div className="mt-3.5 p-3 rounded-xl border border-[#1e2a44] bg-[#070b14] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Team Size Constraint:</span>
                      <span className="font-semibold text-white">
                        {hackathon.min_team_size === hackathon.max_team_size
                          ? `${hackathon.min_team_size} Members Mandatory`
                          : `${hackathon.min_team_size} - ${hackathon.max_team_size} Members`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Institution Policy:</span>
                      <span
                        className={`font-semibold ${
                          hackathon.institution_policy === 'same_institution'
                            ? 'text-teal-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {hackathon.institution_policy === 'same_institution'
                          ? 'Strict: Same College Only'
                          : 'Cross-College Allowed'}
                      </span>
                    </div>

                    {hackathon.required_gender_diversity && (
                      <div className="flex items-center justify-between text-teal-300 font-medium">
                        <span>Gender Inclusivity:</span>
                        <span>Mandatory ≥1 Female Member</span>
                      </div>
                    )}
                  </div>

                  {/* Problem Statements Pill / Trigger */}
                  {hasProblemStatements && (
                    <div className="mt-3 pt-2 border-t border-[#1e2a44] flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {hackathon.problem_statements.length} Official Problem Statements
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveProblemHackathon(hackathon)}
                        className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Problem Statements</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="mt-5 pt-3 border-t border-[#1e2a44] flex items-center gap-2">
                  <Link
                    to="/team-finder"
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold shadow-md shadow-teal-500/15 transition-all text-center cursor-pointer"
                  >
                    Find Teammates
                  </Link>
                  <Link
                    to="/new"
                    className="py-2 px-3 rounded-xl border border-[#1e2a44] bg-[#111a33] hover:bg-[#182444] text-slate-200 text-xs font-semibold transition-colors text-center cursor-pointer"
                  >
                    Create Squad
                  </Link>
                  {hackathon.official_rules_url && (
                    <a
                      href={hackathon.official_rules_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-[#1e2a44] bg-[#070b14] hover:border-teal-500/40 text-slate-400 hover:text-white transition-colors"
                      title="Official Tournament Guidelines"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Problem Statements Modal */}
      {activeProblemHackathon && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeProblemHackathon.title} — Problem Statements
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official challenges released by participating ministries and enterprise tracks.
                </p>
              </div>
              <button
                onClick={() => setActiveProblemHackathon(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {activeProblemHackathon.problem_statements?.map((ps) => (
                <div
                  key={ps.code}
                  className="rounded-lg border border-slate-800 bg-[#0c0e16] p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30">
                      {ps.code}
                    </span>
                    <span className="text-slate-400 text-[11px]">{ps.category}</span>
                  </div>

                  <h4 className="text-[14px] font-semibold text-white">
                    {ps.title}
                  </h4>

                  <p className="text-[11px] text-slate-400">
                    Authority: <strong className="text-slate-200">{ps.ministry}</strong>
                  </p>

                  <p className="text-slate-300 leading-relaxed text-[12px]">
                    {ps.description}
                  </p>

                  {ps.recommended_roles?.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span className="text-slate-500 font-medium">Recommended Squad Roles: </span>
                      <span className="text-slate-300 font-medium">{ps.recommended_roles.join(' · ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Rule Check: Single college squad with mandatory female member required.
              </span>
              <Link
                to="/new"
                onClick={() => setActiveProblemHackathon(null)}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
              >
                Create Squad for this Challenge
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
