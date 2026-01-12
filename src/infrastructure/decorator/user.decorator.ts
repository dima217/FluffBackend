import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { User as UserEntity } from '@domain/entities/user.entity';
import { IS_PUBLIC_KEY } from './public.decorator';

type RequestWithUser = Request & { user?: UserEntity };

export const User = createParamDecorator(
	(data: keyof UserEntity | undefined, context: ExecutionContext) => {
		const request = context.switchToHttp().getRequest<RequestWithUser>();
		const user = request.user;

		// Check if endpoint is public
		const reflector = new Reflector();
		const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		// For public endpoints, return null if user is not found (don't throw error)
		if (!user) {
			if (isPublic) {
				return null;
			}
			throw new UnauthorizedException('User is not authenticated');
		}

		if (data) {
			return user[data];
		}

		return user;
	},
);

