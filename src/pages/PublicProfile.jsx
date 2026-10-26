import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, GraduationCap, Building2, Globe, Briefcase, ExternalLink, Award } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import ImageModal from '../components/ImageModal';
import SendSwapModal from '../components/SendSwapModal';

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

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [userData, reviewData, listingData] = await Promise.all([
        api.users.get(id),
        api.reviews.forUser(id),
        api.listings.forOwner(id),
      ]);
      setProfile(userData.user);
      setReviews(reviewData.reviews || []);
      setListings(listingData.listings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-cw-text-3">Loading profile…</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!profile) return <p className="text-sm text-red-700">User not found.</p>;

  const initials = (profile.full_name || profile.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const cleanGithub = (profile.github_url || '')
    .replace('https://github.com/', '')
    .replace('http://github.com/', '')
    .replace('/', '');

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="card space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="avatar-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold truncate text-cw-text-1">
                {profile.full_name || 'Anonymous Student'}
              </h1>
              {profile.primary_role && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {profile.primary_role}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Email Verified
              </span>
              {profile.is_college_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>College Verified</span>
                </span>
              ) : null}
              {profile.college_name && (
                <span className="inline-flex items-center gap-1 text-cw-accent font-medium text-xs">
                  <Building2 className="w-3.5 h-3.5 text-cw-accent" />
                  <span>{profile.college_name}</span>
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-cw-text-3">
              {profile.experience_level && (
                <span className="font-medium text-cw-text-2">
                  Level: <strong className="text-cw-text-1">{profile.experience_level}</strong>
                </span>
              )}
              {profile.year_of_study && <span>• {profile.year_of_study}</span>}
              <span>• Joined {formatDate(profile.created_at)}</span>
            </div>

            {/* Availability */}
            {profile.availability && (
              <div className="mt-2 text-[13px] text-slate-400">
                <span className="font-medium text-slate-400">Availability: </span>
                <span className="text-slate-200">{profile.availability}</span>
              </div>
            )}

            {profile.bio && (
              <p className="mt-3 text-sm text-cw-text-1 whitespace-pre-line leading-relaxed">{profile.bio}</p>
            )}

            {/* Actions & Links */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {currentUser && currentUser.id !== profile.id && (
                <button
                  type="button"
                  onClick={() => setSwapModalOpen(true)}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Send Swap Request
                </button>
              )}

              {profile.github_url && (
                <a
                  href={profile.github_url.startsWith('http') ? profile.github_url : `https://github.com/${cleanGithub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cw-border bg-cw-bg-alt px-3 py-1.5 text-xs font-medium text-cw-text-1 hover:border-cw-accent transition"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>github.com/{cleanGithub}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cw-text-3" />
                </a>
              )}

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url.startsWith('http') ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cw-border bg-cw-bg-alt px-3 py-1.5 text-xs font-medium text-cw-text-1 hover:border-cw-accent transition"
                >
                  <Globe className="w-3.5 h-3.5 text-cw-text-2" />
                  <span>Portfolio Site</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cw-text-3" />
                </a>
              )}

              <button
                onClick={() => setIsReporting(true)}
                className="ml-auto text-xs font-medium text-red-500 hover:text-red-600 hover:underline"
              >
                Report User
              </button>
            </div>
          </div>
        </div>

        {/* Trust Score & Stats */}
        <div className="flex flex-wrap items-center gap-6 border-t border-cw-border pt-4 justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-cw-text-1">
              {Number(profile.rating_average ?? 0).toFixed(1)}
            </p>
            <Stars rating={Math.round(profile.rating_average ?? 0)} />
            <p className="mt-1 text-xs text-cw-text-3">Trust Score</p>
          </div>
          <div className="text-center border-l border-cw-border pl-6">
            <p className="text-2xl font-bold text-cw-text-1">{profile.rating_count ?? 0}</p>
            <p className="text-xs text-cw-text-3">Reviews</p>
          </div>
          <div className="text-center border-l border-cw-border pl-6">
            <p className="text-2xl font-bold text-cw-text-1">{profile.projects?.length || 0}</p>
            <p className="text-xs text-cw-text-3">Showcase Projects</p>
          </div>
        </div>

        {/* Skills & Hackathon Tracks */}
        <div className="grid gap-4 border-t border-cw-border pt-4 sm:grid-cols-2">
          {profile.skills_offered?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Skills Can Teach</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.skills_offered.map((s) => (
                  <span key={s} className="rounded-md bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.skills_wanted?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Skills Want to Learn</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.skills_wanted.map((s) => (
                  <span key={s} className="rounded-md bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-cw-text-3 uppercase tracking-wider">Interests &amp; Project Themes</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span key={interest} className="rounded-md bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Portfolio Showcase */}
      <div>
        <h2 className="text-xl font-bold text-cw-text-1 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cw-accent" />
          <span>Project Portfolio ({profile.projects?.length || 0})</span>
        </h2>

        {(!profile.projects || profile.projects.length === 0) ? (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-cw-text-2">No portfolio projects showcased yet.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {profile.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="card flex flex-col justify-between hover:border-cw-accent/50 transition shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-cw-text-1">{proj.title}</h3>
                  </div>
                  {proj.description && (
                    <p className="mt-1 text-xs text-cw-text-2 leading-relaxed line-clamp-3">
                      {proj.description}
                    </p>
                  )}
                  {proj.tech_stack?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {proj.tech_stack.map((t) => (
                        <span key={t} className="rounded bg-cw-bg-alt px-1.5 py-0.5 text-[10px] font-medium text-cw-text-3 border border-cw-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-cw-border flex items-center gap-3 text-xs">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-cw-text-1 hover:text-cw-accent flex items-center gap-1"
                    >
                      <span>Code Repo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-bold text-cw-text-1">Reviews & Testimonials ({reviews.length})</h2>

        {reviews.length === 0 && (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-cw-text-2">No reviews yet.</p>
          </div>
        )}

        <div className="mt-3 space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Stars rating={review.rating} />
                  <span className="ml-2 text-sm font-semibold text-cw-text-1">{review.rating}/5</span>
                </div>
                <p className="text-xs text-cw-text-3 w-full sm:w-auto">{formatDate(review.created_at)}</p>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-cw-text-1 whitespace-pre-line">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Listings / Teams */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-cw-text-1">
          Listings by {profile.full_name?.split(' ')[0] || 'User'} ({listings.length})
        </h2>

        {listings.length === 0 && (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-cw-text-2">No active listings.</p>
          </div>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {listings.map((l) => (
            <Link key={l.id} to={`/listings/${l.id}`} className="card hover:border-cw-accent hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                    l.mode === 'team'
                      ? 'bg-indigo-500/10 text-indigo-600'
                      : l.mode === 'freelance'
                      ? 'bg-freelance/10 text-freelance'
                      : 'bg-exchange/10 text-exchange'
                  }`}
                >
                  {l.mode === 'team' ? 'Hackathon Team' : l.mode === 'freelance' ? 'Freelance' : 'Skill Swap'}
                </span>
                <span className="text-xs text-cw-text-3 font-medium capitalize">
                  {l.status.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold text-cw-text-1 line-clamp-1">
                {l.title}
              </p>
              {l.hackathon_name && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{l.hackathon_name}</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {isReporting && (
        <ReportModal reportedUser={profile} onClose={() => setIsReporting(false)} />
      )}

      {fullscreenImage && (
        <ImageModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}

      {swapModalOpen && (
        <SendSwapModal
          recipient={profile}
          onClose={() => setSwapModalOpen(false)}
          onSuccess={() => setSwapModalOpen(false)}
        />
      )}
    </div>
  );
}
