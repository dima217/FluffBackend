import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class PaginationQueryDto {
	@ApiProperty({
		description: 'Page number (1-based indexing). First page is 1.',
		example: 1,
		minimum: 1,
		required: false,
		default: 1,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiProperty({
		description: 'Number of items per page. Maximum value is 100.',
		example: 10,
		minimum: 1,
		maximum: 100,
		required: false,
		default: 10,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10;
}

export class PaginationMetaDto {
	@ApiProperty({ description: 'Current page number', example: 1 })
	page: number;

	@ApiProperty({ description: 'Number of items per page', example: 10 })
	limit: number;

	@ApiProperty({ description: 'Total number of items across all pages', example: 100 })
	total: number;

	@ApiProperty({ description: 'Total number of pages', example: 10 })
	totalPages: number;
}

export class PaginatedResponseDto<T> {
	@ApiProperty({ description: 'Array of items for the current page', isArray: true })
	data: T[];

	@ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
	meta: PaginationMetaDto;
}

