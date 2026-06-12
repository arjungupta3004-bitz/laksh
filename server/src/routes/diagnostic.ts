import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Difficulty } from '@prisma/client';

const router = Router();
router.use(authenticate);

// POST /api/diagnostic/start — start a diagnostic session for a subject
router.post('/start', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({ subjectCode: z.string() });
    const { subjectCode } = schema.parse(req.body);
    const studentId = req.studentId!;

    // Verify subject exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const subject = await prisma.subject.findFirst({
      where: { code: subjectCode, board: student.board, grade: student.grade },
      include: { chapters: true },
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found for your board/grade' });
      return;
    }

    // Check for existing in-progress session
    const existing = await prisma.diagnosticSession.findFirst({
      where: { studentId, subjectCode, status: 'IN_PROGRESS' },
    });

    if (existing) {
      // Return the existing session with its next question
      const answered = await prisma.diagnosticResponse.count({ where: { sessionId: existing.id } });
      const nextQuestion = await getNextQuestion(existing.id, subject.chapters.map(c => c.id), answered);
      res.json({ session: existing, nextQuestion, questionsAnswered: answered });
      return;
    }

    // Create new session
    const session = await prisma.diagnosticSession.create({
      data: { studentId, subjectCode },
    });

    // Get first question (medium difficulty, first chapter)
    const firstQuestion = await prisma.question.findFirst({
      where: {
        chapterId: { in: subject.chapters.map(c => c.id) },
        difficulty: 'MEDIUM',
      },
      select: {
        id: true,
        text: true,
        type: true,
        options: true,
        difficulty: true,
        chapter: { select: { name: true, chapterNo: true } },
      },
    });

    res.json({ session, nextQuestion: firstQuestion, questionsAnswered: 0 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Diagnostic start error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/diagnostic/answer — submit an answer
router.post('/answer', async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      sessionId: z.string(),
      questionId: z.string(),
      answer: z.string(),
      timeTakenMs: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const studentId = req.studentId!;

    // Verify session belongs to student
    const session = await prisma.diagnosticSession.findFirst({
      where: { id: data.sessionId, studentId, status: 'IN_PROGRESS' },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found or already completed' });
      return;
    }

    // Get the question and check answer
    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
      include: { chapter: { include: { subject: true } } },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const isCorrect = data.answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    // Save response
    await prisma.diagnosticResponse.upsert({
      where: {
        sessionId_questionId: { sessionId: data.sessionId, questionId: data.questionId },
      },
      create: {
        sessionId: data.sessionId,
        questionId: data.questionId,
        answer: data.answer,
        isCorrect,
        timeTakenMs: data.timeTakenMs,
      },
      update: {
        answer: data.answer,
        isCorrect,
        timeTakenMs: data.timeTakenMs,
      },
    });

    // Count total answers in this session
    const answeredCount = await prisma.diagnosticResponse.count({
      where: { sessionId: data.sessionId },
    });

    const MAX_QUESTIONS = 20;

    if (answeredCount >= MAX_QUESTIONS) {
      // Complete session and calculate mastery
      await prisma.diagnosticSession.update({
        where: { id: data.sessionId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      const masteryScores = await calculateMastery(data.sessionId, studentId);

      res.json({
        isCorrect,
        explanation: question.explanation,
        sessionComplete: true,
        questionsAnswered: answeredCount,
        masteryScores,
      });
      return;
    }

    // Get next question with adaptive difficulty
    const chapterIds = await getSubjectChapterIds(session.subjectCode, studentId);
    const nextDifficulty = getNextDifficulty(question.difficulty, isCorrect);
    const nextQuestion = await getAdaptiveQuestion(data.sessionId, chapterIds, nextDifficulty);

    res.json({
      isCorrect,
      explanation: question.explanation,
      sessionComplete: false,
      questionsAnswered: answeredCount,
      nextQuestion,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Diagnostic answer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/diagnostic/mastery — get mastery scores
router.get('/mastery', async (req: AuthRequest, res) => {
  try {
    const scores = await prisma.masteryScore.findMany({
      where: { studentId: req.studentId! },
      include: {
        chapter: {
          include: { subject: true },
        },
      },
      orderBy: { chapter: { chapterNo: 'asc' } },
    });

    // Group by subject
    const bySubject: Record<string, {
      subjectName: string;
      subjectCode: string;
      averageMastery: number;
      chapters: { chapterName: string; chapterNo: number; score: number; level: string }[];
    }> = {};

    for (const s of scores) {
      const code = s.chapter.subject.code;
      if (!bySubject[code]) {
        bySubject[code] = {
          subjectName: s.chapter.subject.name,
          subjectCode: code,
          averageMastery: 0,
          chapters: [],
        };
      }
      bySubject[code].chapters.push({
        chapterName: s.chapter.name,
        chapterNo: s.chapter.chapterNo,
        score: s.score,
        level: s.level,
      });
    }

    // Calculate averages
    for (const code in bySubject) {
      const chapters = bySubject[code].chapters;
      bySubject[code].averageMastery =
        Math.round((chapters.reduce((sum, c) => sum + c.score, 0) / chapters.length) * 10) / 10;
    }

    res.json({ mastery: Object.values(bySubject) });
  } catch (err) {
    console.error('Mastery error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/diagnostic/sessions — list all sessions
router.get('/sessions', async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.diagnosticSession.findMany({
      where: { studentId: req.studentId! },
      orderBy: { startedAt: 'desc' },
      include: {
        _count: { select: { responses: true } },
      },
    });

    res.json({ sessions });
  } catch (err) {
    console.error('Sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helper functions ─────────────────────────────────

async function getSubjectChapterIds(subjectCode: string, studentId: string): Promise<string[]> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return [];

  const subject = await prisma.subject.findFirst({
    where: { code: subjectCode, board: student.board, grade: student.grade },
    include: { chapters: { select: { id: true } } },
  });

  return subject?.chapters.map(c => c.id) || [];
}

function getNextDifficulty(current: Difficulty, wasCorrect: boolean): Difficulty {
  if (wasCorrect) {
    if (current === 'EASY') return 'MEDIUM';
    if (current === 'MEDIUM') return 'HARD';
    return 'HARD';
  } else {
    if (current === 'HARD') return 'MEDIUM';
    if (current === 'MEDIUM') return 'EASY';
    return 'EASY';
  }
}

async function getNextQuestion(sessionId: string, chapterIds: string[], questionIndex: number) {
  // Get already-answered question IDs
  const answered = await prisma.diagnosticResponse.findMany({
    where: { sessionId },
    select: { questionId: true },
  });

  const answeredIds = answered.map(a => a.questionId);

  return prisma.question.findFirst({
    where: {
      chapterId: { in: chapterIds },
      id: { notIn: answeredIds },
    },
    select: {
      id: true,
      text: true,
      type: true,
      options: true,
      difficulty: true,
      chapter: { select: { name: true, chapterNo: true } },
    },
  });
}

async function getAdaptiveQuestion(sessionId: string, chapterIds: string[], difficulty: Difficulty) {
  const answered = await prisma.diagnosticResponse.findMany({
    where: { sessionId },
    select: { questionId: true },
  });

  const answeredIds = answered.map(a => a.questionId);

  // Try the target difficulty first
  let question = await prisma.question.findFirst({
    where: {
      chapterId: { in: chapterIds },
      id: { notIn: answeredIds },
      difficulty,
    },
    select: {
      id: true,
      text: true,
      type: true,
      options: true,
      difficulty: true,
      chapter: { select: { name: true, chapterNo: true } },
    },
  });

  // Fallback: any unanswered question
  if (!question) {
    question = await prisma.question.findFirst({
      where: {
        chapterId: { in: chapterIds },
        id: { notIn: answeredIds },
      },
      select: {
        id: true,
        text: true,
        type: true,
        options: true,
        difficulty: true,
        chapter: { select: { name: true, chapterNo: true } },
      },
    });
  }

  return question;
}

async function calculateMastery(sessionId: string, studentId: string) {
  // Get all responses for this session grouped by chapter
  const responses = await prisma.diagnosticResponse.findMany({
    where: { sessionId },
    include: {
      question: {
        include: { chapter: true },
      },
    },
  });

  // Group by chapter
  const chapterStats: Record<string, { correct: number; total: number; difficultySum: number }> = {};

  for (const r of responses) {
    const chapterId = r.question.chapterId;
    if (!chapterStats[chapterId]) {
      chapterStats[chapterId] = { correct: 0, total: 0, difficultySum: 0 };
    }
    chapterStats[chapterId].total++;
    if (r.isCorrect) {
      chapterStats[chapterId].correct++;
      // Weight by difficulty
      const diffWeight = r.question.difficulty === 'HARD' ? 3 : r.question.difficulty === 'MEDIUM' ? 2 : 1;
      chapterStats[chapterId].difficultySum += diffWeight;
    }
  }

  // Calculate and upsert mastery scores
  const results = [];

  for (const [chapterId, stats] of Object.entries(chapterStats)) {
    const baseScore = (stats.correct / stats.total) * 100;
    // Bonus for harder questions answered correctly
    const maxDifficultySum = stats.total * 3; // if all were HARD and correct
    const difficultyBonus = stats.difficultySum > 0
      ? (stats.difficultySum / maxDifficultySum) * 20
      : 0;

    const score = Math.min(100, Math.round((baseScore + difficultyBonus) * 10) / 10);
    const level = score >= 70 ? 'strong' : score >= 40 ? 'moderate' : 'weak';

    const mastery = await prisma.masteryScore.upsert({
      where: { studentId_chapterId: { studentId, chapterId } },
      create: { studentId, chapterId, score, level },
      update: { score, level },
      include: { chapter: { select: { name: true, chapterNo: true } } },
    });

    results.push({
      chapter: mastery.chapter.name,
      chapterNo: mastery.chapter.chapterNo,
      score: mastery.score,
      level: mastery.level,
    });
  }

  return results;
}

export default router;
