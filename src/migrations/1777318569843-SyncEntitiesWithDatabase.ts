import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesWithDatabase1777318569843 implements MigrationInterface {
    name = 'SyncEntitiesWithDatabase1777318569843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" ADD "makePublic" boolean`);
        await queryRunner.query(`ALTER TABLE "recipe" ADD "submitToSystem" boolean`);
        
        await queryRunner.query(`UPDATE "recipe" SET "makePublic" = false WHERE "makePublic" IS NULL`);
        await queryRunner.query(`UPDATE "recipe" SET "submitToSystem" = false WHERE "submitToSystem" IS NULL`);
        
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "submitToSystem"`);
        await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "makePublic"`);
    }
}