import { MigrationInterface, QueryRunner } from "typeorm";

export class SetDefaultFluffAt1777374833678 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "recipe" 
            ADD COLUMN "isFluff" boolean DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE "recipe" 
            DROP COLUMN "fluffAt"
        `);

        await queryRunner.query(`
            WITH "to_update" AS (
                SELECT "id" 
                FROM "recipe" 
                ORDER BY "id" 
                LIMIT 40
            )
            UPDATE "recipe" 
            SET "isFluff" = true 
            WHERE "id" IN (SELECT "id" FROM "to_update")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "recipe" 
            ADD COLUMN "fluffAt" timestamp
        `);
    
        await queryRunner.query(`
            WITH "to_update" AS (
                SELECT "id" 
                FROM "recipe" 
                ORDER BY "id" 
                LIMIT 40 
            )
            UPDATE "recipe" 
            SET "fluffAt" = NOW() 
            WHERE "id" IN (SELECT "id" FROM "to_update")
        `);
    
        await queryRunner.query(`
            ALTER TABLE "recipe" 
            DROP COLUMN "isFluff"
        `);
    }
}
