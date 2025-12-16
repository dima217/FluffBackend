import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { RelatedEntityType } from '@domain/enums/related-entity-type.enum';

export const RelatedEntityTypeParam = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): RelatedEntityType => {
		const request = ctx.switchToHttp().getRequest();
		const type = request.params.type;

		if (!type || !Object.values(RelatedEntityType).includes(type as RelatedEntityType)) {
			throw new BadRequestException(
				`Invalid type: ${type}. Must be one of: ${Object.values(RelatedEntityType).join(', ')}`,
			);
		}

		return type as RelatedEntityType;
	},
);

