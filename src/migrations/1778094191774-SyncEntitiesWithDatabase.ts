import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncEntitiesWithDatabase1778094191774 implements MigrationInterface {
  name = 'SyncEntitiesWithDatabase1778094191774';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recipe_ratings" ("id" SERIAL NOT NULL, "value" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, "recipe_id" integer, CONSTRAINT "PK_7d54d15a0b04e9c0b0c8c6aa65d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b50783d5c7366d93807882fcdb" ON "recipe_ratings" ("user_id", "recipe_id") `,
    );
    await queryRunner.query(`ALTER TABLE "recipe" ADD "ratingsCount" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "recipe_ratings" ADD CONSTRAINT "FK_a3572274a6585cd5c39abdf2953" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_ratings" ADD CONSTRAINT "FK_381ec3f46df5c461be3a2e57db5" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recipe_ratings" DROP CONSTRAINT "FK_381ec3f46df5c461be3a2e57db5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_ratings" DROP CONSTRAINT "FK_a3572274a6585cd5c39abdf2953"`,
    );
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "ratingsCount"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b50783d5c7366d93807882fcdb"`);
    await queryRunner.query(`DROP TABLE "recipe_ratings"`);
  }
}
