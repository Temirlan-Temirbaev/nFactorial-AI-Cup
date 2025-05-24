/*
  Warnings:

  - Added the required column `classId` to the `books` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable for users (add new columns)
ALTER TABLE "users" ADD COLUMN     "classId" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- AddForeignKey for classes
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default class for existing books
INSERT INTO "classes" ("id", "name", "code", "description", "teacherId", "createdAt", "updatedAt")
SELECT 
    'default-class-' || users.id,
    'Default Class',
    'DEFAULT' || SUBSTRING(users.id, 1, 16),
    'Auto-created class for existing books',
    users.id,
    NOW(),
    NOW()
FROM "users" 
WHERE "users"."role" = 'TEACHER' 
AND EXISTS (SELECT 1 FROM "books" WHERE "books"."uploaderId" = "users"."id")
LIMIT 1;

-- Add classId column as nullable first
ALTER TABLE "books" ADD COLUMN "classId" TEXT;

-- Update existing books to use the default class
UPDATE "books" 
SET "classId" = (
    SELECT "classes"."id" 
    FROM "classes" 
    WHERE "classes"."name" = 'Default Class' 
    LIMIT 1
)
WHERE "classId" IS NULL;

-- Now make classId NOT NULL
ALTER TABLE "books" ALTER COLUMN "classId" SET NOT NULL;

-- AddForeignKey constraints
ALTER TABLE "users" ADD CONSTRAINT "users_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "books" ADD CONSTRAINT "books_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
