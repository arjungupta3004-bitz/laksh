import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const goalSchema = z.object({
  targetPercentage: z.number().min(1).max(100),
  examDate: z.string(),
});

// POST /api/goals — create or update goal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = goalSchema.parse(req.body);
    const studentId = req.studentId!;

    // Get student info
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Get all subjects for this board/grade
    const subjects = await prisma.subject.findMany({
      where: { board: student.board, grade: student.grade },
      include: { chapters: true },
    });

    if (subjects.length === 0) {
      res.status(400).json({ error: 'No subjects found for your board/grade. Seed data first.' });
      return;
    }

    const examDate = new Date(data.examDate);

    // Upsert goal
    const goal = await prisma.goal.upsert({
      where: { studentId },
      create: {
        studentId,
        targetPercentage: data.targetPercentage,
        examDate,
      },
      update: {
        targetPercentage: data.targetPercentage,
        examDate,
      },
    });

    // Back-solve: distribute target across subjects by their total marks proportion
    const grandTotal = subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    const targetTotal = (data.targetPercentage / 100) * grandTotal;

    // Delete old subject goals
    await prisma.subjectGoal.deleteMany({ where: { goalId: goal.id } });

    // Create per-subject goals
    const subjectGoals = await Promise.all(
      subjects.map((subject) => {
        const subjectProportion = subject.totalMarks / grandTotal;
        const targetMarks = Math.round(targetTotal * subjectProportion);
        const targetPct = (targetMarks / subject.totalMarks) * 100;

        return prisma.subjectGoal.create({
          data: {
            goalId: goal.id,
            subjectId: subject.id,
            targetMarks,
            targetPercentage: Math.round(targetPct * 10) / 10,
          },
          include: { subject: true },
        });
      })
    );

    // Calculate feasibility
    const weeksRemaining = Math.max(0, Math.floor((examDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)));
    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const chaptersPerWeek = weeksRemaining > 0 ? totalChapters / weeksRemaining : Infinity;

    let feasibility: 'achievable' | 'challenging' | 'very_challenging';
    if (chaptersPerWeek <= 3) feasibility = 'achievable';
    else if (chaptersPerWeek <= 5) feasibility = 'challenging';
    else feasibility = 'very_challenging';

    // Update student exam date
    await prisma.student.update({
      where: { id: studentId },
      data: { examDate },
    });

    res.json({
      goal: {
        id: goal.id,
        targetPercentage: goal.targetPercentage,
        examDate: goal.examDate,
        subjectGoals: subjectGoals.map((sg) => ({
          subject: sg.subject.name,
          subjectCode: sg.subject.code,
          targetMarks: sg.targetMarks,
          totalMarks: sg.subject.totalMarks,
          targetPercentage: sg.targetPercentage,
        })),
      },
      feasibility: {
        weeksRemaining,
        totalChapters,
        chaptersPerWeek: Math.round(chaptersPerWeek * 10) / 10,
        level: feasibility,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/goals — get current goal
router.get('/', async (req: AuthRequest, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { studentId: req.studentId! },
      include: {
        subjectGoals: {
          include: { subject: true },
        },
      },
    });

    if (!goal) {
      res.json({ goal: null });
      return;
    }

    res.json({
      goal: {
        id: goal.id,
        targetPercentage: goal.targetPercentage,
        examDate: goal.examDate,
        subjectGoals: goal.subjectGoals.map((sg) => ({
          subject: sg.subject.name,
          subjectCode: sg.subject.code,
          targetMarks: sg.targetMarks,
          totalMarks: sg.subject.totalMarks,
          targetPercentage: sg.targetPercentage,
        })),
      },
    });
  } catch (err) {
    console.error('Get goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
