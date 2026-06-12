import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  board: z.string().default('CBSE'),
  grade: z.number().int().min(1).max(12).default(10),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);

    const existing = await prisma.student.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const student = await prisma.student.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        board: data.board,
        grade: data.grade,
      },
    });

    // Create streak record
    await prisma.streak.create({ data: { studentId: student.id } });

    const tokens = generateTokens(student.id);

    res.status(201).json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        board: student.board,
        grade: student.grade,
        onboarded: student.onboarded,
      },
      ...tokens,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const student = await prisma.student.findUnique({ where: { email: data.email } });
    if (!student) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(data.password, student.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const tokens = generateTokens(student.id);

    res.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        board: student.board,
        grade: student.grade,
        onboarded: student.onboarded,
      },
      ...tokens,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokens = generateTokens(payload.studentId);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.studentId },
      select: {
        id: true,
        name: true,
        email: true,
        board: true,
        grade: true,
        examDate: true,
        onboarded: true,
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json({ student });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/onboard
router.put('/onboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      board: z.string().optional(),
      grade: z.number().int().optional(),
      examDate: z.string().datetime().optional(),
    });

    const data = schema.parse(req.body);

    const student = await prisma.student.update({
      where: { id: req.studentId },
      data: {
        ...(data.board && { board: data.board }),
        ...(data.grade && { grade: data.grade }),
        ...(data.examDate && { examDate: new Date(data.examDate) }),
        onboarded: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        board: true,
        grade: true,
        examDate: true,
        onboarded: true,
      },
    });

    res.json({ student });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Onboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
