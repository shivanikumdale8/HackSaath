import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Award, Compass, Zap, AlertTriangle, Check, CheckCircle, Lock, Globe, Users, GitFork, Star, ShieldCheck, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLiveRefresh, triggerAppRefresh } from '../hooks/useLiveRefresh';
import TaskProgress from '../components/TaskProgress';
import WorkspaceChat from '../components/WorkspaceChat';
import ParticipantCard from '../components/ParticipantCard';
import WorkspaceReview from '../components/WorkspaceReview';
import ReportModal from '../components/ReportModal';
import ConfirmModal from '../components/ConfirmModal';
import CampusSettlementCard from '../components/CampusSettlementCard';

/**
 * React page component for ListingDetail view.
 * @author = kruthinraj
 * @date = 2026-08-22
 */

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [teamApps, setTeamApps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [form, setForm] = useState({ amount: '', message: '', is_anonymous: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBidId, setDeletingBidId] = useState(null);
  
  const [editingBidId, setEditingBidId] = useState(null);
  const [editBidForm, setEditBidForm] = useState({ amount: '', message: '', is_anonymous: true });
  const [bidSort, setBidSort] = useState('newest'); // 'newest', 'price-asc', 'price-desc', 'rating-desc'

  const navigate = useNavigate();

  const [editingPeople, setEditingPeople] = useState(false);
  const [editPeopleVal, setEditPeopleVal] = useState('');

  const isOwner = user && listing && listing.owner_id === user.id;
  const isParticipant = listing && listing.is_participant;

  const load = useCallback(async () => {
    setError('');
    try {
      const { listing: found } = await api.listings.get(id);
      setListing(found);

      // Bids are only visible to signed-in students.
      if (found.mode === 'freelance' && user) {
        const { bids: list } = await api.bids.forListing(id);
        setBids(list);
      } else if (found.mode === 'team' && user) {
        const { applications: list } = await api.teams.list(id);
        setTeamApps(list);
        api.teams.recommendations(id)
          .then((res) => setRecommendations(res.candidates || []))
          .catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  // Real-time live polling (every 3 seconds, just like WorkspaceChat)
  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !document.hidden) {
        load();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  // Also auto-refresh immediately when window regains focus or after cross-tab events
  useLiveRefresh(load, { intervalMs: 3000, enabled: Boolean(id) });

  const handleAction = async (action) => {
    setError('');
    try {
      await action();
      await load();
      triggerAppRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitBid = (event) => {
    event.preventDefault();
    return handleAction(async () => {
      await api.bids.create({
        listing_id: id,
        amount: Number(form.amount),
        message: form.message.trim(),
        is_anonymous: Boolean(form.is_anonymous),
      });
      setForm({ amount: '', message: '', is_anonymous: true });
    });
  };

  const submitBidEdit = (event, bidId) => {
    event.preventDefault();
    return handleAction(async () => {
      await api.bids.edit(bidId, {
        amount: Number(editBidForm.amount),
        message: editBidForm.message.trim(),
        is_anonymous: Boolean(editBidForm.is_anonymous),
      });
      setEditingBidId(null);
    });
  };

  const submitTeamApp = (event) => {
    event.preventDefault();
    return handleAction(async () => {
      await api.teams.apply({
        listing_id: id,
        message: form.message.trim(),
      });
      setForm({ amount: '', message: '' });
    });
  };

  const handleDelete = async () => {
    setError('');
    try {
      await api.listings.delete(id);
      navigate('/browse');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePeople = async () => {
    setError('');
    try {
      await api.listings.updatePeopleRequired(id, Number(editPeopleVal));
      setEditingPeople(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const proposeSwap = () =>
    handleAction(() =>
      api.exchanges.propose({ listing_id: id, message: 'I would like to swap skills with you.' })
    );

  if (loading) return <p className="text-sm text-cw-text-3">Loading…</p>;
  if (!listing) return <p className="text-sm text-red-700">{error || 'Listing not found.'}</p>;

  const isFreelance = listing.mode === 'freelance';
  const isTeam = listing.mode === 'team';
  const isExpired = isFreelance && listing.deadline && new Date(listing.deadline) < new Date();
  
  // Determine who to review (the other participant)
  let targetReviewee = null;
  if (isParticipant && listing.status === 'completed') {
    if (isOwner && listing.assigned_users?.length > 0) {
      targetReviewee = listing.assigned_users[0]; // For simplicity, take the first assigned user
    } else if (!isOwner && listing.owner) {
      targetReviewee = listing.owner;
    }
  }

  const acceptedBid = bids.find((b) => b.status === 'accepted') || null;
  const freelancerUser =
    listing.assigned_users?.find((u) => u.role === 'freelancer') ||
    (acceptedBid ? acceptedBid.bidder : null);

  const sortedBids = [...bids].sort((a, b) => {
    if (bidSort === 'price-asc') return a.amount - b.amount;
    if (bidSort === 'price-desc') return b.amount - a.amount;
    if (bidSort === 'rating-desc') {
      const aRating = a.bidder?.rating_average || 0;
      const bRating = b.bidder?.rating_average || 0;
      return bRating - aRating;
    }
    // newest (default)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-2">
        <div className="card overflow-hidden">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
              isExpired ? 'bg-cw-border text-cw-text-1' : isFreelance ? 'bg-freelance' : isTeam ? 'bg-indigo-500' : 'bg-exchange'
            }`}
          >
            {isExpired ? 'Expired' : isFreelance ? 'Freelance' : isTeam ? 'Team Finder' : 'Exchange'}
          </span>

          {listing.image_url && (
            <div className="-mx-5 mt-3">
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full max-h-72 object-cover"
              />
            </div>
          )}

          <div className="flex justify-between items-start mt-3">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            {user && !isOwner && (
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5"
                title="Report inappropriate content or bullying"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Post</span>
              </button>
            )}
            {isOwner && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition-colors"
                title="Delete this listing"
              >
                Delete Post
              </button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line text-cw-text-1">{listing.description}</p>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {isFreelance ? (
              <>
                <div>
                  <dt className="text-cw-text-2">Budget</dt>
                  <dd className="font-semibold">₹{listing.budget}</dd>
                </div>
                <div>
                  <dt className="text-cw-text-2">Deadline</dt>
                  <dd className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                    {new Date(listing.deadline).toLocaleDateString()} {isExpired && '(Passed)'}
                  </dd>
                </div>
              </>
            ) : isTeam ? (
              <>
                {listing.hackathon_name && (
                  <div>
                    <dt className="text-cw-text-2">Hackathon / Event</dt>
                    <dd className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{listing.hackathon_name}</span>
                    </dd>
                  </div>
                )}
                {listing.hackathon_theme && (
                  <div>
                    <dt className="text-cw-text-2">Track / Theme</dt>
                    <dd className="font-semibold text-cw-text-1 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cw-text-3" />
                      <span>{listing.hackathon_theme}</span>
                    </dd>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-cw-text-2">Team Capacity</dt>
                  {editingPeople ? (
                    <dd className="mt-1 flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        className="field max-w-[100px] text-sm" 
                        value={editPeopleVal} 
                        onChange={e => setEditPeopleVal(e.target.value)} 
                      />
                      <button onClick={handleUpdatePeople} className="btn-primary py-1 px-3 text-xs">Save</button>
                      <button onClick={() => setEditingPeople(false)} className="btn-ghost py-1 px-3 text-xs">Cancel</button>
                    </dd>
                  ) : (
                    <dd className="font-semibold flex items-center gap-2">
                      {listing.people_required} members
                      {isOwner && listing.status === 'open' && (
                        <button 
                          onClick={() => { setEditPeopleVal(listing.people_required); setEditingPeople(true); }}
                          className="text-xs text-indigo-500 hover:underline font-normal"
                        >
                          (Edit)
                        </button>
                      )}
                    </dd>
                  )}
                </div>
                {listing.deadline && (
                  <div>
                    <dt className="text-cw-text-2">Submission Deadline</dt>
                    <dd className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                      {new Date(listing.deadline).toLocaleDateString()} {isExpired && '(Passed)'}
                    </dd>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <dt className="text-cw-text-2">They can teach</dt>
                  <dd className="font-semibold">{listing.skill_offered}</dd>
                </div>
                <div>
                  <dt className="text-cw-text-2">They want to learn</dt>
                  <dd className="font-semibold">{listing.skill_wanted}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-cw-text-2">Status</dt>
              <dd className="font-semibold capitalize">{listing.status.replace('_', ' ')}</dd>
            </div>
          </dl>

          {/* Team Readiness & Missing Roles Summary */}
          {isTeam && (
            <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-cw-text-1 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <span>Team Readiness &amp; Skill Gap Analysis</span>
                  </h3>
                  <p className="text-xs text-cw-text-3">
                    Calculated from capacity filling, missing role fulfillment, and technical skill diversity.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                    {listing.readiness?.score ?? 40}%
                  </span>
                  <span className="ml-2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {listing.readiness?.statusLabel || 'Core Forming'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-cw-border rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (listing.readiness?.score || 40) >= 80
                      ? 'bg-emerald-500'
                      : (listing.readiness?.score || 40) >= 50
                      ? 'bg-indigo-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${listing.readiness?.score || 40}%` }}
                />
              </div>

              {/* Missing Roles Badges */}
              {(listing.gaps?.missingRoles || listing.required_roles || []).length > 0 && (
                <div className="pt-2 border-t border-indigo-200/40 dark:border-indigo-800/40">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Missing Roles to Reach 100% Readiness:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(listing.gaps?.missingRoles || listing.required_roles || []).map((role) => (
                      <span
                        key={role}
                        className="rounded-lg bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 px-2.5 py-1 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-sm"
                      >
                        + Missing: {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {(listing.team_skills_needed || []).length > 0 && (
                <div className="pt-2 border-t border-indigo-200/40 dark:border-indigo-800/40">
                  <p className="text-xs font-medium text-cw-text-3 mb-1.5">Target Tech Stack Needed:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.team_skills_needed.map((sk) => (
                      <span key={sk} className="chip text-xs">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Squad Workspace CTA */}
              {(isOwner || isParticipant) && (
                <div className="pt-3 border-t border-indigo-200/40 dark:border-indigo-800/40 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                    You have access to the Squad Collaboration Workspace.
                  </span>
                  <Link
                    to={`/workspace/${listing.id}`}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Open Squad Workspace</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {isOwner && listing.status === 'in_progress' && (
            <div className="mt-4 pt-3 border-t border-cw-border/60 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-cw-text-2 font-medium">Task in progress &bull; Finish work &amp; settlement</span>
              <button
                type="button"
                onClick={() => handleAction(() => api.listings.setStatus(id, 'completed'))}
                className="btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4" />
                <span>Mark as Completed</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!user && (
          <p className="card text-sm text-cw-text-2">
            Sign in with your college email to bid or propose a swap.
          </p>
        )}

        {/* Workspace controls */}
        {user && isParticipant && listing.status === 'in_progress' && (
          <TaskProgress 
            listingId={listing.id} 
            currentStatus={listing.worker_status} 
            onUpdate={(updated) => setListing({ ...listing, worker_status: updated.worker_status })} 
          />
        )}
        
        {/* Review System when completed */}
        {user && isParticipant && listing.status === 'completed' && targetReviewee && (
          listing.has_reviewed ? (
            <div className="card text-center bg-cw-surface border-cw-border">
              <p className="text-cw-text-1 font-medium">You have already left a review.</p>
              <p className="text-sm text-cw-text-3 mt-1">Thank you for your feedback.</p>
            </div>
          ) : (
            <WorkspaceReview 
              listingId={listing.id} 
              reviewee={targetReviewee} 
              onReviewSubmitted={load}
            />
          )
        )}

        {/* Completed status banner for non-participants viewing a finished post */}
        {listing.status === 'completed' && !isOwner && !isParticipant && (
          <div className="card text-center py-6 border border-emerald-500/20 bg-emerald-500/5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-cw-text-1">Task Completed</h3>
            <p className="text-xs text-cw-text-3 mt-1">
              This task has been completed and closed. Proposals and internal details are private.
            </p>
          </div>
        )}

        {/* Freelance mode: place a bid, or (as owner) accept one. */}
        {user && isFreelance && (listing.status === 'open' || isOwner || isParticipant) && (
          <div className="card">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Bids ({bids.length})</h2>
                {isOwner && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Owner View: All profiles visible</span>
                  </span>
                )}
                {!isOwner && (
                  <span className="text-[10px] text-cw-text-3 hidden sm:inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Peer privacy enabled</span>
                  </span>
                )}
              </div>
              {isOwner && bids.length > 0 && (
                <select 
                  className="field py-1 text-xs max-w-[150px]"
                  value={bidSort}
                  onChange={(e) => setBidSort(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
              )}
            </div>

            <ul className="space-y-3">
              {sortedBids.map((bid) => {
                const isMyBid = user && (
                  (bid.bidder && bid.bidder.id === user.id) ||
                  bid.bidder_id === user.id
                );
                const isEditing = editingBidId === bid.id;

                if (isEditing) {
                  return (
                    <li key={bid.id} className="rounded-lg border border-cw-border bg-cw-surface p-3">
                      <form onSubmit={(e) => submitBidEdit(e, bid.id)} className="space-y-3">
                        <div>
                          <label className="label">Amount (₹)</label>
                          <input
                            type="number"
                            min={1} max={100000} required
                            value={editBidForm.amount}
                            onChange={e => setEditBidForm({...editBidForm, amount: e.target.value})}
                            className="field"
                          />
                        </div>
                        <div>
                          <label className="label">Message</label>
                          <textarea
                            rows={2} required minLength={5}
                            value={editBidForm.message}
                            onChange={e => setEditBidForm({...editBidForm, message: e.target.value})}
                            className="field"
                          />
                        </div>
                        <label className="flex items-start gap-2 cursor-pointer bg-cw-bg-alt/70 p-2.5 rounded-lg border border-cw-border">
                          <input
                            type="checkbox"
                            checked={editBidForm.is_anonymous}
                            onChange={(e) => setEditBidForm({ ...editBidForm, is_anonymous: e.target.checked })}
                            className="mt-0.5 rounded border-cw-border text-cw-accent focus:ring-cw-accent"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-cw-text-1">Keep my name anonymous to other students</span>
                            <p className="text-cw-text-3 text-[11px] mt-0.5">
                              The listing owner can always view your full profile and rating, but other students will only see "Anonymous Student".
                            </p>
                          </div>
                        </label>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex gap-2">
                            <button type="submit" className="btn-primary py-1 px-3 text-sm">Save</button>
                            <button type="button" onClick={() => setEditingBidId(null)} className="btn-ghost py-1 px-3 text-sm">Cancel</button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBidId(null);
                              setDeletingBidId(bid.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium"
                          >
                            Withdraw Bid
                          </button>
                        </div>
                      </form>
                    </li>
                  );
                }

                return (
                  <li
                    key={bid.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border border-cw-border bg-cw-surface p-3"
                  >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cw-text-1">₹{bid.amount}</p>
                    <p className="text-sm text-cw-text-2 mb-1 break-words">{bid.message}</p>
                    {bid.bidder && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {bid.bidder.id ? (
                          <Link
                            to={`/users/${bid.bidder.id}`}
                            className="text-xs flex items-center gap-2 hover:bg-cw-bg-alt p-1 -ml-1 rounded transition-colors w-fit"
                          >
                            {bid.bidder.avatar_url ? (
                              <img src={bid.bidder.avatar_url} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold" style={{ fontSize: '10px' }}>
                                {bid.bidder.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <span className="font-medium text-cw-text-1">{bid.bidder.full_name}</span>
                            {isMyBid && (
                              <span className="text-[10px] text-cw-accent font-semibold">(You)</span>
                            )}
                            <span className="text-cw-text-3 flex items-center gap-0.5">• <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {Number(bid.bidder.rating_average || 0).toFixed(1)}</span>
                          </Link>
                        ) : (
                          <div className="text-xs flex items-center gap-2 p-1 -ml-1 text-cw-text-2 w-fit">
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-cw-text-3">
                              <Lock className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-cw-text-2">{bid.bidder.full_name}</span>
                            <span className="text-cw-text-3 flex items-center gap-0.5">• <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {Number(bid.bidder.rating_average || 0).toFixed(1)}</span>
                          </div>
                        )}

                        {isOwner && bid.is_anonymous && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded" title="Only you (the owner) see this profile. Other students see 'Anonymous Student'.">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Anonymous to others</span>
                          </span>
                        )}

                        {isMyBid && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                            bid.is_anonymous
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }`}>
                            {bid.is_anonymous ? (
                              <>
                                <Lock className="w-2.5 h-2.5" />
                                <span>Anonymous to peers</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-2.5 h-2.5" />
                                <span>Name public</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    {isMyBid && bid.status === 'pending' && listing.status === 'open' && !isExpired && (
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditBidForm({
                              amount: bid.amount,
                              message: bid.message,
                              is_anonymous: typeof bid.is_anonymous === 'boolean' ? bid.is_anonymous : true,
                            });
                            setEditingBidId(bid.id);
                          }}
                          className="text-xs text-indigo-500 hover:underline font-medium"
                        >
                          Edit Bid
                        </button>
                        <span className="text-cw-text-3 text-xs">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setDeletingBidId(bid.id)}
                          className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium"
                        >
                          Withdraw Bid
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-cw-border/50">
                    <span className="chip capitalize">{bid.status}</span>
                    {isOwner && bid.status === 'pending' && listing.status === 'open' && !isExpired && (
                      <button
                        type="button"
                        onClick={() => handleAction(() => api.bids.accept(bid.id))}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </li>
              )})}
              {bids.length === 0 && <li className="text-sm text-cw-text-3">No bids yet.</li>}
            </ul>

            {!isOwner && listing.status === 'open' && !isExpired && (
              <form onSubmit={submitBid} className="mt-4 space-y-3 border-t border-cw-border pt-4">
                <div>
                  <label htmlFor="amount" className="label">
                    Your price (₹)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min={1}
                    max={100000}
                    required
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    className="field"
                  />
                  <p className="mt-1 text-xs text-cw-text-3">Max ₹1,00,000</p>
                </div>
                <div>
                  <label htmlFor="message" className="label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={2}
                    required
                    minLength={5}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    placeholder="Why you are a good fit"
                    className="field"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer bg-cw-bg-alt/70 p-2.5 rounded-lg border border-cw-border">
                  <input
                    type="checkbox"
                    checked={form.is_anonymous}
                    onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                    className="mt-0.5 rounded border-cw-border text-cw-accent focus:ring-cw-accent"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-cw-text-1">Keep my name anonymous to other students</span>
                    <p className="text-cw-text-3 text-[11px] mt-0.5">
                      The task owner can always view your full profile and rating, but other students will only see "Anonymous Student".
                    </p>
                  </div>
                </label>
                <button type="submit" className="btn-primary w-full">
                  Place bid
                </button>
              </form>
            )}
            {!isOwner && listing.status === 'open' && isExpired && (
              <div className="mt-4 border-t border-cw-border pt-4 text-sm text-cw-text-3 text-center">
                The deadline for this listing has passed. No new bids can be placed.
              </div>
            )}
          </div>
        )}

        {/* Exchange mode: propose the swap. */}
        {user && listing.mode === 'exchange' && !isOwner && listing.status === 'open' && (
          <button type="button" onClick={proposeSwap} className="btn-primary">
            Propose a swap
          </button>
        )}

        {/* Team mode: apply or accept applications */}
        {user && isTeam && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Applications ({teamApps.length})</h2>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleAction(() => api.listings.setStatus(id, listing.status === 'open' ? 'closed' : 'open'))}
                  className="text-xs font-medium underline text-cw-text-2 hover:text-cw-text-1"
                >
                  {listing.status === 'open' ? 'Close to new applications' : 'Reopen to new applications'}
                </button>
              )}
            </div>

            <ul className="space-y-3">
              {teamApps.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-col gap-2 rounded-xl border border-cw-border bg-cw-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/users/${app.applicant?.id}`} className="flex items-start gap-3 hover:bg-cw-bg-alt p-1.5 -ml-1 rounded-lg transition-colors flex-1">
                      {app.applicant?.avatar_url ? (
                        <img src={app.applicant.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm shrink-0">
                          {app.applicant?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-cw-text-1">{app.applicant?.full_name || 'Student'}</p>
                          {app.applicant?.primary_role && (
                            <span className="rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                              {app.applicant.primary_role}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-cw-text-3 mt-0.5">
                          {app.applicant?.experience_level && `Level: ${app.applicant.experience_level} • `}
                          {app.applicant?.availability || 'Available'}
                        </p>
                      </div>
                    </Link>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="chip capitalize">{app.status}</span>
                      {app.match && (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          {app.match.score}% Match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compatibility Explanation */}
                  {app.match?.summaryExplanation && (
                    <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                      <span className="font-bold">Match Analysis:</span> {app.match.summaryExplanation}
                    </div>
                  )}

                  {app.message && (
                    <p className="text-xs text-cw-text-1 bg-cw-bg-alt/70 p-2.5 rounded-lg border border-cw-border">
                      <span className="font-semibold text-cw-text-3 block text-[10px] uppercase tracking-wider mb-0.5">Applicant Note:</span>
                      {app.message}
                    </p>
                  )}
                  
                  {isOwner && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cw-border/60">
                      {app.status === 'pending' && listing.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleAction(() => api.teams.accept(app.id))}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Accept to Team
                        </button>
                      )}
                      {app.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => handleAction(() => api.teams.remove(app.id))}
                          className="btn-ghost text-xs py-1.5 px-3 text-red-500 hover:text-red-600"
                        >
                          Remove from Team
                        </button>
                      )}
                      <Link
                        to={`/users/${app.applicant?.id}`}
                        className="btn-ghost text-xs py-1.5 px-3 ml-auto"
                      >
                        View Full Portfolio
                      </Link>
                    </div>
                  )}
                </li>
              ))}
              {teamApps.length === 0 && <li className="text-sm text-cw-text-3">No applications yet.</li>}
            </ul>

            {!isOwner && listing.status === 'open' && teamApps.length === 0 && (
              <form onSubmit={submitTeamApp} className="mt-4 space-y-3 border-t border-cw-border pt-4">
                <div>
                  <label htmlFor="message" className="label">
                    Why you want to join this team
                  </label>
                  <textarea
                    id="message"
                    rows={2}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    placeholder="E.g. I am a backend developer with Docker & PostgreSQL experience and would love to build this..."
                    className="field"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Apply to Join Team
                </button>
              </form>
            )}
            {!isOwner && listing.status === 'closed' && teamApps.length === 0 && (
              <div className="mt-4 border-t border-cw-border pt-4 text-sm text-cw-text-3 text-center">
                This team is currently closed and not accepting new members.
              </div>
            )}
          </div>
        )}

        {/* Find Complementary Teammates Section */}
        {user && isTeam && (
          <div className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cw-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-cw-text-1 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span>Find Complementary Teammates</span>
                </h2>
                <p className="text-xs text-cw-text-3">
                  Students scored by our deterministic algorithm based on missing roles, technology stack, track alignment, and availability.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {recommendations.length} Candidates Scored
              </span>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-xs text-cw-text-3 italic py-4 text-center">
                No external candidates currently looking for teams in this track.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recommendations.map((cand) => (
                  <div
                    key={cand.id}
                    className="rounded-xl border border-cw-border bg-cw-surface p-4 flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition shadow-sm space-y-3"
                  >
                    <div>
                      {/* Top bar with score */}
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/users/${cand.id}`} className="flex items-center gap-2.5 group">
                          {cand.avatar_url ? (
                            <img src={cand.avatar_url} alt="avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {cand.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-cw-text-1 group-hover:text-indigo-600 transition">
                              {cand.full_name}
                            </h4>
                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              {cand.primary_role}
                            </p>
                          </div>
                        </Link>

                        <div className="text-right shrink-0">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                              cand.match?.score >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300'
                                : cand.match?.score >= 60
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300'
                            }`}
                          >
                            {cand.match?.score ?? 70}% Match
                          </span>
                        </div>
                      </div>

                      {/* Deterministic Explanation */}
                      <div className="mt-2.5 rounded-lg bg-cw-bg-alt/70 border border-cw-border p-2.5 text-xs text-cw-text-2 leading-relaxed">
                        <span className="font-semibold text-cw-text-1">Why Compatible: </span>
                        {cand.match?.summaryExplanation}
                      </div>

                      {/* Skills & Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {cand.skills_offered?.slice(0, 4).map((sk) => (
                          <span key={sk} className="chip text-[10px]">
                            {sk}
                          </span>
                        ))}
                      </div>

                      {/* Portfolio Project Highlight */}
                      {cand.projects?.length > 0 && (
                        <div className="mt-2 text-[11px] text-cw-text-3 flex items-center gap-1.5">
                          <GitFork className="w-3.5 h-3.5 text-cw-text-3" />
                          <span>Pinned Repo:</span>
                          <span className="font-semibold text-cw-text-1 truncate">{cand.projects[0].title}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-cw-border flex items-center justify-between text-xs">
                      {cand.github_url && (
                        <a
                          href={cand.github_url.startsWith('http') ? cand.github_url : `https://${cand.github_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cw-text-2 hover:text-cw-text-1 flex items-center gap-1 font-medium"
                        >
                          <span>GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <Link
                        to={`/users/${cand.id}`}
                        className="btn-ghost py-1 px-2.5 text-xs ml-auto border border-cw-border rounded-lg"
                      >
                        View Full Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BIG HORIZONTAL "MARK AS COMPLETED" BUTTON AT THE BOTTOM */}
        {isOwner && listing.status === 'in_progress' && (
          <div className="card border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-cw-surface p-5 sm:p-6 shadow-xl rounded-2xl space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-cw-text-1">
                  Ready to Finalize and Close this Task?
                </h3>
                <p className="text-xs text-cw-text-2 mt-0.5">
                  Work is finished and payment is settled? Click below to officially close this task, release reviews, and update your records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAction(() => api.listings.setStatus(id, 'completed'))}
              className="btn-primary w-full py-4 px-6 text-base sm:text-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 transition transform active:scale-[0.99] border-2 border-emerald-400/40"
            >
              <CheckCircle className="w-6 h-6 text-white" />
              <span>Mark Task as Completed</span>
            </button>
          </div>
        )}
      </div>

      {/* Workspace Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Participants Overview */}
        {(listing.status === 'in_progress' || listing.status === 'completed') && (
          <div className="space-y-3">
            <h3 className="font-semibold text-cw-text-1 px-1">Participants</h3>
            
            {listing.owner && (
              <ParticipantCard 
                user={listing.owner} 
                role="Owner" 
                listingId={listing.id} 
              />
            )}
            
            {listing.assigned_users?.map((assignee) => (
              <ParticipantCard 
                key={assignee.id} 
                user={assignee} 
                role={assignee.role} 
                listingId={listing.id} 
              />
            ))}
          </div>
        )}

        {/* Direct Campus Settlement (Freelance tasks) */}
        {isFreelance && isParticipant && (listing.status === 'in_progress' || listing.status === 'completed') && (
          <CampusSettlementCard
            listing={listing}
            acceptedBid={acceptedBid}
            currentUser={user}
            isOwner={isOwner}
            freelancer={freelancerUser}
            onNotifyChat={(msg) => api.messages.send(listing.id, msg).catch(() => {})}
          />
        )}

        {user && isParticipant && listing.status === 'in_progress' && (
          <div className="sticky top-6">
            <WorkspaceChat listingId={listing.id} />
          </div>
        )}
      </div>

      {isReportModalOpen && (
        <ReportModal
          reportedUser={listing.owner || { id: listing.owner_id, full_name: 'Listing Owner' }}
          listingId={listing.id}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Listing"
          message={`Are you sure you want to permanently delete "${listing.title}"? This cannot be undone.`}
          confirmText="Delete Post"
          isDestructive={true}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {deletingBidId && (
        <ConfirmModal
          title="Withdraw Your Bid"
          message="Are you sure you want to withdraw and delete your bid? You can always submit a new bid later while this listing remains open."
          confirmText="Withdraw Bid"
          isDestructive={true}
          onConfirm={() => {
            handleAction(async () => {
              await api.bids.delete(deletingBidId);
              setDeletingBidId(null);
            });
          }}
          onClose={() => setDeletingBidId(null)}
        />
      )}
    </div>
  );
}
