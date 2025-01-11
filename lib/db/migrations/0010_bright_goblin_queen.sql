ALTER TABLE "User" ADD COLUMN "otp" varchar(5);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "otpExpires" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "failedTries" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lockedUntil" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "firstName" varchar(50);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastName" varchar(50);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "referralCode" varchar(10);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "referrer" uuid;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "referrerDiscountUsed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_referrer_User_id_fk" FOREIGN KEY ("referrer") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_referralCode_unique" UNIQUE("referralCode");