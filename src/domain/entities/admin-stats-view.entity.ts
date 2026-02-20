import { ViewEntity, ViewColumn } from 'typeorm';

/**
 * Materialized View Entity for Admin Statistics
 * Note: This entity is for TypeORM reference only.
 * The actual MATERIALIZED VIEW is created and managed by ViewCacheService.
 * Use REFRESH MATERIALIZED VIEW to update the cached data.
 */
@ViewEntity({
  name: 'admin_stats_view',
  expression: `
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
      (SELECT COUNT(DISTINCT "user_id") FROM "favorite") as users_with_favorites
  `,
  materialized: true, // Mark as materialized view
})
export class AdminStatsView {
  @ViewColumn()
  total_users: number;

  @ViewColumn()
  active_users: number;

  @ViewColumn()
  total_recipes: number;

  @ViewColumn()
  total_products: number;

  @ViewColumn()
  total_reviews: number;

  @ViewColumn()
  total_tracking: number;

  @ViewColumn()
  total_favorites: number;

  @ViewColumn()
  avg_recipe_rating: number;

  @ViewColumn()
  avg_review_score: number;

  @ViewColumn()
  users_with_tracking: number;

  @ViewColumn()
  users_with_favorites: number;
}
