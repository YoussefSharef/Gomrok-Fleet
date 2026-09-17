import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';

export const dataRouter = Router();
dataRouter.use(requireAuth);

dataRouter.get('/export', async (_req, res) => {
  const [units, vendors] = await Promise.all([
    prisma.unit.findMany({ include: { events: true, parts: true, quotes: true } }),
    prisma.vendor.findMany(),
  ]);
  const vendorsOut = vendors.map(({ offersJson, ...v }) => {
    let offers: string[] = [];
    try {
      offers = JSON.parse(offersJson);
    } catch {
      offers = [];
    }
    return { ...v, offers };
  });
  res.json({ units, vendors: vendorsOut, exportedAt: new Date().toISOString() });
});

const importSchema = z.object({
  units: z.array(z.record(z.any())).default([]),
  vendors: z.array(z.record(z.any())).default([]),
});

// Import wholesale-replaces the register. Restricted to admins (a deliberate
// hardening beyond the single-browser mockup, since this now writes a shared store).
dataRouter.post('/import', requireRole('admin'), async (req, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { units, vendors } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.part.deleteMany();
    await tx.quote.deleteMany();
    await tx.serviceEvent.deleteMany();
    await tx.unit.deleteMany();
    await tx.vendor.deleteMany();

    for (const v of vendors) {
      await tx.vendor.create({
        data: {
          name: String(v.name || ''),
          covers: String(v.covers || ''),
          contract: String(v.contract || 'Annual contract'),
          contact: String(v.contact || ''),
          role: String(v.role || ''),
          phone: String(v.phone || ''),
          email: String(v.email || ''),
          offersJson: JSON.stringify(Array.isArray(v.offers) ? v.offers : []),
          since: typeof v.since === 'number' ? v.since : null,
          escalation: String(v.escalation || ''),
          turnaround: v.turnaround ? String(v.turnaround) : null,
        },
      });
    }

    for (const u of units) {
      const events = Array.isArray(u.events) ? u.events : [];
      const parts = Array.isArray(u.parts) ? u.parts : [];
      const quotes = Array.isArray(u.quotes) ? u.quotes : [];
      await tx.unit.create({
        data: {
          id: String(u.id),
          type: String(u.type || 'FL'),
          brand: String(u.brand || ''),
          model: String(u.model || ''),
          serial: String(u.serial || ''),
          zone: String(u.zone || ''),
          hours: Number(u.hours) || 0,
          lastMeter: Number(u.lastMeter) || 0,
          purchased: u.purchased || null,
          warranty: u.warranty || null,
          intervalHours: Number(u.intervalHours) || 0,
          intervalMonths: Number(u.intervalMonths) || 0,
          lastService: u.lastService || null,
          nextService: u.nextService || null,
          partner: String(u.partner || ''),
          status: String(u.status || 'operational'),
          complaint: u.complaint || null,
          reporter: u.reporter || null,
          channel: u.channel || null,
          impact: u.impact || null,
          reportedAt: u.reportedAt || null,
          issue: u.issue || null,
          vendor: u.vendor || null,
          sent: u.sent || null,
          eta: u.eta || null,
          wo: u.wo || null,
          cost: typeof u.cost === 'number' ? u.cost : null,
          quoted: typeof u.quoted === 'number' ? u.quoted : null,
          events: {
            create: events.map((e: Record<string, unknown>) => ({
              date: String(e.date),
              kind: String(e.kind || 'preventive'),
              title: String(e.title || ''),
              desc: String(e.desc || ''),
              vendor: String(e.vendor || '-'),
              wo: String(e.wo || '-'),
              cost: typeof e.cost === 'number' ? e.cost : null,
            })),
          },
          parts: {
            create: parts.map((p: Record<string, unknown>) => ({
              name: String(p.name || ''),
              qty: Number(p.qty) || 1,
              cost: Number(p.cost) || 0,
            })),
          },
          quotes: {
            create: quotes.map((q: Record<string, unknown>) => ({
              company: String(q.company || ''),
              scope: String(q.scope || ''),
              price: Number(q.price) || 0,
              lead: Number(q.lead) || 0,
              note: String(q.note || ''),
              awarded: Boolean(q.awarded),
            })),
          },
        },
      });
    }
  });

  res.status(204).end();
});
