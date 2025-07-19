/**
 * Input Validation Utilities
 * Comprehensive validation functions for API inputs and data integrity
 */

import { ValidationError } from './error-handler';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * HTTP method validation
 */
export function validateHttpMethod(method: string): ValidationResult {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  const errors: string[] = [];
  
  if (!method) {
    errors.push('HTTP method is required');
  } else if (typeof method !== 'string') {
    errors.push('HTTP method must be a string');
  } else if (!validMethods.includes(method.toUpperCase())) {
    errors.push(`HTTP method must be one of: ${validMethods.join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * URL validation
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  
  if (!url) {
    errors.push('URL is required');
  } else if (typeof url !== 'string') {
    errors.push('URL must be a string');
  } else {
    try {
      new URL(url);
      
      // Additional checks for Aruba Central URLs
      if (!url.startsWith('https://')) {
        errors.push('URL must use HTTPS protocol');
      }
      
      if (url.length > 2000) {
        errors.push('URL is too long (max 2000 characters)');
      }
      
    } catch {
      errors.push('URL format is invalid');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * String length validation
 */
export function validateStringLength(
  value: string, 
  field: string, 
  minLength: number = 1, 
  maxLength: number = 1000
): ValidationResult {
  const errors: string[] = [];
  
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
  } else {
    if (value.length < minLength) {
      errors.push(`${field} must be at least ${minLength} characters long`);
    }
    
    if (value.length > maxLength) {
      errors.push(`${field} must not exceed ${maxLength} characters`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Numeric range validation
 */
export function validateNumericRange(
  value: number, 
  field: string, 
  min: number = 0, 
  max: number = Number.MAX_SAFE_INTEGER
): ValidationResult {
  const errors: string[] = [];
  
  if (typeof value !== 'number') {
    errors.push(`${field} must be a number`);
  } else if (!Number.isFinite(value)) {
    errors.push(`${field} must be a finite number`);
  } else {
    if (value < min) {
      errors.push(`${field} must be at least ${min}`);
    }
    
    if (value > max) {
      errors.push(`${field} must not exceed ${max}`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Database ID validation
 */
export function validateDatabaseId(id: string): ValidationResult {
  const errors: string[] = [];
  
  if (!id) {
    errors.push('ID is required');
  } else if (typeof id !== 'string') {
    errors.push('ID must be a string');
  } else {
    // Check for UUID format or numeric ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const isNumeric = /^\d+$/.test(id);
    
    if (!isUuid && !isNumeric) {
      errors.push('ID must be a valid UUID or numeric identifier');
    }
    
    if (id.length > 100) {
      errors.push('ID is too long (max 100 characters)');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (typeof email !== 'string') {
    errors.push('Email must be a string');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      errors.push('Email format is invalid');
    }
    
    if (email.length > 254) {
      errors.push('Email is too long (max 254 characters)');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * JSON validation
 */
export function validateJson(value: string, field: string): ValidationResult {
  const errors: string[] = [];
  
  if (!value) {
    return { isValid: true, errors }; // Allow empty JSON
  }
  
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`);
  } else {
    try {
      JSON.parse(value);
    } catch {
      errors.push(`${field} must be valid JSON`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Search query validation
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  
  if (query !== undefined && query !== null) {
    if (typeof query !== 'string') {
      errors.push('Search query must be a string');
    } else {
      if (query.trim().length === 0) {
        errors.push('Search query cannot be empty');
      }
      
      if (query.length > 500) {
        errors.push('Search query too long (max 500 characters)');
      }
      
      // Check for potentially malicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:/i,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(query)) {
          errors.push('Search query contains invalid characters');
          break;
        }
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Pagination parameters validation
 */
export function validatePaginationParams(
  page?: number, 
  limit?: number
): ValidationResult {
  const errors: string[] = [];
  
  if (page !== undefined) {
    const pageValidation = validateNumericRange(page, 'page', 1, 10000);
    if (!pageValidation.isValid) {
      errors.push(...pageValidation.errors);
    }
  }
  
  if (limit !== undefined) {
    const limitValidation = validateNumericRange(limit, 'limit', 1, 1000);
    if (!limitValidation.isValid) {
      errors.push(...limitValidation.errors);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * API authentication config validation
 */
export function validateAuthConfig(authConfig: any): ValidationResult {
  const errors: string[] = [];
  
  if (!authConfig) {
    return { isValid: true, errors }; // Auth config is optional
  }
  
  if (typeof authConfig !== 'object') {
    errors.push('Auth config must be an object');
    return { isValid: false, errors };
  }
  
  const { type, token, key, value } = authConfig;
  
  if (!type) {
    errors.push('Auth type is required');
  } else if (!['bearer', 'apikey', 'basic', 'oauth2'].includes(type)) {
    errors.push('Auth type must be one of: bearer, apikey, basic, oauth2');
  }
  
  if (type === 'bearer' && !token) {
    errors.push('Bearer token is required for bearer auth');
  }
  
  if (type === 'apikey' && (!key || !value)) {
    errors.push('API key and value are required for apikey auth');
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Comprehensive request validation
 */
export function validateApiRequest(request: {
  name?: string;
  method?: string;
  url?: string;
  description?: string;
  headers?: any;
  authConfig?: any;
  body?: any;
}): ValidationResult {
  const errors: string[] = [];
  
  // Validate required fields
  if (!request.name) {
    errors.push('API name is required');
  } else {
    const nameValidation = validateStringLength(request.name, 'name', 1, 200);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
  }
  
  if (!request.method) {
    errors.push('HTTP method is required');
  } else {
    const methodValidation = validateHttpMethod(request.method);
    if (!methodValidation.isValid) {
      errors.push(...methodValidation.errors);
    }
  }
  
  if (!request.url) {
    errors.push('URL is required');
  } else {
    const urlValidation = validateUrl(request.url);
    if (!urlValidation.isValid) {
      errors.push(...urlValidation.errors);
    }
  }
  
  // Validate optional fields
  if (request.description) {
    const descValidation = validateStringLength(request.description, 'description', 0, 1000);
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors);
    }
  }
  
  if (request.authConfig) {
    const authValidation = validateAuthConfig(request.authConfig);
    if (!authValidation.isValid) {
      errors.push(...authValidation.errors);
    }
  }
  
  if (request.headers && typeof request.headers === 'string') {
    const headersValidation = validateJson(request.headers, 'headers');
    if (!headersValidation.isValid) {
      errors.push(...headersValidation.errors);
    }
  }
  
  if (request.body && typeof request.body === 'string') {
    const bodyValidation = validateJson(request.body, 'body');
    if (!bodyValidation.isValid) {
      errors.push(...bodyValidation.errors);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Throw validation error if validation fails
 */
export function validateOrThrow(validation: ValidationResult, context?: string): void {
  if (!validation.isValid) {
    const message = context 
      ? `Validation failed in ${context}: ${validation.errors.join(', ')}`
      : `Validation failed: ${validation.errors.join(', ')}`;
    throw new ValidationError(message, { errors: validation.errors });
  }
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...validations: ValidationResult[]): ValidationResult {
  const allErrors = validations.flatMap(v => v.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}