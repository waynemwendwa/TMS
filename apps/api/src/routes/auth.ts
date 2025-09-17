import { Router, Request, Response } from 'express';
import { prisma } from '@tms/db/client';
import { UserRole } from '@prisma/client';
import { signToken } from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Test endpoint to debug issues
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Auth router is working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
    }
  });
});

// Test database and roles
router.get('/test-db', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test if we can create a user with FINANCE_PROCUREMENT role
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'FINANCE_PROCUREMENT',
        passwordHash: 'test'
      }
    });
    
    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    
    res.json({ 
      status: 'ok', 
      message: 'Database and roles working correctly',
      timestamp: new Date().toISOString(),
      testResult: 'FINANCE_PROCUREMENT role is available'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Migration status endpoint
router.get('/migration-status', async (req, res) => {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Check if users table exists
    const userCount = await prisma.user.count();
    
    // Check if we can create a user with FINANCE_PROCUREMENT role
    let roleTest = 'unknown';
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'migration-status-test@example.com',
          name: 'Migration Status Test',
          role: 'FINANCE_PROCUREMENT',
          passwordHash: 'test'
        }
      });
      await prisma.user.delete({ where: { id: testUser.id } });
      roleTest = 'success';
    } catch (roleError) {
      roleTest = 'failed';
    }
    
    res.json({
      status: 'success',
      message: 'Migration status check completed',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        usersTableExists: true,
        userCount: userCount
      },
      roles: {
        FINANCE_PROCUREMENT: roleTest
      },
      migration: {
        status: 'completed',
        tablesCreated: true,
        rolesAvailable: roleTest === 'success'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Migration status check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      migration: {
        status: 'failed',
        tablesCreated: false,
        rolesAvailable: false
      }
    });
  }
});

// Simple login by email only (for dev/demo). In production, add password hashing & checks
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Looking up user:', email);
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.passwordHash) {
      console.log('No password hash');
      return res.status(401).json({ error: 'Password not set' });
    }
    
    console.log('Comparing password...');
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', ok);
    
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Generating token...');
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    console.log('Login successful for:', email);
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({ 
      error: 'Failed to login', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple signup (dev/demo): create user by email, name, role
router.post('/signup', async (req: Request, res: Response) => {
  try {
    console.log('=== SIGNUP ATTEMPT ===');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    
    const { email, name, role, password, assignedProjectId } = req.body as { email: string; name: string; role: string; password: string; assignedProjectId?: string };
    console.log('Received data:', { email, name, role, hasPassword: !!password, assignedProjectId });
    
    if (!email || !name || !role || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Email, name, role and password are required' });
    }

    console.log('Checking if user exists...');
    const existing = await prisma.user.findUnique({ where: { email } });
    console.log('User exists:', !!existing);
    
    if (existing) {
      console.log('User already exists');
      return res.status(409).json({ error: 'User already exists' });
    }

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    console.log('Creating user in database...');
    // Validate role against enum
    const allowedRoles = Object.values(UserRole);
    if (!allowedRoles.includes(role as UserRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await prisma.user.create({
      data: { email, name, role: role as UserRole, passwordHash }
    });
    console.log('User created successfully:', user.id);

    // If Site Supervisor, create assignment (exactly one project)
    if (role === 'SITE_SUPERVISOR') {
      if (!assignedProjectId) {
        console.log('Site Supervisor missing assignedProjectId');
        return res.status(400).json({ error: 'assignedProjectId is required for Site Supervisor' });
      }
      const projectExists = await prisma.project.findUnique({ where: { id: assignedProjectId } });
      if (!projectExists) {
        return res.status(400).json({ error: 'Assigned project not found' });
      }
      await prisma.siteSupervisorAssignment.create({
        data: { userId: user.id, projectId: assignedProjectId }
      });
    }

    console.log('Generating token...');
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    console.log('Signup successful for:', email);
    
    res.status(201).json({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('=== SIGNUP ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({ 
      error: 'Failed to signup', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get current user from token
router.get('/me', requireAuth, async (req: Request, res: Response) => {
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


