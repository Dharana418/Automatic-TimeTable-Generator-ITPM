import { body, param, validationResult } from 'express-validator';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=\S+$).{8,64}$/;
const ROLE_NAME_REGEX = /^[A-Za-z][A-Za-z0-9\s]{1,49}$/;
const NAME_NO_SPECIAL_REGEX = /^[A-Za-z\s]+$/;

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

const adminAssignableRoleValidation = (fieldName = 'role') =>
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters')
    .matches(ROLE_NAME_REGEX)
    .withMessage('Role must start with a letter and contain only letters, numbers, and spaces');

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
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(NAME_NO_SPECIAL_REGEX)
    .withMessage('Name cannot contain special characters'),
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
  adminAssignableRoleValidation('role'),
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
  adminAssignableRoleValidation('role'),
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
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role must be between 2 and 50 characters')
    .matches(ROLE_NAME_REGEX)
    .withMessage('Role must start with a letter and contain only letters, numbers, and spaces'),
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

export const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 256 })
    .withMessage('Reset token format is invalid'),
  strongPasswordValidation('password'),
  body('confirmPassword')
    .isString()
    .withMessage('Confirm password must be a string')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password and confirmPassword do not match'),
];

export const profileUpdateValidation = [
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('address')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 300 })
    .withMessage('Address cannot exceed 300 characters'),
  body('birthday')
    .optional({ nullable: true, values: 'falsy' })
    .isISO8601()
    .withMessage('Birthday must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('phonenumber')
    .optional({ nullable: true, values: 'falsy' })
    .matches(/^\d{1,10}$/)
    .withMessage('Phone number must contain digits only and cannot exceed 10 numbers'),
  body('profilePhotoUrl')
    .optional({ nullable: true })
    .isString()
    .withMessage('profilePhotoUrl must be a string')
    .isLength({ max: 3000000 })
    .withMessage('profilePhotoUrl is too large')
    .custom((value) => {
      if (!value) return true;
      const isHttpUrl = /^https?:\/\/.+/i.test(value);
      const isDataImage = /^data:image\/(png|jpe?g|webp);base64,[a-zA-Z0-9+/=\r\n]+$/i.test(value);
      if (!isHttpUrl && !isDataImage) {
        throw new Error('profilePhotoUrl must be an image URL or base64 data URL');
      }
      return true;
    }),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
