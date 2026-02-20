import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PROVIDER_CONSTANTS } from '@domain/interface/constant';

@Injectable()
export class ViewCacheService {
  private readonly logger = new Logger(ViewCacheService.name);

  constructor(@Inject(PROVIDER_CONSTANTS.DATA_SOURCE) private readonly dataSource: DataSource) {}

  /**
   * Refresh materialized view cache
   * Uses REFRESH MATERIALIZED VIEW to update cached data
   */
  async refreshStatsView(): Promise<void> {
    try {
      this.logger.log('Refreshing admin_stats_view materialized view...');

      // First check if view exists
      const viewExists = await this.checkIfMaterializedViewExists('admin_stats_view');
      
      if (!viewExists) {
        this.logger.warn('admin_stats_view does not exist, creating it first...');
        await this.createMaterializedView();
        return;
      }

      // Try refreshing with CONCURRENTLY
      try {
        await this.dataSource.query(`
          REFRESH MATERIALIZED VIEW CONCURRENTLY admin_stats_view;
        `);
        this.logger.log('admin_stats_view refreshed successfully (with CONCURRENTLY)');
      } catch (error) {
        // If CONCURRENTLY fails (no unique index), try without it
        if (error.message?.includes('CONCURRENTLY') || error.message?.includes('unique index')) {
          this.logger.warn('CONCURRENTLY refresh failed, trying without CONCURRENTLY...');
          await this.dataSource.query(`
            REFRESH MATERIALIZED VIEW admin_stats_view;
          `);
          this.logger.log('admin_stats_view refreshed successfully (without CONCURRENTLY)');
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Failed to refresh admin_stats_view', error);
      throw error;
    }
  }

  /**
   * Check if materialized view exists
   */
  private async checkIfMaterializedViewExists(viewName: string): Promise<boolean> {
    const result = await this.dataSource.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname = $1
      ) as exists;
    `, [viewName]);
    
    return result[0]?.exists || false;
  }

  /**
   * Create the materialized view
   */
  private async createMaterializedView(): Promise<void> {
    this.logger.log('Creating admin_stats_view materialized view...');
    
    await this.dataSource.query(`
      CREATE MATERIALIZED VIEW admin_stats_view AS
      SELECT 
        (SELECT COUNT(*) FROM "user" WHERE "deletedAt" IS NULL) as total_users,
        (SELECT COUNT(*) FROM "user" WHERE "isActive" = true AND "deletedAt" IS NULL) as active_users,
        (SELECT COUNT(*) FROM "recipe") as total_recipes,
        (SELECT COUNT(*) FROM "product") as total_products,
        (SELECT COUNT(*) FROM "review") as total_reviews,
        (SELECT COUNT(*) FROM "tracking") as total_tracking,
        (SELECT COUNT(*) FROM "favorite") as total_favorites,
        (SELECT COALESCE(AVG("average"), 0) FROM "recipe") as avg_recipe_rating,
        (SELECT COALESCE(AVG("score"), 0) FROM "review") as avg_review_score,
        (SELECT COUNT(DISTINCT "user_id") FROM "tracking") as users_with_tracking,
        (SELECT COUNT(DISTINCT "user_id") FROM "favorite") as users_with_favorites;
    `);

    // Create unique index for CONCURRENT refresh
    await this.createUniqueIndex();
    
    this.logger.log('admin_stats_view materialized view created successfully');
  }

  /**
   * Create unique index for CONCURRENT refresh
   */
  private async createUniqueIndex(): Promise<void> {
    try {
      // Check if index already exists
      const indexExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = 'admin_stats_view' 
          AND indexname = 'admin_stats_view_unique_idx'
        ) as exists;
      `);

      if (!indexExists[0]?.exists) {
        await this.dataSource.query(`
          CREATE UNIQUE INDEX admin_stats_view_unique_idx 
          ON admin_stats_view (total_users, active_users, total_recipes, total_products);
        `);
        this.logger.log('Unique index created for admin_stats_view');
      }
    } catch (error) {
      this.logger.warn('Failed to create unique index (may already exist)', error);
    }
  }

  /**
   * Initialize materialized view on application startup
   */
  async initializeView(): Promise<void> {
    try {
      this.logger.log('Initializing admin_stats_view materialized view...');
      
      // Check if materialized view exists
      const viewExists = await this.checkIfMaterializedViewExists('admin_stats_view');

      if (!viewExists) {
        // Create materialized view if it doesn't exist
        await this.createMaterializedView();
      } else {
        // Refresh existing materialized view
        this.logger.log('admin_stats_view already exists, refreshing...');
        await this.refreshStatsView();
      }
    } catch (error) {
      this.logger.error('Failed to initialize admin_stats_view', error);
      // Don't throw - allow app to start even if view creation fails
    }
  }

  /**
   * Get stats from view
   */
  async getStats(): Promise<any> {
    try {
      const result = await this.dataSource.query(`
        SELECT * FROM admin_stats_view LIMIT 1;
      `);
      return result[0] || null;
    } catch (error) {
      this.logger.error('Failed to get stats from view', error);
      
      // If materialized view doesn't exist, initialize it
      if (error.message?.includes('does not exist') || 
          error.message?.includes('materialized view') ||
          error.code === '42P01') { // PostgreSQL error code for undefined_table
        await this.initializeView();
        // Try again after initialization
        const result = await this.dataSource.query(`
          SELECT * FROM admin_stats_view LIMIT 1;
        `);
        return result[0] || null;
      }
      
      throw error;
    }
  }

  /**
   * Drop and recreate the view (useful for schema changes)
   */
  async recreateView(): Promise<void> {
    try {
      this.logger.warn('Recreating admin_stats_view materialized view...');
      
      // Drop if exists
      await this.dataSource.query(`
        DROP MATERIALIZED VIEW IF EXISTS admin_stats_view CASCADE;
      `);
      
      // Recreate
      await this.createMaterializedView();
      
      this.logger.log('admin_stats_view recreated successfully');
    } catch (error) {
      this.logger.error('Failed to recreate admin_stats_view', error);
      throw error;
    }
  }
}