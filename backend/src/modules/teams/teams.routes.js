import { Router } from 'express';
import { z } from 'zod';
import { db, TABLES } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  calculateCandidateMatch,
  calculateTeamReadiness,
  computeTeamRoleGaps,
} from '../../services/matchingService.js';
import { validateTeamForHackathon } from '../hackathons/hackathons.routes.js';

/**
 * Express API routes for hackathon teams module.
 * Provides team application handling, missing roles identification,
 * deterministic skill matching, team readiness scoring, invitations,
 * candidate discovery (Same-College vs Cross-College), workspace management,
 * and team merges.
 */
const router = Router();

const applySchema = z.object({
  listing_id: z.string().min(1),
  message: z.string().max(500).default(''),
});

const inviteSchema = z.object({
  invitee_id: z.string().min(1),
  role: z.string().min(2).max(60).default('Teammate'),
  message: z.string().max(500).default(''),
});

/** Helper to fetch all current members of a team (owner + accepted applicants) */
export async function getTeamMembers(listing) {
  const members = [];

  // Add owner
  const owner = await db.findOne(TABLES.users, { id: listing.owner_id });
  if (owner) {
    members.push({
      ...owner,
      isOwner: true,
      role: owner.primary_role || 'Team Lead',
    });
  }

  // Add accepted applicants
  const acceptedApps = await db.findMany('team_applications', {
    listing_id: listing.id,
    status: 'accepted',
  });

  for (const app of acceptedApps) {
    const user = await db.findOne(TABLES.users, { id: app.applicant_id });
    if (user) {
      members.push({
        ...user,
        application_id: app.id,
        isOwner: false,
        role: app.role || user.primary_role || 'Member',
      });
    }
  }

  return members;
}

/**
 * GET /api/teams/candidates
 * Discovers students with explicit Same-College vs Cross-College mode filtering.
 */
router.get(
  '/candidates',
  asyncHandler(async (req, res) => {
    const {
      mode = 'all', // 'same_college' | 'cross_college' | 'all'
      college_id,
      college_name,
      city,
      skills,
      year,
      availability,
      search,
    } = req.query;

    let allUsers = await db.findMany(TABLES.users, {}, { limit: 100 });

    // Exclude blocked users
    allUsers = allUsers.filter((u) => !u.is_blocked);

    // Filter by mode
    if (mode === 'same_college' && college_id) {
      allUsers = allUsers.filter((u) => u.college_id === college_id);
    } else if (mode === 'cross_college' && college_id) {
      allUsers = allUsers.filter((u) => u.college_id !== college_id);
    }

    // Filter by specific college name (Cross-College search filter)
    if (college_name) {
      const q = college_name.toLowerCase();
      allUsers = allUsers.filter((u) => u.college_name?.toLowerCase().includes(q));
    }

    // Filter by city
    if (city) {
      const q = city.toLowerCase();
      allUsers = allUsers.filter((u) => u.city?.toLowerCase().includes(q));
    }

    // Filter by academic year
    if (year && year !== 'All Years') {
      const q = year.toLowerCase();
      allUsers = allUsers.filter((u) => u.year_of_study?.toLowerCase().includes(q));
    }

    // Filter by availability
    if (availability && availability !== 'All Availability') {
      const q = availability.toLowerCase();
      allUsers = allUsers.filter((u) => u.availability?.toLowerCase().includes(q));
    }

    // Filter by skills
    if (skills) {
      const skillList = skills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (skillList.length > 0) {
        allUsers = allUsers.filter((u) => {
          const userSkills = (u.skills_offered || []).concat(u.skills || []).map((s) => s.toLowerCase());
          return skillList.some((s) => userSkills.includes(s));
        });
      }
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.toLowerCase();
      allUsers = allUsers.filter((u) => {
        const full = (u.full_name || '').toLowerCase();
        const role = (u.primary_role || '').toLowerCase();
        const cname = (u.college_name || '').toLowerCase();
        const skillsText = (u.skills_offered || []).concat(u.skills || []).join(' ').toLowerCase();
        return full.includes(q) || role.includes(q) || cname.includes(q) || skillsText.includes(q);
      });
    }

    const candidates = allUsers.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      email: u.email,
      bio: u.bio,
      primary_role: u.primary_role || 'General Contributor',
      experience_level: u.experience_level || 'Intermediate',
      year_of_study: u.year_of_study || '',
      availability: u.availability || 'Actively Seeking Team',
      gender: u.gender || 'unspecified',
      college_id: u.college_id,
      college_name: u.college_name || 'Affiliated College',
      city: u.city || '',
      github_url: u.github_url || '',
      portfolio_url: u.portfolio_url || '',
      skills_offered: u.skills_offered || u.skills || [],
      interests: u.interests || [],
      projects: u.projects || [],
      rating_average: u.rating_average || 5.0,
      rating_count: u.rating_count || 0,
    }));

    res.json({ candidates });
  })
);

