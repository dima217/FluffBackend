import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncEntitiesWithDatabase1778009971884 implements MigrationInterface {
  name = 'SyncEntitiesWithDatabase1778009971884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" RENAME COLUMN "fluffAt" TO "isFluff"`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "fluffAt"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "fcmToken" text`);
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "timezone" character varying(64) NOT NULL DEFAULT 'UTC'`,
    );
    await queryRunner.query(`ALTER TABLE "recipe" ADD "isFluff" boolean DEFAULT false`);
    await queryRunner.query(`
            ALTER TABLE "recipe" ADD "makePublic" boolean NOT NULL DEFAULT true
          `);
    await queryRunner.query(`ALTER TABLE "recipe" ADD "submitToSystem" boolean`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isFluff"`);
    await queryRunner.query(`ALTER TABLE "product" ADD "isFluff" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isFluff"`);
    await queryRunner.query(`ALTER TABLE "product" ADD "isFluff" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "submitToSystem"`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "makePublic"`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "isFluff"`);
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "timezone"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
    await queryRunner.query(`ALTER TABLE "recipe" ADD "fluffAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "product" RENAME COLUMN "isFluff" TO "fluffAt"`);
  }
}
