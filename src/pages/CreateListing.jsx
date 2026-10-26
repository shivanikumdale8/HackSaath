import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, Check, Plus, AlertCircle, ShieldCheck, Users, Search, Building } from 'lucide-react';
import ModeToggle from '../components/ModeToggle';
import { api } from '../lib/api';
import { compressImage } from '../utils/imageCompressor';

const AVAILABLE_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'AI/ML Engineer',
  'Mobile Developer',
  'Cloud / DevOps Engineer',
  'IoT Specialist',
  'Product / Pitch Lead',
  'Data Scientist',
];

const HACKATHON_TRACKS = [
  'AI / Machine Learning',
  'Healthcare & MedTech',
  'FinTech & Web3',
  'Education & EdTech',
  'Sustainability & CleanTech',
  'Cybersecurity & Privacy',
  'Agriculture & Rural Innovation',
  'IoT & Embedded',
  'Open Innovation',
];

const KNOWN_HACKATHONS = [
  {
    id: 'sih-2026',
    name: 'Smart India Hackathon 2026 (SIH)',
    theme: 'Agriculture & Rural Innovation',
    capacity: '6',
    policy: 'same_institution',
    problem_statements: ['SIH1420', 'SIH1421', 'SIH1422'],
    ruleNote: 'Official SIH Mandate: 6 members strictly required from the same college. At least 1 female teammate is compulsory.',
  },
  {
    id: 'technovanza-2026',
    name: 'VJTI Technovanza HackSprint v8',
    theme: 'FinTech & Web3',
    capacity: '3',
    policy: 'cross_institution',
    problem_statements: ['TECH-01'],
    ruleNote: 'Cross-college teams permitted. Minimum 2, maximum 4 members.',
  },
  {
    id: 'cleantech-2026',
    name: 'CleanTech Global Hackathon 2026',
    theme: 'Sustainability & CleanTech',
    capacity: '4',
    policy: 'cross_institution',
    problem_statements: [],
    ruleNote: 'International climate sprint. Teams of 3-5 members from any universities.',
  },
  {
    id: 'mindspark-2026',
    name: 'MindSpark AI Challenge 2026',
    theme: 'AI / Machine Learning',
    capacity: '3',
    policy: 'unverified',
    problem_statements: [],
    ruleNote: 'Collegiate AI challenge. Cross-college allowed, pending verification.',
  },
];

const emptyForm = {
  title: '',
  description: '',
  tags: '',
  budget: '',
  deadline: '',
  skill_offered: '',
  skill_wanted: '',
  people_required: '4',
  hackathon_id: '',
  hackathon_name: '',
  hackathon_theme: 'AI / Machine Learning',
  institution_policy: 'same_institution', // same_institution | cross_institution | unverified
  problem_statement_code: '',
  required_roles: ['Frontend Developer', 'Backend Developer'],
  team_skills_needed: '',
};

