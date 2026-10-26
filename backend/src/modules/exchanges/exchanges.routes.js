import { Router } from 'express';
import { z } from 'zod';
import { db, TABLES } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { toPublicProfile } from '../users/users.routes.js';

/**
 * Express API routes for exchanges module.
 * Provides genuine student-to-student skill matching (Two-way & One-way)
 * and persistent, authorized swap requests management.
 */

const router = Router();

const normalise = (skill) => String(skill || '').trim().toLowerCase();

const swapProposeSchema = z.object({
  recipient_id: z.string().min(1, 'Recipient is required'),
  offered_skill: z.string().max(80).optional().default(''),
  wanted_skill: z.string().max(80).optional().default(''),
  message: z.string().min(3, 'Message must be at least 3 characters').max(500),
  listing_id: z.string().optional().default(''),
});

const legacyProposeSchema = z.object({
  listing_id: z.string().min(1),
  message: z.string().min(3).max(500),
});

/**
 * Helper to enrich exchange rows with sender & recipient public profile data
 */
async function enrichExchange(exchange) {
  const [proposer, recipient] = await Promise.all([
    db.findOne(TABLES.users, { id: exchange.proposer_id }),
    db.findOne(TABLES.users, { id: exchange.recipient_id || exchange.owner_id }),
  ]);

  return {
    ...exchange,
    proposer: proposer ? toPublicProfile(proposer) : null,
    recipient: recipient ? toPublicProfile(recipient) : null,
  };
}

/**
 * GET /api/exchanges/peer-matches
 * Computes deterministic two-way and one-way matches between the logged-in student
 * and all other registered students directly on skills_offered and skills_wanted.
 */
router.get(
  '/peer-matches',
  requireAuth,
  asyncHandler(async (req, res) => {
    const me = await db.findOne(TABLES.users, { id: req.user.id });
    if (!me) throw ApiError.unauthorized('User not found');

    const myOffered = (me.skills_offered ?? []).map(normalise).filter(Boolean);
    const myWanted = (me.skills_wanted ?? []).map(normalise).filter(Boolean);

    if (myOffered.length === 0 && myWanted.length === 0) {
      return res.json({
        matches: [],
        hint: 'Add skills you can teach and skills you want to learn in your profile to discover matching peers.',
        myOffered: me.skills_offered ?? [],
        myWanted: me.skills_wanted ?? [],
      });
    }

    // Fetch all active, non-blocked students (excluding self)
    const allUsers = await db.findMany(TABLES.users, {}, { limit: 300 });
    const eligibleStudents = allUsers.filter(
      (u) => u.id !== req.user.id && !u.is_blocked && u.status !== 'blocked'
    );

    const matches = [];

    for (const student of eligibleStudents) {
      const studentOfferedRaw = student.skills_offered ?? [];
      const studentWantedRaw = student.skills_wanted ?? [];

      const studentOffered = studentOfferedRaw.map(normalise).filter(Boolean);
      const studentWanted = studentWantedRaw.map(normalise).filter(Boolean);

      // What they can teach me: overlap between their offered skills and my wanted skills
      const theyCanTeachMe = studentOfferedRaw.filter((s) =>
        myWanted.includes(normalise(s))
      );

      // What I can teach them: overlap between my offered skills and their wanted skills
      const iCanTeachThem = (me.skills_offered ?? []).filter((s) =>
        studentWanted.includes(normalise(s))
      );

      const hasTheyTeachMe = theyCanTeachMe.length > 0;
      const hasITeachThem = iCanTeachThem.length > 0;

      if (hasTheyTeachMe || hasITeachThem) {
        const isTwoWay = hasTheyTeachMe && hasITeachThem;
        matches.push({
          student: toPublicProfile(student),
          matchType: isTwoWay ? 'two-way' : 'one-way',
          theyCanTeachMe,
          iCanTeachThem,
          score: isTwoWay ? 2 : 1,
        });
      }
    }

    // Sort: Two-way matches first, then One-way matches
    matches.sort((a, b) => b.score - a.score);

    res.json({
      matches,
      totalCount: matches.length,
      myOffered: me.skills_offered ?? [],
      myWanted: me.skills_wanted ?? [],
    });
  })
);

