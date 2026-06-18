CREATE TABLE "StudyWeeklyGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "effectiveWeekStartDate" DATE NOT NULL,
    "targetDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyWeeklyGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudyWeeklyGoal_userId_effectiveWeekStartDate_key" ON "StudyWeeklyGoal"("userId", "effectiveWeekStartDate");

CREATE INDEX "StudyWeeklyGoal_userId_effectiveWeekStartDate_idx" ON "StudyWeeklyGoal"("userId", "effectiveWeekStartDate");

ALTER TABLE "StudyWeeklyGoal" ADD CONSTRAINT "StudyWeeklyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
