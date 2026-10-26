import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db, TABLES } from '../../db/index.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { fuzzyFilterAndSort } from '../../utils/fuzzySearch.js';
import { calculateTeamReadiness, computeTeamRoleGaps } from '../../services/matchingService.js';

/**
 * Express API routes for unified search with typo-tolerance across students and hackathon teams.
 */
const router = Router();

/** Public profile projection */
const toPublicProfile = (user) => ({
  id: user.id,
  full_name: user.full_name || '',
  bio: user.bio || '',
  avatar_url: user.avatar_url ?? '',
  primary_role: user.primary_role || 'General Contributor',
  experience_level: user.experience_level || 'Intermediate',
  year_of_study: user.year_of_study || '',
  availability: user.availability || 'Actively Seeking Team',
  github_url: user.github_url || '',
  skills_offered: user.skills_offered ?? [],
  skills_wanted: user.skills_wanted ?? [],
  interests: user.interests ?? [],
  rating_average: user.rating_average ?? 0,
  rating_count: user.rating_count ?? 0,
  created_at: user.created_at,
});

/**
 * GET /api/search?q=...&type=all|users|posts
 * Returns typo-tolerant matches for users and posts accessible to the requester.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').trim();
    const type = req.query.type || 'all'; // 'all' | 'users' | 'posts'

    if (!q) {
      return res.json({ query: '', users: [], listings: [], total: 0 });
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
        const payload = jwt.verify(token, env.jwtSecret);
        userCollegeId = payload.college_id;
      } catch (err) {}
    }

    try {
      let matchedUsers = [];
      let matchedListings = [];

      // 1. Search Users if requested
      if (type === 'all' || type === 'users') {
        const userWhere = userCollegeId ? { college_id: userCollegeId } : {};
        const rawUsers = await db.findMany(TABLES.users, userWhere, { limit: 200 });
        const eligibleUsers = (rawUsers || []).filter(
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

        matchedUsers = fuzzyFilterAndSort(eligibleUsers, q, userTextExtractor, 0.45)
          .map(toPublicProfile)
          .slice(0, 30);
      }

      // 2. Search Listings/Posts if requested
      if (type === 'all' || type === 'posts') {
        const listWhere = { status: 'open', ...(userCollegeId ? { college_id: userCollegeId } : {}) };
        const rawListings = await db.findMany(TABLES.listings, listWhere, { limit: 200 });

        const now = new Date();
        const activeListings = (rawListings || []).filter((l) => {
          if (l.mode === 'freelance' && l.deadline && new Date(l.deadline) <= now) {
            return false;
          }
          return true;
        });

        // Enrich team listings with readiness and missing roles
        for (const l of activeListings) {
          const owner = await db.findOne(TABLES.users, { id: l.owner_id });
          if (owner) {
            l.owner = {
              id: owner.id,
              full_name: owner.full_name,
              avatar_url: owner.avatar_url,
              primary_role: owner.primary_role,
            };
          }
          if (l.mode === 'team') {
            const acceptedApps = await db.findMany('team_applications', { listing_id: l.id, status: 'accepted' });
            const members = [
              ...(owner ? [{ ...owner, isOwner: true, role: owner.primary_role || 'Team Lead' }] : []),
            ];
            for (const app of acceptedApps) {
              const u = await db.findOne(TABLES.users, { id: app.applicant_id });
              if (u) members.push({ ...u, isOwner: false, role: u.primary_role || 'Member' });
            }
            l.readiness = calculateTeamReadiness(l, members);
            l.gaps = computeTeamRoleGaps(l, members);
            l.member_count = members.length;
          }
        }

        const listingTextExtractor = (l) =>
          [
            l.title || '',
            l.description || '',
            l.hackathon_name || '',
            l.hackathon_theme || '',
            Array.isArray(l.tags) ? l.tags.join(' ') : '',
            Array.isArray(l.required_roles) ? l.required_roles.join(' ') : '',
            Array.isArray(l.team_skills_needed) ? l.team_skills_needed.join(' ') : '',
            l.skill_offered || '',
            l.skill_wanted || '',
          ].join(' ');

        matchedListings = fuzzyFilterAndSort(activeListings, q, listingTextExtractor, 0.45).slice(0, 30);
      }

      res.json({
        query: q,
        users: matchedUsers,
        listings: matchedListings,
        total: matchedUsers.length + matchedListings.length,
      });
    } catch (err) {
      console.error('[Search Error]', err);
      res.json({ query: q, users: [], listings: [], total: 0 });
    }
  })
);

export default router;
