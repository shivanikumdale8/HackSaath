import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { db, TABLES } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { signToken } from '../../middleware/requireAuth.js';
import { issueOtp, verifyOtp } from '../../services/otpService.js';
import { recordUserActivity } from '../../services/loginTracker.js';

/**
 * Business logic service for HackSaath auth module.
 * Supports simplified registration via personal (Gmail, Outlook) or college emails.
 * Distinguishes email verification (via OTP) from college verification (institutional domain).
 */

export const normaliseEmail = (email) => String(email).trim().toLowerCase();

/**
 * Checks if an email domain matches an approved college in the roster.
 * Returns the college record or null without throwing errors.
 */
export const findCollegeByDomain = async (email) => {
  const parts = String(email).split('@');
  if (parts.length < 2) return null;
  const domain = parts[1].toLowerCase().trim();

  try {
    const college = await db.findOne(TABLES.colleges, { domain });
    return college || null;
  } catch (err) {
    return null;
  }
};

/** Send an OTP code (used for registration, college email verification, and password reset). */
export async function requestOtp(rawEmail) {
  const email = normaliseEmail(rawEmail);
  if (!email || !email.includes('@')) {
    throw ApiError.badRequest('Please enter a valid email address.');
  }

  // Personal and college emails are both supported without domain whitelist restrictions
  return issueOtp(email);
}

/** Sign in with email + password. */
export async function loginWithPassword(rawEmail, password) {
  const email = normaliseEmail(rawEmail);
  if (!email || !email.includes('@')) {
    throw ApiError.badRequest('Please enter a valid email address.');
  }

  const user = await db.findOne(TABLES.users, { email });
  if (!user) {
    throw ApiError.unauthorized('No account found with this email. Please register first.');
  }

  if (user.is_blocked) {
    const actions = await db.findMany(
      TABLES.admin_actions,
      { user_id: user.id, action: 'block' },
      { orderBy: 'created_at', ascending: false, limit: 1 }
    );
    const blockReason = actions?.[0]?.message || 'No reason provided.';
    const blockImage = actions?.[0]?.image_url || null;
    throw ApiError.forbidden(`Your account has been blocked. Reason: ${blockReason}`, { image_url: blockImage });
  }

  if (!user.password_hash) {
    throw ApiError.badRequest(
      'No password set on this account. Use "Forgot password" to set one.'
    );
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw ApiError.unauthorized('Incorrect password.');
  }

  // Record user last login timestamp
  await recordUserActivity(user.id);

  // Ensure is_email_verified and is_college_verified flags are present
  const enrichedUser = {
    ...user,
    is_email_verified: Boolean(user.is_email_verified ?? true),
    is_college_verified: Boolean(user.is_college_verified ?? (user.college_id ? true : false)),
    college_name: user.college_name || '',
  };

  return { token: signToken(enrichedUser), user: enrichedUser };
}

/** Register a new user — requires email, password, and a valid OTP. Supports personal or college email. */
export async function registerWithOtp(rawEmail, password, code, rollNumber = '', collegeName = '', fullName = '') {
  const email = normaliseEmail(rawEmail);
  if (!email || !email.includes('@')) {
    throw ApiError.badRequest('Please enter a valid email address.');
  }

  verifyOtp(email, code); // Throws if missing, wrong or expired

  const existing = await db.findOne(TABLES.users, { email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists. Please sign in.');
  }

  // Check if the domain happens to be an approved college domain
  const matchedCollege = await findCollegeByDomain(email);
  const isCollegeDomain = Boolean(matchedCollege);

  const hash = await bcrypt.hash(password, 12);
  const user = await db.insert(TABLES.users, {
    email,
    full_name: fullName || '',
    bio: '',
    password_hash: hash,
    roll_number: rollNumber || '',
    college_name: matchedCollege ? matchedCollege.name : (collegeName || ''),
    college_id: matchedCollege ? matchedCollege.id : null,
    college_email: isCollegeDomain ? email : '',
    is_email_verified: true, // OTP was validated
    is_college_verified: isCollegeDomain,
    is_blocked: false,
    skills_offered: [],
    skills_wanted: [],
    rating_average: 0,
    rating_count: 0,
  });

  // Record initial activity
  await recordUserActivity(user.id);

  const enrichedUser = {
    ...user,
    is_email_verified: true,
    is_college_verified: isCollegeDomain,
    college_name: user.college_name || '',
  };

  return { token: signToken(enrichedUser), user: enrichedUser };
}

/** Forgot-password flow: verify OTP, then set new password. */
export async function resetPassword(rawEmail, code, password) {
  const email = normaliseEmail(rawEmail);
  verifyOtp(email, code);

  const user = await db.findOne(TABLES.users, { email });
  if (!user) {
    throw ApiError.notFound('No account found with this email.');
  }

  const hash = await bcrypt.hash(password, 12);
  const updated = await db.update(TABLES.users, { id: user.id }, { password_hash: hash });

  const enrichedUser = {
    ...updated,
    is_email_verified: Boolean(updated.is_email_verified ?? true),
    is_college_verified: Boolean(updated.is_college_verified ?? (updated.college_id ? true : false)),
    college_name: updated.college_name || '',
  };

  return { token: signToken(enrichedUser), user: enrichedUser };
}

/** Change password while already signed in. */
export async function setPassword(userId, password) {
  const hash = await bcrypt.hash(password, 12);
  const user = await db.update(TABLES.users, { id: userId }, { password_hash: hash });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/** Fetch user record by ID. */
export async function getUserById(id) {
  const user = await db.findOne(TABLES.users, { id });
  if (!user) throw ApiError.unauthorized('User not found (please sign in again)');

  return {
    ...user,
    is_email_verified: Boolean(user.is_email_verified ?? true),
    is_college_verified: Boolean(user.is_college_verified ?? (user.college_id ? true : false)),
    college_name: user.college_name || '',
    college_email: user.college_email || '',
  };
}
