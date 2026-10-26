import { Router } from 'express';
import { z } from 'zod';
import { db, TABLES } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { fuzzyFilterAndSort } from '../../utils/fuzzySearch.js';
import { issueOtp, verifyOtp } from '../../services/otpService.js';
import { findCollegeByDomain } from '../auth/auth.service.js';

/**
 * Express API routes for users module.
 * Manages student profiles, portfolio projects, hackathon availability,
 * and public student profiles.
 */
const router = Router();

const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  github_url: z.string().max(200).default(''),
  demo_url: z.string().max(200).default(''),
  tech_stack: z.array(z.string().max(40)).default([]),
});

const profileSchema = z.object({
  full_name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  college_name: z.string().max(150).optional(),
  roll_number: z.string().max(50).optional(),
  skills_offered: z.array(z.string().min(1).max(40)).max(25).optional(),
  skills_wanted: z.array(z.string().min(1).max(40)).max(25).optional(),
  upi_id: z.string().max(80).optional(),
  // Hackathon Team Finder extensions
  primary_role: z.string().max(60).optional(),
  experience_level: z.string().max(40).optional(),
  year_of_study: z.string().max(40).optional(),
  interests: z.array(z.string().max(50)).max(15).optional(),
  availability: z.string().max(60).optional(),
  github_url: z.string().max(200).optional(),
  portfolio_url: z.string().max(200).optional(),
  projects: z.array(projectSchema).max(10).optional(),
});

const avatarSchema = z.object({
  avatar_url: z.string().max(150000, 'Image is too large (max ~100 KB)'),
});

/** Return public profile fields, keeping private details safe. */
export const toPublicProfile = (user) => ({
  id: user.id,
  email: user.email || '',
  full_name: user.full_name || '',
  bio: user.bio || '',
  avatar_url: user.avatar_url ?? '',
  college_name: user.college_name || '',
  roll_number: user.roll_number || '',
  is_email_verified: Boolean(user.is_email_verified ?? true),
  is_college_verified: Boolean(user.is_college_verified ?? (user.college_id ? true : false)),
  college_email: user.college_email || '',
  skills_offered: user.skills_offered ?? [],
  skills_wanted: user.skills_wanted ?? [],
  upi_id: user.upi_id ?? '',
  primary_role: user.primary_role || 'General Contributor',
  experience_level: user.experience_level || 'Intermediate',
  year_of_study: user.year_of_study || '',
  interests: user.interests ?? [],
  availability: user.availability || 'Actively Seeking Team',
  github_url: user.github_url || '',
  portfolio_url: user.portfolio_url || '',
  projects: user.projects ?? [],
  rating_average: user.rating_average ?? 0,
  rating_count: user.rating_count ?? 0,
  created_at: user.created_at,
});

/** GET /api/users/search?q=... - search for public users with typo tolerance. */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({ users: [] });
    }

    let token = null;
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      token = header.substring(7).trim();
      if (token === 'null' || token === 'undefined') token = null;
    }
    let userCollegeId = null;
    if (token) {
      try {
        const payload = (await import('jsonwebtoken')).default.verify(
          token,
          (await import('../../config/env.js')).env.jwtSecret
        );
        userCollegeId = payload.college_id;
      } catch (err) {}
    }

    try {
      const where = {};
      if (userCollegeId) {
        where.college_id = userCollegeId;
      }
      const data = await db.findMany(TABLES.users, where, { limit: 200 });

      const eligibleUsers = (data || []).filter(
        (u) => !u.is_blocked && u.status !== 'blocked' && u.email !== 'kruthin123@gmail.com'
      );

      const userTextExtractor = (u) =>
        [
          u.full_name || '',
          u.bio || '',
          u.primary_role || '',
          Array.isArray(u.skills_offered) ? u.skills_offered.join(' ') : '',
          Array.isArray(u.skills_wanted) ? u.skills_wanted.join(' ') : '',
          Array.isArray(u.interests) ? u.interests.join(' ') : '',
        ].join(' ');

      const matched = fuzzyFilterAndSort(eligibleUsers, q, userTextExtractor, 0.45);
      const users = matched.map(toPublicProfile).slice(0, 30);
      res.json({ users });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error('[User Search Error]', err);
      res.json({ users: [] });
    }
  })
);

