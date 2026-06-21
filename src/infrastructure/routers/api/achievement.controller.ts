import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AchievementService } from '@application/service/achievement.service';
import { AchievementResponseDto } from '@application/dto/achievement.dto';
import { User as UserDecorator } from '@infrastructure/decorator/user.decorator';
import type { User as UserEntity } from '@domain/entities/user.entity';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get achievements for current user' })
  @ApiResponse({ status: 200, type: [AchievementResponseDto] })
  async getMine(@UserDecorator() user: UserEntity): Promise<AchievementResponseDto[]> {
    return this.achievementService.getUserAchievements(user.id);
  }
}
