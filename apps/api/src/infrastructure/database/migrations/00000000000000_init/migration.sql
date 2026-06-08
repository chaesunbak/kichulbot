-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserAuthType" AS ENUM ('EMAIL', 'OAUTH');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('KAKAO');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'WRITTEN');

-- CreateEnum
CREATE TYPE "AnswerMode" AS ENUM ('ONE_BY_ONE', 'EXAM');

-- CreateEnum
CREATE TYPE "QuestionSetKind" AS ENUM ('OFFICIAL_PAPER', 'CUSTOM', 'DAILY_WRONG', 'DAILY_WEAKNESS', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "AttemptOutcome" AS ENUM ('CORRECT', 'INCORRECT', 'OMITTED');

-- CreateEnum
CREATE TYPE "QuestionReportCategory" AS ENUM ('QUESTION_ERROR', 'IMAGE_ERROR', 'CHOICE_ERROR', 'ANSWER_ERROR', 'EXPLANATION_ERROR', 'CATEGORY_ERROR', 'OTHER');

-- CreateEnum
CREATE TYPE "QuestionReportStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "TagSelectionMode" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "nickname" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "authType" "UserAuthType" NOT NULL DEFAULT 'EMAIL',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "providerNickname" TEXT,
    "rawProfile" JSONB,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usesMonth" BOOLEAN NOT NULL DEFAULT false,
    "usesGrade" BOOLEAN NOT NULL DEFAULT false,
    "usesRound" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCategory" (
    "examId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamCategory_pkey" PRIMARY KEY ("examId","categoryId")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 20,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "examSessionId" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "displayYear" INTEGER NOT NULL,
    "month" INTEGER,
    "grade" INTEGER,
    "round" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "tagGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagGroup" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selectionMode" "TagSelectionMode" NOT NULL DEFAULT 'MULTIPLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "choiceCount" INTEGER,
    "answerChoice" INTEGER,
    "answerText" TEXT,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,
    "recommendedTimeSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionRevision" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "choiceCount" INTEGER,
    "answerChoice" INTEGER,
    "answerText" TEXT,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,
    "recommendedTimeSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSet" (
    "id" TEXT NOT NULL,
    "kind" "QuestionSetKind" NOT NULL,
    "ownerUserId" TEXT,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSetItem" (
    "questionSetId" TEXT NOT NULL,
    "questionRevisionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sourceAttemptId" TEXT,
    "reason" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSetItem_pkey" PRIMARY KEY ("questionSetId","questionRevisionId")
);

-- CreateTable
CREATE TABLE "GeneratedQuestionSet" (
    "questionSetId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "kind" "QuestionSetKind" NOT NULL,
    "studyDate" DATE,
    "generatorVersion" TEXT NOT NULL,
    "parameters" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedQuestionSet_pkey" PRIMARY KEY ("questionSetId")
);

-- CreateTable
CREATE TABLE "LibraryFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPaper" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolveSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT,
    "sourceSetId" TEXT,
    "mode" "AnswerMode" NOT NULL DEFAULT 'EXAM',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolveSessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionRevisionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolveSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftResponse" (
    "sessionItemId" TEXT NOT NULL,
    "answerChoice" INTEGER,
    "answerText" TEXT,
    "spentMilliseconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftResponse_pkey" PRIMARY KEY ("sessionItemId")
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionItemId" TEXT,
    "questionRevisionId" TEXT NOT NULL,
    "answerChoice" INTEGER,
    "answerText" TEXT,
    "outcome" "AttemptOutcome" NOT NULL,
    "spentMilliseconds" INTEGER NOT NULL DEFAULT 0,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTag" (
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionTag_pkey" PRIMARY KEY ("questionId","tagId")
);

