import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ViewCacheService } from './view-cache.service';

@Injectable()
export class ViewCacheCronService {
  private readonly logger = new Logger(ViewCacheCronService.name);

  constructor(private readonly viewCacheService: ViewCacheService) {}

  /**
   * Refresh stats view every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleViewRefresh() {
    this.logger.log('Running scheduled view refresh...');
    try {
      await this.viewCacheService.refreshStatsView();
      this.logger.log('Scheduled view refresh completed successfully');
    } catch (error) {
      this.logger.error('Scheduled view refresh failed', error);
    }
  }

  /**
   * Refresh stats view every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyViewRefresh() {
    this.logger.log('Running daily view refresh...');
    try {
      await this.viewCacheService.refreshStatsView();
      this.logger.log('Daily view refresh completed successfully');
    } catch (error) {
      this.logger.error('Daily view refresh failed', error);
    }
  }
}
