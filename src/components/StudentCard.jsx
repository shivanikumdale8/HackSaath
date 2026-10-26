import { Link } from 'react-router-dom';
import { ExternalLink, Github } from 'lucide-react';

/**
 * Standardized StudentCard Component
 * Implements the 10-point information hierarchy:
 * 1. Profile picture or initials placeholder
 * 2. Student name (17-20px, semibold)
 * 3. Primary role or area of interest
 * 4. College and academic year, if available
 * 5. Relevant skills
 * 6. Skills the student can teach
 * 7. Skills the student wants to learn
 * 8. Availability, if provided
 * 9. GitHub, portfolio, or project links, if available
 * 10. Relevant actions: "View Profile" and "Connect"
 */
export default function StudentCard({
  student,
  onConnect,
  connectLabel = 'Connect',
  extraBadge = null,
}) {
  if (!student) return null;

  const name = student.full_name || student.name || 'Student';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const role = student.primary_role || student.primaryRole || 'Student Builder';
  const college = student.college_name || student.college || '';
  const academicYear = student.year_of_study || student.degree || '';
  const availability = student.availability || '';
  const skills = Array.isArray(student.skills) && student.skills.length > 0
    ? student.skills
    : student.interests ?? [];
  const skillsOffered = student.skills_offered ?? [];
  const skillsWanted = student.skills_wanted ?? [];
  const githubUrl = student.github_url || student.githubUrl || '';
  const portfolioUrl = student.portfolio_url || student.portfolioUrl || '';
  const profileId = student.id;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111420] p-5 transition-all duration-200 hover:border-slate-700 flex flex-col justify-between">
      <div>
        {/* 1, 2, 3, 4: Header Block with Avatar, Name, Role, College & Year */}
        <div className="flex items-start gap-3.5">
          {/* 1. Profile picture or initials placeholder */}
          <div className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center shrink-0 overflow-hidden">
            {student.avatar_url || student.avatar ? (
              <img
                src={student.avatar_url || student.avatar}
                alt={name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              {/* 2. Student name */}
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-white tracking-tight truncate">
                {name}
              </h3>
              {extraBadge}
            </div>

            {/* 3. Primary role or area of interest */}
            <p className="text-[14px] text-indigo-400 font-medium truncate mt-0.5">
              {role}
            </p>

            {/* 4. College and academic year */}
            {(college || academicYear) && (
              <div className="text-[13px] text-slate-400 truncate mt-0.5">
                {college}
                {college && academicYear && <span className="mx-1.5 text-slate-600">·</span>}
                {academicYear}
              </div>
            )}
          </div>
        </div>

        {/* 5. Relevant Skills */}
        {skills.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-[13px]">
            <span className="text-slate-400 font-medium">Relevant skills: </span>
            <span className="text-slate-300">
              {skills.slice(0, 5).join(' · ')}
            </span>
          </div>
        )}

        {/* 6. Skills the student can teach */}
        {skillsOffered.length > 0 && (
          <div className="mt-2 text-[13px]">
            <span className="text-emerald-400 font-medium">Can teach: </span>
            <span className="text-slate-300">
              {skillsOffered.slice(0, 4).join(' · ')}
            </span>
          </div>
        )}

        {/* 7. Skills the student wants to learn */}
        {skillsWanted.length > 0 && (
          <div className="mt-2 text-[13px]">
            <span className="text-amber-400 font-medium">Wants to learn: </span>
            <span className="text-slate-300">
              {skillsWanted.slice(0, 4).join(' · ')}
            </span>
          </div>
        )}

        {/* 8. Availability */}
        {availability && (
          <div className="mt-2 text-[13px] text-slate-400">
            <span className="font-medium text-slate-400">Availability: </span>
            <span className="text-slate-300">{availability}</span>
          </div>
        )}

        {/* 9. GitHub, portfolio, or project links */}
        {(githubUrl || portfolioUrl) && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-4 text-[13px]">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}
            {portfolioUrl && (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* 10. Relevant actions: "View Profile" and "Connect" */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        {profileId ? (
          <Link
            to={`/users/${profileId}`}
            className="text-[13px] sm:text-[14px] font-medium text-slate-300 hover:text-white transition-colors"
          >
            View Profile
          </Link>
        ) : (
          <span className="text-[13px] text-slate-500">Registered Student</span>
        )}

        {onConnect && (
          <button
            type="button"
            onClick={() => onConnect(student)}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-[13px] sm:text-[14px] font-medium text-white shadow-sm transition-colors cursor-pointer"
          >
            {connectLabel}
          </button>
        )}
      </div>
    </div>
  );
}
