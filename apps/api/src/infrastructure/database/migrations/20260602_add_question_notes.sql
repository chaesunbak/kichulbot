CREATE TABLE "QuestionNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "QuestionNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestionNote_userId_questionId_key" ON "QuestionNote"("userId", "questionId");
CREATE INDEX "QuestionNote_questionId_idx" ON "QuestionNote"("questionId");

ALTER TABLE "QuestionNote" ADD CONSTRAINT "QuestionNote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionNote" ADD CONSTRAINT "QuestionNote_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
