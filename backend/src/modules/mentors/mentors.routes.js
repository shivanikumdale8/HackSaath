import { Router } from 'express';
import { z } from 'zod';
import { db, TABLES } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

const mentorRequestSchema = z.object({
  team_id: z.string().min(1),
  mentor_id: z.string().min(1),
  topic: z.string().min(3).max(200),
  message: z.string().max(1000).default(''),
});

/** GET /api/mentors - directory of verified mentors */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { expertise } = req.query;
    let list = await db.findMany(TABLES.mentors, {}, { limit: 50 });

    if (expertise) {
      const q = expertise.toLowerCase();
      list = list.filter((m) =>
        m.expertise_areas?.some((e) => e.toLowerCase().includes(q)) ||
        m.full_name?.toLowerCase().includes(q)
      );
    }

    res.json({ mentors: list });
  })
);

/** POST /api/mentors/request - team requests mentorship */
router.post(
  '/request',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = mentorRequestSchema.parse(req.body);

    const team = await db.findOne(TABLES.listings, { id: payload.team_id });
    if (!team) throw ApiError.notFound('Team not found');

    // Verify user is owner or accepted member
    if (team.owner_id !== req.user.id) {
      const member = await db.findOne('team_applications', {
        listing_id: team.id,
        applicant_id: req.user.id,
        status: 'accepted',
      });
      if (!member) throw ApiError.forbidden('Only team members can request mentorship');
    }

    const mentor = await db.findOne(TABLES.mentors, { id: payload.mentor_id });
    if (!mentor) throw ApiError.notFound('Mentor not found');

    const request = await db.insert(TABLES.mentor_requests, {
      team_id: team.id,
      team_title: team.title,
      mentor_id: mentor.id,
      mentor_name: mentor.full_name,
      requested_by: req.user.id,
      topic: payload.topic,
      message: payload.message,
      status: 'pending',
      meeting_details: 'Meeting link and scheduling will be assigned upon acceptance.',
      session_notes: '',
    });

    res.status(201).json({ request });
  })
);

/** GET /api/mentors/requests - get mentorship requests for teams the user is part of */
router.get(
  '/requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Find all teams owned by user
    const ownedTeams = await db.findMany(TABLES.listings, { owner_id: req.user.id });
    const memberApps = await db.findMany('team_applications', {
      applicant_id: req.user.id,
      status: 'accepted',
    });

    const userTeamIds = new Set([
      ...ownedTeams.map((t) => t.id),
      ...memberApps.map((a) => a.listing_id),
    ]);

    const allRequests = await db.findMany(TABLES.mentor_requests, {}, { limit: 100 });
    const filtered = allRequests.filter((r) => userTeamIds.has(r.team_id));

    res.json({ requests: filtered });
  })
);

/** PATCH /api/mentors/requests/:id/notes - update mentorship session notes */
router.patch(
  '/requests/:id/notes',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { session_notes } = req.body;
    if (typeof session_notes !== 'string') {
      throw ApiError.badRequest('session_notes must be a string');
    }

    const request = await db.findOne(TABLES.mentor_requests, { id: req.params.id });
    if (!request) throw ApiError.notFound('Mentor request not found');

    const updated = await db.update(
      TABLES.mentor_requests,
      { id: request.id },
      { session_notes }
    );

    res.json({ request: updated });
  })
);

export default router;