-- CreateTable
CREATE TABLE "QuestionNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionReport" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT,
    "questionId" TEXT NOT NULL,
    "questionRevisionId" TEXT,
    "category" "QuestionReportCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "QuestionReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminMemo" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_userId_provider_key" ON "OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_usedAt_expiresAt_idx" ON "EmailVerificationCode"("email", "usedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_usedAt_expiresAt_idx" ON "PasswordResetToken"("userId", "usedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "ExamCategory_categoryId_idx" ON "ExamCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Paper_questionSetId_key" ON "Paper"("questionSetId");

-- CreateIndex
CREATE INDEX "Paper_examSessionId_idx" ON "Paper"("examSessionId");

-- CreateIndex
CREATE INDEX "Paper_isPublished_idx" ON "Paper"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_key_key" ON "ExamSession"("key");

-- CreateIndex
CREATE INDEX "ExamSession_examId_displayYear_month_grade_round_idx" ON "ExamSession"("examId", "displayYear", "month", "grade", "round");

-- CreateIndex
CREATE INDEX "Tag_examId_idx" ON "Tag"("examId");

-- CreateIndex
CREATE INDEX "Tag_tagGroupId_idx" ON "Tag"("tagGroupId");

-- CreateIndex
CREATE INDEX "TagGroup_examId_isActive_sortOrder_idx" ON "TagGroup"("examId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Question_paperId_idx" ON "Question"("paperId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_paperId_number_key" ON "Question"("paperId", "number");

-- CreateIndex
CREATE INDEX "QuestionRevision_questionId_idx" ON "QuestionRevision"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionRevision_questionId_revision_key" ON "QuestionRevision"("questionId", "revision");

-- CreateIndex
CREATE INDEX "QuestionSet_ownerUserId_kind_idx" ON "QuestionSet"("ownerUserId", "kind");

-- CreateIndex
CREATE INDEX "QuestionSetItem_questionRevisionId_idx" ON "QuestionSetItem"("questionRevisionId");

-- CreateIndex
CREATE INDEX "QuestionSetItem_sourceAttemptId_idx" ON "QuestionSetItem"("sourceAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetItem_questionSetId_position_key" ON "QuestionSetItem"("questionSetId", "position");

-- CreateIndex
CREATE INDEX "GeneratedQuestionSet_ownerUserId_generatedAt_idx" ON "GeneratedQuestionSet"("ownerUserId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedQuestionSet_ownerUserId_kind_studyDate_key" ON "GeneratedQuestionSet"("ownerUserId", "kind", "studyDate");

-- CreateIndex
CREATE INDEX "LibraryFolder_userId_idx" ON "LibraryFolder"("userId");

-- CreateIndex
CREATE INDEX "LibraryFolder_parentId_idx" ON "LibraryFolder"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryFolder_userId_parentId_name_key" ON "LibraryFolder"("userId", "parentId", "name");

-- CreateIndex
CREATE INDEX "UserPaper_userId_idx" ON "UserPaper"("userId");

-- CreateIndex
CREATE INDEX "UserPaper_paperId_idx" ON "UserPaper"("paperId");

-- CreateIndex
CREATE INDEX "UserPaper_folderId_idx" ON "UserPaper"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPaper_userId_paperId_folderId_key" ON "UserPaper"("userId", "paperId", "folderId");

-- CreateIndex
CREATE INDEX "SolveSession_userId_paperId_submittedAt_idx" ON "SolveSession"("userId", "paperId", "submittedAt");

-- CreateIndex
CREATE INDEX "SolveSession_paperId_idx" ON "SolveSession"("paperId");

-- CreateIndex
CREATE INDEX "SolveSession_sourceSetId_idx" ON "SolveSession"("sourceSetId");

-- CreateIndex
CREATE INDEX "SolveSessionItem_questionRevisionId_idx" ON "SolveSessionItem"("questionRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "SolveSessionItem_sessionId_questionRevisionId_key" ON "SolveSessionItem"("sessionId", "questionRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "SolveSessionItem_sessionId_position_key" ON "SolveSessionItem"("sessionId", "position");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_questionRevisionId_gradedAt_idx" ON "QuestionAttempt"("userId", "questionRevisionId", "gradedAt");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_gradedAt_idx" ON "QuestionAttempt"("userId", "gradedAt");

-- CreateIndex
CREATE INDEX "QuestionAttempt_sessionItemId_idx" ON "QuestionAttempt"("sessionItemId");

-- CreateIndex
CREATE INDEX "QuestionTag_tagId_idx" ON "QuestionTag"("tagId");

-- CreateIndex
CREATE INDEX "QuestionNote_questionId_idx" ON "QuestionNote"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionNote_userId_questionId_key" ON "QuestionNote"("userId", "questionId");

-- CreateIndex
CREATE INDEX "QuestionReport_status_createdAt_idx" ON "QuestionReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionReport_category_idx" ON "QuestionReport"("category");

-- CreateIndex
CREATE INDEX "QuestionReport_questionId_status_idx" ON "QuestionReport"("questionId", "status");

-- CreateIndex
CREATE INDEX "QuestionReport_questionRevisionId_idx" ON "QuestionReport"("questionRevisionId");

-- CreateIndex
CREATE INDEX "QuestionReport_reporterUserId_createdAt_idx" ON "QuestionReport"("reporterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionReport_reviewedByUserId_idx" ON "QuestionReport"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCategory" ADD CONSTRAINT "ExamCategory_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCategory" ADD CONSTRAINT "ExamCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_tagGroupId_fkey" FOREIGN KEY ("tagGroupId") REFERENCES "TagGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagGroup" ADD CONSTRAINT "TagGroup_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRevision" ADD CONSTRAINT "QuestionRevision_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetItem" ADD CONSTRAINT "QuestionSetItem_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetItem" ADD CONSTRAINT "QuestionSetItem_questionRevisionId_fkey" FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetItem" ADD CONSTRAINT "QuestionSetItem_sourceAttemptId_fkey" FOREIGN KEY ("sourceAttemptId") REFERENCES "QuestionAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedQuestionSet" ADD CONSTRAINT "GeneratedQuestionSet_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedQuestionSet" ADD CONSTRAINT "GeneratedQuestionSet_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFolder" ADD CONSTRAINT "LibraryFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFolder" ADD CONSTRAINT "LibraryFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LibraryFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaper" ADD CONSTRAINT "UserPaper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaper" ADD CONSTRAINT "UserPaper_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaper" ADD CONSTRAINT "UserPaper_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "LibraryFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveSession" ADD CONSTRAINT "SolveSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveSession" ADD CONSTRAINT "SolveSession_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveSession" ADD CONSTRAINT "SolveSession_sourceSetId_fkey" FOREIGN KEY ("sourceSetId") REFERENCES "QuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveSessionItem" ADD CONSTRAINT "SolveSessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SolveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolveSessionItem" ADD CONSTRAINT "SolveSessionItem_questionRevisionId_fkey" FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftResponse" ADD CONSTRAINT "DraftResponse_sessionItemId_fkey" FOREIGN KEY ("sessionItemId") REFERENCES "SolveSessionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_sessionItemId_fkey" FOREIGN KEY ("sessionItemId") REFERENCES "SolveSessionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionRevisionId_fkey" FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTag" ADD CONSTRAINT "QuestionTag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTag" ADD CONSTRAINT "QuestionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionNote" ADD CONSTRAINT "QuestionNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionNote" ADD CONSTRAINT "QuestionNote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_questionRevisionId_fkey" FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