/**
 * GET /api/teams/my-invitations
 * Returns pending invitations received by the authenticated student.
 */
router.get(
  '/my-invitations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const invites = await db.findMany(TABLES.team_invitations, {
      invitee_id: req.user.id,
    });

    const populated = [];
    for (const inv of invites) {
      const listing = await db.findOne(TABLES.listings, { id: inv.listing_id });
      const inviter = await db.findOne(TABLES.users, { id: inv.inviter_id });
      populated.push({
        ...inv,
        team_title: listing ? listing.title : 'Team Project',
        hackathon_name: listing ? listing.hackathon_name : '',
        hackathon_id: listing ? listing.hackathon_id : '',
        team_status: listing ? listing.status : 'closed',
        inviter_name: inviter ? inviter.full_name : 'Team Leader',
      });
    }

    res.json({ invitations: populated });
  })
);

/**
 * POST /api/teams/invitations/:id/respond
 * Respond to an invitation (accept, decline, or cancel).
 */
router.post(
  '/invitations/:id/respond',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { action } = req.body; // 'accept' | 'decline' | 'cancel'
    if (!['accept', 'decline', 'cancel'].includes(action)) {
      throw ApiError.badRequest('Invalid action');
    }

    const invitation = await db.findOne(TABLES.team_invitations, { id: req.params.id });
    if (!invitation) throw ApiError.notFound('Invitation not found');

    if (action === 'cancel') {
      if (invitation.inviter_id !== req.user.id) {
        throw ApiError.forbidden('Only the inviter can cancel an invitation');
      }
      const updated = await db.update(TABLES.team_invitations, { id: invitation.id }, { status: 'cancelled' });
      return res.json({ invitation: updated });
    }

    // Must be invitee for accept or decline
    if (invitation.invitee_id !== req.user.id) {
      throw ApiError.forbidden('Only the invited student can accept or decline');
    }

    if (action === 'decline') {
      const updated = await db.update(TABLES.team_invitations, { id: invitation.id }, { status: 'declined' });
      return res.json({ invitation: updated });
    }

    if (action === 'accept') {
      const listing = await db.findOne(TABLES.listings, { id: invitation.listing_id });
      if (!listing) throw ApiError.notFound('Team listing no longer exists');
      if (listing.status !== 'open') throw ApiError.conflict('This team is no longer accepting new members');

      // Check capacity
      const acceptedCount = (
        await db.findMany('team_applications', {
          listing_id: listing.id,
          status: 'accepted',
        })
      ).length;

      const maxAllowedTeammates = (listing.people_required || 4) - 1;
      if (acceptedCount >= maxAllowedTeammates) {
        throw ApiError.conflict(`Team is already full (${acceptedCount + 1}/${listing.people_required} members)`);
      }

      // Check one active team per hackathon rule
      if (listing.hackathon_id) {
        const existingOwned = await db.findOne(TABLES.listings, {
          owner_id: req.user.id,
          hackathon_id: listing.hackathon_id,
          mode: 'team',
        });
        if (existingOwned && existingOwned.status !== 'closed' && existingOwned.status !== 'cancelled') {
          throw ApiError.conflict(`You already lead an active team ("${existingOwned.title}") for this hackathon.`);
        }
      }

      // Update invitation
      await db.update(TABLES.team_invitations, { id: invitation.id }, { status: 'accepted' });

      // Create accepted application record
      const app = await db.insert('team_applications', {
        listing_id: listing.id,
        applicant_id: req.user.id,
        role: invitation.role,
        message: invitation.message,
        status: 'accepted',
      });

      return res.json({ message: 'Invitation accepted successfully', application: app });
    }
  })
);

