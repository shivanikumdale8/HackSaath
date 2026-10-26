import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, Building2, MapPin, Calendar, Clock, Filter, Search, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import SendSwapModal from './SendSwapModal';

/**
 * Smart Team Finder
 * Features dual discovery modes:
 * 1. Same College - find eligible teammates from the user's own college
 * 2. Cross-College - find eligible teammates from other colleges & universities
 * Clean typography, unboxed metadata, zero-pill discipline, zero emojis.
 */

const FALLBACK_DIRECTORY = [
  {
    id: 'usr-1',
    full_name: 'Gauri Kulkarni',
    college_id: 'col-1',
    college_name: 'COEP Technological University, Pune',
    city: 'Pune',
    year_of_study: '3rd Year',
    primary_role: 'AI/ML Engineer',
    skills_offered: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'Computer Vision', 'Docker'],
    skills_wanted: ['Figma', 'UI/UX Design', 'React'],
    availability: 'Actively Seeking Team',
    bio: 'B.Tech Computer Engineering at COEP Pune. Focused on computer vision, deep learning, multimodal LLMs, and real-time inference on edge devices.',
    github_url: 'https://github.com/gaurikulkarni',
    portfolio_url: 'https://gaurikulkarni.dev',
    rating_average: 4.95,
  },
  {
    id: 'usr-2',
    full_name: 'Aarav Patil',
    college_id: 'col-1',
    college_name: 'COEP Technological University, Pune',
    city: 'Pune',
    year_of_study: '3rd Year',
    primary_role: 'Full Stack Developer',
    skills_offered: ['React', 'TypeScript', 'Node.js', 'Go', 'PostgreSQL', 'Docker', 'Tailwind CSS'],
    skills_wanted: ['Figma', 'UI/UX Design', 'IoT Specialist'],
    availability: 'Actively Seeking Team',
    bio: 'Full stack builder at COEP Pune. Core contributor to campus open source tools. Building high-throughput microservices, WebSocket channels, and clean React dashboards.',
    github_url: 'https://github.com/aaravpatil',
    portfolio_url: 'https://aaravpatil.dev',
    rating_average: 4.9,
  },
  {
    id: 'usr-3',
    full_name: 'Tanvi Deshmukh',
    college_id: 'col-2',
    college_name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai',
    city: 'Mumbai',
    year_of_study: '2nd Year',
    primary_role: 'UI/UX Designer',
    skills_offered: ['Figma', 'Wireframing', 'Design Systems', 'User Research', 'Tailwind CSS', 'React'],
    skills_wanted: ['React', 'Frontend Animation'],
    availability: 'Actively Seeking Team',
    bio: 'B.Tech IT at VJTI Mumbai. Lead designer for Technovanza hackathon portal. Obsessed with WCAG AAA accessibility, typography, design systems, and converting micro-interactions.',
    portfolio_url: 'https://tanvidesign.me',
    rating_average: 5.0,
  },
  {
    id: 'usr-4',
    full_name: 'Rohan Kulkarni',
    college_id: 'col-1',
    college_name: 'COEP Technological University, Pune',
    city: 'Pune',
    year_of_study: '4th Year',
    primary_role: 'Backend Developer',
    skills_offered: ['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'Go', 'Express', 'Kafka'],
    skills_wanted: ['AI/ML Engineer', 'PyTorch'],
    availability: 'Available (Weekend Sprint)',
    bio: 'Systems engineer & backend specialist at COEP Pune. Building fault-tolerant APIs, distributed queues, and high-performance databases.',
    github_url: 'https://github.com/rohankulkarni',
    rating_average: 4.8,
  },
  {
    id: 'usr-5',
    full_name: 'Priya Patel',
    college_id: 'col-3',
    college_name: 'Pune Institute of Computer Technology (PICT), Pune',
    city: 'Pune',
    year_of_study: '3rd Year',
    primary_role: 'Frontend Developer',
    skills_offered: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Vite', 'State Management'],
    skills_wanted: ['Backend Developer', 'PostgreSQL'],
    availability: 'Actively Seeking Team',
    bio: 'PICT Pune computer engineering student crafting buttery-smooth web apps with React, Vite, and Motion. Incubation hackathon finalist.',
    github_url: 'https://github.com/priyapatel-pict',
    rating_average: 4.9,
  },
  {
    id: 'usr-6',
    full_name: 'Aditya Shinde',
    college_id: 'col-4',
    college_name: 'Sardar Patel Institute of Technology (SPIT), Mumbai',
    city: 'Mumbai',
    year_of_study: '3rd Year',
    primary_role: 'Blockchain & FinTech Engineer',
    skills_offered: ['Solidity', 'Ethereum', 'Web3.js', 'Hardhat', 'TypeScript', 'PostgreSQL'],
    skills_wanted: ['UI/UX Designer', 'React'],
    availability: 'Available (15-20 hrs/wk)',
    bio: 'SPIT Mumbai student specializing in decentralized finance protocols, smart contracts, ERC standards, and zero-knowledge proofs.',
    github_url: 'https://github.com/adityashinde-web3',
    rating_average: 4.85,
  },
  {
    id: 'usr-7',
    full_name: 'Snehal Jadhav',
    college_id: 'col-5',
    college_name: "MKSSS's Cummins College of Engineering for Women, Pune",
    city: 'Pune',
    year_of_study: '3rd Year',
    primary_role: 'Product Lead & Pitch Specialist',
    skills_offered: ['Product Management', 'Pitch Deck Design', 'Figma', 'Market Research', 'Financial Modeling'],
    skills_wanted: ['Full Stack Developer', 'AI/ML Engineer'],
    availability: 'Actively Seeking Team',
    bio: "Cummins College Pune. Won best pitch at Smart India Hackathon & National Innovation Council. Bridges technical architecture with compelling business narratives.",
    github_url: 'https://github.com/snehaljadhav',
    rating_average: 4.92,
  },
  {
    id: 'usr-8',
    full_name: 'Siddharth Joshi',
    college_id: 'col-6',
    college_name: 'Visvesvaraya National Institute of Technology (VNIT), Nagpur',
    city: 'Nagpur',
    year_of_study: '3rd Year',
    primary_role: 'IoT Specialist',
    skills_offered: ['C++', 'Python', 'ESP32', 'MQTT', 'ROS2', 'Raspberry Pi', 'Edge AI'],
    skills_wanted: ['Full Stack Developer', 'React'],
    availability: 'Available (15-20 hrs/wk)',
    bio: 'VNIT Nagpur robotics engineer connecting hardware sensors with cloud dashboards via MQTT and high-frequency edge analytics.',
    github_url: 'https://github.com/siddharth-vnit',
    rating_average: 4.85,
  },
  {
    id: 'usr-9',
    full_name: 'Neha Gaikwad',
    college_id: 'col-8',
    college_name: 'K.K. Wagh Institute of Engineering, Nashik',
    city: 'Nashik',
    year_of_study: '3rd Year',
    primary_role: 'Data Scientist',
    skills_offered: ['Python', 'FastAPI', 'Pandas', 'PyTorch', 'HuggingFace', 'PostgreSQL'],
    skills_wanted: ['Full Stack Developer', 'React'],
    availability: 'Actively Seeking Team',
    bio: 'KK Wagh Nashik student working on regional language NLP models, dataset normalization, and predictive agriculture pipelines.',
    github_url: 'https://github.com/nehagaikwad-kkw',
    rating_average: 4.9,
  },
  {
    id: 'usr-10',
    full_name: 'Pranav Kadam',
    college_id: 'col-7',
    college_name: 'Walchand College of Engineering, Sangli',
    city: 'Sangli',
    year_of_study: '4th Year',
    primary_role: 'Cloud & DevOps Engineer',
    skills_offered: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD Pipelines', 'Linux'],
    skills_wanted: ['Full Stack Developer', 'AI/ML Engineer'],
    availability: 'Available (Weekend Sprint)',
    bio: 'WCE Sangli student managing production cloud clusters, automated zero-downtime CI/CD pipelines, and microservice infrastructure.',
    github_url: 'https://github.com/pranavkadam-wce',
    rating_average: 4.88,
  },
  {
    id: 'usr-11',
    full_name: 'Shweta More',
    college_id: 'col-9',
    college_name: 'Vishwakarma Institute of Technology (VIT), Pune',
    city: 'Pune',
    year_of_study: '2nd Year',
    primary_role: 'Mobile App Developer',
    skills_offered: ['Flutter', 'React Native', 'Dart', 'Firebase', 'State Management', 'REST APIs'],
    skills_wanted: ['Backend Developer', 'FastAPI'],
    availability: 'Actively Seeking Team',
    bio: 'VIT Pune student passionate about cross-platform mobile apps, native performance, offline-first sync, and intuitive mobile UI.',
    github_url: 'https://github.com/shwetamore-vit',
    rating_average: 4.85,
  },
  {
    id: 'usr-12',
    full_name: 'Omkar Deshpande',
    college_id: 'col-10',
    college_name: 'Government College of Engineering, Chhatrapati Sambhajinagar',
    city: 'Chhatrapati Sambhajinagar',
    year_of_study: '3rd Year',
    primary_role: 'Cybersecurity Specialist',
    skills_offered: ['Ethical Hacking', 'Penetration Testing', 'Network Security', 'OWASP', 'Linux', 'Python'],
    skills_wanted: ['Backend Developer', 'Docker'],
    availability: 'Available (15-20 hrs/wk)',
    bio: 'GECA student specializing in web application security audits, vulnerability triage, and secure architecture for hackathon builds.',
    github_url: 'https://github.com/omkardeshpande-geca',
    rating_average: 4.92,
  },
];

