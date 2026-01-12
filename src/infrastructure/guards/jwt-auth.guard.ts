import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@infrastructure/decorator/public.decorator';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public endpoints, still try to validate token if provided
      // but don't require it (don't throw error if token is missing or invalid)
      const result = super.canActivate(context);
      if (result instanceof Observable) {
        return result.pipe(
          catchError(() => {
            // If token validation fails, just continue without user
            // This allows public endpoints to work with or without token
            return of(true);
          }),
        );
      }
      if (result instanceof Promise) {
        return result.catch(() => true);
      }
      return result;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public endpoints, don't throw error if token is invalid or missing
    if (isPublic && (err || !user)) {
      return null; // Return null instead of throwing error
    }

    // For protected endpoints, use default behavior (throw error if invalid)
    return super.handleRequest(err, user, info, context);
  }
}