/**
 * GET /api/teams/:id/workspace
 * Complete collaborative workspace state for a team.
 */
router.get(
  '/:id/workspace',
  requireAuth,
  asyncHandler(async (req, res) => {
    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Team not found');

    const members = await getTeamMembers(listing);
    const isMember = members.some((m) => m.id === req.user.id);
    const isOwner = listing.owner_id === req.user.id;

    if (!isMember && !isOwner) {
      throw ApiError.forbidden('Access restricted to verified team members');
    }

    // Pending applications (join requests)
    const applications = await db.findMany('team_applications', {
      listing_id: listing.id,
      status: 'pending',
    });

    for (const app of applications) {
      const user = await db.findOne(TABLES.users, { id: app.applicant_id });
      if (user) {
        app.applicant = {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          primary_role: user.primary_role,
          college_name: user.college_name,
          skills_offered: user.skills_offered,
          github_url: user.github_url,
        };
        app.match = calculateCandidateMatch(user, listing, members);
      }
    }

    // Sent invitations
    const invitations = await db.findMany(TABLES.team_invitations, {
      listing_id: listing.id,
    });
    for (const inv of invitations) {
      const user = await db.findOne(TABLES.users, { id: inv.invitee_id });
      if (user) {
        inv.invitee = {
          id: user.id,
          full_name: user.full_name,
          primary_role: user.primary_role,
          college_name: user.college_name,
        };
      }
    }

    // Hackathon eligibility audit
    let eligibilityAudit = null;
    if (listing.hackathon_id) {
      const hackathon = await db.findOne(TABLES.hackathons, { id: listing.hackathon_id });
      if (hackathon) {
        eligibilityAudit = await validateTeamForHackathon(hackathon, members, listing);
      }
    }

    // Mentorship requests for this team
    const mentorRequests = await db.findMany(TABLES.mentor_requests, {
      team_id: listing.id,
    });

    // Incomplete teams for the same hackathon (potential merge candidates)
    let mergeCandidates = [];
    if (listing.hackathon_id) {
      const otherTeams = await db.findMany(TABLES.listings, {
        hackathon_id: listing.hackathon_id,
        mode: 'team',
      });
      mergeCandidates = otherTeams
        .filter((t) => t.id !== listing.id && t.status === 'open')
        .slice(0, 5);
    }

    const readiness = calculateTeamReadiness(listing, members);
    const gaps = computeTeamRoleGaps(listing, members);

    res.json({
      team: listing,
      members,
      pending_applications: applications,
      invitations,
      eligibility_audit: eligibilityAudit,
      mentor_requests: mentorRequests,
      merge_candidates: mergeCandidates,
      readiness,
      gaps,
      isOwner,
    });
  })
);

/**
 * POST /api/teams/:id/invite
 * Team leader invites a candidate to join the team roster.
 */
