import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesWithDatabase1777378483896 implements MigrationInterface {
    name = 'SyncEntitiesWithDatabase1777378483896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "isFluff" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "isFluff" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "isFluff" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "isFluff" DROP NOT NULL`);
    }

}
