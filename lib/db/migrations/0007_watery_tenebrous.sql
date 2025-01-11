ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "phoneNumber" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "countryCode" varchar(4) NOT NULL;