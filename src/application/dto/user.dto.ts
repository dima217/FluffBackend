import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { IsEqualToProperty } from '@application/decorator/is-equal-to-property.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UserSignUpDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 8 characters)',
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'John', description: 'User first name', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code sent to email',
    minLength: 5,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  code: string;

  @ApiProperty({
    example: 'male',
    description: 'User gender',
    enum: ['male', 'female', 'other'],
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(['male', 'female', 'other'])
  gender: 'male' | 'female' | 'other';

  @ApiProperty({
    example: '1990-01-01T00:00:00.000Z',
    description: 'Birth date (used to calculate age for calorie tracking)',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @ApiProperty({
    example: 175.5,
    description: 'Height in centimeters (for calorie tracking)',
    minimum: 50,
    maximum: 300,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(50)
  @Max(300)
  height: number;

  @ApiProperty({
    example: 70.5,
    description: 'Weight in kilograms (for calorie tracking)',
    minimum: 20,
    maximum: 500,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(20)
  @Max(500)
  weight: number;
}

export class UserSignUpInitDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class UserLoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Username (email)',
    minLength: 5,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 10,
    maxLength: 15,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  password: string;
}

export class JwtTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refresh: string;

  constructor(access: string, refresh: string) {
    this.access = access;
    this.refresh = refresh;
  }
}

export class UserOauthDto {
  @ApiProperty({ example: 'oauth_token_here', description: 'OAuth token' })
  token: string;
}

export class UserRecoveryConfirmDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Username (email)',
    minLength: 5,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Recovery code sent to email',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'New password',
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'Password confirmation',
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @IsEqualToProperty('password', { message: 'Passwords do not match' })
  passwordConfirm: string;
}

export class UserRecoveryInitDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Username (email)',
    minLength: 5,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  username: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Verification code sent to your email', description: 'Response message' })
  message: string;
}
