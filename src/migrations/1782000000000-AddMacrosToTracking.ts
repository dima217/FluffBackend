import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMacrosToTracking1782000000000 implements MigrationInterface {
  name = 'AddMacrosToTracking1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tracking" ADD COLUMN IF NOT EXISTS "proteins" decimal(8,2) NULL`);
    await queryRunner.query(`ALTER TABLE "tracking" ADD COLUMN IF NOT EXISTS "fats" decimal(8,2) NULL`);
    await queryRunner.query(`ALTER TABLE "tracking" ADD COLUMN IF NOT EXISTS "carbs" decimal(8,2) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tracking" DROP COLUMN IF EXISTS "carbs"`);
    await queryRunner.query(`ALTER TABLE "tracking" DROP COLUMN IF EXISTS "fats"`);
    await queryRunner.query(`ALTER TABLE "tracking" DROP COLUMN IF EXISTS "proteins"`);
  }
}
