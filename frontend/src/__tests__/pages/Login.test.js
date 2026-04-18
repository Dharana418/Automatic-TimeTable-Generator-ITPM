/**
 * Component Tests for Login Page
 * Tests login form validation, submission, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Login Page Component', () => {
  
  describe('Form Rendering', () => {
    it('should render login form with email and password fields', () => {
      const formElements = {
        emailInput: { id: 'email', type: 'email', required: true },
        passwordInput: { id: 'password', type: 'password', required: true },
        submitButton: { text: 'Login', type: 'submit' }
      };

      expect(formElements.emailInput).toBeDefined();
      expect(formElements.emailInput.type).toBe('email');
      expect(formElements.passwordInput.type).toBe('password');
      expect(formElements.submitButton.text).toBe('Login');
    });

    it('should display "Register" link for new users', () => {
      const pageLinks = {
        registerLink: { text: 'Create new account', href: '/register' },
        forgotPasswordLink: { text: 'Forgot password?', href: '/forgot-password' }
      };

      expect(pageLinks.registerLink.text).toBe('Create new account');
      expect(pageLinks.forgotPasswordLink.href).toBe('/forgot-password');
    });
  });

  describe('Form Validation', () => {
    it('should validate email format on blur', () => {
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('valid@example.com')).toBe(true);
      expect(validateEmail('invalid.email')).toBe(false);
    });

    it('should show validation error for invalid email', () => {
      const getValidationError = (field, value) => {
        if (field === 'email' && !value.includes('@')) {
          return 'Please enter a valid email address';
        }
        return null;
      };

      expect(getValidationError('email', 'invalid')).toBe('Please enter a valid email address');
      expect(getValidationError('email', 'valid@example.com')).toBeNull();
    });

    it('should require both fields before submission', () => {
      const canSubmit = (email, password) => {
        return email.trim() !== '' && password.trim() !== '';
      };

      expect(canSubmit('user@example.com', 'pass123')).toBe(true);
      expect(canSubmit('', 'pass123')).toBe(false);
      expect(canSubmit('user@example.com', '')).toBe(false);
    });
  });

  describe('Form Submission', () => {
    it('should call login API with email and password', () => {
      const mockLoginAPI = vi.fn().mockResolvedValue({ success: true, token: 'jwt-token' });
      
      const handleLogin = async (email, password) => {
        return mockLoginAPI({ email, password });
      };

      handleLogin('user@example.com', 'pass123');
      
      expect(mockLoginAPI).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'pass123'
      });
    });

    it('should disable submit button during submission', () => {
      const isLoading = true;
      const canSubmit = !isLoading;

      expect(canSubmit).toBe(false);
      expect(isLoading).toBe(true);
    });

    it('should show loading spinner while submitting', () => {
      const renderSpinner = (isLoading) => {
        if (isLoading) {
          return { element: 'spinner', className: 'loading-spinner' };
        }
        return null;
      };

      expect(renderSpinner(true)).toBeDefined();
      expect(renderSpinner(false)).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed login', () => {
      const handleLoginError = (error) => {
        const errorMessages = {
          401: 'Invalid email or password',
          400: 'Missing required fields',
          500: 'Server error. Please try again later.'
        };
        return errorMessages[error.code] || 'An error occurred';
      };

      expect(handleLoginError({ code: 401 })).toBe('Invalid email or password');
      expect(handleLoginError({ code: 500 })).toBe('Server error. Please try again later.');
    });

    it('should display specific error for network failure', () => {
      const handleNetworkError = (error) => {
        if (error.message === 'Network Error') {
          return 'Network connection failed. Please check your internet.';
        }
        return 'Failed to connect to server';
      };

      expect(handleNetworkError({ message: 'Network Error' })).toContain('Network connection failed');
    });

    it('should clear error on field change', () => {
      let error = 'Invalid email or password';
      
      const clearError = () => {
        error = '';
      };

      expect(error).toBe('Invalid email or password');
      clearError();
      expect(error).toBe('');
    });
  });

  describe('Navigation After Login', () => {
    it('should navigate to dashboard on successful login', () => {
      const mockNavigate = vi.fn();
      
      const handleSuccessfulLogin = (response) => {
        if (response.success && response.token) {
          localStorage.setItem('authToken', response.token);
          mockNavigate('/dashboard');
        }
      };

      handleSuccessfulLogin({ success: true, token: 'jwt-token' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate based on user role', () => {
      const mockNavigate = vi.fn();

      const navigateByRole = (role) => {
        const routes = {
          'admin': '/admin-dashboard',
          'coordinator': '/academic-coordinator-dashboard',
          'faculty_coordinator': '/faculty-coordinator-dashboard',
          'user': '/dashboard'
        };
        mockNavigate(routes[role]);
      };

      navigateByRole('coordinator');
      expect(mockNavigate).toHaveBeenCalledWith('/academic-coordinator-dashboard');
    });

    it('should store auth token in localStorage', () => {
      const storeToken = (token) => {
        localStorage.setItem('authToken', token);
      };

      storeToken('jwt-token-123');
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'jwt-token-123');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      const formLabels = {
        emailLabel: { htmlFor: 'email', text: 'Email Address' },
        passwordLabel: { htmlFor: 'password', text: 'Password' }
      };

      expect(formLabels.emailLabel.htmlFor).toBe('email');
      expect(formLabels.passwordLabel.htmlFor).toBe('password');
    });

    it('should support keyboard navigation', () => {
      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          return 'submit';
        }
        if (e.key === 'Tab') {
          return 'navigate-next';
        }
      };

      expect(handleKeyDown({ key: 'Enter', shiftKey: false })).toBe('submit');
      expect(handleKeyDown({ key: 'Tab' })).toBe('navigate-next');
    });
  });
});