/**
 * GET /api/exchanges/matches - Legacy listing matches
 */
router.get(
  '/matches',
  requireAuth,
  asyncHandler(async (req, res) => {
    const me = await db.findOne(TABLES.users, { id: req.user.id });
    if (!me) throw ApiError.unauthorized('User not found');

    const iOffer = (me.skills_offered ?? []).map(normalise);
    const iWant = (me.skills_wanted ?? []).map(normalise);

    if (!iOffer.length || !iWant.length) {
      return res.json({
        matches: [],
        hint: 'Add at least one skill you can teach and one you want to learn to get matches.',
      });
    }

    const open = await db.findMany(
      TABLES.listings,
      { mode: 'exchange', status: 'open' },
      { limit: 200 }
    );

    const matches = open
      .filter((listing) => listing.owner_id !== req.user.id)
      .map((listing) => {
        const theyOffer = normalise(listing.skill_offered);
        const theyWant = normalise(listing.skill_wanted);
        const theyTeachWhatIWant = iWant.includes(theyOffer);
        const iTeachWhatTheyWant = iOffer.includes(theyWant);

        return {
          listing,
          theyTeachWhatIWant,
          iTeachWhatTheyWant,
          score: Number(theyTeachWhatIWant) + Number(iTeachWhatTheyWant),
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score);

    res.json({ matches });
  })
);

/**
 * GET /api/exchanges
 * Returns all swaps involving the authenticated user, categorized into received, sent, and accepted.
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [proposed, receivedByRecipient, receivedByOwner] = await Promise.all([
      db.findMany(TABLES.exchanges, { proposer_id: req.user.id }, { limit: 150 }),
      db.findMany(TABLES.exchanges, { recipient_id: req.user.id }, { limit: 150 }),
      db.findMany(TABLES.exchanges, { owner_id: req.user.id }, { limit: 150 }),
    ]);

    // Deduplicate all combined swaps by id
    const swapMap = new Map();
    [...proposed, ...receivedByRecipient, ...receivedByOwner].forEach((s) => {
      if (s && s.id) swapMap.set(s.id, s);
    });

    const enrichedList = await Promise.all(
      Array.from(swapMap.values()).map(enrichExchange)
    );

    // Sort newest first
    enrichedList.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    const received = enrichedList.filter(
      (s) => s.recipient_id === req.user.id || (s.owner_id === req.user.id && s.proposer_id !== req.user.id)
    );
    const sent = enrichedList.filter((s) => s.proposer_id === req.user.id);
    const accepted = enrichedList.filter((s) => s.status === 'accepted');

    res.json({
      exchanges: enrichedList,
      received,
      sent,
      accepted,
    });
  })
);

/**
 * POST /api/exchanges/propose
 * Propose a direct student-to-student skill swap.
 */
router.post(
  '/propose',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { recipient_id, offered_skill, wanted_skill, message, listing_id } =
      swapProposeSchema.parse(req.body);

    if (recipient_id === req.user.id) {
      throw ApiError.badRequest('You cannot send a swap request to yourself.');
    }

    const recipient = await db.findOne(TABLES.users, { id: recipient_id });
    if (!recipient) {
      throw ApiError.notFound('Recipient student not found.');
    }

    // Duplicate prevention: check for existing pending swap
    const existing = await db.findMany(
      TABLES.exchanges,
      {
        proposer_id: req.user.id,
        recipient_id,
        status: 'pending',
      },
      { limit: 5 }
    );

    if (existing.length > 0) {
      throw ApiError.conflict('You already have a pending swap request with this student.');
    }

    const exchange = await db.insert(TABLES.exchanges, {
      proposer_id: req.user.id,
      recipient_id,
      owner_id: recipient_id,
      offered_skill: offered_skill || '',
      wanted_skill: wanted_skill || '',
      listing_id: listing_id || null,
      message,
      status: 'pending',
    });

    const enriched = await enrichExchange(exchange);
    res.status(201).json({ exchange: enriched });
  })
);

