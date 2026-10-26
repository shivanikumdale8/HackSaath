import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  X,
  UserPlus,
  GitMerge,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  LogOut,
  Crown,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function TeamWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & sub-flows
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ invitee_id: '', role: '', message: '' });
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Mentor request modal
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorList, setMentorList] = useState([]);
  const [mentorForm, setMentorForm] = useState({ mentor_id: '', topic: '', message: '' });
  const [submittingMentor, setSubmittingMentor] = useState(false);

  // Merge modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeForm, setMergeForm] = useState({ target_team_id: '', message: '' });
  const [submittingMerge, setSubmittingMerge] = useState(false);

  // Transfer lead modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');

  const loadWorkspace = useCallback(async () => {
    try {
      setError('');
      const data = await api.teams.workspace(id);
      setWorkspace(data);
    } catch (err) {
      setError(err.message || 'Failed to load team workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkspace();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadWorkspace();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [loadWorkspace]);

  // Load mentors & candidates when needed
  useEffect(() => {
    if (showMentorModal && mentorList.length === 0) {
      api.mentors.list().then((res) => setMentorList(res.mentors || [])).catch(() => {});
    }
  }, [showMentorModal, mentorList.length]);

  useEffect(() => {
    if (showInviteModal && eligibleStudents.length === 0 && workspace?.team) {
      api.teams
        .candidates({
          mode: workspace.team.institution_policy === 'same_institution' ? 'same_college' : 'all',
          college_id: workspace.team.college_id,
        })
        .then((res) => {
          const currentMemberIds = new Set((workspace.members || []).map((m) => m.id));
          const filtered = (res.candidates || []).filter((c) => !currentMemberIds.has(c.id));
          setEligibleStudents(filtered);
        })
        .catch(() => {});
    }
  }, [showInviteModal, eligibleStudents.length, workspace]);

  const handleStatusChange = async (newStatus) => {
    try {
      setError('');
      await api.teams.updateStatus(id, newStatus);
      setSuccessMsg(`Team status updated to ${newStatus}`);
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAcceptApplication = async (appId) => {
    try {
      setError('');
      await api.teams.accept(appId);
      setSuccessMsg('Teammate added to squad roster.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (appId) => {
    try {
      setError('');
      await api.teams.remove(appId);
      setSuccessMsg('Member removed from team.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      setError('');
      await api.teams.leave(id);
      navigate('/team-finder');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTransferLeadership = async () => {
    if (!transferTargetId) return;
    try {
      setError('');
      await api.teams.transferLead(id, transferTargetId);
      setShowTransferModal(false);
      setSuccessMsg('Leadership transferred successfully.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.invitee_id) return;
    setSubmittingInvite(true);
    setError('');
    try {
      await api.teams.invite(id, inviteForm);
      setShowInviteModal(false);
      setInviteForm({ invitee_id: '', role: '', message: '' });
      setSuccessMsg('Invitation sent to candidate.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCancelInvite = async (invId) => {
    try {
      setError('');
      await api.teams.respondInvitation(invId, 'cancel');
      setSuccessMsg('Invitation cancelled.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestMentor = async (e) => {
    e.preventDefault();
    if (!mentorForm.mentor_id || !mentorForm.topic) return;
    setSubmittingMentor(true);
    setError('');
    try {
      await api.mentors.request({
        team_id: id,
        mentor_id: mentorForm.mentor_id,
        topic: mentorForm.topic,
        message: mentorForm.message,
      });
      setShowMentorModal(false);
      setMentorForm({ mentor_id: '', topic: '', message: '' });
      setSuccessMsg('Mentorship requested successfully.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingMentor(false);
    }
  };

  const handleProposeMerge = async (e) => {
    e.preventDefault();
    if (!mergeForm.target_team_id) return;
    setSubmittingMerge(true);
    setError('');
    try {
      await api.teams.proposeMerge(id, mergeForm);
      setShowMergeModal(false);
      setMergeForm({ target_team_id: '', message: '' });
      setSuccessMsg('Merge proposal sent to target team leader.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingMerge(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-[14px]">
        Loading team workspace...
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="p-6 rounded-xl border border-red-900/50 bg-red-950/20 text-red-300">
          <p className="font-semibold text-base">Unable to access workspace</p>
          <p className="text-sm mt-1">{error}</p>
          <Link
            to={`/listings/${id}`}
            className="mt-4 inline-block px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
          >
            Back to Team Listing
          </Link>
        </div>
      </div>
    );
  }

  const { team, members, pending_applications, invitations, eligibility_audit, mentor_requests, merge_candidates, isOwner } = workspace;
  const currentTeamStatus = team.team_status || (team.status === 'closed' ? 'locked' : 'open');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Status Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-[13px]">
        <div className="flex items-center gap-2 text-slate-400">
          <Link to="/team-finder" className="hover:text-white transition-colors">Team Finder</Link>
          <span>/</span>
          <Link to={`/listings/${team.id}`} className="hover:text-white transition-colors truncate max-w-xs">{team.title}</Link>
          <span>/</span>
          <span className="text-white font-medium">Workspace</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/listings/${team.id}`}
            className="text-slate-400 hover:text-white text-[13px] font-medium"
          >
            Public Listing
          </Link>
          {!isOwner && (
            <button
              type="button"
              onClick={handleLeaveTeam}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Team</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[13px] flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Team Header Card */}
      <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                {team.hackathon_name || 'Hackathon Squad'}
              </span>

              {eligibility_audit && (
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                    eligibility_audit.status === 'Eligible'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : eligibility_audit.status === 'Ineligible'
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {eligibility_audit.status}
                </span>
              )}

              <span className="text-xs px-2.5 py-0.5 rounded bg-[#181c28] border border-slate-800 text-slate-300 capitalize font-mono">
                Status: {currentTeamStatus}
              </span>
            </div>

            <h1 className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight">
              {team.title}
            </h1>

            <p className="text-[14px] text-slate-300 max-w-3xl leading-relaxed">
              {team.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-[13px] text-slate-400">
              <span>Institution: <strong className="text-slate-200">{team.college_name || 'College'}</strong></span>
              <span>•</span>
              <span>Capacity: <strong className="text-slate-200">{members.length} / {team.people_required || 4} Members</strong></span>
              {team.problem_statement_code && (
                <>
                  <span>•</span>
                  <span>Problem Statement: <strong className="text-indigo-300 font-mono">{team.problem_statement_code}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Leader Controls: Status Switcher & Actions */}
          {isOwner && (
            <div className="flex flex-col gap-2 shrink-0 self-start md:self-auto w-full md:w-auto">
              <label className="text-[12px] font-medium text-slate-400">
                Squad Formation Phase:
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#0c0e16] border border-slate-800 text-xs">
                {['open', 'forming', 'ready', 'locked'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-1.5 px-2 rounded font-medium capitalize transition-colors cursor-pointer text-center ${
                      currentTeamStatus === st
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3 transition-colors cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Teammate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMentorModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Request Mentor</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hackathon Eligibility Audit Card */}
      {eligibility_audit && (
        <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-[17px] font-semibold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Official Hackathon Eligibility Validation</span>
              </h2>
              <p className="text-[13px] text-slate-400 mt-0.5">
                Deterministic compliance check based on official tournament rule specifications.
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                eligibility_audit.eligible
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              {eligibility_audit.status}
            </span>
          </div>

          {/* Validation Checks Checklist */}
          <div className="grid gap-3 sm:grid-cols-3 pt-4">
            {eligibility_audit.checks?.map((check, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-[#0c0e16] p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">{check.label}</span>
                    {check.passed ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Passed
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Attention
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-400 mt-1 leading-snug">
                    {check.message}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Required: {check.required}
                </div>
              </div>
            ))}
          </div>

          {/* Actionable recommendations */}
          {eligibility_audit.recommendations?.length > 0 && (
            <div className="mt-4 p-3.5 rounded-lg border border-indigo-900/40 bg-indigo-950/20 text-xs text-indigo-200">
              <span className="font-semibold block text-indigo-300 mb-1">Actionable Requirements:</span>
              <ul className="list-disc list-inside space-y-1">
                {eligibility_audit.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Section: Squad Members Directory & Pending Join Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Squad Members Directory (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-[17px] font-semibold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Squad Members ({members.length}/{team.people_required || 4})</span>
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Current enrolled teammates and verified college credentials.
              </p>
            </div>

            {isOwner && members.length > 1 && (
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Transfer Leadership
              </button>
            )}
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border border-slate-800 bg-[#0c0e16] p-3.5 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center shrink-0">
                      {member.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/users/${member.id}`}
                        className="text-[14px] font-semibold text-white hover:text-indigo-300 truncate"
                      >
                        {member.full_name}
                      </Link>
                      {member.isOwner && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded">
                          <Crown className="w-3 h-3 text-amber-400" /> Lead
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-indigo-400 font-medium truncate mt-0.5">
                      {member.role || member.primary_role}
                    </p>

                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      <span>{member.college_name || 'Affiliated College'}</span>
                      {member.gender && <span className="text-slate-600"> • </span>}
                      {member.gender && <span className="capitalize">{member.gender}</span>}
                    </div>

                    {member.skills_offered?.length > 0 && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Skills: {member.skills_offered.slice(0, 3).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/users/${member.id}`}
                    className="text-xs text-slate-400 hover:text-white font-medium"
                  >
                    Profile
                  </Link>
                  {isOwner && !member.isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.application_id)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join Requests & Invitations Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Join Requests */}
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-[17px] font-semibold text-white tracking-tight">
                Join Requests ({pending_applications.length})
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Students requesting to join this hackathon roster.
              </p>
            </div>

            {pending_applications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No pending join requests right now.
              </p>
            ) : (
              <div className="space-y-3">
                {pending_applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-slate-800 bg-[#0c0e16] p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/users/${app.applicant?.id}`}
                          className="text-[13px] font-semibold text-white hover:text-indigo-300"
                        >
                          {app.applicant?.full_name}
                        </Link>
                        <p className="text-[11px] text-indigo-400">
                          {app.applicant?.primary_role} · {app.applicant?.college_name}
                        </p>
                      </div>

                      {app.match && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                          {app.match.score}% Match
                        </span>
                      )}
                    </div>

                    {app.message && (
                      <p className="text-xs text-slate-300 bg-[#141724] p-2 rounded border border-slate-800/80 leading-normal">
                        "{app.message}"
                      </p>
                    )}

                    {isOwner && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAcceptApplication(app.id)}
                          className="flex-1 py-1 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer text-center"
                        >
                          Accept to Team
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(app.id)}
                          className="py-1 px-2.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer text-center"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Invitations Tracker */}
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-white tracking-tight">
                  Sent Invitations ({invitations.length})
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Direct invitations sent to candidate builders.
                </p>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  + New Invite
                </button>
              )}
            </div>

            {invitations.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">
                No active invitations sent yet.
              </p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-slate-800 bg-[#0c0e16] p-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{inv.invitee?.full_name || 'Invited Student'}</p>
                      <p className="text-[11px] text-slate-400">
                        Role: {inv.role} · <span className="capitalize text-slate-300">{inv.status}</span>
                      </p>
                    </div>

                    {isOwner && inv.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-red-400 hover:text-red-300 font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mentorship Support Section */}
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-white tracking-tight flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Mentor Guidance</span>
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Assigned faculty and industry advisors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMentorModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Request Mentor
              </button>
            </div>

            {mentor_requests.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-800 rounded-lg p-4">
                <p>No mentor sessions booked yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Get architectural review, pitch feedback, and model validation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mentor_requests.map((mr) => (
                  <div key={mr.id} className="rounded-lg border border-slate-800 bg-[#0c0e16] p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{mr.mentor_name || 'Assigned Mentor'}</span>
                      <span className="capitalize font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                        {mr.status}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium">Topic: {mr.topic}</p>
                    {mr.meeting_details && (
                      <p className="text-[11px] text-slate-400">{mr.meeting_details}</p>
                    )}
                    {mr.session_notes && (
                      <div className="p-2 rounded bg-[#141724] border border-slate-800 text-[11px] text-slate-300 mt-1">
                        <span className="font-semibold text-indigo-300 block mb-0.5">Session Feedback:</span>
                        {mr.session_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Merge Proposals (Mutual Leader Approval) */}
          {merge_candidates?.length > 0 && isOwner && (
            <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 shadow-sm space-y-3">
              <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-1.5">
                    <GitMerge className="w-4 h-4 text-indigo-400" />
                    <span>Incomplete Squad Merge</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Combine forces with another squad for {team.hackathon_name}.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {merge_candidates.map((mc) => (
                  <div key={mc.id} className="p-2.5 rounded-lg border border-slate-800 bg-[#0c0e16] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white truncate max-w-xs">{mc.title}</p>
                      <p className="text-[11px] text-slate-400">Needs {mc.people_required || 4} people</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMergeForm({ target_team_id: mc.id, message: '' });
                        setShowMergeModal(true);
                      }}
                      className="py-1 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                    >
                      Propose Merge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Teammate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Invite Teammate to Squad</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Candidate:</label>
                <select
                  required
                  value={inviteForm.invitee_id}
                  onChange={(e) => setInviteForm({ ...inviteForm, invitee_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose eligible student --</option>
                  {eligibleStudents.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0c0e16]">
                      {s.full_name} ({s.primary_role} · {s.college_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Proposed Squad Role:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI/ML Engineer, IoT Specialist..."
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Invitation Message:</label>
                <textarea
                  rows={3}
                  placeholder="Hey, we'd love for you to join our hackathon squad to work on..."
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="py-1.5 px-3 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="py-1.5 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submittingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Mentor Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Request Expert Mentorship</h3>
              <button onClick={() => setShowMentorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestMentor} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Mentor:</label>
                <select
                  required
                  value={mentorForm.mentor_id}
                  onChange={(e) => setMentorForm({ ...mentorForm, mentor_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose verified mentor --</option>
                  {mentorList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0c0e16]">
                      {m.full_name} ({m.title} · {m.organization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Consultation Topic:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model inference latency optimization, pitch deck review..."
                  value={mentorForm.topic}
                  onChange={(e) => setMentorForm({ ...mentorForm, topic: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Context for Mentor:</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what your squad has built so far and the specific blockers..."
                  value={mentorForm.message}
                  onChange={(e) => setMentorForm({ ...mentorForm, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="py-1.5 px-3 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMentor}
                  className="py-1.5 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submittingMentor ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Propose Squad Merge</h3>
              <button onClick={() => setShowMergeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProposeMerge} className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Merging allows two incomplete squads for the same hackathon to combine rosters into a single competitive team with mutual consent.
              </p>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Note to Target Leader:</label>
                <textarea
                  rows={3}
                  placeholder="Hey, we noticed your squad has a complementary backend stack. Let's merge our teams..."
                  value={mergeForm.message}
                  onChange={(e) => setMergeForm({ ...mergeForm, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="py-1.5 px-3 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMerge}
                  className="py-1.5 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submittingMerge ? 'Proposing...' : 'Propose Merge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Leadership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-800 bg-[#111420] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Transfer Squad Leadership</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select an active accepted squad member to receive team ownership:
              </p>

              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose member --</option>
                {members.filter((m) => !m.isOwner).map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0c0e16]">
                    {m.full_name} ({m.primary_role})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="py-1.5 px-3 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!transferTargetId}
                  onClick={handleTransferLeadership}
                  className="py-1.5 px-4 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
