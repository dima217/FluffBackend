import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDate, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfileDto {
  photo?: string;
  birthDate?: Date;
  bio?: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    example: 'https://example.com/photo.jpg',
    description: 'Profile photo URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ example: '1990-01-01T00:00:00.000Z', description: 'Birth date', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @ApiProperty({
    example: 'Software developer passionate about coding',
    description: 'User bio',
    required: false,
  })
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

  @ApiPropertyOptional({
    example: 'male',
    description: 'User gender',
    enum: ['male', 'female', 'other'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @ApiPropertyOptional({
    example: 175.5,
    description: 'Height in centimeters',
    minimum: 50,
    maximum: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({
    example: 70.5,
    description: 'Weight in kilograms',
    minimum: 20,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weight?: number;
}

export class ProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Profile ID' })
  id: string;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    description: 'User information',
  })
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

  @ApiPropertyOptional({
    example: 'male',
    description: 'User gender',
    enum: ['male', 'female', 'other'],
  })
  gender: string | null;

  @ApiPropertyOptional({ example: 175.5, description: 'Height in centimeters' })
  height: number | null;

  @ApiPropertyOptional({ example: 70.5, description: 'Weight in kilograms' })
  weight: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}
