import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupportChat1779447746149 implements MigrationInterface {
    name = 'AddSupportChat1779447746149'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // New columns on support_tickets for chat read-state
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "adminSeen" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "userLastReadAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "lastAdminMessageAt" TIMESTAMP`);

        // Chat messages table
        await queryRunner.query(`
            CREATE TABLE "support_messages" (
                "id"          SERIAL PRIMARY KEY,
                "ticketId"    integer NOT NULL,
                "senderId"    integer NOT NULL,
                "senderType"  varchar(10) NOT NULL DEFAULT 'user',
                "content"     text NOT NULL,
                "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
                "editedAt"    TIMESTAMP,
                CONSTRAINT "FK_support_messages_ticket"
                    FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_support_messages_ticketId" ON "support_messages" ("ticketId")`);
        await queryRunner.query(`CREATE INDEX "IDX_support_messages_createdAt" ON "support_messages" ("createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_support_messages_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_support_messages_ticketId"`);
        await queryRunner.query(`DROP TABLE "support_messages"`);

        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "lastAdminMessageAt"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "userLastReadAt"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "adminSeen"`);
    }

}
