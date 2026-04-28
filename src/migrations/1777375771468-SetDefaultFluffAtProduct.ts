import { MigrationInterface, QueryRunner } from "typeorm";

export class SetDefaultFluffAtProduct1777375771468 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "product" 
            ADD COLUMN "isFluff" boolean DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE "product" 
            DROP COLUMN "fluffAt"
        `);

        await queryRunner.query(`
            WITH "to_update" AS (
                SELECT "id" 
                FROM "recipe" 
                ORDER BY "id" 
                LIMIT 40
            )
            UPDATE "product" 
            SET "isFluff" = true 
            WHERE "id" IN (SELECT "id" FROM "to_update")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "product" 
            ADD COLUMN "fluffAt" timestamp
        `);
    
        await queryRunner.query(`
            WITH "to_update" AS (
                SELECT "id" 
                FROM "product" 
                ORDER BY "id" 
                LIMIT 40 
            )
            UPDATE "product" 
            SET "fluffAt" = NOW() 
            WHERE "id" IN (SELECT "id" FROM "to_update")
        `);
    
        await queryRunner.query(`
            ALTER TABLE "product" 
            DROP COLUMN "isFluff"
        `);
    }
}

