ALTER TABLE "Chat" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Document" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Suggestion" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Vote" ALTER COLUMN "messageId" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "Vote" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;