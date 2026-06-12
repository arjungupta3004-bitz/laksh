import { Router } from 'express';
import prisma from '../prisma/client.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// POST /api/plan/generate — generate or regenerate the study plan
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const studentId = req.studentId!;

    // Get student + goal + mastery
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const goal = await prisma.goal.findUnique({
      where: { studentId },
      include: { subjectGoals: { include: { subject: true } } },
    });

    if (!goal) {
      res.status(400).json({ error: 'Set a goal before generating a plan' });
      return;
    }

    // Get all chapters with their mastery scores
    const subjects = await prisma.subject.findMany({
      where: { board: student.board, grade: student.grade },
      include: {
        chapters: {
          include: {
            masteryScores: { where: { studentId } },
          },
          orderBy: { chapterNo: 'asc' },
        },
      },
    });

    // Calculate priority for each chapter
    // priority = (weightage * gap_to_target) / (mastery + 1)
    type ChapterPriority = {
      chapterId: string;
      chapterName: string;
      subjectName: string;
      weightage: number;
      mastery: number;
      priority: number;
    };

    const chapterPriorities: ChapterPriority[] = [];

    for (const subject of subjects) {
      const subjectGoal = goal.subjectGoals.find(sg => sg.subjectId === subject.id);
      const targetPct = subjectGoal?.targetPercentage || goal.targetPercentage;

      for (const chapter of subject.chapters) {
        const mastery = chapter.masteryScores[0]?.score || 0;
        const gap = Math.max(0, targetPct - mastery);
        const weightage = chapter.weightage || (1 / subject.chapters.length) * 100;
        const priority = (weightage * gap) / (mastery + 1);

        chapterPriorities.push({
          chapterId: chapter.id,
          chapterName: chapter.name,
          subjectName: subject.name,
          weightage,
          mastery,
          priority,
        });
      }
    }

    // Sort by priority descending
    chapterPriorities.sort((a, b) => b.priority - a.priority);

    // Calculate days until exam
    const now = new Date();
    const examDate = new Date(goal.examDate);
    const daysUntilExam = Math.max(1, Math.floor((examDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    // Delete existing plan
    await prisma.studyPlan.deleteMany({ where: { studentId } });

    // Create new plan
    const plan = await prisma.studyPlan.create({
      data: { studentId },
    });

    // Generate plan items
    // Strategy: spread chapters across available days
    // - High priority chapters get STUDY + PRACTICE slots
    // - Moderate mastery chapters get REVISION slots
    // - Schedule spaced repetition for completed chapters
    const planItems = [];
    const itemsPerDay = 3; // max items per day
    const totalSlots = Math.min(daysUntilExam * itemsPerDay, chapterPriorities.length * 3);

    let dayOffset = 0;
    let slotsUsedToday = 0;

    for (let i = 0; i < chapterPriorities.length && planItems.length < totalSlots; i++) {
      const ch = chapterPriorities[i];

      // Determine type based on mastery
      let type: 'STUDY' | 'REVISION' | 'PRACTICE';
      let durationMin: number;

      if (ch.mastery < 30) {
        type = 'STUDY';
        durationMin = 60;
      } else if (ch.mastery < 60) {
        type = 'STUDY';
        durationMin = 45;
      } else {
        type = 'REVISION';
        durationMin = 30;
      }

      // Add main study session
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(9, 0, 0, 0);

      planItems.push({
        planId: plan.id,
        chapterId: ch.chapterId,
        type,
        date,
        durationMin,
        description: `${type === 'STUDY' ? 'Study' : 'Revise'}: ${ch.subjectName} — ${ch.chapterName}`,
      });

      slotsUsedToday++;

      // Add practice session for high-priority chapters
      if (ch.priority > 5 && planItems.length < totalSlots) {
        const practiceDate = new Date(date);
        practiceDate.setDate(practiceDate.getDate() + 1);

        planItems.push({
          planId: plan.id,
          chapterId: ch.chapterId,
          type: 'PRACTICE' as const,
          date: practiceDate,
          durationMin: 30,
          description: `Practice: ${ch.subjectName} — ${ch.chapterName} (10 questions)`,
        });
      }

      // Add spaced revision
      if (planItems.length < totalSlots) {
        const revisionDate = new Date(date);
        revisionDate.setDate(revisionDate.getDate() + 7); // revisit after a week

        if (revisionDate < examDate) {
          planItems.push({
            planId: plan.id,
            chapterId: ch.chapterId,
            type: 'REVISION' as const,
            date: revisionDate,
            durationMin: 20,
            description: `Spaced revision: ${ch.subjectName} — ${ch.chapterName}`,
          });
        }
      }

      if (slotsUsedToday >= itemsPerDay) {
        dayOffset++;
        slotsUsedToday = 0;
      }
    }

    // Bulk create plan items
    if (planItems.length > 0) {
      await prisma.planItem.createMany({ data: planItems });
    }

    // Fetch the complete plan
    const completePlan = await prisma.studyPlan.findUnique({
      where: { id: plan.id },
      include: {
        items: {
          include: {
            chapter: { include: { subject: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    res.json({
      plan: {
        id: completePlan!.id,
        generatedAt: completePlan!.generatedAt,
        totalItems: completePlan!.items.length,
        daysUntilExam,
        items: completePlan!.items.map(item => ({
          id: item.id,
          type: item.type,
          date: item.date,
          durationMin: item.durationMin,
          description: item.description,
          completed: item.completed,
          chapter: item.chapter.name,
          subject: item.chapter.subject.name,
        })),
      },
    });
  } catch (err) {
    console.error('Plan generate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plan — get current plan
router.get('/', async (req: AuthRequest, res) => {
  try {
    const plan = await prisma.studyPlan.findUnique({
      where: { studentId: req.studentId! },
      include: {
        items: {
          include: {
            chapter: { include: { subject: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!plan) {
      res.json({ plan: null });
      return;
    }

    res.json({
      plan: {
        id: plan.id,
        generatedAt: plan.generatedAt,
        totalItems: plan.items.length,
        items: plan.items.map(item => ({
          id: item.id,
          type: item.type,
          date: item.date,
          durationMin: item.durationMin,
          description: item.description,
          completed: item.completed,
          completedAt: item.completedAt,
          chapter: item.chapter.name,
          subject: item.chapter.subject.name,
        })),
      },
    });
  } catch (err) {
    console.error('Get plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plan/today — get today's tasks
router.get('/today', async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await prisma.studyPlan.findUnique({
      where: { studentId: req.studentId! },
    });

    if (!plan) {
      res.json({ tasks: [] });
      return;
    }

    const tasks = await prisma.planItem.findMany({
      where: {
        planId: plan.id,
        date: { gte: today, lt: tomorrow },
      },
      include: {
        chapter: { include: { subject: true } },
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      tasks: tasks.map(item => ({
        id: item.id,
        type: item.type,
        durationMin: item.durationMin,
        description: item.description,
        completed: item.completed,
        chapter: item.chapter.name,
        subject: item.chapter.subject.name,
      })),
    });
  } catch (err) {
    console.error('Today plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/plan/complete/:itemId — mark a plan item complete
router.put('/complete/:itemId', async (req: AuthRequest, res) => {
  try {
    const itemId = String(req.params.itemId);
    const studentId = req.studentId!;

    // Verify ownership
    const plan = await prisma.studyPlan.findUnique({ where: { studentId } });
    if (!plan) { res.status(404).json({ error: 'No plan found' }); return; }

    const item = await prisma.planItem.findFirst({
      where: { id: itemId, planId: plan.id },
    });

    if (!item) { res.status(404).json({ error: 'Plan item not found' }); return; }

    const updated = await prisma.planItem.update({
      where: { id: itemId },
      data: { completed: true, completedAt: new Date() },
      include: { chapter: { include: { subject: true } } },
    });

    // Update streak
    const streak = await prisma.streak.findUnique({ where: { studentId } });
    if (streak) {
      const lastActive = streak.lastActiveAt;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newCurrent = streak.currentStreak;
      if (!lastActive || new Date(lastActive).toDateString() !== new Date().toDateString()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActive && new Date(lastActive).toDateString() === yesterday.toDateString()) {
          newCurrent = streak.currentStreak + 1;
        } else if (!lastActive || new Date(lastActive) < yesterday) {
          newCurrent = 1;
        }
      }

      await prisma.streak.update({
        where: { studentId },
        data: {
          currentStreak: newCurrent,
          longestStreak: Math.max(streak.longestStreak, newCurrent),
          lastActiveAt: new Date(),
        },
      });
    }

    res.json({
      item: {
        id: updated.id,
        completed: updated.completed,
        completedAt: updated.completedAt,
        chapter: updated.chapter.name,
        subject: updated.chapter.subject.name,
      },
    });
  } catch (err) {
    console.error('Complete item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/plan/adherence — weekly adherence stats
router.get('/adherence', async (req: AuthRequest, res) => {
  try {
    const plan = await prisma.studyPlan.findUnique({ where: { studentId: req.studentId! } });
    if (!plan) { res.json({ adherence: null }); return; }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekItems = await prisma.planItem.findMany({
      where: {
        planId: plan.id,
        date: { gte: weekAgo, lte: new Date() },
      },
    });

    const total = weekItems.length;
    const completed = weekItems.filter(i => i.completed).length;
    const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      adherence: {
        weeklyTotal: total,
        weeklyCompleted: completed,
        adherencePercentage: adherence,
        target: 60, // target adherence %
        onTrack: adherence >= 60,
      },
    });
  } catch (err) {
    console.error('Adherence error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
