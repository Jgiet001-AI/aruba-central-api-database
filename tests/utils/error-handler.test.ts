/**
 * Error Handler Unit Tests
 */

import { 
  ErrorHandler, 
  AppError, 
  DatabaseError, 
  ValidationError, 
  NotFoundError, 
  TimeoutError,
  ErrorCode 
} from '../../src/utils/error-handler';

describe('ErrorHandler', () => {
  describe('createErrorResponse', () => {
    test('should create standard error response format', () => {
      const response = ErrorHandler.createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Test error message',
        { field: 'test' }
      );

      expect(response).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Test error message',
          details: { field: 'test' },
          timestamp: expect.any(String)
        }
      });
      
      expect(new Date(response.error.timestamp)).toBeInstanceOf(Date);
    });

    test('should sanitize password in error message', () => {
      const response = ErrorHandler.createErrorResponse(
        ErrorCode.DATABASE_ERROR,
        'Connection failed with password=secret123',
        null
      );

      expect(response.error.message).toBe('Connection failed with password=***');
    });

    test('should sanitize token in error details', () => {
      const response = ErrorHandler.createErrorResponse(
        ErrorCode.AUTHENTICATION_ERROR,
        'Auth failed',
        { token: 'secret_token_123', other: 'safe_data' }
      );

      expect(response.error.details.token).toBe('***');
      expect(response.error.details.other).toBe('safe_data');
    });
  });

  describe('createSuccessResponse', () => {
    test('should create standard success response format', () => {
      const data = { id: 1, name: 'test' };
      const response = ErrorHandler.createSuccessResponse(data);

      expect(response).toMatchObject({
        success: true,
        data,
        timestamp: expect.any(String)
      });
      
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('handleError', () => {
    test('should handle AppError correctly', () => {
      const appError = new AppError(ErrorCode.NOT_FOUND, 'Resource not found', { id: '123' });
      const response = ErrorHandler.handleError(appError, 'TestContext');

      expect(response).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Resource not found',
          details: { id: '123' }
        }
      });
    });

    test('should handle generic Error correctly', () => {
      const genericError = new Error('Generic error message');
      const response = ErrorHandler.handleError(genericError);

      expect(response).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          details: { originalMessage: 'Generic error message' }
        }
      });
    });

    test('should handle unknown error correctly', () => {
      const unknownError = 'String error';
      const response = ErrorHandler.handleError(unknownError);

      expect(response).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unknown error occurred'
        }
      });
    });
  });

  describe('wrapAsync', () => {
    test('should return success response for successful async operation', async () => {
      const asyncFn = async () => ({ result: 'success' });
      const response = await ErrorHandler.wrapAsync(asyncFn);

      expect(response).toMatchObject({
        success: true,
        data: { result: 'success' }
      });
    });

    test('should return error response for failed async operation', async () => {
      const asyncFn = async () => {
        throw new ValidationError('Validation failed');
      };
      
      const response = await ErrorHandler.wrapAsync(asyncFn, 'TestContext');

      expect(response).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed'
        }
      });
    });
  });

  describe('createDatabaseError', () => {
    test('should create database error from PostgreSQL error', () => {
      const pgError = {
        message: 'Connection failed',
        code: '28000',
        detail: 'Invalid credentials',
        hint: 'Check username and password'
      };

      const dbError = ErrorHandler.createDatabaseError(pgError);

      expect(dbError).toBeInstanceOf(DatabaseError);
      expect(dbError.message).toBe('Connection failed');
      expect(dbError.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(dbError.details).toMatchObject({
        code: '28000',
        detail: 'Invalid credentials',
        hint: 'Check username and password'
      });
    });
  });

  describe('createValidationError', () => {
    test('should create validation error from multiple errors', () => {
      const errors = ['Field is required', 'Invalid format', 'Too long'];
      const validationError = ErrorHandler.createValidationError(errors);

      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError.message).toBe('Validation failed: Field is required, Invalid format, Too long');
      expect(validationError.details).toMatchObject({ errors });
    });
  });
});

describe('Custom Error Classes', () => {
  test('AppError should have correct properties', () => {
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test message', { field: 'test' }, 400);

    expect(error.name).toBe('AppError');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Test message');
    expect(error.details).toMatchObject({ field: 'test' });
    expect(error.statusCode).toBe(400);
  });

  test('DatabaseError should have correct defaults', () => {
    const error = new DatabaseError('DB connection failed');

    expect(error.name).toBe('DatabaseError');
    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.statusCode).toBe(500);
  });

  test('ValidationError should have correct defaults', () => {
    const error = new ValidationError('Validation failed');

    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
  });

  test('NotFoundError should format message correctly', () => {
    const error1 = new NotFoundError('User');
    expect(error1.message).toBe('User not found');

    const error2 = new NotFoundError('User', '123');
    expect(error2.message).toBe('User with identifier \'123\' not found');
    expect(error2.statusCode).toBe(404);
  });

  test('TimeoutError should include operation details', () => {
    const error = new TimeoutError('database_query', 5000);

    expect(error.message).toBe('Operation \'database_query\' timed out after 5000ms');
    expect(error.details).toMatchObject({
      operation: 'database_query',
      timeoutMs: 5000
    });
    expect(error.statusCode).toBe(408);
  });
});