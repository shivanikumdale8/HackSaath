import { Link } from 'react-router-dom';
import { Award, ShieldCheck, Users, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';

export default function ListingCard({ listing }) {
  const { user } = useAuth();
  const isFreelance = listing.mode === 'freelance';
  const isTeam = listing.mode === 'team';
  const isCompleted = listing.status === 'completed';
  const hasImage = Boolean(listing.image_url);
  const isExpired = isFreelance && listing.deadline && new Date(listing.deadline) < new Date();

  const missingRoles = listing.gaps?.missingRoles || listing.required_roles || [];
  const readiness = listing.readiness;
  const memberCount = listing.member_count || 1;
  const capacity = listing.people_required || 4;
  const isFull = memberCount >= capacity;
  const teamStatus = listing.team_status || (isFull || listing.status === 'closed' ? 'locked' : 'open');

  const isUserMember = user && (
    listing.owner_id === user.id ||
    listing.assigned_users?.some((u) => u.id === user.id)
  );

  return (
    <div
      className={`rounded-2xl border border-[#1e2a44] bg-[#0c1224] p-5 shadow-sm transition hover:border-teal-500/40 flex flex-col justify-between ${
        isExpired || isCompleted ? 'opacity-85' : ''
      }`}
    >
      <div>
        {hasImage && (
          <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl">
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-36 object-cover"
            />
          </div>
        )}

        {/* Top Badges Bar */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isCompleted
                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                  : isExpired
                  ? 'bg-slate-800 text-slate-400'
                  : isFreelance
                  ? 'bg-amber-950/60 border border-amber-500/30 text-amber-300'
                  : isTeam
                  ? 'bg-teal-950/60 border border-teal-500/40 text-teal-300'
                  : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
              }`}
            >
              {isCompleted
                ? 'Completed'
                : isExpired
                ? 'Expired'
                : isFreelance
                ? 'Freelance'
                : isTeam
                ? 'Hackathon Squad'
                : 'Skill Swap'}
            </span>

            {isTeam && listing.hackathon_name && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#111a33] border border-[#1e2a44] px-2 py-0.5 text-[11px] font-medium text-slate-300 truncate max-w-[170px]">
                <Award className="w-3 h-3 text-teal-400" />
                <span className="truncate">{listing.hackathon_name}</span>
              </span>
            )}

            {isTeam && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${
                  isFull || teamStatus === 'locked'
                    ? 'bg-red-950/50 border-red-500/30 text-red-300'
                    : teamStatus === 'ready'
                    ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#111a33] border-[#1e2a44] text-slate-300'
                }`}
              >
                {isFull ? 'Squad Full' : teamStatus.toUpperCase()}
              </span>
            )}
          </div>

          {isFreelance ? (
            <span className="text-sm font-semibold text-white">₹{listing.budget}</span>
          ) : isTeam ? (
            <span className="text-xs font-mono font-medium text-teal-300 bg-[#070b14] px-2 py-0.5 rounded-md border border-[#1e2a44]">
              {memberCount}/{capacity} Members
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              {listing.skill_offered} → {listing.skill_wanted}
            </span>
          )}
        </div>

        <Link to={`/listings/${listing.id}`} className="group block">
          <h3 className="font-semibold text-white text-[15px] group-hover:text-teal-400 transition-colors">
            {listing.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-300 leading-relaxed">
            {listing.description}
          </p>
        </Link>

        {/* Institution Eligibility Badge */}
        {isTeam && listing.institution_policy && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Building2 className="w-3 h-3 text-teal-400" />
            <span>
              {listing.institution_policy === 'same_institution'
                ? 'Same College Only (SIH Compliant)'
                : 'Cross-College Allowed'}
            </span>
            {listing.college_name && (
              <span className="text-slate-500 truncate">· {listing.college_name}</span>
            )}
          </div>
        )}

        {/* Team Readiness & Missing Roles Bar */}
        {isTeam && (
          <div className="mt-3 rounded-xl border border-[#1e2a44] bg-[#070b14] p-2.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-400">Squad Readiness</span>
              <span className="font-semibold text-teal-400">
                {readiness ? `${readiness.score}% • ${readiness.statusLabel}` : 'Forming Squad'}
              </span>
            </div>

            <div className="h-1.5 w-full bg-[#111a33] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (readiness?.score || 30) >= 80
                    ? 'bg-emerald-500'
                    : (readiness?.score || 30) >= 50
                    ? 'bg-teal-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${readiness?.score || 30}%` }}
              />
            </div>

            {!isFull && missingRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-amber-400">
                  Open Roles:
                </span>
                {missingRoles.slice(0, 3).map((role) => (
                  <span
                    key={role}
                    className="rounded-md bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-300"
                  >
                    {role}
                  </span>
                ))}
                {missingRoles.length > 3 && (
                  <span className="text-[10px] text-slate-500">+{missingRoles.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {(listing.tags ?? []).slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#111a33] border border-[#1e2a44] px-2 py-0.5 text-[11px] text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-[#1e2a44] flex items-center justify-between text-xs">
        <div className="text-slate-400">
          {listing.deadline && (
            <span>
              {isExpired ? 'Ended ' : 'Deadline '}{formatDate(listing.deadline)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isTeam && isUserMember && (
            <Link
              to={`/workspace/${listing.id}`}
              className="rounded-lg px-2.5 py-1 bg-teal-500/15 border border-teal-500/40 text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition-colors font-semibold text-xs"
            >
              Workspace
            </Link>
          )}

          <Link
            to={`/listings/${listing.id}`}
            className="rounded-lg px-2.5 py-1 bg-[#111a33] hover:bg-[#182444] border border-[#1e2a44] text-slate-200 transition-colors font-medium text-xs"
          >
            {isTeam ? (isFull ? 'View Squad' : 'View & Join') : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  );
}
