import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

/**
 * React page component for ProfileSetup view.
 * Allows students to fill in their name, optional college, bio, and initial skills.
 */

const toList = (text) =>
  text.split(',').map((item) => item.trim()).filter(Boolean);

export default function ProfileSetup() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    college_name: user?.college_name ?? '',
    bio: '',
    skills_offered: '',
    skills_wanted: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const { user: updated } = await api.users.updateMe({
        full_name: form.full_name.trim(),
        college_name: form.college_name.trim(),
        bio: form.bio.trim(),
        skills_offered: toList(form.skills_offered),
        skills_wanted: toList(form.skills_wanted),
      });
      setUser(updated);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg animate-fade-in py-8">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-2">
          <UserRound className="w-6 h-6" />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Welcome to HackSaath!</h1>
        <p className="mt-2 text-sm text-slate-400">
          Set up your profile so fellow campus builders and collaborators know who you are.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-[#1f2436] bg-[#111420] p-6 shadow-xl text-white">
        <div>
          <label htmlFor="setup-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            id="setup-name"
            required
            minLength={2}
            value={form.full_name}
            onChange={update('full_name')}
            placeholder="e.g. Priya Sharma"
            className="w-full rounded-xl border border-[#1f2436] bg-[#0c0e16] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>

        <div>
          <label htmlFor="setup-college" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            College / University Name <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
          </label>
          <input
            id="setup-college"
            value={form.college_name}
            onChange={update('college_name')}
            placeholder="e.g. COEP Tech University Pune, VJTI Mumbai"
            className="w-full rounded-xl border border-[#1f2436] bg-[#0c0e16] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>

        <div>
          <label htmlFor="setup-bio" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            About you
          </label>
          <textarea
            id="setup-bio"
            rows={3}
            value={form.bio}
            onChange={update('bio')}
            placeholder="Tell other students about your background, interests, and what you love building…"
            className="w-full rounded-xl border border-[#1f2436] bg-[#0c0e16] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>

        <div>
          <label htmlFor="setup-offer" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Skills you can offer <span className="font-normal text-slate-500 text-[11px]">(comma separated)</span>
          </label>
          <input
            id="setup-offer"
            value={form.skills_offered}
            onChange={update('skills_offered')}
            placeholder="React, FastAPI, UI/UX, PyTorch"
            className="w-full rounded-xl border border-[#1f2436] bg-[#0c0e16] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>

        <div>
          <label htmlFor="setup-want" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Skills you want to learn <span className="font-normal text-slate-500 text-[11px]">(comma separated)</span>
          </label>
          <input
            id="setup-want"
            value={form.skills_wanted}
            onChange={update('skills_wanted')}
            placeholder="Figma, Docker, Rust, Flutter"
            className="w-full rounded-xl border border-[#1f2436] bg-[#0c0e16] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-950/30 p-3 text-xs text-red-300 border border-red-900/50">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-950/40 transition disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving…' : 'Complete Profile Setup'}
        </button>
      </form>
    </div>
  );
}
