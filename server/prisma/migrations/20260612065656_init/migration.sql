-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'NUMERICAL', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PlanItemType" AS ENUM ('STUDY', 'REVISION', 'PRACTICE');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "board" TEXT NOT NULL DEFAULT 'CBSE',
    "grade" INTEGER NOT NULL DEFAULT 10,
    "exam_date" TIMESTAMP(3),
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "board" TEXT NOT NULL DEFAULT 'CBSE',
    "grade" INTEGER NOT NULL DEFAULT 10,
    "total_marks" INTEGER NOT NULL DEFAULT 80,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chapter_no" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL DEFAULT 0,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequency" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic_no" INTEGER NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "text" TEXT NOT NULL,
    "options" JSONB,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "target_percentage" DOUBLE PRECISION NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_goals" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "target_marks" INTEGER NOT NULL,
    "target_percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "subject_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_sessions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "diagnostic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_responses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" TEXT,
    "is_correct" BOOLEAN NOT NULL,
    "time_taken_ms" INTEGER,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery_scores" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'weak',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mastery_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "type" "PlanItemType" NOT NULL DEFAULT 'STUDY',
    "date" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 45,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3),

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_board_grade_key" ON "subjects"("code", "board", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_subject_id_chapter_no_key" ON "chapters"("subject_id", "chapter_no");

-- CreateIndex
CREATE UNIQUE INDEX "topics_chapter_id_topic_no_key" ON "topics"("chapter_id", "topic_no");

-- CreateIndex
CREATE UNIQUE INDEX "goals_student_id_key" ON "goals"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_goals_goal_id_subject_id_key" ON "subject_goals"("goal_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_responses_session_id_question_id_key" ON "diagnostic_responses"("session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "mastery_scores_student_id_chapter_id_key" ON "mastery_scores"("student_id", "chapter_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_plans_student_id_key" ON "study_plans"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_student_id_key" ON "streaks"("student_id");

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_goals" ADD CONSTRAINT "subject_goals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_goals" ADD CONSTRAINT "subject_goals_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mastery_scores" ADD CONSTRAINT "mastery_scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mastery_scores" ADD CONSTRAINT "mastery_scores_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
