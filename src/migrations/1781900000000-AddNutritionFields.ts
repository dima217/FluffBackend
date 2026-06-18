import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNutritionFields1781900000000 implements MigrationInterface {
  name = 'AddNutritionFields1781900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Product: description + macronutrients
    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "description" text NULL`);
    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "proteins" decimal(6,2) NULL`);
    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "fats" decimal(6,2) NULL`);
    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "carbs" decimal(6,2) NULL`);

    // Recipe: macronutrients (calculated from ingredients)
    await queryRunner.query(`ALTER TABLE "recipe" ADD COLUMN IF NOT EXISTS "proteins" decimal(8,2) NULL`);
    await queryRunner.query(`ALTER TABLE "recipe" ADD COLUMN IF NOT EXISTS "fats" decimal(8,2) NULL`);
    await queryRunner.query(`ALTER TABLE "recipe" ADD COLUMN IF NOT EXISTS "carbs" decimal(8,2) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN IF EXISTS "carbs"`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN IF EXISTS "fats"`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN IF EXISTS "proteins"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN IF EXISTS "carbs"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN IF EXISTS "fats"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN IF EXISTS "proteins"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN IF EXISTS "description"`);
  }
}
