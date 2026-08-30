import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message =
        typeof exResponse === 'string'
          ? exResponse
          : (exResponse as any)?.message || exception.message;
    }

    // Log full error server-side (never expose to client)
    this.logger.error(
      `${request.method} ${request.originalUrl} ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Production: sanitize response — never leak stack traces or internals
    const isProduction = process.env.NODE_ENV === 'production';

    let safeMessage = message;
    if (isProduction && status >= 500) {
      safeMessage = 'Internal server error';
    } else if (isProduction && status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      safeMessage = 'Validation failed';
    }

    response.status(status).json({
      statusCode: status,
      message: safeMessage,
      ...(isProduction ? {} : { timestamp: new Date().toISOString() }),
    });
  }
}
