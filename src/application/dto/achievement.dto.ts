import { ApiProperty } from '@nestjs/swagger';

export class AchievementResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  icon: string;

  @ApiProperty({ nullable: true })
  unlockedAt: string | null;
}
