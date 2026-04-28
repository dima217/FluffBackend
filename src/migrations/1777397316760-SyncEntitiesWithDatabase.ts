import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntitiesWithDatabase1777397316760 implements MigrationInterface {
    name = 'SyncEntitiesWithDatabase1777397316760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "isFluff" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe" ALTER COLUMN "isFluff" SET NOT NULL`);
    }

}
