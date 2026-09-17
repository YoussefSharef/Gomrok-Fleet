import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { addDays, todayStr } from '../lib/dates.js';

export const unitsRouter = Router();
unitsRouter.use(requireAuth);

const unitInclude = { events: true, parts: true, quotes: true } as const;

unitsRouter.get('/', async (_req, res) => {
  const units = await prisma.unit.findMany({
    include: unitInclude,
    orderBy: { createdAt: 'asc' },
  });
  res.json(units);
});

const createSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  brand: z.string().default(''),
  model: z.string().default(''),
  serial: z.string().default(''),
  zone: z.string().default(''),
  hours: z.number().default(0),
  lastMeter: z.number().default(0),
  purchased: z.string().optional().nullable(),
  warranty: z.string().optional().nullable(),
  intervalHours: z.number().default(0),
  intervalMonths: z.number().default(0),
  lastService: z.string().optional().nullable(),
  nextService: z.string().optional().nullable(),
  partner: z.string().default(''),
});

unitsRouter.post('/', requireRole('admin', 'ops'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const id = data.id.trim().toUpperCase();
  if (!data.serial.trim() && !data.brand.trim()) {
    res.status(400).json({ error: 'Enter at least a brand or serial number' });
    return;
  }
  const existing = await prisma.unit.findUnique({ where: { id } });
  if (existing) {
    res.status(409).json({ error: 'An asset with that ID already exists' });
    return;
  }
  const unit = await prisma.unit.create({
    data: { ...data, id, status: 'operational' },
    include: unitInclude,
  });
  res.status(201).json(unit);
});

unitsRouter.delete('/:id', requireRole('admin', 'ops'), async (req, res) => {
  const existing = await prisma.unit.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await prisma.unit.delete({ where: { id: existing.id } });
  res.status(204).end();
});

const eventSchema = z.object({
  date: z.string().min(1),
  kind: z.enum(['preventive', 'breakdown']),
  title: z.string().min(1),
  desc: z.string().default(''),
  vendor: z.string().default('-'),
  wo: z.string().default('-'),
  cost: z.number().default(0),
});

unitsRouter.post('/:id/events', async (req, res) => {
  const unit = await prisma.unit.findUnique({ where: { id: req.params.id } });
  if (!unit) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const event = await prisma.serviceEvent.create({ data: { ...parsed.data, unitId: unit.id } });
  res.status(201).json(event);
});

const reportFaultSchema = z.object({
  complaint: z.string().min(1),
  reporter: z.string().default(''),
  channel: z.string().default(''),
  impact: z.string().default(''),
});

unitsRouter.post('/:id/report-fault', requireRole('admin', 'ops', 'engineer'), async (req, res) => {
  const unit = await prisma.unit.findUnique({ where: { id: req.params.id } });
  if (!unit) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const parsed = reportFaultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updated = await prisma.unit.update({
    where: { id: unit.id },
    data: { status: 'reported', reportedAt: todayStr(), ...parsed.data },
    include: unitInclude,
  });
  res.json(updated);
});

const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  sendOut: z.boolean().default(true),
  wo: z.string().default(''),
  parts: z
    .array(z.object({ name: z.string().min(1), qty: z.number().default(1), cost: z.number().default(0) }))
    .default([]),
  quotes: z
    .array(
      z.object({
        company: z.string().default(''),
        scope: z.string().default(''),
        price: z.number().default(0),
        lead: z.number().default(0),
        note: z.string().default(''),
        awarded: z.boolean().default(false),
      }),
    )
    .default([]),
  fallbackVendor: z.string().default('Not set'),
  inHouseName: z.string().default('In-house Workshop'),
  defaultPartName: z.string().default('Part to be specified'),
  defaultComplaint: z.string().default('Fault reported by operations'),
  confirmedPrefix: z.string().default('Confirmed on inspection -'),
});

unitsRouter.post('/:id/review', requireRole('admin', 'ops', 'engineer'), async (req, res) => {
  const unit = await prisma.unit.findUnique({ where: { id: req.params.id }, include: unitInclude });
  if (!unit) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;

  await prisma.part.deleteMany({ where: { unitId: unit.id } });
  await prisma.quote.deleteMany({ where: { unitId: unit.id } });

  if (body.decision === 'reject') {
    const updated = await prisma.unit.update({
      where: { id: unit.id },
      data: {
        status: 'operational',
        complaint: null,
        reporter: null,
        channel: null,
        impact: null,
        reportedAt: null,
        issue: null,
        vendor: null,
        sent: null,
        eta: null,
        wo: null,
        cost: null,
        quoted: null,
      },
      include: unitInclude,
    });
    res.json(updated);
    return;
  }

  const filledQuotes = body.quotes.filter((q) => q.company.trim());
  const awarded = filledQuotes.find((q) => q.awarded) || filledQuotes[0] || null;
  const today = todayStr();
  const parts = body.parts.length ? body.parts : [{ name: body.defaultPartName, qty: 1, cost: 0 }];
  const partsSum = parts.reduce((a, p) => a + p.qty * p.cost, 0);
  const status = body.sendOut ? 'vendor' : 'maintenance';
  const vendorName = body.sendOut ? awarded?.company || unit.partner || body.fallbackVendor : body.inHouseName;
  const eta = body.sendOut ? addDays(today, awarded?.lead || 13) : addDays(today, 2);
  const wo = body.wo.trim() || `WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const quoted = body.sendOut && awarded ? awarded.price : Math.round(partsSum * 1.18);

  const updated = await prisma.unit.update({
    where: { id: unit.id },
    data: {
      status,
      issue: `${body.confirmedPrefix} ${unit.complaint || body.defaultComplaint}`,
      vendor: vendorName,
      sent: today,
      eta,
      wo,
      quoted,
      cost: quoted,
      parts: { create: parts },
      quotes: {
        create: filledQuotes.map((q) => ({ ...q, awarded: awarded ? q.company === awarded.company : false })),
      },
    },
    include: unitInclude,
  });
  res.json(updated);
});
