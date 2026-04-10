-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "plantImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: seed plantImageUrls with existing plantImageUrl so legacy posts keep working
UPDATE "Post"
SET "plantImageUrls" = ARRAY["plantImageUrl"]
WHERE (array_length("plantImageUrls", 1) IS NULL OR array_length("plantImageUrls", 1) = 0)
  AND "plantImageUrl" IS NOT NULL;
