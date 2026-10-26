/**
 * Deterministic Matching & Compatibility Engine for Hackathon Teams
 * Calculates transparent, explainable 0-100% compatibility scores and team readiness.
 * No pseudo-AI or randomized scores.
 */

// Canonical roles recognized across hackathon teams
export const HACKATHON_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'AI/ML Engineer',
  'Full Stack Developer',
  'Mobile Developer',
  'Cloud / DevOps Engineer',
  'Product / Pitch Lead',
];

export const HACKATHON_TRACKS = [
  'AI / Machine Learning',
  'Healthcare & MedTech',
  'FinTech & Web3',
  'Education & EdTech',
  'Sustainability & CleanTech',
  'Cybersecurity & Privacy',
  'Open Innovation',
  'Mobile & AR/VR',
];

/**
 * Normalizes a role string to match known patterns.
 */
function normalizeRole(role = '') {
  const r = role.toLowerCase().trim();
  if (r.includes('front')) return 'Frontend Developer';
  if (r.includes('back')) return 'Backend Developer';
  if (r.includes('ui') || r.includes('ux') || r.includes('design')) return 'UI/UX Designer';
  if (r.includes('ai') || r.includes('ml') || r.includes('machine') || r.includes('data')) return 'AI/ML Engineer';
  if (r.includes('full')) return 'Full Stack Developer';
  if (r.includes('mobile') || r.includes('android') || r.includes('ios')) return 'Mobile Developer';
  if (r.includes('devops') || r.includes('cloud')) return 'Cloud / DevOps Engineer';
  if (r.includes('product') || r.includes('pitch') || r.includes('lead')) return 'Product / Pitch Lead';
  return role;
}

/**
 * Computes missing roles for a team listing based on accepted applicants and owner.
 */
export function computeTeamRoleGaps(listing, members = []) {
  const requiredRoles = Array.isArray(listing.required_roles) ? listing.required_roles : [];
  
  // Filled roles from members
  const filledRoles = members
    .map((m) => m.primary_role || m.role)
    .filter(Boolean)
    .map(normalizeRole);

  const missingRoles = [];
  const filledRequiredRoles = [];

  for (const reqRole of requiredRoles) {
    const normalizedReq = normalizeRole(reqRole);
    const countRequired = requiredRoles.filter((r) => normalizeRole(r) === normalizedReq).length;
    const countFilled = filledRoles.filter((r) => r === normalizedReq).length;

    if (countFilled < countRequired) {
      if (!missingRoles.includes(reqRole)) {
        missingRoles.push(reqRole);
      }
    } else {
      if (!filledRequiredRoles.includes(reqRole)) {
        filledRequiredRoles.push(reqRole);
      }
    }
  }

  return {
    requiredRoles,
    filledRoles,
    missingRoles,
    filledRequiredRoles,
  };
}

/**
 * Calculates Team Readiness Score (0-100%).
 * Evaluates:
 * - Member capacity filling (35 points)
 * - Required role coverage (40 points)
 * - Skill diversity coverage (25 points)
 */
export function calculateTeamReadiness(listing, members = []) {
  const capacity = listing.people_required || 4;
  const currentCount = members.length;
  
  // 1. Capacity ratio (0 to 35)
  const capacityScore = Math.min(35, Math.round((currentCount / capacity) * 35));

  // 2. Role coverage (0 to 40)
  const { requiredRoles, missingRoles } = computeTeamRoleGaps(listing, members);
  let roleScore = 40;
  if (requiredRoles.length > 0) {
    const filledCount = requiredRoles.length - missingRoles.length;
    roleScore = Math.round((Math.max(0, filledCount) / requiredRoles.length) * 40);
  }

  // 3. Technical skill coverage (0 to 25)
  const neededSkills = (listing.team_skills_needed || listing.tags || []).map((s) => s.toLowerCase());
  const allTeamSkills = new Set();
  members.forEach((m) => {
    (m.skills_offered || []).forEach((s) => allTeamSkills.add(s.toLowerCase()));
  });

  let skillCoverageScore = 15;
  if (neededSkills.length > 0) {
    const covered = neededSkills.filter((ns) => allTeamSkills.has(ns));
    skillCoverageScore = Math.round((covered.length / neededSkills.length) * 25);
  } else if (allTeamSkills.size >= 4) {
    skillCoverageScore = 25;
  }

  const totalScore = Math.min(100, capacityScore + roleScore + skillCoverageScore);

  let statusLabel = 'Looking for Teammates';
  if (totalScore >= 90) statusLabel = 'Hackathon Ready';
  else if (totalScore >= 70) statusLabel = 'Well Balanced';
  else if (totalScore >= 45) statusLabel = 'Core Forming';

  return {
    score: totalScore,
    statusLabel,
    capacity,
    currentCount,
    missingRoles,
    neededSkills,
    coveredSkillsCount: neededSkills.filter((ns) => allTeamSkills.has(ns)).length,
  };
}

