import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || (res as any).error || res;
        errorType = (res as any).error || exception.name;
      } else {
        message = res;
        errorType = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma-specific known database errors
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `A resource with this ${target} already exists`;
          errorType = 'Conflict';
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found';
          errorType = 'NotFound';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed on related record';
          errorType = 'ConstraintViolation';
          break;
        }
        case 'P2028': {
          status = HttpStatus.REQUEST_TIMEOUT;
          message = 'Database transaction timed out under high load. Please retry.';
          errorType = 'TransactionTimeout';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = `Database query error (Code: ${exception.code})`;
          errorType = 'DatabaseError';
          break;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database service temporarily unavailable. Reconnecting...';
      errorType = 'DatabaseUnavailable';
      this.logger.error(`Database initialization failure: ${exception.message}`);
    } else if (exception instanceof Error) {
      // Standard JS error
      message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : exception.message;
      errorType = exception.name;
      this.logger.error(`Unhandled Exception at ${request.method} ${request.url}: ${exception.message}`, exception.stack);
    }

    // Never let unhandled errors crash the process
    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorType,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

