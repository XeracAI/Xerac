ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "Message" CASCADE;--> statement-breakpoint
-- ALTER TABLE "Vote" DROP CONSTRAINT "Vote_messageId_Message_id_fk";
--> statement-breakpoint
ALTER TABLE "Vote" ALTER COLUMN "messageId" SET DATA TYPE varchar;