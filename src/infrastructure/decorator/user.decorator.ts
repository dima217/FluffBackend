import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { User as UserEntity } from '@domain/entities/user.entity';

type RequestWithUser = Request & { user?: UserEntity };

export const User = createParamDecorator(
	(data: keyof UserEntity | undefined, context: ExecutionContext) => {
		const request = context.switchToHttp().getRequest<RequestWithUser>();
		const user = request.user;

		if (!user) {
			throw new UnauthorizedException('User is not authenticated');
		}

		if (data) {
			return user[data];
		}

		return user;
	},
);