export default function CreateListing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('team');
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const toggleRole = (role) => {
    setForm((prev) => {
      const exists = prev.required_roles.includes(role);
      const nextRoles = exists
        ? prev.required_roles.filter((r) => r !== role)
        : [...prev.required_roles, role];
      return { ...prev, required_roles: nextRoles };
    });
  };

  const handleSelectKnownHackathon = (e) => {
    const val = e.target.value;
    if (!val) {
      setForm((prev) => ({ ...prev, hackathon_id: '', hackathon_name: '' }));
      return;
    }

    const matched = KNOWN_HACKATHONS.find((h) => h.id === val);
    if (matched) {
      setForm((prev) => ({
        ...prev,
        hackathon_id: matched.id,
        hackathon_name: matched.name,
        hackathon_theme: matched.theme,
        people_required: matched.capacity,
        institution_policy: matched.policy,
        problem_statement_code: matched.problem_statements[0] || '',
      }));
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const compressedDataUrl = await compressImage(file);
      setImagePreview(compressedDataUrl);
      setImageBase64(compressedDataUrl);
    } catch (err) {
      setError(err.message || 'Failed to process image');
    }
  };

  const buildPayload = () => {
    const base = {
      mode,
      title: form.title.trim(),
      description: form.description.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      image_url: imageBase64,
    };

    if (mode === 'freelance') {
      return {
        ...base,
        budget: Number(form.budget),
        deadline: new Date(form.deadline).toISOString(),
      };
    }

    if (mode === 'exchange') {
      return {
        ...base,
        skill_offered: form.skill_offered.trim(),
        skill_wanted: form.skill_wanted.trim(),
      };
    }

    if (mode === 'team') {
      const skillsNeeded = form.team_skills_needed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        ...base,
        people_required: Number(form.people_required || 4),
        deadline: new Date(form.deadline || Date.now() + 14 * 86400000).toISOString(),
        hackathon_id: form.hackathon_id || undefined,
        hackathon_name: form.hackathon_name.trim(),
        hackathon_theme: form.hackathon_theme,
        problem_statement_code: form.problem_statement_code || undefined,
        institution_policy: form.institution_policy,
        required_roles: form.required_roles,
        team_skills_needed: skillsNeeded,
        tags: [...new Set([...base.tags, ...skillsNeeded, form.hackathon_theme])],
      };
    }
    return base;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'team') {
      if (!form.hackathon_name.trim()) {
        setError('Please specify the Hackathon or Competition name.');
        return;
      }
      if (form.required_roles.length === 0) {
        setError('Please select at least one role your team needs.');
        return;
      }
    }

    setSaving(true);
    try {
      const { listing } = await api.listings.create(buildPayload());
      navigate(`/listings/${listing.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentKnown = KNOWN_HACKATHONS.find((h) => h.id === form.hackathon_id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create a Team or Listing</h1>
        <p className="mt-1 text-sm text-slate-400">
          Form an eligible hackathon squad, post a technical task, or swap skills with peers.
        </p>
      </div>

      <div className="mb-6">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-800 bg-[#111420] p-6 shadow-sm">
        {mode === 'team' && (
          <div className="space-y-4">
            {/* Find Existing Squad First Notice */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-xs text-indigo-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Find Existing Squads First</p>
                <p className="mt-0.5 leading-relaxed text-slate-300">
                  Before creating a new team, check if an existing team is already looking for your role. Joining an active squad prevents duplicate teams for the same challenge.
                </p>
                <Link
                  to="/browse?mode=team"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Browse Existing Teams →
                </Link>
              </div>
            </div>

            {/* Hackathon Preset Selector */}
            <div className="rounded-xl border border-slate-800 bg-[#0c0e16] p-4 space-y-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>Tournament & Eligibility Setup</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Verified Hackathon Preset:
                </label>
                <select
                  value={form.hackathon_id}
                  onChange={handleSelectKnownHackathon}
                  className="w-full rounded-lg border border-slate-800 bg-[#141724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Custom / Other Hackathon --</option>
                  {KNOWN_HACKATHONS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentKnown?.ruleNote && (
                <div className="p-3 rounded-lg border border-amber-900/40 bg-amber-950/20 text-xs text-amber-200">
                  <span className="font-semibold block text-amber-300 mb-0.5">Eligibility Guideline:</span>
                  {currentKnown.ruleNote}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hackathon_name" className="block text-xs font-medium text-slate-300 mb-1">
                    Hackathon Name *
                  </label>
                  <input
                    id="hackathon_name"
                    required
                    value={form.hackathon_name}
                    onChange={update('hackathon_name')}
                    placeholder="e.g. Smart India Hackathon 2026"
                    className="w-full rounded-lg border border-slate-800 bg-[#141724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="hackathon_theme" className="block text-xs font-medium text-slate-300 mb-1">
                    Track / Theme *
                  </label>
                  <select
                    id="hackathon_theme"
                    value={form.hackathon_theme}
                    onChange={update('hackathon_theme')}
                    className="w-full rounded-lg border border-slate-800 bg-[#141724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {HACKATHON_TRACKS.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Institution Eligibility Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Team Institution Eligibility *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'same_institution', label: 'Same college only', desc: 'All members from your college (SIH default)' },
                    { id: 'cross_institution', label: 'Multiple colleges allowed', desc: 'Open cross-collegiate squad' },
                    { id: 'unverified', label: 'Eligibility not specified', desc: 'Flexible / casual tournament' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, institution_policy: p.id }))}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer text-xs ${
                        form.institution_policy === p.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-[#141724] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold block text-slate-200">{p.label}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem statement code (if applicable) */}
              {currentKnown?.problem_statements?.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Problem Statement Code:
                  </label>
                  <select
                    value={form.problem_statement_code}
                    onChange={update('problem_statement_code')}
                    className="w-full rounded-lg border border-slate-800 bg-[#141724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- General / No specific code --</option>
                    {currentKnown.problem_statements.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Roles Needed */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Roles Needed in Squad * <span className="font-normal text-slate-500">(Select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ROLES.map((role) => {
                    const selected = form.required_roles.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-[#141724] text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {selected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        <span>{role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="team_skills_needed" className="block text-xs font-medium text-slate-300 mb-1">
                  Target Technologies / Skills <span className="font-normal text-slate-500">(comma separated)</span>
                </label>
                <input
                  id="team_skills_needed"
                  value={form.team_skills_needed}
                  onChange={update('team_skills_needed')}
                  placeholder="e.g. PyTorch, FastAPI, Figma, React, ESP32"
                  className="w-full rounded-lg border border-slate-800 bg-[#141724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-xs font-medium text-slate-300 mb-1">
            {mode === 'team' ? 'Squad Project Title *' : 'Listing Title *'}
          </label>
          <input
            id="title"
            required
            value={form.title}
            onChange={update('title')}
            placeholder={
              mode === 'team'
                ? 'e.g. SIH 2026: AgriScan Automated Drone Foliar Disease Squad'
                : mode === 'freelance'
                ? 'e.g. Design a vector poster for campus tech fest'
                : 'e.g. Teach Python in exchange for Figma UI design'
            }
            className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-medium text-slate-300 mb-1">
            {mode === 'team' ? 'Project Problem Statement & Squad Goals *' : 'Description *'}
          </label>
          <textarea
            id="description"
            rows={4}
            required
            value={form.description}
            onChange={update('description')}
            placeholder={
              mode === 'team'
                ? 'Describe what challenge you are tackling, existing repository progress, and expectations from teammates...'
                : 'Provide details about deliverables, tools, and requirements...'
            }
            className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {mode === 'freelance' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget" className="block text-xs font-medium text-slate-300 mb-1">
                Budget (₹) *
              </label>
              <input
                id="budget"
                type="number"
                min={1}
                required
                value={form.budget}
                onChange={update('budget')}
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block text-xs font-medium text-slate-300 mb-1">
                Deadline *
              </label>
              <input
                id="deadline"
                type="date"
                required
                value={form.deadline}
                onChange={update('deadline')}
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        ) : mode === 'exchange' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="skill_offered" className="block text-xs font-medium text-slate-300 mb-1">
                Skill you can teach *
              </label>
              <input
                id="skill_offered"
                required
                value={form.skill_offered}
                onChange={update('skill_offered')}
                placeholder="e.g. Python, Machine Learning"
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="skill_wanted" className="block text-xs font-medium text-slate-300 mb-1">
                Skill you want to learn *
              </label>
              <input
                id="skill_wanted"
                required
                value={form.skill_wanted}
                onChange={update('skill_wanted')}
                placeholder="e.g. Figma, UI Prototyping"
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="people_required" className="block text-xs font-medium text-slate-300 mb-1">
                Target Squad Capacity *
              </label>
              <select
                id="people_required"
                value={form.people_required}
                onChange={update('people_required')}
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="2">2 Members (Duo)</option>
                <option value="3">3 Members (Trio)</option>
                <option value="4">4 Members (Standard Quad)</option>
                <option value="5">5 Members</option>
                <option value="6">6 Members (SIH Official Mandatory)</option>
              </select>
            </div>
            <div>
              <label htmlFor="deadline" className="block text-xs font-medium text-slate-300 mb-1">
                Hackathon Submission / Roster Lock Date *
              </label>
              <input
                id="deadline"
                type="date"
                required
                value={form.deadline}
                onChange={update('deadline')}
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="tags" className="block text-xs font-medium text-slate-300 mb-1">
            General Tags <span className="font-normal text-slate-500">(comma separated)</span>
          </label>
          <input
            id="tags"
            value={form.tags}
            onChange={update('tags')}
            placeholder="hackathon, open-source, urgent"
            className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Creating…' : mode === 'team' ? 'Create Hackathon Squad' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
