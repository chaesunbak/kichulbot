ALTER TABLE "AnswerSession" RENAME TO "SolveSession";

ALTER INDEX IF EXISTS "AnswerSession_pkey" RENAME TO "SolveSession_pkey";
ALTER INDEX IF EXISTS "AnswerSession_paperId_idx" RENAME TO "SolveSession_paperId_idx";
ALTER INDEX IF EXISTS "AnswerSession_sourceSetId_idx" RENAME TO "SolveSession_sourceSetId_idx";
ALTER INDEX IF EXISTS "AnswerSession_userId_paperId_submittedAt_idx" RENAME TO "SolveSession_userId_paperId_submittedAt_idx";

ALTER TABLE "SolveSession" RENAME CONSTRAINT "AnswerSession_userId_fkey" TO "SolveSession_userId_fkey";
ALTER TABLE "SolveSession" RENAME CONSTRAINT "AnswerSession_paperId_fkey" TO "SolveSession_paperId_fkey";
ALTER TABLE "SolveSession" RENAME CONSTRAINT "AnswerSession_sourceSetId_fkey" TO "SolveSession_sourceSetId_fkey";
