import { body, param, validationResult } from 'express-validator';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=\S+$).{8,64}$/;

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

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
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
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
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
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
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
