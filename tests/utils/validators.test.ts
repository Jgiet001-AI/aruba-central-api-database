/**
 * Validators Unit Tests
 */

import {
  validateHttpMethod,
  validateUrl,
  validateStringLength,
  validateNumericRange,
  validateDatabaseId,
  validateEmail,
  validateJson,
  validateSearchQuery,
  validatePaginationParams,
  validateAuthConfig,
  validateApiRequest,
  sanitizeInput,
  combineValidations
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('validateHttpMethod', () => {
    test('should accept valid HTTP methods', () => {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      
      validMethods.forEach(method => {
        const result = validateHttpMethod(method);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should accept lowercase methods', () => {
      const result = validateHttpMethod('get');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid methods', () => {
      const result = validateHttpMethod('INVALID');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('HTTP method must be one of: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
    });

    test('should reject empty method', () => {
      const result = validateHttpMethod('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('HTTP method is required');
    });

    test('should reject non-string method', () => {
      const result = validateHttpMethod(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('HTTP method must be a string');
    });
  });

  describe('validateUrl', () => {
    test('should accept valid HTTPS URLs', () => {
      const validUrls = [
        'https://api.example.com',
        'https://api.example.com/v1/users',
        'https://central.arubanetworks.com/monitoring/v1/devices'
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject HTTP URLs', () => {
      const result = validateUrl('http://api.example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL must use HTTPS protocol');
    });

    test('should reject invalid URL format', () => {
      const result = validateUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL format is invalid');
    });

    test('should reject empty URL', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    test('should reject too long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is too long (max 2000 characters)');
    });
  });

  describe('validateStringLength', () => {
    test('should accept strings within range', () => {
      const result = validateStringLength('valid string', 'test field', 1, 20);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject strings too short', () => {
      const result = validateStringLength('', 'test field', 5, 20);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must be at least 5 characters long');
    });

    test('should reject strings too long', () => {
      const result = validateStringLength('very long string', 'test field', 1, 5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must not exceed 5 characters');
    });

    test('should reject non-strings', () => {
      const result = validateStringLength(123 as any, 'test field');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must be a string');
    });
  });

  describe('validateNumericRange', () => {
    test('should accept numbers within range', () => {
      const result = validateNumericRange(50, 'test field', 1, 100);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject numbers below minimum', () => {
      const result = validateNumericRange(-5, 'test field', 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must be at least 0');
    });

    test('should reject numbers above maximum', () => {
      const result = validateNumericRange(150, 'test field', 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must not exceed 100');
    });

    test('should reject non-finite numbers', () => {
      const result = validateNumericRange(Infinity, 'test field');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must be a finite number');
    });

    test('should reject non-numbers', () => {
      const result = validateNumericRange('123' as any, 'test field');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must be a number');
    });
  });

  describe('validateDatabaseId', () => {
    test('should accept valid UUIDs', () => {
      const result = validateDatabaseId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept numeric IDs', () => {
      const result = validateDatabaseId('12345');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid formats', () => {
      const result = validateDatabaseId('invalid-id');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID must be a valid UUID or numeric identifier');
    });

    test('should reject empty ID', () => {
      const result = validateDatabaseId('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID is required');
    });
  });

  describe('validateEmail', () => {
    test('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double@domain.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Email format is invalid');
      });
    });
  });

  describe('validateJson', () => {
    test('should accept valid JSON strings', () => {
      const validJson = JSON.stringify({ key: 'value', array: [1, 2, 3] });
      const result = validateJson(validJson, 'test field');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept empty JSON', () => {
      const result = validateJson('', 'test field');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid JSON', () => {
      const result = validateJson('{ invalid json }', 'test field');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test field must be valid JSON');
    });
  });

  describe('validateSearchQuery', () => {
    test('should accept valid search queries', () => {
      const validQueries = [
        'device management',
        'API endpoints',
        'monitoring tools'
      ];

      validQueries.forEach(query => {
        const result = validateSearchQuery(query);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject empty queries', () => {
      const result = validateSearchQuery('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Search query cannot be empty');
    });

    test('should reject queries with suspicious patterns', () => {
      const suspiciousQueries = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'onclick=alert(1)'
      ];

      suspiciousQueries.forEach(query => {
        const result = validateSearchQuery(query);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Search query contains invalid characters');
      });
    });

    test('should reject too long queries', () => {
      const longQuery = 'a'.repeat(501);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Search query too long (max 500 characters)');
    });
  });

  describe('validateAuthConfig', () => {
    test('should accept valid bearer auth config', () => {
      const authConfig = { type: 'bearer', token: 'abc123' };
      const result = validateAuthConfig(authConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept valid API key auth config', () => {
      const authConfig = { type: 'apikey', key: 'X-API-Key', value: 'abc123' };
      const result = validateAuthConfig(authConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject bearer auth without token', () => {
      const authConfig = { type: 'bearer' };
      const result = validateAuthConfig(authConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bearer token is required for bearer auth');
    });

    test('should reject apikey auth without key/value', () => {
      const authConfig = { type: 'apikey', key: 'X-API-Key' };
      const result = validateAuthConfig(authConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key and value are required for apikey auth');
    });

    test('should accept null auth config', () => {
      const result = validateAuthConfig(null);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateApiRequest', () => {
    test('should accept valid API request', () => {
      const request = {
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        description: 'Retrieve all users',
        headers: { 'Content-Type': 'application/json' },
        authConfig: { type: 'bearer', token: 'abc123' }
      };

      const result = validateApiRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject request missing required fields', () => {
      const request = {};
      const result = validateApiRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API name is required');
      expect(result.errors).toContain('HTTP method is required');
      expect(result.errors).toContain('URL is required');
    });

    test('should validate nested fields', () => {
      const request = {
        name: 'Test API',
        method: 'INVALID_METHOD',
        url: 'http://insecure.com',
        authConfig: { type: 'bearer' } // Missing token
      };

      const result = validateApiRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });

  describe('sanitizeInput', () => {
    test('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('scriptalert("xss")/script');
    });

    test('should remove quotes', () => {
      const input = `It's a "test" string`;
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Its a test string');
    });

    test('should handle non-string input', () => {
      const sanitized = sanitizeInput(123 as any);
      expect(sanitized).toBe('');
    });
  });

  describe('combineValidations', () => {
    test('should combine multiple valid results', () => {
      const result1 = { isValid: true, errors: [] };
      const result2 = { isValid: true, errors: [] };
      
      const combined = combineValidations(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    test('should combine validation errors', () => {
      const result1 = { isValid: false, errors: ['Error 1'] };
      const result2 = { isValid: false, errors: ['Error 2', 'Error 3'] };
      
      const combined = combineValidations(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });
  });
});