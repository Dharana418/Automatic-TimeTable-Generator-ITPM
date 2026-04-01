import { body, param, validationResult } from 'express-validator';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=\S+$).{8,64}$/;
const VALID_NAME_CHARS_REGEX = /^[A-Za-z][A-Za-z\s'.-]{2,99}$/;

const VALID_USER_ROLES = [
  'Admin',
  'User',
  'Instructor',
  'Lecturer',
  'Senior Lecturer',
  'Assistant Lecturer',
  'Professor',
  'LIC',
  'Faculty Coordinator',
  'Academic Coordinator',
  'Lecturer/Senior Lecturer',
];

const strongPasswordValidation = (fieldName = 'password') =>
  body(fieldName)
    .isString()
    .withMessage('Password must be a string')
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage('Password must be 8-64 characters and include uppercase, lowercase, number, and special character');

const humanNameValidation = (fieldName = 'name') =>
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(VALID_NAME_CHARS_REGEX)
    .withMessage("Name can contain only letters, spaces, apostrophes, dots, and hyphens")
    .custom((value) => {
      const name = String(value || '').trim();
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        throw new Error('Please provide full name (first and last name)');
      }

      if (parts.some((part) => part.replace(/[^A-Za-z]/g, '').length < 2)) {
        throw new Error('Each name part should contain at least 2 letters');
      }

      const lettersOnly = name.toLowerCase().replace(/[^a-z]/g, '');
      if (lettersOnly.length < 4) {
        throw new Error('Please enter a realistic human name');
      }

      if (/(.)\1{3,}/.test(lettersOnly)) {
        throw new Error('Name appears repetitive and not human-like');
      }

      if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(lettersOnly) || /[aeiou]{5,}/.test(lettersOnly)) {
        throw new Error('Name appears invalid and not human-like');
      }

      const uniqueChars = new Set(lettersOnly).size;
      if (lettersOnly.length >= 8 && uniqueChars <= 3) {
        throw new Error('Name appears repetitive and not human-like');
      }

      const vowelCount = (lettersOnly.match(/[aeiou]/g) || []).length;
      const vowelRatio = vowelCount / lettersOnly.length;
      if (vowelCount < 2 || vowelRatio < 0.2 || vowelRatio > 0.8) {
        throw new Error('Name does not appear human-like');
      }

      return true;
    });

export const registerValidation = [
  humanNameValidation('name'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  strongPasswordValidation('password'),
  body('address').optional().isString(),
  body('birthday').optional().isISO8601().toDate(),
  body('phonenumber')
    .optional({ values: 'falsy' })
    .matches(/^\d{1,10}$/)
    .withMessage('Phone number must contain digits only and cannot exceed 10 numbers'),
];

export const adminCreateUserValidation = [
  humanNameValidation('name'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  strongPasswordValidation('password'),
  body('address').optional().isString(),
  body('birthday').optional().isISO8601().toDate(),
  body('phonenumber')
    .optional({ values: 'falsy' })
    .matches(/^\d{1,10}$/)
    .withMessage('Phone number must contain digits only and cannot exceed 10 numbers'),
  body('roleAssignmentNote')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 500 })
    .withMessage('Role assignment note must be under 500 characters'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(VALID_USER_ROLES)
    .withMessage('Invalid role for admin user creation'),
];

export const bootstrapAdminValidation = [
  humanNameValidation('name'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  strongPasswordValidation('password'),
  body('address').optional().isString(),
  body('birthday').optional().isISO8601().toDate(),
  body('phonenumber')
    .optional({ values: 'falsy' })
    .matches(/^\d{1,10}$/)
    .withMessage('Phone number must contain digits only and cannot exceed 10 numbers'),
  body('roleAssignmentNote')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 500 })
    .withMessage('Role assignment note must be under 500 characters'),
  body('role')
    .optional({ values: 'falsy' })
    .custom((value) => String(value).trim().toLowerCase() === 'admin')
    .withMessage('bootstrap-admin only supports Admin role'),
];

export const adminRoleAssignmentCreateValidation = [
  body('targetUserId')
    .optional({ values: 'falsy' })
    .isUUID()
    .withMessage('targetUserId must be a valid UUID'),
  body('targetUserEmail')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('targetUserEmail must be a valid email')
    .normalizeEmail(),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(VALID_USER_ROLES)
    .withMessage('Invalid role supplied'),
  body('roleAssignmentNote')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 500 })
    .withMessage('Role assignment note must be under 500 characters'),
  body('plainPassword')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('plainPassword must be a string')
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage('plainPassword must be 8-64 characters and include uppercase, lowercase, number, and special character'),
  body().custom((payload) => {
    if (!payload?.targetUserId && !payload?.targetUserEmail) {
      throw new Error('targetUserId or targetUserEmail is required');
    }
    return true;
  }),
];

export const adminRoleAssignmentUpdateValidation = [
  body('role')
    .optional({ values: 'falsy' })
    .isIn(VALID_USER_ROLES)
    .withMessage('Invalid role supplied'),
  body('roleAssignmentNote')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage('Role assignment note must be under 500 characters'),
  body().custom((payload) => {
    if (!payload || (typeof payload.role === 'undefined' && typeof payload.roleAssignmentNote === 'undefined')) {
      throw new Error('Nothing to update');
    }
    return true;
  }),
];

export const historyIdValidation = [
  param('historyId')
    .isUUID()
    .withMessage('historyId must be a valid UUID'),
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