router.post(
  '/:id/invite',
  requireAuth,
  asyncHandler(async (req, res) => {
    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Team not found');
    if (listing.owner_id !== req.user.id) {
      throw ApiError.forbidden('Only the team leader can send invitations');
    }

    const payload = inviteSchema.parse(req.body);

    // Verify invitee exists
    const invitee = await db.findOne(TABLES.users, { id: payload.invitee_id });
    if (!invitee) throw ApiError.notFound('Student not found');

    // Check if team is full
    const acceptedCount = (
      await db.findMany('team_applications', {
        listing_id: listing.id,
        status: 'accepted',
      })
    ).length;
    const maxAllowedTeammates = (listing.people_required || 4) - 1;
    if (acceptedCount >= maxAllowedTeammates) {
      throw ApiError.conflict('Team is already full');
    }

    // Check if invitee is already a member
    if (listing.owner_id === invitee.id) {
      throw ApiError.conflict('You cannot invite yourself');
    }
    const alreadyMember = await db.findOne('team_applications', {
      listing_id: listing.id,
      applicant_id: invitee.id,
      status: 'accepted',
    });
    if (alreadyMember) throw ApiError.conflict('Student is already in the team');

    // Check pending invite
    const existingInvite = await db.findOne(TABLES.team_invitations, {
      listing_id: listing.id,
      invitee_id: invitee.id,
      status: 'pending',
    });
    if (existingInvite) throw ApiError.conflict('An active invitation is already pending for this student');

    const invitation = await db.insert(TABLES.team_invitations, {
      listing_id: listing.id,
      inviter_id: req.user.id,
      invitee_id: invitee.id,
      role: payload.role,
      message: payload.message,
      status: 'pending',
    });

    res.status(201).json({ invitation });
  })
);

/**
 * PATCH /api/teams/:id/status
 * Update team lifecycle status (open, forming, ready, locked).
 */
router.patch(
  '/:id/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['open', 'forming', 'ready', 'locked'].includes(status)) {
      throw ApiError.badRequest('Invalid status. Allowed: open, forming, ready, locked');
    }

    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Team not found');
    if (listing.owner_id !== req.user.id) {
      throw ApiError.forbidden('Only the team leader can change the team status');
    }

    const updated = await db.update(
      TABLES.listings,
      { id: listing.id },
      {
        team_status: status,
        status: status === 'locked' ? 'closed' : 'open',
      }
    );

    res.json({ listing: updated });
  })
);

/**
 * POST /api/teams/:id/transfer-lead
 * Team leader transfers ownership to another member.
 */
router.post(
  '/:id/transfer-lead',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { new_leader_id } = req.body;
    if (!new_leader_id) throw ApiError.badRequest('new_leader_id is required');

    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Team not found');
    if (listing.owner_id !== req.user.id) {
      throw ApiError.forbidden('Only the current team leader can transfer leadership');
    }

    // Verify new leader is an accepted team member
    const memberApp = await db.findOne('team_applications', {
      listing_id: listing.id,
      applicant_id: new_leader_id,
      status: 'accepted',
    });
    if (!memberApp) throw ApiError.badRequest('New leader must be an active accepted member of this team');

    // Make old leader an accepted member
    await db.update('team_applications', { id: memberApp.id }, { applicant_id: req.user.id });

    // Update listing owner
    const updated = await db.update(TABLES.listings, { id: listing.id }, { owner_id: new_leader_id });

    res.json({ listing: updated, message: 'Leadership transferred successfully' });
  })
);

/**
 * POST /api/teams/:id/leave
 * Member leaves the team.
 */
router.post(
  '/:id/leave',
  requireAuth,
  asyncHandler(async (req, res) => {
    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Team not found');

    if (listing.owner_id === req.user.id) {
      throw ApiError.forbidden('Team leader cannot leave the team without transferring leadership first.');
    }

    const memberApp = await db.findOne('team_applications', {
      listing_id: listing.id,
      applicant_id: req.user.id,
      status: 'accepted',
    });
    if (!memberApp) throw ApiError.notFound('You are not an active member of this team');

    await db.update('team_applications', { id: memberApp.id }, { status: 'left' });

    res.json({ message: 'You have left the team successfully' });
  })
);

