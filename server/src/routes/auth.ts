import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { signToken } from '../auth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import type { Role } from '../types.js';

export const authRouter = Router();

// Unauthenticated on purpose: the login screen needs to show "who are you?"
// before anyone has signed in. Only name/role/title are exposed, never the
// PIN hash.
authRouter.get('/login-options', async (_req, res) => {
  const people = await prisma.person.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(people.map((p) => ({ id: p.id, name: p.name, role: p.role, title: p.title })));
});

const loginSchema = z.object({
  name: z.string().min(1),
  pin: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Name and PIN are required' });
    return;
  }
  const { name, pin } = parsed.data;
  const person = await prisma.person.findUnique({ where: { name } });
  if (!person || !(await bcrypt.compare(pin, person.pinHash))) {
    res.status(401).json({ error: 'wrong_pin' });
    return;
  }
  const authed = { id: person.id, name: person.name, role: person.role as Role, title: person.title };
  const token = signToken(authed);
  res.json({ token, person: authed });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ person: req.person });
});
