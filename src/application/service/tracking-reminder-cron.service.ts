import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { IProfileRepository } from '@domain/interface/profile.repository';
import type { ITrackingRepository } from '@domain/interface/tracking.repository';
import { REPOSITORY_CONSTANTS } from '@domain/interface/constant';
import { PushEventsService } from './push-event.service';
import { Profile } from '@domain/entities/profile.entity';

@Injectable()
export class TrackingReminderCronService {
  private readonly logger = new Logger(TrackingReminderCronService.name);

  constructor(
    @Inject(REPOSITORY_CONSTANTS.PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,
    @Inject(REPOSITORY_CONSTANTS.TRACKING_REPOSITORY)
    private readonly trackingRepository: ITrackingRepository,
    private readonly pushEventsService: PushEventsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async notifyCalorieDeficitAfterEvening(): Promise<void> {
    try {
      const profiles = await this.profileRepository.findAllWithUsers();
      for (const profile of profiles) {
        await this.processProfile(profile);
      }
    } catch (error) {
      this.logger.error(
        `Tracking reminder job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async processProfile(profile: Profile): Promise<void> {
    const userId = profile.user?.id;
    if (!userId) return;

    const timezone = this.normalizeTimezone(profile.timezone);
    const localNow = this.getLocalDateParts(new Date(), timezone);

    if (localNow.hour < 18) return;

    const reminderCacheKey = `tracking:reminder:${userId}:${localNow.dateKey}`;
    const alreadySent = await this.cacheManager.get<boolean>(reminderCacheKey);
    if (alreadySent) return;

    const dailyTarget = this.calculateDailyTarget(profile);
    if (!dailyTarget) return;

    const localStart = { year: localNow.year, month: localNow.month, day: localNow.day, hour: 0 };
    const localEnd = {
      year: localNow.year,
      month: localNow.month,
      day: localNow.day,
      hour: 23,
      minute: 59,
      second: 59,
    };

    const startUtc = this.zonedPartsToUtc(localStart, timezone);
    const endUtc = this.zonedPartsToUtc(localEnd, timezone);
    const stats = await this.trackingRepository.getDateStatistics(startUtc, endUtc, userId);

    if (stats.totalCalories >= dailyTarget) return;

    const caloriesLeft = Math.max(0, Math.round(dailyTarget - stats.totalCalories));
    await this.pushEventsService.sendToUserIds(
      [userId],
      'Not enough calories today',
      `You still need around ${caloriesLeft} kcal today. Add one more meal to stay on track.`,
      {
        type: 'tracking_reminder',
        targetCalories: String(Math.round(dailyTarget)),
        consumedCalories: String(Math.round(stats.totalCalories)),
        caloriesLeft: String(caloriesLeft),
        date: localNow.dateKey,
      },
    );

    const ttlMs = this.getMsUntilLocalMidnight(timezone);
    await this.cacheManager.set(reminderCacheKey, true, Math.max(60, Math.floor(ttlMs / 1000)));
  }

  private calculateDailyTarget(profile: Profile): number | null {
    if (!profile.birthDate || !profile.height || !profile.weight || !profile.gender) {
      return null;
    }

    const age = this.calculateAge(profile.birthDate);
    if (age <= 0) return null;

    const weight = Number(profile.weight);
    const height = Number(profile.height);
    if (!Number.isFinite(weight) || !Number.isFinite(height)) {
      return null;
    }

    let bmr: number;
    if (profile.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (profile.gender === 'female') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 78;
    }

    const multiplier = this.getActivityMultiplier(profile.sportActivity);
    const target = bmr * multiplier;
    return target > 0 ? target : null;
  }

  private getActivityMultiplier(activity: string | null): number {
    switch ((activity ?? '').toLowerCase()) {
      case 'running':
      case 'cycling':
      case 'swimming':
        return 1.55;
      case 'walking':
        return 1.375;
      default:
        return 1.2;
    }
  }

  private calculateAge(birthDate: Date): number {
    const now = new Date();
    let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
      age--;
    }
    return age;
  }

  private normalizeTimezone(timezone: string | null | undefined): string {
    if (!timezone?.trim()) return 'UTC';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return timezone;
    } catch {
      return 'UTC';
    }
  }

  private getLocalDateParts(date: Date, timeZone: string): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    dateKey: string;
  } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map = new Map(parts.map((part) => [part.type, part.value]));
    const year = Number(map.get('year'));
    const month = Number(map.get('month'));
    const day = Number(map.get('day'));
    const hour = Number(map.get('hour'));
    const minute = Number(map.get('minute'));
    const second = Number(map.get('second'));

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      dateKey: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  }

  private zonedPartsToUtc(
    parts: {
      year: number;
      month: number;
      day: number;
      hour?: number;
      minute?: number;
      second?: number;
    },
    timeZone: string,
  ): Date {
    const utcGuess = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour ?? 0,
      parts.minute ?? 0,
      parts.second ?? 0,
    );
    const offsetMs = this.getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
    return new Date(utcGuess - offsetMs);
  }

  private getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const local = this.getLocalDateParts(date, timeZone);
    const localAsUtc = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );
    return localAsUtc - date.getTime();
  }

  private getMsUntilLocalMidnight(timeZone: string): number {
    const now = new Date();
    const local = this.getLocalDateParts(now, timeZone);
    const nextDayLocalMidnightUtc = this.zonedPartsToUtc(
      {
        year: local.year,
        month: local.month,
        day: local.day + 1,
        hour: 0,
        minute: 0,
        second: 0,
      },
      timeZone,
    );
    return Math.max(60_000, nextDayLocalMidnightUtc.getTime() - now.getTime());
  }
}