/**
 * POST /api/teams/:id/propose-merge
 * Propose merging with another incomplete team for the same hackathon.
 */
router.post(
  '/:id/propose-merge',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { target_team_id, message = '' } = req.body;
    if (!target_team_id) throw ApiError.badRequest('target_team_id is required');

    const sourceTeam = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!sourceTeam) throw ApiError.notFound('Source team not found');
    if (sourceTeam.owner_id !== req.user.id) {
      throw ApiError.forbidden('Only the source team leader can propose a merge');
    }

    const targetTeam = await db.findOne(TABLES.listings, { id: target_team_id });
    if (!targetTeam) throw ApiError.notFound('Target team not found');

    if (sourceTeam.hackathon_id !== targetTeam.hackathon_id) {
      throw ApiError.badRequest('Teams must be registered for the same hackathon to merge');
    }

    const merge = await db.insert(TABLES.team_merges, {
      source_team_id: sourceTeam.id,
      target_team_id: targetTeam.id,
      proposed_by: req.user.id,
      message,
      status: 'pending',
    });

    res.status(201).json({ merge });
  })
);

/**
 * GET /api/teams?listing_id=...
 * Every application on one team listing with match score.
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const listingId = req.query.listing_id;
    if (!listingId) throw ApiError.badRequest('listing_id query parameter is required');

    const listing = await db.findOne(TABLES.listings, { id: listingId });
    if (!listing) throw ApiError.notFound('Listing not found');

    let where = { listing_id: listingId };
    if (listing.owner_id !== req.user.id) {
      where.applicant_id = req.user.id;
    }

    const applications = await db.findMany('team_applications', where, { limit: 100 });
    const members = await getTeamMembers(listing);

    // Attach user details and calculated match score
    for (const app of applications) {
      const user = await db.findOne(TABLES.users, { id: app.applicant_id });
      if (user) {
        const matchData = calculateCandidateMatch(user, listing, members);
        app.applicant = {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          email: user.email,
          primary_role: user.primary_role,
          experience_level: user.experience_level,
          availability: user.availability,
          github_url: user.github_url,
          portfolio_url: user.portfolio_url,
          skills_offered: user.skills_offered,
          interests: user.interests,
        };
        app.match = matchData;
      }
    }

    res.json({ applications });
  })
);

/** GET /api/teams/:id/readiness - team readiness score and missing role breakdown. */
router.get(
  '/:id/readiness',
  asyncHandler(async (req, res) => {
    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Listing not found');

    const members = await getTeamMembers(listing);
    const gaps = computeTeamRoleGaps(listing, members);
    const readiness = calculateTeamReadiness(listing, members);

    res.json({
      readiness,
      gaps,
      members: members.map((m) => ({
        id: m.id,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
        primary_role: m.primary_role,
        skills_offered: m.skills_offered,
        github_url: m.github_url,
        isOwner: m.isOwner,
      })),
    });
  })
);

/** GET /api/teams/:id/recommendations - find complementary student teammates with deterministic scores. */
router.get(
  '/:id/recommendations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const listing = await db.findOne(TABLES.listings, { id: req.params.id });
    if (!listing) throw ApiError.notFound('Listing not found');

    const members = await getTeamMembers(listing);
    const memberIds = new Set(members.map((m) => m.id));

    // Get all students in the database
    const allUsers = await db.findMany(TABLES.users, {}, { limit: 100 });

    const candidates = [];
    for (const candidate of allUsers) {
      if (memberIds.has(candidate.id)) continue;
      if (candidate.is_blocked) continue;

      const match = calculateCandidateMatch(candidate, listing, members);

      candidates.push({
        id: candidate.id,
        full_name: candidate.full_name,
        avatar_url: candidate.avatar_url,
        email: candidate.email,
        bio: candidate.bio,
        primary_role: candidate.primary_role || 'General Contributor',
        experience_level: candidate.experience_level || 'Intermediate',
        year_of_study: candidate.year_of_study || '',
        availability: candidate.availability || 'Actively Seeking Team',
        github_url: candidate.github_url || '',
        portfolio_url: candidate.portfolio_url || '',
        skills_offered: candidate.skills_offered || [],
        interests: candidate.interests || [],
        projects: candidate.projects || [],
        rating_average: candidate.rating_average || 0,
        college_id: candidate.college_id,
        college_name: candidate.college_name,
        match,
      });
    }

    candidates.sort((a, b) => b.match.score - a.match.score);
    res.json({ candidates });
  })
);

