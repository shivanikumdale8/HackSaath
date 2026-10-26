import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Eye,
  Camera,
  GraduationCap,
  Building2,
  Star,
  User,
  FileText,
  Settings,
  Award,
  Briefcase,
  X,
  CreditCard,
  Plus,
  FolderOpen,
  HelpCircle,
  Mail,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import EditListingModal from '../components/EditListingModal';
import ConfirmModal from '../components/ConfirmModal';
import ImageModal from '../components/ImageModal';
import { compressImage } from '../utils/imageCompressor';

/**
 * React page component for Profile view with responsive sidebar navigation.
 * @author = kruthinraj
 * @date = 2026-08-22
 */

const toText = (list) => (list ?? []).join(', ');
const toList = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const Stars = ({ rating }) => (
  <span className="inline-flex gap-1 items-center">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-4 h-4 ${
          n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
        }`}
      />
    ))}
  </span>
);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Active tab in navigation: 'profile' | 'listings' | 'reviews' | 'account'
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    college_name: user?.college_name ?? '',
    roll_number: user?.roll_number ?? '',
    bio: user?.bio ?? '',
    skills_offered: toText(user?.skills_offered),
    skills_wanted: toText(user?.skills_wanted),
    upi_id: user?.upi_id || (user?.id ? localStorage.getItem(`skillbridge_upi_${user.id}`) : '') || '',
    primary_role: user?.primary_role || 'Frontend Developer',
    experience_level: user?.experience_level || 'Intermediate',
    year_of_study: user?.year_of_study || '3rd Year',
    availability: user?.availability || 'Actively Seeking Team',
    github_url: user?.github_url || '',
    portfolio_url: user?.portfolio_url || '',
    interests: toText(user?.interests),
  });

  const [projects, setProjects] = useState(user?.projects || []);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    github_url: '',
    demo_url: '',
    tech_stack: '',
  });
  const [showAddProject, setShowAddProject] = useState(false);

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [listingFilter, setListingFilter] = useState('all'); // 'all' | 'open' | 'completed'
  const [editingListing, setEditingListing] = useState(null);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Sync form when user updates
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? '',
        college_name: user.college_name ?? '',
        roll_number: user.roll_number ?? '',
        bio: user.bio ?? '',
        skills_offered: toText(user.skills_offered),
        skills_wanted: toText(user.skills_wanted),
        upi_id: user.upi_id || localStorage.getItem(`skillbridge_upi_${user.id}`) || '',
        primary_role: user.primary_role || 'Frontend Developer',
        experience_level: user.experience_level || 'Intermediate',
        year_of_study: user.year_of_study || '3rd Year',
        availability: user.availability || 'Actively Seeking Team',
        github_url: user.github_url || '',
        portfolio_url: user.portfolio_url || '',
        interests: toText(user.interests),
      });
      setProjects(user.projects || []);
    }
  }, [user]);

  const initials = (user?.full_name || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Load reviews and listings
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [reviewData, listingsData] = await Promise.all([
        api.reviews.forUser(user.id).catch(() => ({ reviews: [] })),
        api.listings.forOwner(user.id).catch(() => ({ listings: [] })),
      ]);
      setReviews(reviewData.reviews || []);
      setMyListings(listingsData.listings || []);
    } catch (_) {
      // silently ignore
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setError('');
    try {
      const compressedDataUrl = await compressImage(file, 100);
      const { user: updated } = await api.users.updateAvatar(compressedDataUrl);
      setUser(updated);
      setStatus('Avatar updated successfully.');
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setSaving(true);

    try {
      if (form.upi_id) {
        localStorage.setItem(`skillbridge_upi_${user.id}`, form.upi_id.trim());
      }
      const patch = {
        full_name: form.full_name.trim(),
        college_name: form.college_name?.trim() || '',
        roll_number: form.roll_number?.trim() || '',
        bio: form.bio.trim(),
        skills_offered: toList(form.skills_offered),
        skills_wanted: toList(form.skills_wanted),
        primary_role: form.primary_role,
        experience_level: form.experience_level,
        year_of_study: form.year_of_study,
        availability: form.availability,
        github_url: form.github_url.trim(),
        portfolio_url: form.portfolio_url.trim(),
        interests: toList(form.interests),
        projects,
      };
      if (form.upi_id) {
        patch.upi_id = form.upi_id.trim();
      }
      const { user: updated } = await api.users.updateMe(patch);
      setUser(updated);
      setStatus('Profile updated successfully.');
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    const project = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      github_url: newProject.github_url.trim(),
      demo_url: newProject.demo_url.trim(),
      tech_stack: newProject.tech_stack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setProjects((prev) => [...prev, project]);
    setNewProject({ title: '', description: '', github_url: '', demo_url: '', tech_stack: '' });
    setShowAddProject(false);
  };

  const handleRemoveProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    try {
      await api.listings.delete(listingToDelete.id);
      setMyListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      setListingToDelete(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredListings = myListings.filter((l) => {
    if (listingFilter === 'open') return l.status === 'open';
    if (listingFilter === 'completed') return l.status === 'completed';
    return true; // 'all'
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cw-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-cw-text-1">Settings &amp; Profile</h1>
          <p className="text-sm text-cw-text-3 mt-0.5">
            Manage your personal profile, active gigs, peer reviews, and security credentials.
          </p>
        </div>
        <Link
          to={`/users/${user?.id}`}
          className="btn-ghost text-xs py-2 px-3 border border-cw-border rounded-xl flex items-center gap-1.5 text-cw-text-2 hover:text-cw-text-1 w-fit"
          title="See how other students see your profile"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Public Profile</span>
          <ExternalLink className="w-3 h-3 text-cw-text-3" />
        </Link>
      </div>

      {/* Main Grid: Left Sidebar Navigation + Right Content Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <aside className="md:col-span-1 space-y-3">
          {/* User Glance Card */}
          <div className="card p-4 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="avatar-xl">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title="Change photo"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {avatarUploading ? (
                  <span className="text-[10px]">Uploading…</span>
                ) : (
                  <span className="text-xs font-medium inline-flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <h3 className="font-bold text-cw-text-1 text-base mt-2 truncate max-w-full">
              {user?.full_name || 'Student'}
            </h3>
            <p className="text-xs text-cw-text-3 truncate max-w-full">{user?.email}</p>

            {/* Verification Badges */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 w-full">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Email Verified
              </span>
              {user?.is_college_verified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <GraduationCap className="w-3 h-3 text-indigo-400" />
                  <span>College Verified</span>
                </span>
              ) : (
                <span
                  title="College verification is optional and can be completed anytime in Account & Security"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cw-bg-alt text-cw-text-3 border border-cw-border"
                >
                  <GraduationCap className="w-3 h-3 text-cw-text-3" />
                  <span>College Unverified (Optional)</span>
                </span>
              )}
            </div>

            {user?.college_name && (
              <p className="text-[11px] text-cw-accent font-medium mt-1.5 truncate max-w-full px-2 flex items-center justify-center gap-1" title={user.college_name}>
                <Building2 className="w-3 h-3 text-cw-accent shrink-0" />
                <span className="truncate">{user.college_name}</span>
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-cw-border/70 flex items-center justify-center gap-4 w-full text-xs">
              <div>
                <span className="font-bold text-cw-text-1 text-sm flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{Number(user?.rating_average ?? 0).toFixed(1)}</span>
                </span>
                <span className="text-[11px] text-cw-text-3">Trust Score</span>
              </div>
              <div className="w-px h-6 bg-cw-border/70" />
              <div>
                <span className="font-bold text-cw-text-1 text-sm block">{reviews.length}</span>
                <span className="text-[11px] text-cw-text-3">Reviews</span>
              </div>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="card p-1.5 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-cw-accent text-white shadow-sm font-semibold'
                  : 'text-cw-text-2 hover:bg-cw-bg-alt hover:text-cw-text-1'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'listings'
                  ? 'bg-cw-accent text-white shadow-sm font-semibold'
                  : 'text-cw-text-2 hover:bg-cw-bg-alt hover:text-cw-text-1'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>My Listings</span>
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'listings' ? 'bg-white/20 text-white' : 'bg-cw-bg-alt text-cw-text-3'
                }`}
              >
                {myListings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'reviews'
                  ? 'bg-cw-accent text-white shadow-sm font-semibold'
                  : 'text-cw-text-2 hover:bg-cw-bg-alt hover:text-cw-text-1'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-cw-bg-alt text-cw-text-3'
                }`}
              >
                {reviews.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'account'
                  ? 'bg-cw-accent text-white shadow-sm font-semibold'
                  : 'text-cw-text-2 hover:bg-cw-bg-alt hover:text-cw-text-1'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Account &amp; Security</span>
              </span>
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="md:col-span-3 space-y-6">
          {/* TAB 1: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleSaveProfile} className="card space-y-5 p-6">
                <div className="flex items-center justify-between pb-3 border-b border-cw-border">
                  <div>
                    <h2 className="text-lg font-bold text-cw-text-1">Personal Profile</h2>
                    <p className="text-xs text-cw-text-3">This information is shown to campus peers.</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="full_name" className="label font-semibold text-cw-text-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    required
                    minLength={2}
                    value={form.full_name}
                    onChange={update('full_name')}
                    placeholder="Your legal or preferred student name"
                    className="field text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="college_name" className="label font-semibold text-cw-text-1">
                      College / University Name <span className="font-normal text-cw-text-3">(Optional)</span>
                    </label>
                    <input
                      id="college_name"
                      value={form.college_name}
                      onChange={update('college_name')}
                      placeholder="e.g. COEP Technological University, VJTI Mumbai, PICT Pune"
                      className="field text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="roll_number" className="label font-semibold text-cw-text-1">
                      Student ID / Roll Number <span className="font-normal text-cw-text-3">(Optional)</span>
                    </label>
                    <input
                      id="roll_number"
                      value={form.roll_number}
                      onChange={update('roll_number')}
                      placeholder="e.g. CS2024-042"
                      className="field text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="label font-semibold text-cw-text-1">
                    About You (Bio)
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={form.bio}
                    onChange={update('bio')}
                    placeholder="Tell other students about yourself, your department, major, or hobbies..."
                    className="field text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="skills_offered" className="label font-semibold text-cw-text-1">
                      Skills You Can Teach <span className="font-normal text-cw-text-3">(comma separated)</span>
                    </label>
                    <input
                      id="skills_offered"
                      value={form.skills_offered}
                      onChange={update('skills_offered')}
                      placeholder="Python, UI Design, Calculus"
                      className="field text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="skills_wanted" className="label font-semibold text-cw-text-1">
                      Skills You Want to Learn <span className="font-normal text-cw-text-3">(comma separated)</span>
                    </label>
                    <input
                      id="skills_wanted"
                      value={form.skills_wanted}
                      onChange={update('skills_wanted')}
                      placeholder="Figma, Guitar, Public Speaking"
                      className="field text-sm"
                    />
                  </div>
                </div>

                {/* Hackathon Role & Team Finder Section */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/40 p-4 dark:bg-indigo-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-500" />
                        <span>Hackathon &amp; Team Matching Profile</span>
                      </h3>
                      <p className="text-xs text-indigo-700/80 dark:text-indigo-300 mt-0.5">
                        These details power the deterministic matching engine when teams search for members.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="primary_role" className="label font-semibold text-cw-text-1">
                        Primary Role *
                      </label>
                      <select
                        id="primary_role"
                        value={form.primary_role}
                        onChange={update('primary_role')}
                        className="field text-sm bg-white dark:bg-cw-surface"
                      >
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="AI/ML Engineer">AI/ML Engineer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Mobile Developer">Mobile Developer</option>
                        <option value="Cloud / DevOps Engineer">Cloud / DevOps Engineer</option>
                        <option value="Product / Pitch Lead">Product / Pitch Lead</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="experience_level" className="label font-semibold text-cw-text-1">
                        Experience Level
                      </label>
                      <select
                        id="experience_level"
                        value={form.experience_level}
                        onChange={update('experience_level')}
                        className="field text-sm bg-white dark:bg-cw-surface"
                      >
                        <option value="Beginner">Beginner (1st Hackathon / Learning)</option>
                        <option value="Intermediate">Intermediate (Built projects, solid fundamentals)</option>
                        <option value="Advanced">Advanced (Production code, multiple hackathons)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="year_of_study" className="label font-semibold text-cw-text-1">
                        Year of Study
                      </label>
                      <select
                        id="year_of_study"
                        value={form.year_of_study}
                        onChange={update('year_of_study')}
                        className="field text-sm bg-white dark:bg-cw-surface"
                      >
                        <option value="1st Year">1st Year Undergraduate</option>
                        <option value="2nd Year">2nd Year Undergraduate</option>
                        <option value="3rd Year">3rd Year Undergraduate</option>
                        <option value="4th Year">4th Year Undergraduate</option>
                        <option value="Postgraduate">Postgraduate / Masters / PhD</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="availability" className="label font-semibold text-cw-text-1">
                        Hackathon Availability *
                      </label>
                      <select
                        id="availability"
                        value={form.availability}
                        onChange={update('availability')}
                        className="field text-sm bg-white dark:bg-cw-surface font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        <option value="Actively Seeking Team">Actively Seeking Team</option>
                        <option value="Available (Weekend Sprint)">Available (Weekend Sprint)</option>
                        <option value="Available (15-20 hrs/wk)">Available (15-20 hrs/wk)</option>
                        <option value="Team Full / Unavailable">Team Full / Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="github_url" className="label font-semibold text-cw-text-1">
                        GitHub Profile URL or Username
                      </label>
                      <input
                        id="github_url"
                        value={form.github_url}
                        onChange={update('github_url')}
                        placeholder="https://github.com/yourusername"
                        className="field text-sm bg-white dark:bg-cw-surface"
                      />
                    </div>

                    <div>
                      <label htmlFor="portfolio_url" className="label font-semibold text-cw-text-1">
                        Portfolio / Personal Website
                      </label>
                      <input
                        id="portfolio_url"
                        value={form.portfolio_url}
                        onChange={update('portfolio_url')}
                        placeholder="https://yourname.dev"
                        className="field text-sm bg-white dark:bg-cw-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="interests" className="label font-semibold text-cw-text-1">
                      Hackathon Track Interests <span className="font-normal text-cw-text-3">(comma separated)</span>
                    </label>
                    <input
                      id="interests"
                      value={form.interests}
                      onChange={update('interests')}
                      placeholder="e.g. AI / Machine Learning, Healthcare, FinTech, Sustainability, Web3"
                      className="field text-sm bg-white dark:bg-cw-surface"
                    />
                  </div>
                </div>

                {/* Project Portfolio Showcase Manager */}
                <div className="rounded-xl border border-cw-border bg-cw-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-cw-text-1 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-cw-accent" />
                        <span>Project Portfolio Showcase ({projects.length})</span>
                      </h3>
                      <p className="text-xs text-cw-text-3">
                        Highlight repos and live applications you have built to prove skill readiness to team leads.
                      </p>
                    </div>
                    {!showAddProject && (
                      <button
                        type="button"
                        onClick={() => setShowAddProject(true)}
                        className="btn-ghost text-xs py-1.5 px-3 border border-cw-border"
                      >
                        + Add Project
                      </button>
                    )}
                  </div>

                  {showAddProject && (
                    <div className="rounded-lg border border-indigo-500/20 bg-cw-bg-alt/80 p-3 space-y-3">
                      <h4 className="text-xs font-bold text-cw-text-1">New Portfolio Project</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs">Project Title *</label>
                          <input
                            required
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            placeholder="e.g. MedAI Diagnostics"
                            className="field text-xs"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Tech Stack (comma separated)</label>
                          <input
                            value={newProject.tech_stack}
                            onChange={(e) => setNewProject({ ...newProject, tech_stack: e.target.value })}
                            placeholder="e.g. Python, PyTorch, FastAPI, React"
                            className="field text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label text-xs">Description</label>
                        <textarea
                          rows={2}
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          placeholder="Briefly describe what this project does and key achievements..."
                          className="field text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs">GitHub Repository URL</label>
                          <input
                            value={newProject.github_url}
                            onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
                            placeholder="https://github.com/username/repo"
                            className="field text-xs"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Live Demo URL (optional)</label>
                          <input
                            value={newProject.demo_url}
                            onChange={(e) => setNewProject({ ...newProject, demo_url: e.target.value })}
                            placeholder="https://my-app.vercel.app"
                            className="field text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddProject(false)}
                          className="btn-ghost text-xs py-1 px-3"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddProject}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Add to Portfolio
                        </button>
                      </div>
                    </div>
                  )}

                  {projects.length === 0 ? (
                    <p className="text-xs text-cw-text-3 italic py-2 text-center">
                      No showcase projects added yet. Click "+ Add Project" above.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {projects.map((proj) => (
                        <div key={proj.id} className="rounded-lg border border-cw-border bg-cw-bg-alt/50 p-2.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-xs text-cw-text-1">{proj.title}</h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveProject(proj.id)}
                                className="text-xs text-red-500 hover:text-red-700 p-0.5 rounded"
                                title="Remove project"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {proj.description && (
                              <p className="text-[11px] text-cw-text-2 mt-0.5 line-clamp-2">{proj.description}</p>
                            )}
                            {proj.tech_stack?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {proj.tech_stack.map((t) => (
                                  <span key={t} className="rounded bg-cw-surface px-1.5 py-0.2 text-[9px] font-medium text-cw-text-3 border border-cw-border">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campus Payment Details (UPI) */}
                <div className="rounded-xl border border-cw-border/80 bg-cw-bg-alt/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cw-accent shrink-0" />
                    <div>
                      <label htmlFor="upi_id" className="label !mb-0 font-bold text-cw-text-1">
                        Campus UPI ID <span className="font-normal text-cw-text-3">(PhonePe / GPay / Paytm)</span>
                      </label>
                      <p className="text-[11px] text-cw-text-3 mt-0.5">
                        Used to receive direct freelance task settlements from students who hire you.
                      </p>
                    </div>
                  </div>
                  <input
                    id="upi_id"
                    value={form.upi_id || ''}
                    onChange={update('upi_id')}
                    placeholder="e.g. username@okhdfcbank, 9876543210@paytm"
                    className="field text-sm bg-cw-surface"
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 p-3 text-xs">
                    {error}
                  </p>
                )}
                {status && (
                  <p className="rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 p-3 text-xs">
                    {status}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary py-2 px-6 text-sm font-semibold">
                    {saving ? 'Saving changes…' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MY LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cw-border">
                <div>
                  <h2 className="text-lg font-bold text-cw-text-1">My Listings ({myListings.length})</h2>
                  <p className="text-xs text-cw-text-3">Manage all tasks, freelance gigs, and skill swaps you posted.</p>
                </div>
                <Link to="/new" className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Post</span>
                </Link>
              </div>

              {/* Status Filter Pills */}
              <div className="flex gap-2 text-xs">
                {[
                  { key: 'all', label: 'All Posts', count: myListings.length },
                  { key: 'open', label: 'Open Gigs', count: myListings.filter((l) => l.status === 'open').length },
                  { key: 'completed', label: 'Completed', count: myListings.filter((l) => l.status === 'completed').length },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setListingFilter(item.key)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      listingFilter === item.key
                        ? 'bg-cw-accent text-white shadow-sm'
                        : 'bg-cw-surface border border-cw-border text-cw-text-2 hover:text-cw-text-1'
                    }`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>

              {filteredListings.length === 0 ? (
                <div className="card text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-cw-text-2">
                    {listingFilter === 'all'
                      ? "You haven't posted any listings yet."
                      : `No ${listingFilter} listings found.`}
                  </p>
                  <Link to="/new" className="btn-secondary text-xs py-1.5 px-4 inline-block">
                    Post your first listing
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border hover:border-cw-accent/40 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              listing.mode === 'freelance'
                                ? 'bg-freelance/10 text-freelance'
                                : listing.mode === 'team'
                                ? 'bg-indigo-500/10 text-indigo-500'
                                : 'bg-exchange/10 text-exchange'
                            }`}
                          >
                            {listing.mode}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              listing.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : listing.status === 'open'
                                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                : 'bg-cw-bg-alt text-cw-text-3 border border-cw-border'
                            }`}
                          >
                            {listing.status.replace('_', ' ')}
                          </span>
                          {listing.mode === 'freelance' && (
                            <span className="text-xs font-bold text-cw-text-1">₹{listing.budget}</span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-cw-text-1 truncate">{listing.title}</h3>
                        <p className="text-xs text-cw-text-3 line-clamp-1">{listing.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-cw-border/60">
                        <Link
                          to={`/listings/${listing.id}`}
                          className="btn-ghost text-xs py-1.5 px-3 border border-cw-border rounded-lg text-cw-text-1 hover:bg-cw-bg-alt"
                        >
                          View
                        </Link>
                        {listing.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => setEditingListing(listing)}
                            className="btn-ghost text-xs py-1.5 px-3 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setListingToDelete(listing)}
                          className="btn-ghost text-xs py-1.5 px-3 border border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS & REPUTATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-cw-border">
                <div>
                  <h2 className="text-lg font-bold text-cw-text-1">Peer Reviews &amp; Trust Score</h2>
                  <p className="text-xs text-cw-text-3">Reviews left by other campus students after completing tasks.</p>
                </div>
              </div>

              {/* Big Trust Score Banner */}
              <div className="card p-6 bg-gradient-to-br from-cw-surface to-cw-bg-alt/50 border flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-cw-text-1">
                        {Number(user?.rating_average ?? 0).toFixed(1)}
                      </span>
                      <span className="text-sm text-cw-text-3 font-medium">/ 5.0</span>
                    </div>
                    <div className="mt-1">
                      <Stars rating={Math.round(user?.rating_average ?? 0)} />
                    </div>
                  </div>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-cw-border pt-4 sm:pt-0 sm:pl-8 text-center sm:text-left w-full sm:w-auto">
                  <p className="text-2xl font-bold text-cw-text-1">{reviews.length}</p>
                  <p className="text-xs text-cw-text-3">Total Verified Reviews</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                    100% Campus Authenticated
                  </p>
                </div>
              </div>

              {/* Reviews Stream */}
              {reviews.length === 0 ? (
                <div className="card text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cw-text-2">No reviews yet.</p>
                    <p className="text-xs text-cw-text-3 max-w-sm mx-auto mt-1">
                      Complete freelance gigs or skill swaps with other students to start earning peer reviews and building your campus reputation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="card p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Stars rating={review.rating} />
                          <span className="text-xs font-bold text-cw-text-1">{review.rating} / 5</span>
                        </div>
                        <span className="text-xs text-cw-text-3">{formatDate(review.created_at)}</span>
                      </div>

                      {review.comment && (
                        <p className="text-sm text-cw-text-1 whitespace-pre-line leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}

                      {review.image_url && (
                        <div className="pt-1">
                          <img
                            src={review.image_url}
                            alt="Review attachment"
                            className="max-h-36 rounded-xl border border-cw-border object-cover cursor-zoom-in hover:opacity-90 transition"
                            onClick={() => setFullscreenImage(review.image_url)}
                          />
                        </div>
                      )}

                      {review.listing_id && (
                        <div className="pt-2 border-t border-cw-border/60">
                          <Link
                            to={`/listings/${review.listing_id}`}
                            className="text-xs font-semibold text-cw-accent hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Task Details</span>
                            <span>→</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              <AccountSecuritySection user={user} setUser={setUser} />
            </div>
          )}
        </main>
      </div>

      {/* Edit Listing Modal */}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onUpdated={() => {
            setEditingListing(null);
            loadProfileData();
          }}
        />
      )}

      {/* Delete Listing Confirmation */}
      {listingToDelete && (
        <ConfirmModal
          title="Delete Listing"
          message={`Are you sure you want to permanently delete "${listingToDelete.title}"? This cannot be undone.`}
          confirmText="Delete Post"
          isDestructive={true}
          onConfirm={handleDeleteListing}
          onClose={() => setListingToDelete(null)}
        />
      )}

      {/* Fullscreen Image Preview */}
      {fullscreenImage && (
        <ImageModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}
    </div>
  );
}

/**
 * Account & Security section: Distinct Email & College verification, optional college OTP, and password change.
 */
function AccountSecuritySection({ user, setUser }) {
  // Password OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [code, setCode] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [otpConfirm, setOtpConfirm] = useState('');
  const [otpStatus, setOtpStatus] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);

  // College Verification State
  const [collegeEmailInput, setCollegeEmailInput] = useState(user?.college_email || '');
  const [collegeOtpSent, setCollegeOtpSent] = useState(false);
  const [sendingCollegeOtp, setSendingCollegeOtp] = useState(false);
  const [collegeCountdown, setCollegeCountdown] = useState(0);
  const [collegeCode, setCollegeCode] = useState('');
  const [verifyingCollegeOtp, setVerifyingCollegeOtp] = useState(false);
  const [collegeStatusMsg, setCollegeStatusMsg] = useState('');
  const [collegeErrorMsg, setCollegeErrorMsg] = useState('');

  // Countdown timer for password resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Countdown timer for college resend OTP
  useEffect(() => {
    if (collegeCountdown <= 0) return;
    const timer = setInterval(() => {
      setCollegeCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [collegeCountdown]);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setOtpError('');
    setOtpStatus('');
    try {
      await api.auth.requestOtp(user.email);
      setOtpSent(true);
      setCountdown(60);
      setOtpStatus(`A 6-digit verification code has been sent to ${user.email}.`);
    } catch (err) {
      setOtpError(err.message || 'Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPasswordWithOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpStatus('');

    if (otpPassword !== otpConfirm) {
      setOtpError('New passwords do not match.');
      return;
    }
    if (otpPassword.length < 6) {
      setOtpError('Password must be at least 6 characters.');
      return;
    }

    setSubmittingOtp(true);
    try {
      await api.auth.resetPassword(user.email, code.trim(), otpPassword);
      setOtpStatus('Password changed successfully! Your account is now secured with the new password.');
      setCode('');
      setOtpPassword('');
      setOtpConfirm('');
      setOtpSent(false);
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleSendCollegeOtp = async (e) => {
    e.preventDefault();
    setCollegeErrorMsg('');
    setCollegeStatusMsg('');
    if (!collegeEmailInput || !collegeEmailInput.includes('@')) {
      setCollegeErrorMsg('Please enter a valid college or institutional email address.');
      return;
    }

    setSendingCollegeOtp(true);
    try {
      const res = await api.users.requestCollegeOtp(collegeEmailInput.trim().toLowerCase());
      setCollegeOtpSent(true);
      setCollegeCountdown(60);
      setCollegeStatusMsg(res.message || `A 6-digit OTP code has been sent to ${collegeEmailInput}.`);
    } catch (err) {
      setCollegeErrorMsg(
        err.message || 'Could not send verification code. You can continue using HackSaath freely with your personal email.'
      );
    } finally {
      setSendingCollegeOtp(false);
    }
  };

  const handleVerifyCollegeOtp = async (e) => {
    e.preventDefault();
    setCollegeErrorMsg('');
    setCollegeStatusMsg('');

    if (!collegeCode || collegeCode.trim().length !== 6) {
      setCollegeErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingCollegeOtp(true);
    try {
      const res = await api.users.verifyCollegeOtp(collegeEmailInput.trim().toLowerCase(), collegeCode.trim());
      if (res.user && setUser) {
        setUser(res.user);
      }
      setCollegeStatusMsg(res.message);
      setCollegeOtpSent(false);
      setCollegeCode('');
    } catch (err) {
      setCollegeErrorMsg(
        err.message || 'Verification failed. Remember: college verification is optional, and your personal account has full platform access!'
      );
    } finally {
      setVerifyingCollegeOtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Status Cards: Clearly distinguishing Email from College */}
      <div className="card p-6 space-y-5">
        <div className="pb-3 border-b border-cw-border">
          <h2 className="text-lg font-bold text-cw-text-1">Account &amp; Verification Status</h2>
          <p className="text-xs text-cw-text-3">
            HackSaath distinguishes between verified email identity and optional college affiliation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Verification Box */}
          <div className="p-4 rounded-xl bg-cw-bg-alt/50 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cw-text-3 font-semibold uppercase tracking-wider text-[10px]">
                Email Verification
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Email Verified
              </span>
            </div>
            <p className="font-semibold text-cw-text-1 text-sm truncate">{user?.email}</p>
            <p className="text-xs text-cw-text-3 leading-relaxed">
              Verified with secure 6-digit email OTP. Personal emails (Gmail, Outlook, Yahoo) and college domains both have complete access.
            </p>
          </div>

          {/* College Verification Box */}
          <div className={`p-4 rounded-xl bg-cw-bg-alt/50 border space-y-2 ${
            user?.is_college_verified ? 'border-indigo-500/30' : 'border-cw-border'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-cw-text-3 font-semibold uppercase tracking-wider text-[10px]">
                College Verification
              </span>
              {user?.is_college_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>College Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Unverified (Optional)</span>
                </span>
              )}
            </div>
            <p className="font-semibold text-cw-text-1 text-sm truncate">
              {user?.college_name || 'No college specified'}
            </p>
            <p className="text-xs text-cw-text-3 leading-relaxed">
              {user?.is_college_verified
                ? `Institutional domain verified (${user?.college_email || user?.email}).`
                : 'Optional. You can verify an institutional college email below anytime, or continue with your verified personal account.'}
            </p>
          </div>
        </div>

        {/* General Account Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-3 rounded-xl bg-cw-bg-alt/30 border border-cw-border space-y-1">
            <span className="text-cw-text-3 font-semibold uppercase tracking-wider text-[10px]">
              Roll / Student ID
            </span>
            <p className="font-mono font-semibold text-cw-text-1 text-sm pt-0.5">
              {user?.roll_number || 'Not provided (optional)'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cw-bg-alt/30 border border-cw-border space-y-1">
            <span className="text-cw-text-3 font-semibold uppercase tracking-wider text-[10px]">
              Account Created
            </span>
            <p className="font-semibold text-cw-text-1 text-sm pt-0.5">
              {formatDate(user?.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Optional College Domain Verification Card */}
      {!user?.is_college_verified && (
        <div className="card p-6 space-y-4 border-indigo-500/20 bg-gradient-to-br from-cw-surface via-cw-surface to-indigo-950/10">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-cw-border">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-cw-text-1">Verify College Domain (Optional)</h2>
              </div>
              <p className="text-xs text-cw-text-3 mt-1">
                Have an institutional college email (e.g. <code>.edu</code>, <code>.ac.in</code>)? Verify it here to receive the College Verified badge on your profile.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Personal accounts have zero restrictions:</strong> If you don't have a college email or if verification is unsuccessful, you can continue using HackSaath normally.
            </p>
          </div>

          {!collegeOtpSent ? (
            <form onSubmit={handleSendCollegeOtp} className="space-y-3 pt-1">
              <div>
                <label htmlFor="college-email-input" className="label font-semibold text-cw-text-1 text-xs">
                  Institutional / College Email Address
                </label>
                <input
                  id="college-email-input"
                  type="email"
                  value={collegeEmailInput}
                  onChange={(e) => setCollegeEmailInput(e.target.value)}
                  placeholder="student@university.edu or student@college.ac.in"
                  className="field text-sm"
                  required
                />
              </div>

              {collegeErrorMsg && (
                <p role="alert" className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs">
                  {collegeErrorMsg}
                </p>
              )}
              {collegeStatusMsg && (
                <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 text-xs">
                  {collegeStatusMsg}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={sendingCollegeOtp}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{sendingCollegeOtp ? 'Sending College OTP…' : 'Send College Verification Code'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCollegeOtp} className="space-y-3 pt-1">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
                OTP sent to <strong className="underline">{collegeEmailInput}</strong>. Please check your inbox and enter the 6-digit code.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="college-otp-code" className="label font-semibold text-cw-text-1 text-xs !mb-0">
                    Enter 6-Digit College OTP
                  </label>
                  <button
                    type="button"
                    disabled={collegeCountdown > 0 || sendingCollegeOtp}
                    onClick={handleSendCollegeOtp}
                    className="text-xs font-semibold text-cw-accent hover:underline disabled:text-cw-text-3"
                  >
                    {collegeCountdown > 0 ? `Resend in ${collegeCountdown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  id="college-otp-code"
                  type="text"
                  maxLength={6}
                  value={collegeCode}
                  onChange={(e) => setCollegeCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className="field text-sm font-mono tracking-widest text-center"
                  required
                />
              </div>

              {collegeErrorMsg && (
                <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs space-y-1">
                  <p className="font-semibold">{collegeErrorMsg}</p>
                  <p className="text-[11px] text-cw-text-3">
                    Don't worry! Your personal account remains 100% active and verified.
                  </p>
                </div>
              )}
              {collegeStatusMsg && (
                <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 text-xs">
                  {collegeStatusMsg}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={verifyingCollegeOtp}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl"
                >
                  {verifyingCollegeOtp ? 'Verifying…' : 'Confirm College OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCollegeOtpSent(false);
                    setCollegeCode('');
                    setCollegeErrorMsg('');
                  }}
                  className="btn-ghost text-xs py-2 px-3 text-cw-text-3 hover:text-cw-text-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Change Password Card with OTP */}
      <div className="card p-6 space-y-5">
        <div className="pb-3 border-b border-cw-border">
          <h2 className="text-lg font-bold text-cw-text-1">Security &amp; Password</h2>
          <p className="text-xs text-cw-text-3">
            To protect your account, changing your password requires email OTP verification.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Email OTP Verification Required</p>
              <p className="mt-0.5">
                We will send a one-time 6-digit confirmation code to <span className="font-bold underline">{user?.email}</span> to verify your identity.
              </p>
            </div>
          </div>

          {!otpSent ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>{sendingOtp ? 'Sending code…' : 'Send Verification OTP to Email'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPasswordWithOtp} className="space-y-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="otp-code" className="label font-semibold text-cw-text-1 !mb-0">
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    disabled={countdown > 0 || sendingOtp}
                    onClick={handleSendOtp}
                    className="text-xs font-semibold text-cw-accent hover:underline disabled:text-cw-text-3"
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
                <input
                  id="otp-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className="field text-sm font-mono tracking-widest text-center"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="otp-new-password" className="label font-semibold text-cw-text-1">
                    New Password
                  </label>
                  <PasswordInput
                    id="otp-new-password"
                    required
                    minLength={6}
                    value={otpPassword}
                    onChange={(e) => setOtpPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label htmlFor="otp-confirm-password" className="label font-semibold text-cw-text-1">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    id="otp-confirm-password"
                    required
                    minLength={6}
                    value={otpConfirm}
                    onChange={(e) => setOtpConfirm(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {otpError && (
                <p role="alert" className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs">
                  {otpError}
                </p>
              )}
              {otpStatus && (
                <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 text-xs">
                  {otpStatus}
                </p>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submittingOtp}
                  className="btn-primary py-2.5 px-6 text-xs font-bold rounded-xl"
                >
                  {submittingOtp ? 'Updating password…' : 'Verify OTP & Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setCode('');
                    setOtpError('');
                  }}
                  className="btn-ghost text-xs py-2 px-3 text-cw-text-3 hover:text-cw-text-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {otpError && !otpSent && (
            <p role="alert" className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs mt-2">
              {otpError}
            </p>
          )}
          {otpStatus && !otpSent && (
            <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 text-xs mt-2">
              {otpStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