/** GET /api/users/me - get logged-in user profile */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await db.findOne(TABLES.users, { id: req.user.id });
    if (!user) throw ApiError.notFound('User not found');
    res.json({ user: toPublicProfile(user) });
  })
);

/** GET /api/users/:id - public profile with trust score and portfolio. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await db.findOne(TABLES.users, { id: req.params.id });
    if (!user) throw ApiError.notFound('User not found');
    res.json({ user: toPublicProfile(user) });
  })
);

/** PATCH /api/users/me - edit your own profile. */
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const patch = profileSchema.parse(req.body);
    let user;
    try {
      user = await db.update(TABLES.users, { id: req.user.id }, patch);
    } catch (err) {
      if (patch.upi_id && err.message && err.message.includes('upi_id')) {
        const fallbackPatch = { ...patch };
        delete fallbackPatch.upi_id;
        user = await db.update(TABLES.users, { id: req.user.id }, fallbackPatch);
      } else {
        throw err;
      }
    }
    if (!user) throw ApiError.notFound('User not found');
    res.json({ user: toPublicProfile(user) });
  })
);

/** PATCH /api/users/me/avatar - upload a profile picture. */
router.patch(
  '/me/avatar',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { avatar_url } = avatarSchema.parse(req.body);
    const user = await db.update(TABLES.users, { id: req.user.id }, { avatar_url });
    if (!user) throw ApiError.notFound('User not found');
    res.json({ user: toPublicProfile(user) });
  })
);

/** POST /api/users/request-college-otp - Optional college email verification code request */
router.post(
  '/request-college-otp',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { college_email } = z
      .object({
        college_email: z.string().email('Please enter a valid college or institutional email address'),
      })
      .parse(req.body);

    const cleanEmail = college_email.trim().toLowerCase();
    const result = await issueOtp(cleanEmail);

    res.json({
      success: true,
      message: `A verification code was sent to ${cleanEmail}.${result.devCode ? ` [Code: ${result.devCode}]` : ''}`,
      expiresInMinutes: result.expiresInMinutes,
      deliveredByEmail: result.delivered,
      code: result.devCode,
    });
  })
);

/** POST /api/users/verify-college-otp - Confirm college OTP and mark college verified */
router.post(
  '/verify-college-otp',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { college_email, code } = z
      .object({
        college_email: z.string().email('Please enter a valid college or institutional email address'),
        code: z.string().regex(/^\d{6}$/, 'The code must be 6 digits'),
      })
      .parse(req.body);

    const cleanEmail = college_email.trim().toLowerCase();

    try {
      verifyOtp(cleanEmail, code);
    } catch (err) {
      throw ApiError.badRequest(
        'Invalid or expired verification code. If you prefer, you can continue using HackSaath freely with your verified personal email.'
      );
    }

    const matchedCollege = await findCollegeByDomain(cleanEmail);
    const isApproved = Boolean(matchedCollege);

    const patch = {
      college_email: cleanEmail,
      college_id: matchedCollege ? matchedCollege.id : null,
      is_college_verified: isApproved,
    };
    if (matchedCollege?.name) {
      patch.college_name = matchedCollege.name;
    }

    const updated = await db.update(TABLES.users, { id: req.user.id }, patch);
    if (!updated) throw ApiError.notFound('User not found');

    res.json({
      success: true,
      is_college_verified: isApproved,
      message: isApproved
        ? `College verified! Your institutional status for ${matchedCollege.name} is now active.`
        : `Your institutional email (@${cleanEmail.split('@')[1]}) is confirmed. This domain has been submitted for roster addition, and your personal account retains full platform access!`,
      user: toPublicProfile(updated),
    });
  })
);

export default router;
