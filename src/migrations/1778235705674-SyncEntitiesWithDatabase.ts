import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesWithDatabase1778235705674 implements MigrationInterface {
    name = 'SyncEntitiesWithDatabase1778235705674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "cheatMeal" numeric array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "cheatMeal"`);
    }

}