const POPULAR_SKILLS = [
  'React',
  'Python',
  'FastAPI',
  'Figma',
  'TypeScript',
  'Tailwind CSS',
  'PostgreSQL',
  'PyTorch',
  'Docker',
  'ESP32',
  'Node.js',
];

const ACADEMIC_YEARS = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const AVAILABILITY_OPTIONS = [
  'All Availability',
  'Actively Seeking Team',
  'Available (15-20 hrs/wk)',
  'Available (Weekend Sprint)',
];

export default function SmartTeamFinder({ defaultTargetGoal = '' }) {
  const { user } = useAuth();

  // Primary mode state: 'same_college' | 'cross_college'
  const [discoveryMode, setDiscoveryMode] = useState('same_college');

  // Filters
  const [searchQuery, setSearchQuery] = useState(defaultTargetGoal);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedAvailability, setSelectedAvailability] = useState('All Availability');

  // Cross-college specific filters
  const [collegeFilter, setCollegeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Candidates list from backend
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForConnect, setSelectedStudentForConnect] = useState(null);

  // Determine current student's college (fallback to col-1 COEP Pune)
  const userCollegeId = user?.college_id || 'col-1';
  const userCollegeName = user?.college_name || 'COEP Technological University, Pune';

  // Fetch candidates from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.teams
      .candidates({
        mode: discoveryMode,
        college_id: userCollegeId,
        college_name: discoveryMode === 'cross_college' ? collegeFilter : undefined,
        city: discoveryMode === 'cross_college' ? cityFilter : undefined,
        year: selectedYear !== 'All Years' ? selectedYear : undefined,
        availability: selectedAvailability !== 'All Availability' ? selectedAvailability : undefined,
        skills: selectedSkills.join(','),
        search: searchQuery,
      })
      .then((res) => {
        if (isMounted) {
          setCandidates(res.candidates || []);
          setLoading(false);
        }
      })
      .catch(() => {
        // Local fallback in case network error occurs
        if (isMounted) {
          setCandidates(FALLBACK_DIRECTORY);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    discoveryMode,
    userCollegeId,
    collegeFilter,
    cityFilter,
    selectedYear,
    selectedAvailability,
    selectedSkills,
    searchQuery,
  ]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSkills([]);
    setSelectedYear('All Years');
    setSelectedAvailability('All Availability');
    setCollegeFilter('');
    setCityFilter('');
  };

  // Client-side filtering pass on loaded candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      // Exclude logged-in user from candidate list
      if (user && candidate.id === user.id) return false;

      // Mode check
      if (discoveryMode === 'same_college') {
        const matchesCollege = candidate.college_id === userCollegeId;
        if (!matchesCollege) return false;
      } else if (discoveryMode === 'cross_college') {
        const isDifferentCollege = candidate.college_id !== userCollegeId;
        if (!isDifferentCollege) return false;

        if (collegeFilter.trim()) {
          const q = collegeFilter.toLowerCase();
          const matchCol = (candidate.college_name || '').toLowerCase().includes(q);
          if (!matchCol) return false;
        }

        if (cityFilter.trim()) {
          const q = cityFilter.toLowerCase();
          const matchCity = (candidate.city || '').toLowerCase().includes(q);
          if (!matchCity) return false;
        }
      }

      // Academic year filter
      if (selectedYear !== 'All Years') {
        const q = selectedYear.toLowerCase();
        if (!(candidate.year_of_study || '').toLowerCase().includes(q)) return false;
      }

      // Availability filter
      if (selectedAvailability !== 'All Availability') {
        const q = selectedAvailability.toLowerCase();
        if (!(candidate.availability || '').toLowerCase().includes(q)) return false;
      }

      // Skills filter
      if (selectedSkills.length > 0) {
        const candidateSkills = (candidate.skills_offered || []).concat(candidate.skills || []);
        const hasAny = selectedSkills.some((s) =>
          candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
        );
        if (!hasAny) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const candidateSkills = (candidate.skills_offered || []).concat(candidate.skills || []);
        const match =
          candidate.full_name?.toLowerCase().includes(q) ||
          candidate.primary_role?.toLowerCase().includes(q) ||
          candidate.college_name?.toLowerCase().includes(q) ||
          candidateSkills.some((s) => s.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    candidates,
    user,
    discoveryMode,
    userCollegeId,
    collegeFilter,
    cityFilter,
    selectedYear,
    selectedAvailability,
    selectedSkills,
    searchQuery,
  ]);

  return (
    <div className="rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-6 shadow-sm">
      {/* Header with Title and Mode Segmented Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1e2a44]">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-tight">
            Smart Team Finder
          </h2>
          <p className="text-[14px] text-slate-400 mt-0.5">
            Discover student collaborators by verified skills, college eligibility, and availability.
          </p>
        </div>

        {/* Discovery Mode Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070b14] border border-[#1e2a44] self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setDiscoveryMode('same_college')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
              discoveryMode === 'same_college'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#111a33]'
            }`}
          >
            Same College
          </button>
          <button
            type="button"
            onClick={() => setDiscoveryMode('cross_college')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
              discoveryMode === 'cross_college'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#111a33]'
            }`}
          >
            Cross-College
          </button>
        </div>
      </div>

      {/* Mode Indicator Banner */}
      <div className="mt-4 px-3.5 py-2.5 rounded-xl border border-[#1e2a44] bg-[#070b14] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
        <div className="flex items-center gap-2 text-slate-300">
          <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
          {discoveryMode === 'same_college' ? (
            <span>
              Showing eligible teammates from <strong className="text-white font-medium">{userCollegeName}</strong> (ideal for SIH and single-college hackathons).
            </span>
          ) : (
            <span>
              Showing eligible teammates from <strong className="text-white font-medium">other colleges and universities</strong> (for open and inter-collegiate hackathons).
            </span>
          )}
        </div>
        <span className="text-teal-300 font-mono text-[12px] shrink-0">
          {filteredCandidates.length} eligible student{filteredCandidates.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Primary Filters Row */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 pt-4 pb-4 border-b border-[#1e2a44]">
        <div>
          <label className="block text-[12px] font-medium text-slate-300 mb-1">
            Search keywords or role:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              className="w-full rounded-xl border border-[#1e2a44] bg-[#070b14] pl-9 pr-3.5 py-2 text-[13px] text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. React, Vision, PyTorch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-slate-300 mb-1">
            Academic Year:
          </label>
          <select
            className="w-full rounded-xl border border-[#1e2a44] bg-[#070b14] px-3 py-2 text-[13px] text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y} className="bg-[#070b14] text-white">
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-slate-300 mb-1">
            Weekly Availability:
          </label>
          <select
            className="w-full rounded-xl border border-[#1e2a44] bg-[#070b14] px-3 py-2 text-[13px] text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
          >
            {AVAILABILITY_OPTIONS.map((a) => (
              <option key={a} value={a} className="bg-[#070b14] text-white">
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic 4th column based on discovery mode */}
        {discoveryMode === 'cross_college' ? (
          <div>
            <label className="block text-[12px] font-medium text-slate-300 mb-1">
              Filter by City:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                className="w-full rounded-xl border border-[#1e2a44] bg-[#070b14] pl-9 pr-3.5 py-2 text-[13px] text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Pune, Mumbai, Nagpur..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1e2a44] bg-[#111a33] hover:bg-[#182444] px-3 py-2 text-[13px] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Cross-College Specific Filter: College Name input + Reset row */}
      {discoveryMode === 'cross_college' && (
        <div className="grid gap-3.5 sm:grid-cols-2 pt-3 pb-3 border-b border-[#1e2a44]">
          <div>
            <label className="block text-[12px] font-medium text-slate-300 mb-1">
              Filter by College or University name:
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-[#1e2a44] bg-[#070b14] px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. IIT Bombay, BITS, VJTI, NIT..."
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1e2a44] bg-[#111a33] hover:bg-[#182444] px-4 py-2 text-[13px] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* Skill Filter Buttons */}
      <div className="py-3.5 border-b border-[#1e2a44]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[12px] font-medium text-slate-400">
            Filter by required technical skills:
          </span>
          {selectedSkills.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSkills([])}
              className="text-[12px] text-teal-400 hover:text-teal-300 cursor-pointer font-medium"
            >
              Reset skills ({selectedSkills.length})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map((skill) => {
            const active = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors cursor-pointer border ${
                  active
                    ? 'bg-teal-500 border-teal-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-[#111a33] border-[#1e2a44] text-slate-300 hover:border-teal-500/40 hover:text-white'
                }`}
              >
                {active ? <Check className="w-3 h-3 text-slate-950 font-bold" /> : <Plus className="w-3 h-3 text-slate-400" />}
                <span>{skill}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      <div className="pt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-[14px]">
            Loading student candidates...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-[#1e2a44] rounded-2xl p-8 bg-[#070b14]/50">
            <p className="text-[15px] font-medium text-slate-200">No candidates match your criteria</p>
            <p className="text-[13px] text-slate-400 mt-1">
              Try adjusting the filters or switch to{' '}
              <button
                type="button"
                onClick={() => setDiscoveryMode(discoveryMode === 'same_college' ? 'cross_college' : 'same_college')}
                className="text-teal-400 hover:text-teal-300 font-semibold underline cursor-pointer"
              >
                {discoveryMode === 'same_college' ? 'Cross-College mode' : 'Same College mode'}
              </button>
              .
            </p>
          </div>
        ) : (
          filteredCandidates.map((student) => {
            const initials = student.full_name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2);

            const displaySkills = (student.skills_offered || student.skills || []).slice(0, 4);

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-[#1e2a44] bg-[#070b14] p-4 flex flex-col justify-between hover:border-teal-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.full_name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#1e2a44] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-white tracking-tight truncate">
                        {student.full_name}
                      </h3>
                      <p className="text-[13px] text-teal-400 truncate font-medium">
                        {student.primary_role}
                      </p>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-400 truncate mt-0.5">
                        <span className="truncate">{student.college_name}</span>
                        {student.city && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="shrink-0">{student.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[13px] text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {student.bio || 'Active student builder collaborating on hackathons and production software.'}
                  </p>

                  {/* Metadata Row: Academic Year and Availability */}
                  <div className="mt-3 pt-2.5 border-t border-[#1e2a44] grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Academic Year</span>
                      <span className="text-slate-300 font-medium">{student.year_of_study || 'Student'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Availability</span>
                      <span className="text-slate-300 truncate block">{student.availability || 'Available'}</span>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="mt-2.5 pt-2 border-t border-[#1e2a44]/80 text-[12px] text-slate-400">
                    <span className="text-slate-400 font-medium">Skills: </span>
                    <span className="text-slate-300">{displaySkills.join(' · ')}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-[#1e2a44] flex items-center justify-between text-[13px]">
                  <Link
                    to={`/users/${student.id}`}
                    className="text-slate-300 hover:text-white font-medium transition-colors"
                  >
                    View Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentForConnect(student)}
                    className="rounded-lg bg-teal-500 hover:bg-teal-400 px-3.5 py-1 text-slate-950 text-[13px] font-semibold shadow-sm shadow-teal-500/10 transition-colors cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Connect / Swap Modal */}
      {selectedStudentForConnect && (
        <SendSwapModal
          recipient={selectedStudentForConnect}
          onClose={() => setSelectedStudentForConnect(null)}
          onSuccess={() => setSelectedStudentForConnect(null)}
        />
      )}
    </div>
  );
}
