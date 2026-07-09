-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Task_parentId_idx" ON "Task"("parentId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
