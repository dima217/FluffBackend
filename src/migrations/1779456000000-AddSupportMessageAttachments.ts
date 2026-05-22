import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportMessageAttachments1779456000000 implements MigrationInterface {
  name = 'AddSupportMessageAttachments1779456000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "support_messages"
      ADD "attachments" jsonb NOT NULL DEFAULT '[]'
    `);

    await queryRunner.query(`
      ALTER TABLE "support_messages"
      ALTER COLUMN "content" SET DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "support_messages"
      DROP COLUMN "attachments"
    `);

    await queryRunner.query(`
      ALTER TABLE "support_messages"
      ALTER COLUMN "content" DROP DEFAULT
    `);
  }
}
