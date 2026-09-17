import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { ROLE_KEYS } from '../types.js';

export const peopleRouter = Router();
peopleRouter.use(requireAuth);

peopleRouter.get('/', async (_req, res) => {
  const people = await prisma.person.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(people.map((p) => ({ id: p.id, name: p.name, role: p.role, title: p.title })));
});

const createSchema = z.object({
  name: z.string().min(1),
  role: z.enum(ROLE_KEYS),
  title: z.string().default(''),
  pin: z.string().min(4).max(12),
});

peopleRouter.post('/', requireRole('admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, role, title, pin } = parsed.data;
  const existing = await prisma.person.findUnique({ where: { name } });
  if (existing) {
    res.status(409).json({ error: 'A person with that name already exists' });
    return;
  }
  const pinHash = await bcrypt.hash(pin, 10);
  const person = await prisma.person.create({ data: { name, role, title, pinHash } });
  res.status(201).json({ id: person.id, name: person.name, role: person.role, title: person.title });
});

peopleRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const target = await prisma.person.findUnique({ where: { id: req.params.id } });
  if (!target) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (req.person!.id === target.id) {
    res.status(400).json({ error: 'You cannot remove your own account' });
    return;
  }
  await prisma.person.delete({ where: { id: target.id } });
  res.status(204).end();
});
