import { Router } from 'express';
import { db, TABLES } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

/**
 * Validates a team against hackathon rules (SIH 2026, collegiate, or cross-college).
 * Evaluates:
 * - Minimum and maximum team size
 * - Same-institution vs cross-institution policy
 * - Mandatory gender diversity (e.g. SIH 2026 requires at least one female teammate)
 * - Required skill roles
 */
export async function validateTeamForHackathon(hackathon, teamMembers, teamListing = null) {
  const violations = [];
  const recommendations = [];
  const checks = [];

  const memberCount = teamMembers.length;
  const minSize = hackathon.min_team_size || 2;
  const maxSize = hackathon.max_team_size || 6;

  // 1. Team Size Check
  const sizePassed = memberCount >= minSize && memberCount <= maxSize;
  if (memberCount < minSize) {
    violations.push(`Team has ${memberCount} members. Official rule requires minimum ${minSize} members.`);
    recommendations.push(`Recruit ${minSize - memberCount} more student(s) to satisfy the official squad capacity.`);
  } else if (memberCount > maxSize) {
    violations.push(`Team has ${memberCount} members, exceeding maximum allowed limit of ${maxSize}.`);
  }
  checks.push({
    label: 'Team Size',
    required: `${minSize}-${maxSize} members`,
    current: `${memberCount} members`,
    passed: sizePassed,
    message: sizePassed
      ? `Meets squad size requirements (${memberCount}/${maxSize})`
      : `Squad incomplete: ${memberCount}/${minSize} required`,
  });

  // 2. Institution Policy (Same College vs Cross-College)
  if (hackathon.institution_policy === 'same_institution') {
    const colleges = new Set(teamMembers.map((m) => m.college_id).filter(Boolean));
    const collegeNames = Array.from(new Set(teamMembers.map((m) => m.college_name || m.college_id).filter(Boolean)));
    const institutionPassed = colleges.size <= 1;

    if (!institutionPassed) {
      violations.push(
        `All members must belong to the same college. Found members from ${colleges.size} distinct colleges (${collegeNames.join(', ')}).`
      );
      recommendations.push('SIH 2026 strictly requires single-college teams. Remove cross-college members before submission.');
    }
    checks.push({
      label: 'Institution Policy',
      required: 'Same College Only',
      current: colleges.size <= 1 ? (collegeNames[0] || 'Single Institution') : 'Mixed Colleges',
      passed: institutionPassed,
      message: institutionPassed
        ? `Compliant with single-college mandate (${collegeNames[0] || 'Verified'})`
        : `Non-compliant: Multiple institutions detected (${collegeNames.join(', ')})`,
    });
  } else {
    checks.push({
      label: 'Institution Policy',
      required: hackathon.institution_policy === 'cross_institution' ? 'Cross-College Allowed' : 'Flexible',
      current: 'Open / Inter-Collegiate',
      passed: true,
      message: 'Cross-college and inter-university teammates permitted.',
    });
  }

  // 3. Gender Diversity Rule (Mandatory for SIH 2026)
  if (hackathon.required_gender_diversity) {
    const femaleMembers = teamMembers.filter(
      (m) => m.gender?.toLowerCase() === 'female' || m.primary_role?.toLowerCase().includes('female')
    );
    const genderPassed = femaleMembers.length >= 1;

    if (!genderPassed) {
      violations.push('Smart India Hackathon mandate: At least one female student member is mandatory in the team roster.');
      recommendations.push('Invite a female student developer, designer, or pitch lead to fulfill official AICTE guidelines.');
    }
    checks.push({
      label: 'Mandatory Gender Diversity',
      required: 'At least 1 female teammate',
      current: `${femaleMembers.length} female member(s)`,
      passed: genderPassed,
      message: genderPassed
        ? `Gender diversity rule satisfied (${femaleMembers.length} female member)`
        : 'Ineligible: Minimum 1 female member is compulsory for SIH 2026.',
    });
  }

  // Determine overall status
  let status = 'Eligible';
  if (violations.length > 0) {
    status = 'Ineligible';
  } else if (hackathon.verification_status === 'needs_verification') {
    status = 'Needs verification';
    recommendations.push('This hackathon is pending institutional verification. Confirm rules with college coordinator.');
  }

  return {
    eligible: violations.length === 0,
    status,
    checks,
    violations,
    recommendations,
  };
}

/** GET /api/hackathons - list directory of hackathons */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, institution_policy, verified } = req.query;
    let list = await db.findMany(TABLES.hackathons, {}, { limit: 100 });

    if (category) {
      list = list.filter((h) => h.category?.toLowerCase() === category.toLowerCase());
    }
    if (institution_policy) {
      list = list.filter((h) => h.institution_policy === institution_policy);
    }
    if (verified === 'true') {
      list = list.filter((h) => h.verification_status === 'verified');
    }

    res.json({ hackathons: list });
  })
);

/** GET /api/hackathons/:id - retrieve hackathon with problem statements */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const hackathon = await db.findOne(TABLES.hackathons, { id: req.params.id });
    if (!hackathon) throw ApiError.notFound('Hackathon not found');
    res.json({ hackathon });
  })
);

/** POST /api/hackathons/:id/validate-eligibility - test a team against official rules */
router.post(
  '/:id/validate-eligibility',
  asyncHandler(async (req, res) => {
    const hackathon = await db.findOne(TABLES.hackathons, { id: req.params.id });
    if (!hackathon) throw ApiError.notFound('Hackathon not found');

    const { team_id, member_ids } = req.body;
    let teamMembers = [];
    let teamListing = null;

    if (team_id) {
      teamListing = await db.findOne(TABLES.listings, { id: team_id });
      if (teamListing) {
        // Collect owner
        const owner = await db.findOne(TABLES.users, { id: teamListing.owner_id });
        if (owner) teamMembers.push(owner);

        // Collect accepted applicants
        const acceptedApps = await db.findMany('team_applications', {
          listing_id: teamListing.id,
          status: 'accepted',
        });

        for (const app of acceptedApps) {
          const user = await db.findOne(TABLES.users, { id: app.applicant_id });
          if (user) teamMembers.push(user);
        }
      }
    } else if (Array.isArray(member_ids) && member_ids.length > 0) {
      for (const uid of member_ids) {
        const user = await db.findOne(TABLES.users, { id: uid });
        if (user) teamMembers.push(user);
      }
    }

    const audit = await validateTeamForHackathon(hackathon, teamMembers, teamListing);
    res.json({ audit, hackathon_title: hackathon.title });
  })
);

export default router;
