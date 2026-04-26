import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesWithDatabase1777237693370 implements MigrationInterface {
    name = 'SyncEntitiesWithDatabase1777237693370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "timezone" character varying(64) NOT NULL DEFAULT 'UTC'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "timezone"`);
    }

}
