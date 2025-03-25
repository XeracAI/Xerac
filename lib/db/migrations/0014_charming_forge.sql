CREATE TABLE "Feature" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"color" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Model" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"label" varchar(50) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"apiIdentifier" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"inputTypes" varchar[] NOT NULL,
	"outputTypes" varchar[] NOT NULL,
	"contextWindow" bigint,
	"maxOutput" bigint,
	"inputCost" numeric(10, 6),
	"outputCost" numeric(10, 6),
	"cacheWriteCost" numeric(10, 6),
	"cacheReadCost" numeric(10, 6),
	"knowledgeCutoff" timestamp,
	"releaseDate" timestamp,
	"extraMetadata" jsonb,
	"status" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ModelFeature" (
	"modelId" varchar(70) NOT NULL,
	"featureId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ModelFeature_modelId_featureId_pk" PRIMARY KEY("modelId","featureId")
);
--> statement-breakpoint
CREATE TABLE "ModelGroup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" varchar(50) NOT NULL,
	"order" serial NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ModelGroupModel" (
	"modelId" varchar(70) NOT NULL,
	"modelGroupId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ModelGroupModel_modelId_modelGroupId_pk" PRIMARY KEY("modelId","modelGroupId")
);
--> statement-breakpoint
CREATE TABLE "ModelTag" (
	"modelId" varchar(70) NOT NULL,
	"tagId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ModelTag_modelId_tagId_pk" PRIMARY KEY("modelId","tagId")
);
--> statement-breakpoint
CREATE TABLE "Tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "Tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "isAdmin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ModelFeature" ADD CONSTRAINT "ModelFeature_modelId_Model_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."Model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModelFeature" ADD CONSTRAINT "ModelFeature_featureId_Feature_id_fk" FOREIGN KEY ("featureId") REFERENCES "public"."Feature"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModelGroup" ADD CONSTRAINT "ModelGroup_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModelGroupModel" ADD CONSTRAINT "ModelGroupModel_modelId_Model_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."Model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModelGroupModel" ADD CONSTRAINT "ModelGroupModel_modelGroupId_ModelGroup_id_fk" FOREIGN KEY ("modelGroupId") REFERENCES "public"."ModelGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModelTag" ADD CONSTRAINT "ModelTag_modelId_Model_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."Model"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ModelTag" ADD CONSTRAINT "ModelTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_title_unique_idx" ON "ModelGroup" USING btree ("userId","title");--> statement-breakpoint
CREATE UNIQUE INDEX "user_order_unique_idx" ON "ModelGroup" USING btree ("userId","order");