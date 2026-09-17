import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';

export const vendorsRouter = Router();
vendorsRouter.use(requireAuth);

function serialize(v: Awaited<ReturnType<typeof prisma.vendor.findFirstOrThrow>>) {
  let offers: string[] = [];
  try {
    offers = JSON.parse(v.offersJson);
  } catch {
    offers = [];
  }
  return {
    id: v.id,
    name: v.name,
    covers: v.covers,
    contract: v.contract,
    contact: v.contact,
    role: v.role,
    phone: v.phone,
    email: v.email,
    offers,
    since: v.since,
    escalation: v.escalation,
    turnaround: v.turnaround,
  };
}

vendorsRouter.get('/', async (_req, res) => {
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(vendors.map(serialize));
});

const createSchema = z.object({
  name: z.string().min(1),
  covers: z.string().default(''),
  contract: z.string().default('Annual contract'),
  contact: z.string().default(''),
  role: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  offers: z.array(z.string()).default([]),
});

vendorsRouter.post('/', requireRole('admin', 'ops', 'engineer'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { offers, ...rest } = parsed.data;
  const existing = await prisma.vendor.findUnique({ where: { name: rest.name } });
  if (existing) {
    res.status(409).json({ error: 'A maintenance company with that name already exists' });
    return;
  }
  const vendor = await prisma.vendor.create({
    data: { ...rest, offersJson: JSON.stringify(offers), since: new Date().getFullYear() },
  });
  res.status(201).json(serialize(vendor));
});
