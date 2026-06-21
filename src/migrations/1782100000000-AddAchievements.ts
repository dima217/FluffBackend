import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAchievements1782100000000 implements MigrationInterface {
  name = 'AddAchievements1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "achievements" (
        "id" SERIAL NOT NULL,
        "code" character varying(64) NOT NULL,
        "icon" character varying(64) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_achievements_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_achievements_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_achievements" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "achievement_id" integer NOT NULL,
        "unlocked_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_achievements_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_achievements_user_achievement" UNIQUE ("user_id", "achievement_id"),
        CONSTRAINT "FK_user_achievements_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_achievements_achievement" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_achievements_user_id"
      ON "user_achievements" ("user_id")
    `);

    await queryRunner.query(`
      INSERT INTO "achievements" ("code", "icon", "sort_order") VALUES
        ('created_account', 'created-account', 1),
        ('first_recipe', 'first-recipe', 2),
        ('perfect_month_tracking', 'perfect-month', 3),
        ('public_recipe', 'public-recipe', 4),
        ('ten_recipes', 'ten-recipes', 5),
        ('first_rate', 'first-rate', 6),
        ('all_achievements', 'all-achievements', 7)
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_achievements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "achievements"`);
  }
}
