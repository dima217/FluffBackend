import { ExceptionFilter, Catch, ArgumentsHost, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(NotFoundException)
export class SwaggerJsonFilter implements ExceptionFilter {
  constructor(private readonly swaggerDocument?: any) {}

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (request.method === 'GET' && this.swaggerDocument) {
      response.setHeader('Content-Type', 'application/json');
      return response.send(this.swaggerDocument);
    }

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