/** POST /api/teams - apply for a team listing. */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = applySchema.parse(req.body);

    const listing = await db.findOne(TABLES.listings, { id: payload.listing_id });
    if (!listing) throw ApiError.notFound('Listing not found');
    if (listing.mode !== 'team') throw ApiError.badRequest('Only team listings take team applications');
    if (listing.status !== 'open') throw ApiError.conflict('This team is closed and not accepting new applicants');
    if (listing.owner_id === req.user.id) throw ApiError.forbidden('You cannot apply to your own team');

    const existing = await db.findOne('team_applications', {
      listing_id: listing.id,
      applicant_id: req.user.id,
    });
    if (existing && existing.status !== 'removed' && existing.status !== 'left') {
      throw ApiError.conflict('You have already applied to this team');
    }

    // Check one active team per hackathon rule
    if (listing.hackathon_id) {
      const existingOwned = await db.findOne(TABLES.listings, {
        owner_id: req.user.id,
        hackathon_id: listing.hackathon_id,
        mode: 'team',
      });
      if (existingOwned && existingOwned.status !== 'closed' && existingOwned.status !== 'cancelled') {
        throw ApiError.conflict(
          `You already lead team "${existingOwned.title}" for this hackathon. You cannot apply to other teams.`
        );
      }
    }

    const application = await db.insert('team_applications', {
      ...payload,
      applicant_id: req.user.id,
      status: 'pending',
    });
    res.status(201).json({ application });
  })
);

/** POST /api/teams/:id/accept - owner selects a teammate. */
router.post(
  '/:id/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const application = await db.findOne('team_applications', { id: req.params.id });
    if (!application) throw ApiError.notFound('Application not found');

    const listing = await db.findOne(TABLES.listings, { id: application.listing_id });
    if (!listing) throw ApiError.notFound('Listing not found');
    if (listing.owner_id !== req.user.id) {
      throw ApiError.forbidden('Only the post owner can accept applicants');
    }

    if (application.status === 'accepted') {
      throw ApiError.conflict('This applicant is already accepted');
    }

    // Check if team is full (excluding owner)
    const acceptedCount = (
      await db.findMany('team_applications', {
        listing_id: listing.id,
        status: 'accepted',
      })
    ).length;

    const maxAllowedTeammates = (listing.people_required || 4) - 1;

    if (acceptedCount >= maxAllowedTeammates) {
      throw ApiError.conflict(`The team is already full (${acceptedCount + 1}/${listing.people_required} people).`);
    }

    const accepted = await db.update('team_applications', { id: application.id }, { status: 'accepted' });
    res.json({ application: accepted });
  })
);

/** POST /api/teams/:id/remove - owner removes a selected teammate. */
router.post(
  '/:id/remove',
  requireAuth,
  asyncHandler(async (req, res) => {
    const application = await db.findOne('team_applications', { id: req.params.id });
    if (!application) throw ApiError.notFound('Application not found');

    const listing = await db.findOne(TABLES.listings, { id: application.listing_id });
    if (!listing) throw ApiError.notFound('Listing not found');
    if (listing.owner_id !== req.user.id) {
      throw ApiError.forbidden('Only the post owner can remove applicants');
    }

    const removed = await db.update('team_applications', { id: application.id }, { status: 'removed' });
    res.json({ application: removed });
  })
);

export default router;
