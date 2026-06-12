import { Router } from 'express';
import prisma from '../prisma/client.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/dashboard — aggregated dashboard data
router.get('/', async (req: AuthRequest, res) => {
  try {
    const studentId = req.studentId!;

    // Get student
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    // Get goal
    const goal = await prisma.goal.findUnique({
      where: { studentId },
      include: {
        subjectGoals: { include: { subject: true } },
      },
    });

    // Get mastery scores grouped by subject
    const masteryScores = await prisma.masteryScore.findMany({
      where: { studentId },
      include: {
        chapter: { include: { subject: true } },
      },
    });

    // Aggregate mastery by subject
    const subjectMastery: Record<string, {
      subjectName: string;
      subjectCode: string;
      averageMastery: number;
      chaptersAssessed: number;
      totalChapters: number;
      targetPercentage: number;
    }> = {};

    // Get total chapter counts per subject
    const subjects = await prisma.subject.findMany({
      where: { board: student.board, grade: student.grade },
      include: { _count: { select: { chapters: true } } },
    });

    for (const subject of subjects) {
      const subjectScores = masteryScores.filter(m => m.chapter.subject.id === subject.id);
      const avgMastery = subjectScores.length > 0
        ? Math.round((subjectScores.reduce((sum, s) => sum + s.score, 0) / subjectScores.length) * 10) / 10
        : 0;

      const subjectGoal = goal?.subjectGoals.find(sg => sg.subjectId === subject.id);

      subjectMastery[subject.code] = {
        subjectName: subject.name,
        subjectCode: subject.code,
        averageMastery: avgMastery,
        chaptersAssessed: subjectScores.length,
        totalChapters: subject._count.chapters,
        targetPercentage: subjectGoal?.targetPercentage || goal?.targetPercentage || 0,
      };
    }

    // Overall readiness
    const allMasteryValues = Object.values(subjectMastery);
    const overallReadiness = allMasteryValues.length > 0
      ? Math.round((allMasteryValues.reduce((sum, s) => sum + s.averageMastery, 0) / allMasteryValues.length) * 10) / 10
      : 0;

    // Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await prisma.studyPlan.findUnique({ where: { studentId } });
    let todayTasks: any[] = [];
    let weeklyAdherence = 0;

    if (plan) {
      const todayItems = await prisma.planItem.findMany({
        where: {
          planId: plan.id,
          date: { gte: today, lt: tomorrow },
        },
        include: { chapter: { include: { subject: true } } },
        orderBy: { date: 'asc' },
      });

      todayTasks = todayItems.map(item => ({
        id: item.id,
        type: item.type,
        durationMin: item.durationMin,
        description: item.description,
        completed: item.completed,
        chapter: item.chapter.name,
        subject: item.chapter.subject.name,
      }));

      // Weekly adherence
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekItems = await prisma.planItem.findMany({
        where: { planId: plan.id, date: { gte: weekAgo, lte: new Date() } },
      });
      const total = weekItems.length;
      const completed = weekItems.filter(i => i.completed).length;
      weeklyAdherence = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    // Streak
    const streak = await prisma.streak.findUnique({ where: { studentId } });

    // Days until exam
    const daysUntilExam = goal
      ? Math.max(0, Math.floor((new Date(goal.examDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

    // Diagnostic completion
    const completedDiagnostics = await prisma.diagnosticSession.count({
      where: { studentId, status: 'COMPLETED' },
    });

    res.json({
      dashboard: {
        student: {
          name: student.name,
          board: student.board,
          grade: student.grade,
        },
        goal: goal ? {
          targetPercentage: goal.targetPercentage,
          examDate: goal.examDate,
          daysUntilExam,
        } : null,
        readiness: {
          overall: overallReadiness,
          target: goal?.targetPercentage || 0,
          gap: Math.max(0, (goal?.targetPercentage || 0) - overallReadiness),
        },
        subjects: Object.values(subjectMastery),
        todayTasks,
        adherence: {
          weeklyPercentage: weeklyAdherence,
          target: 60,
          onTrack: weeklyAdherence >= 60,
        },
        streak: streak ? {
          current: streak.currentStreak,
          longest: streak.longestStreak,
        } : { current: 0, longest: 0 },
        diagnosticsCompleted: completedDiagnostics,
        totalSubjects: subjects.length,
        hasPlan: !!plan,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
