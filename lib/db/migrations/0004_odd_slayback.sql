ALTER TABLE "Document" ADD COLUMN "text" varchar DEFAULT 'text' NOT NULL;
ALTER TABLE "Message" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "images" json;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "audios" json;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "videos" json;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "voice" json;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "model" varchar;