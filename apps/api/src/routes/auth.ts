import { Router } from 'express';
import { prisma } from '@tms/db/client';
import { signToken } from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Simple login by email only (for dev/demo). In production, add password hashing & checks
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Password not set' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Simple signup (dev/demo): create user by email, name, role
router.post('/signup', async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    if (!email || !name || !role || !password) {
      return res.status(400).json({ error: 'Email, name, role and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, role, passwordHash }
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to signup' });
  }
});

// Get current user from token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;


