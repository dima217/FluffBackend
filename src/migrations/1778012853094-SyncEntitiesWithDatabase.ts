import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncEntitiesWithDatabase1778012853094 implements MigrationInterface {
  name = 'SyncEntitiesWithDatabase1778012853094';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "support_tickets" ADD "screenshot" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "screenshot"`);
  }
}
