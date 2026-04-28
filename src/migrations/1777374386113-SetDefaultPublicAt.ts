import { MigrationInterface, QueryRunner } from "typeorm";

export class SetDefaultPublicAt1777374386113 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "recipe" SET "makePublic" = true WHERE "makePublic" IS NULL`);
        await queryRunner.query(`UPDATE "recipe" SET "submitToSystem" = true WHERE "submitToSystem" IS NULL`);
        
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "makePublic" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "submitToSystem" DROP DEFAULT`);
        
        await queryRunner.query(`UPDATE "recipe" SET "makePublic" = false WHERE "makePublic" = true`);
        await queryRunner.query(`UPDATE "recipe" SET "submitToSystem" = false WHERE "submitToSystem" = true`);
    }
}
