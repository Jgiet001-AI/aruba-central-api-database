/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

import { logger } from '@config/logger';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Response type union
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Error codes for different types of errors
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, AppError);
  }
}

/**
 * Database-specific error
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, details, 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, details, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, { resource, identifier }, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(
      ErrorCode.TIMEOUT_ERROR, 
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      { operation, timeoutMs },
      408
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    code: ErrorCode,
    message: string,
    details?: any
  ): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message: this.sanitizeErrorMessage(message),
        details: this.sanitizeErrorDetails(details),
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a standardized success response
   */
  static createSuccessResponse<T>(data: T): SuccessResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle and log errors consistently
   */
  static handleError(error: unknown, context?: string): ErrorResponse {
    const contextStr = context ? `[${context}] ` : '';
    
    if (error instanceof AppError) {
      logger.error(`${contextStr}Application Error:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });
      
      return this.createErrorResponse(error.code, error.message, error.details);
    }

    if (error instanceof Error) {
      logger.error(`${contextStr}Unexpected Error:`, {
        message: error.message,
        stack: error.stack,
      });
      
      return this.createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred',
        { originalMessage: error.message }
      );
    }

    logger.error(`${contextStr}Unknown Error:`, error);
    
    return this.createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'An unknown error occurred'
    );
  }

  /**
   * Wrap async functions with error handling
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<ApiResponse<T>> {
    try {
      const result = await fn();
      return this.createSuccessResponse(result);
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  private static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information patterns
    return message
      .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s]+/gi, 'secret=***');
  }

  /**
   * Sanitize error details to prevent information disclosure
   */
  private static sanitizeErrorDetails(details: any): any {
    if (!details) return details;
    
    if (typeof details === 'string') {
      return this.sanitizeErrorMessage(details);
    }
    
    if (typeof details === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(details)) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeErrorMessage(value);
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeErrorDetails(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }
    
    return details;
  }

  /**
   * Create a database error from a PostgreSQL error
   */
  static createDatabaseError(error: any): DatabaseError {
    const message = error.message || 'Database operation failed';
    const details = {
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
    };
    
    return new DatabaseError(message, details);
  }

  /**
   * Create a validation error from multiple validation failures
   */
  static createValidationError(errors: string[]): ValidationError {
    const message = `Validation failed: ${errors.join(', ')}`;
    return new ValidationError(message, { errors });
  }
}

/**
 * Decorator for async method error handling
 */
export function HandleErrors(context?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        const errorContext = context || `${target.constructor.name}.${propertyName}`;
        logger.error(`Error in ${errorContext}:`, error);
        throw error;
      }
    };
  };
}