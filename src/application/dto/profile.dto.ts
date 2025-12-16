import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsDate } from "class-validator";
import { Type } from "class-transformer";

export class CreateProfileDto {
	photo?: string;
	birthDate?: Date;
	bio?: string;
}

export class UpdateProfileDto {
	@ApiProperty({ example: 'https://example.com/photo.jpg', description: 'Profile photo URL', required: false })
	@IsOptional()
	@IsString()
	photo?: string;

	@ApiProperty({ example: '1990-01-01T00:00:00.000Z', description: 'Birth date', required: false })
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	birthDate?: Date;

	@ApiProperty({ example: 'Software developer passionate about coding', description: 'User bio', required: false })
	@IsOptional()
	@IsString()
	bio?: string;

	@ApiProperty({ example: 'John', description: 'User first name', required: false })
	@IsOptional()
	@IsString()
	firstName?: string;

	@ApiProperty({ example: 'Doe', description: 'User last name', required: false })
	@IsOptional()
	@IsString()
	lastName?: string;
}


export class ProfileResponseDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Profile ID' })
	id: string;

	@ApiProperty({ example: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'user@example.com', firstName: 'John', lastName: 'Doe' }, description: 'User information' })
	user: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
	};

	@ApiProperty({ example: '1990-01-01T00:00:00.000Z', description: 'Birth date' })
	birthDate: Date;

	@ApiProperty({ example: 'Software developer passionate about coding', description: 'User bio' })
	bio: string;

	@ApiProperty({ example: 'https://example.com/photo.jpg', description: 'Profile photo URL' })
	photo: string;

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
	createdAt: Date;

	@ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
	updatedAt: Date;
}