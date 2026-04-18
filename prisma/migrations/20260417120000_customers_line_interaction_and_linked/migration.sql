-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN "last_interaction_at" TIMESTAMPTZ(6);
ALTER TABLE "public"."customers" ADD COLUMN "is_linked" BOOLEAN NOT NULL DEFAULT false;
