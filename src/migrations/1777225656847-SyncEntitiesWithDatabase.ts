import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesWithDatabase1777225656847 implements MigrationInterface {
    name = 'SyncEntitiesWithDatabase1777225656847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "fcmToken" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "fcmToken" text array`);
    }

}