/**
 * POST /api/exchanges - Propose swap (supports both direct swap and legacy listing proposal)
 */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.body.recipient_id) {
      const { recipient_id, offered_skill, wanted_skill, message, listing_id } =
        swapProposeSchema.parse(req.body);

      if (recipient_id === req.user.id) {
        throw ApiError.badRequest('You cannot send a swap request to yourself.');
      }

      const recipient = await db.findOne(TABLES.users, { id: recipient_id });
      if (!recipient) throw ApiError.notFound('Recipient student not found');

      const existing = await db.findMany(
        TABLES.exchanges,
        { proposer_id: req.user.id, recipient_id, status: 'pending' },
        { limit: 5 }
      );
      if (existing.length > 0) {
        throw ApiError.conflict('You already have a pending swap request with this student.');
      }

      const exchange = await db.insert(TABLES.exchanges, {
        proposer_id: req.user.id,
        recipient_id,
        owner_id: recipient_id,
        offered_skill: offered_skill || '',
        wanted_skill: wanted_skill || '',
        listing_id: listing_id || null,
        message,
        status: 'pending',
      });
      const enriched = await enrichExchange(exchange);
      return res.status(201).json({ exchange: enriched });
    }

    const { listing_id, message } = legacyProposeSchema.parse(req.body);
    const listing = await db.findOne(TABLES.listings, { id: listing_id });
    if (!listing) throw ApiError.notFound('Listing not found');
    if (listing.mode !== 'exchange') throw ApiError.badRequest('That listing is not a skill exchange');
    if (listing.status !== 'open') throw ApiError.conflict('This listing is no longer open');
    if (listing.owner_id === req.user.id) {
      throw ApiError.forbidden('You cannot propose a swap on your own listing');
    }

    const exchange = await db.insert(TABLES.exchanges, {
      listing_id,
      owner_id: listing.owner_id,
      recipient_id: listing.owner_id,
      proposer_id: req.user.id,
      offered_skill: listing.skill_wanted || '',
      wanted_skill: listing.skill_offered || '',
      message,
      status: 'pending',
    });
    const enriched = await enrichExchange(exchange);
    res.status(201).json({ exchange: enriched });
  })
);

/**
 * POST /api/exchanges/:id/accept
 * Recipient accepts the swap request.
 */
router.post(
  '/:id/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const exchange = await db.findOne(TABLES.exchanges, { id: req.params.id });
    if (!exchange) throw ApiError.notFound('Exchange request not found');

    const isRecipient =
      exchange.recipient_id === req.user.id || exchange.owner_id === req.user.id;
    if (!isRecipient) {
      throw ApiError.forbidden('Only the recipient of this swap request can accept it');
    }

    if (exchange.status === 'accepted') {
      return res.json({ exchange: await enrichExchange(exchange) });
    }

    const updated = await db.update(TABLES.exchanges, { id: exchange.id }, { status: 'accepted' });
    if (exchange.listing_id) {
      await db.update(TABLES.listings, { id: exchange.listing_id }, { status: 'in_progress' });
    }

    const enriched = await enrichExchange(updated);
    res.json({ exchange: enriched });
  })
);

/**
 * POST /api/exchanges/:id/decline
 * Recipient declines the swap request.
 */
router.post(
  '/:id/decline',
  requireAuth,
  asyncHandler(async (req, res) => {
    const exchange = await db.findOne(TABLES.exchanges, { id: req.params.id });
    if (!exchange) throw ApiError.notFound('Exchange request not found');

    const isRecipient =
      exchange.recipient_id === req.user.id || exchange.owner_id === req.user.id;
    if (!isRecipient) {
      throw ApiError.forbidden('Only the recipient of this swap request can decline it');
    }

    const updated = await db.update(TABLES.exchanges, { id: exchange.id }, { status: 'declined' });
    const enriched = await enrichExchange(updated);
    res.json({ exchange: enriched });
  })
);

export default router;
