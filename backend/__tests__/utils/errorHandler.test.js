/**
 * Unit Tests for ErrorHandler Utility
 * Tests custom error handling and error code assignment
 */

import ErrorHandler from '../../utils/errorHandler.js';

describe('ErrorHandler Utility', () => {
  it('should create an error with message and code', () => {
    const errorMsg = 'Test error message';
    const errorCode = 400;
    const error = new ErrorHandler(errorMsg, errorCode);

    expect(error.message).toBe(errorMsg);
    expect(error.errorCode).toBe(errorCode);
    expect(error instanceof Error).toBe(true);
  });

  it('should properly inherit from Error class', () => {
    const error = new ErrorHandler('Unauthorized', 401);
    expect(error).toBeInstanceOf(ErrorHandler);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have proper stack trace', () => {
    const error = new ErrorHandler('Database error', 500);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('ErrorHandler');
  });

  it('should handle various error codes', () => {
    const testCases = [
      { code: 400, msg: 'Bad Request' },
      { code: 401, msg: 'Unauthorized' },
      { code: 403, msg: 'Forbidden' },
      { code: 404, msg: 'Not Found' },
      { code: 500, msg: 'Internal Server Error' }
    ];

    testCases.forEach(({ code, msg }) => {
      const error = new ErrorHandler(msg, code);
      expect(error.errorCode).toBe(code);
      expect(error.message).toBe(msg);
    });
  });

  it('should work with empty message', () => {
    const error = new ErrorHandler('', 400);
    expect(error.message).toBe('');
    expect(error.errorCode).toBe(400);
  });
});
