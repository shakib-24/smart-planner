-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "startAt" TIMESTAMP(3);