/**
 * Calculates deterministic match score (0-100) between a student candidate and a team listing.
 * Returns score breakdown and simple English explanation.
 */
export function calculateCandidateMatch(candidate, listing, members = []) {
  const { missingRoles, requiredRoles } = computeTeamRoleGaps(listing, members);
  const candidateRole = normalizeRole(candidate.primary_role);

  // 1. Role Match (40 points max)
  let rolePoints = 0;
  let roleExplanation = '';
  const isDirectMissingRole = missingRoles.some((mr) => normalizeRole(mr) === candidateRole);

  if (isDirectMissingRole) {
    rolePoints = 40;
    roleExplanation = `Fills your missing role: ${candidate.primary_role}`;
  } else if (requiredRoles.some((rr) => normalizeRole(rr) === candidateRole)) {
    rolePoints = 25;
    roleExplanation = `Matches required role (${candidate.primary_role}), though another member also shares this role`;
  } else if (candidate.primary_role) {
    rolePoints = 15;
    roleExplanation = `Offers complementary skill set as ${candidate.primary_role}`;
  } else {
    rolePoints = 10;
    roleExplanation = 'General contributor without specified primary role';
  }

  // 2. Skill Complementarity (30 points max)
  const neededSkills = (listing.team_skills_needed || listing.tags || []).map((s) => s.toLowerCase());
  const candidateSkills = (candidate.skills_offered || []).map((s) => s.toLowerCase());
  
  const matchedSkills = neededSkills.filter((ns) => candidateSkills.includes(ns));
  let skillPoints = 0;
  let skillExplanation = '';

  if (neededSkills.length === 0) {
    skillPoints = candidateSkills.length > 0 ? 25 : 10;
    skillExplanation = `Offers ${candidate.skills_offered?.slice(0, 3).join(', ') || 'diverse technical skills'}`;
  } else if (matchedSkills.length >= 3) {
    skillPoints = 30;
    skillExplanation = `Brings key stack skills: ${matchedSkills.slice(0, 3).join(', ')}`;
  } else if (matchedSkills.length === 2) {
    skillPoints = 24;
    skillExplanation = `Matches requested skills: ${matchedSkills.join(', ')}`;
  } else if (matchedSkills.length === 1) {
    skillPoints = 16;
    skillExplanation = `Has requested skill: ${matchedSkills[0]}`;
  } else {
    // Check if they bring valuable general skills
    skillPoints = candidateSkills.length > 0 ? 10 : 5;
    skillExplanation = `Brings alternative skills (${candidateSkills.slice(0, 2).join(', ') || 'adaptable'})`;
  }

  // 3. Hackathon Track / Interest Alignment (15 points max)
  const candidateInterests = (candidate.interests || []).map((i) => i.toLowerCase());
  const teamTheme = (listing.hackathon_theme || listing.title || '').toLowerCase();
  
  let trackPoints = 0;
  let trackExplanation = '';

  const matchedInterest = candidateInterests.find((interest) =>
    teamTheme.includes(interest) || interest.split(' ').some((word) => word.length > 3 && teamTheme.includes(word))
  );

  if (matchedInterest) {
    trackPoints = 15;
    trackExplanation = `Shares interest in ${matchedInterest}`;
  } else if (candidateInterests.length > 0) {
    trackPoints = 10;
    trackExplanation = `Passionate about ${candidate.interests[0]}`;
  } else {
    trackPoints = 5;
    trackExplanation = 'Open to multidisciplinary hackathon topics';
  }

  // 4. Availability & Readiness (15 points max)
  const avail = candidate.availability || 'Actively Seeking Team';
  let availPoints = 0;
  let availExplanation = '';

  if (avail.includes('Actively') || avail.includes('Seeking') || avail.includes('Weekend')) {
    availPoints = 15;
    availExplanation = `Fully available (${avail})`;
  } else if (avail.includes('15-20') || avail.includes('Part-time') || avail.includes('Available')) {
    availPoints = 12;
    availExplanation = `Good availability: ${avail}`;
  } else if (avail.includes('Unavailable') || avail.includes('Full')) {
    availPoints = 2;
    availExplanation = 'Limited or busy availability';
  } else {
    availPoints = 8;
    availExplanation = avail;
  }

  const score = Math.min(100, Math.max(10, rolePoints + skillPoints + trackPoints + availPoints));

  // Construct cohesive plain English summary
  const reasons = [roleExplanation, skillExplanation, trackExplanation, availExplanation].filter(Boolean);
  const summaryExplanation = `${score}% Match — ${reasons.join('. ')}.`;

  return {
    score,
    breakdown: {
      roleScore: { points: rolePoints, max: 40, detail: roleExplanation },
      skillScore: { points: skillPoints, max: 30, detail: skillExplanation },
      trackScore: { points: trackPoints, max: 15, detail: trackExplanation },
      availabilityScore: { points: availPoints, max: 15, detail: availExplanation },
    },
    matchedSkills,
    isDirectMissingRole,
    summaryExplanation,
  };
}
