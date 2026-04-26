import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiPropertyOptional({
    description: 'FCM registration token from the device; omit or null to unregister',
    maxLength: 4096,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  token?: string | null;
}

export class MarkNotificationsReadDto {
  @ApiProperty({
    description: 'Notification ids to mark as read',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
