import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorBody = { message?: unknown; errors?: unknown };
function isErrorBody(x: unknown): x is ErrorBody {
  return typeof x === 'object' && x !== null;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload: {
      statusCode: number;
      message: string;
      path: string;
      timestamp: string;
      errors?: unknown;
    } = {
      statusCode: status,
      message: '서버 오류',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        payload.message = res;
      } else if (isErrorBody(res)) {
        if (typeof res.message === 'string') payload.message = res.message;
        if (Array.isArray(res.errors)) payload.errors = res.errors;
      } else if (exception.message) {
        payload.message = String(exception.message);
      }
    } else if (exception instanceof Error) {
      payload.message = String(exception.message);
    }

    response.status(status).json(payload);
  }
}
