import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductGramsToRecipe1781548122319 implements MigrationInterface {
  name = 'AddProductGramsToRecipe1781548122319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add productGrams column
    await queryRunner.query(`ALTER TABLE "recipe" ADD COLUMN IF NOT EXISTS "productGrams" jsonb NULL`);

    // Convert existing customProducts from string[] to {name: string}[]
    // Only converts rows where the first element is a string (old format)
    await queryRunner.query(`
      UPDATE recipe
      SET "customProducts" = (
        SELECT jsonb_agg(jsonb_build_object('name', elem))
        FROM jsonb_array_elements_text("customProducts") AS elem
      )
      WHERE "customProducts" IS NOT NULL
        AND jsonb_typeof("customProducts") = 'array'
        AND jsonb_array_length("customProducts") > 0
        AND jsonb_typeof("customProducts" -> 0) = 'string'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert customProducts from {name: string}[] back to string[]
    await queryRunner.query(`
      UPDATE recipe
      SET "customProducts" = (
        SELECT jsonb_agg(elem ->> 'name')
        FROM jsonb_array_elements("customProducts") AS elem
      )
      WHERE "customProducts" IS NOT NULL
        AND jsonb_typeof("customProducts") = 'array'
        AND jsonb_array_length("customProducts") > 0
        AND jsonb_typeof("customProducts" -> 0) = 'object'
    `);

    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN IF EXISTS "productGrams"`);
  }
}
